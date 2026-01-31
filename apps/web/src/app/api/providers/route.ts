export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@service-match/db';

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const category = searchParams.get('category');
        const postcode = searchParams.get('postcode');
        const query = searchParams.get('q');
        const sortBy = searchParams.get('sort') || 'rating';
        const page = parseInt(searchParams.get('page') || '1');
        const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50);
        const minRating = parseFloat(searchParams.get('minRating') || '0');
        const verified = searchParams.get('verified') === 'true';

        // Build where clause
        const where: any = {
            status: 'ACTIVE',
            onboardingComplete: true,
        };

        // Category filter
        if (category) {
            where.services = {
                some: {
                    category: { slug: category },
                    isActive: true,
                },
            };
        }

        // Query filter
        if (query) {
            where.OR = [
                { businessName: { contains: query, mode: 'insensitive' } },
                { description: { contains: query, mode: 'insensitive' } },
                { services: { some: { name: { contains: query, mode: 'insensitive' } } } },
            ];
        }

        // Rating filter
        if (minRating > 0) {
            where.avgRating = { gte: minRating };
        }

        // Verified filter
        if (verified) {
            where.AND = [
                { identityVerified: true },
                { insuranceVerified: true },
            ];
        }

        // Build orderBy
        let orderBy: any = {};
        switch (sortBy) {
            case 'rating':
                orderBy = [{ avgRating: 'desc' }, { totalReviews: 'desc' }];
                break;
            case 'reviews':
                orderBy = { totalReviews: 'desc' };
                break;
            case 'response':
                orderBy = { avgResponseTime: 'asc' };
                break;
            case 'newest':
                orderBy = { createdAt: 'desc' };
                break;
            default:
                orderBy = [{ avgRating: 'desc' }, { totalReviews: 'desc' }];
        }

        // Fetch providers
        const [providers, total] = await Promise.all([
            prisma.providerProfile.findMany({
                where,
                include: {
                    user: {
                        select: { firstName: true, lastName: true, avatarUrl: true },
                    },
                    services: {
                        where: { isActive: true },
                        take: 5,
                        include: { category: true },
                    },
                    portfolio: { take: 4 },
                    locations: { where: { isDefault: true }, take: 1 },
                    _count: { select: { reviews: true } },
                },
                orderBy,
                skip: (page - 1) * limit,
                take: limit,
            }),
            prisma.providerProfile.count({ where }),
        ]);

        // If postcode provided, filter and sort by distance
        let results = providers;
        if (postcode) {
            const geocodeResult = await geocodePostcode(postcode);
            if (geocodeResult) {
                results = providers
                    .map((provider) => {
                        const location = provider.locations[0];
                        if (!location) return null;

                        const distance = calculateDistance(
                            geocodeResult.latitude,
                            geocodeResult.longitude,
                            location.latitude,
                            location.longitude
                        );

                        if (distance > location.radius) return null;

                        return {
                            ...provider,
                            distance: Math.round(distance * 10) / 10,
                        };
                    })
                    .filter(Boolean)
                    .sort((a, b) => (a?.distance || 0) - (b?.distance || 0)) as any[];
            }
        }

        // Transform response
        const transformedResults = results.map((provider) => ({
            id: provider.id,
            slug: provider.slug,
            businessName: provider.businessName,
            shortBio: provider.shortBio,
            avatarUrl: provider.user.avatarUrl || provider.logoUrl,
            coverImageUrl: provider.bannerUrl,
            avgRating: provider.avgRating,
            totalReviews: provider.totalReviews,
            responseTime: provider.avgResponseTime,
            verified: {
                identity: provider.identityVerified,
                insurance: provider.insuranceVerified,
                background: provider.backgroundChecked,
            },
            services: provider.services.map((s) => ({
                id: s.id,
                name: s.name,
                category: s.category.name,
            })),
            portfolio: provider.portfolio.map((p) => p.thumbnailUrl || p.imageUrl),
            city: provider.city,
            distance: (provider as any).distance,
            subscriptionTier: provider.subscriptionTier,
        }));

        return NextResponse.json({
            providers: transformedResults,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        });
    } catch (error) {
        console.error('Error searching providers:', error);
        return NextResponse.json(
            { error: 'Failed to search providers' },
            { status: 500 }
        );
    }
}

async function geocodePostcode(postcode: string) {
    try {
        const response = await fetch(
            `https://api.postcodes.io/postcodes/${encodeURIComponent(postcode)}`
        );
        if (response.ok) {
            const data = await response.json();
            if (data.result) {
                return {
                    latitude: data.result.latitude,
                    longitude: data.result.longitude,
                };
            }
        }
    } catch (error) {
        console.error('Geocoding error:', error);
    }
    return null;
}

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 3959;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}
