import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@service-match/db';

export async function GET(req: NextRequest) {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
        return new NextResponse('Unauthorized', { status: 401 });
    }

    try {
        // Get customer profile
        const customer = await prisma.customerProfile.findUnique({
            where: { userId: session.user.id },
        });

        if (!customer) {
            return new NextResponse('Customer profile not found', { status: 404 });
        }

        const favorites = await prisma.providerFavorite.findMany({
            where: {
                customerId: customer.id,
            },
            include: {
                provider: {
                    include: {
                        services: {
                            where: { isActive: true },
                            take: 5,
                        },
                        reviews: {
                            select: {
                                overallRating: true,
                            },
                        },
                        _count: {
                            select: { reviews: true },
                        },
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });

        // Transform to Provider interface
        const providers = favorites.map((fav) => {
            const p = fav.provider;

            // Calculate avg rating
            const totalRating = p.reviews.reduce((acc, r) => acc + r.overallRating, 0);
            const avgRating = p.reviews.length > 0 ? totalRating / p.reviews.length : null;

            return {
                id: p.id,
                slug: p.slug,
                businessName: p.businessName,
                shortBio: p.shortBio || undefined,
                avatarUrl: p.logoUrl || undefined,
                coverImageUrl: p.bannerUrl || undefined,
                avgRating,
                totalReviews: p._count.reviews,
                responseTime: p.avgResponseTime || null,
                verified: {
                    identity: p.identityVerified,
                    insurance: p.insuranceVerified,
                    background: p.backgroundChecked,
                },
                services: p.services.map(s => ({
                    id: s.id,
                    name: s.name,
                    category: s.categoryId // Just ID for now, simpler
                })),
                portfolio: [], // Not fetching portfolio for list view
                city: p.city || undefined,
                distance: undefined, // Can't calc distance without user location
                subscriptionTier: p.subscriptionTier,
            };
        });

        return NextResponse.json({ favorites: providers });
    } catch (error) {
        console.error('Error fetching favorites:', error);
        return new NextResponse('Internal Error', { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
        return new NextResponse('Unauthorized', { status: 401 });
    }

    try {
        const { providerId } = await req.json();

        if (!providerId) {
            return new NextResponse('Provider ID required', { status: 400 });
        }

        // Get customer profile
        const customer = await prisma.customerProfile.findUnique({
            where: { userId: session.user.id },
        });

        if (!customer) {
            return new NextResponse('Customer profile not found', { status: 404 });
        }

        // Check if already favorite
        const existing = await prisma.providerFavorite.findUnique({
            where: {
                customerId_providerId: {
                    customerId: customer.id,
                    providerId,
                },
            },
        });

        if (existing) {
            // Remove it
            await prisma.providerFavorite.delete({
                where: { id: existing.id },
            });
            return NextResponse.json({ favorited: false });
        } else {
            // Add it
            await prisma.providerFavorite.create({
                data: {
                    customerId: customer.id,
                    providerId,
                },
            });
            return NextResponse.json({ favorited: true });
        }
    } catch (error) {
        console.error('Error toggling favorite:', error);
        return new NextResponse('Internal Error', { status: 500 });
    }
}
