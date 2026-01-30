import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@service-match/db';
import { getSession } from '@/lib/auth';
import { z } from 'zod';

const reviewSchema = z.object({
    bookingId: z.string(),
    overallRating: z.number().min(1).max(5),
    qualityRating: z.number().min(1).max(5).optional(),
    valueRating: z.number().min(1).max(5).optional(),
    punctualityRating: z.number().min(1).max(5).optional(),
    communicationRating: z.number().min(1).max(5).optional(),
    title: z.string().max(100).optional(),
    comment: z.string().min(20).max(2000),
    wouldRecommend: z.boolean().optional(),
});

// Get reviews
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const providerId = searchParams.get('providerId');
        const customerId = searchParams.get('customerId');
        const bookingId = searchParams.get('bookingId');
        const page = parseInt(searchParams.get('page') || '1');
        const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50);

        const where: any = { status: 'PUBLISHED' };

        if (providerId) {
            where.providerId = providerId;
        }
        if (customerId) {
            where.customerId = customerId;
        }
        if (bookingId) {
            where.bookingId = bookingId;
        }

        const [reviews, total] = await Promise.all([
            prisma.review.findMany({
                where,
                include: {
                    customer: {
                        include: {
                            user: {
                                select: {
                                    firstName: true,
                                    lastName: true,
                                    avatarUrl: true,
                                },
                            },
                        },
                    },
                    booking: {
                        select: {
                            service: { select: { name: true } },
                            scheduledDate: true,
                        },
                    },
                    media: true,
                },
                orderBy: { createdAt: 'desc' },
                skip: (page - 1) * limit,
                take: limit,
            }),
            prisma.review.count({ where }),
        ]);

        return NextResponse.json({
            reviews,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        });
    } catch (error) {
        console.error('Error fetching reviews:', error);
        return NextResponse.json(
            { error: 'Failed to fetch reviews' },
            { status: 500 }
        );
    }
}

// Create a review
export async function POST(req: NextRequest) {
    try {
        const session = await getSession();
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const result = reviewSchema.safeParse(body);

        if (!result.success) {
            return NextResponse.json(
                { error: 'Invalid input', details: result.error.flatten() },
                { status: 400 }
            );
        }

        const data = result.data;

        // Get customer profile
        const customerProfile = await prisma.customerProfile.findUnique({
            where: { userId: session.user.id },
        });

        if (!customerProfile) {
            return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
        }

        // Get booking
        const booking = await prisma.booking.findUnique({
            where: { id: data.bookingId },
            include: { provider: true },
        });

        if (!booking) {
            return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
        }

        if (booking.customerId !== customerProfile.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        if (booking.status !== 'COMPLETED') {
            return NextResponse.json(
                { error: 'Can only review completed bookings' },
                { status: 400 }
            );
        }

        // Check if already reviewed
        const existingReview = await prisma.review.findUnique({
            where: { bookingId: data.bookingId },
        });

        if (existingReview) {
            return NextResponse.json(
                { error: 'Booking already reviewed' },
                { status: 400 }
            );
        }

        // Create review
        const review = await prisma.review.create({
            data: {
                bookingId: data.bookingId,
                customerId: customerProfile.id,
                providerId: booking.providerId,
                overallRating: data.overallRating,
                qualityRating: data.qualityRating,
                valueRating: data.valueRating,
                punctualityRating: data.punctualityRating,
                communicationRating: data.communicationRating,
                title: data.title,
                comment: data.comment,
                wouldRecommend: data.wouldRecommend ?? data.overallRating >= 4,
                status: 'PUBLISHED', // Auto-publish for now
            },
        });

        // Update provider stats
        const allReviews = await prisma.review.findMany({
            where: {
                providerId: booking.providerId,
                status: 'PUBLISHED',
            },
            select: { overallRating: true },
        });

        const avgRating =
            allReviews.reduce((sum, r) => sum + r.overallRating, 0) / allReviews.length;

        await prisma.providerProfile.update({
            where: { id: booking.providerId },
            data: {
                avgRating,
                totalReviews: allReviews.length,
            },
        });

        // Create notification for provider
        await prisma.notification.create({
            data: {
                userId: booking.provider.userId,
                type: 'NEW_REVIEW',
                title: 'New Review',
                body: `You received a ${data.overallRating}-star review`,
                data: { reviewId: review.id, bookingId: booking.id },
            },
        });

        return NextResponse.json(review);
    } catch (error) {
        console.error('Error creating review:', error);
        return NextResponse.json(
            { error: 'Failed to create review' },
            { status: 500 }
        );
    }
}
