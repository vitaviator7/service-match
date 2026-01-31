import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@service-match/db';

export async function GET(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
        return new NextResponse('Unauthorized', { status: 401 });
    }

    try {
        const provider = await prisma.providerProfile.findUnique({
            where: { userId: session.user.id },
            include: {
                availability: true, // Weekly schedule rules
                timeOffs: true,     // Blocked dates
            }
        });

        if (!provider) {
            return new NextResponse('Provider profile not found', { status: 404 });
        }

        const { searchParams } = new URL(req.url);
        const start = searchParams.get('start');
        const end = searchParams.get('end');

        // If no range, default to current month (approx) or let client handle filtering
        // We'll require range to be performant

        const bookingWhere: any = {
            providerId: provider.id,
            status: { notIn: ['CANCELLED', 'DECLINED', 'REFUNDED'] }
        };

        if (start && end) {
            bookingWhere.scheduledDate = {
                gte: new Date(start),
                lte: new Date(end),
            };
        }

        const bookings = await prisma.booking.findMany({
            where: bookingWhere,
            select: {
                id: true,
                scheduledDate: true,
                scheduledTime: true,
                estimatedDuration: true,
                status: true,
                title: true,
                customer: {
                    select: {
                        user: {
                            select: { firstName: true, lastName: true }
                        }
                    }
                }
            },
            orderBy: { scheduledDate: 'asc' }
        });

        return NextResponse.json({
            bookings,
            availability: provider.availability,
            timeOffs: provider.timeOffs,
        });
    } catch (error) {
        console.error('Error fetching calendar:', error);
        return new NextResponse('Internal Error', { status: 500 });
    }
}
