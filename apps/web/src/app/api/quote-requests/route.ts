export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@service-match/db';
import { getSession } from '@/lib/auth';
import { z } from 'zod';

const quoteRequestSchema = z.object({
    categoryId: z.string(),
    title: z.string().min(5).max(200),
    description: z.string().min(20).max(2000),
    postcode: z.string().regex(/^[A-Z]{1,2}\d[A-Z\d]? ?\d[A-Z]{2}$/i),
    urgency: z.enum(['EMERGENCY', 'URGENT', 'THIS_WEEK', 'THIS_MONTH', 'FLEXIBLE']),
    budgetMin: z.number().optional(),
    budgetMax: z.number().optional(),
    preferredDate: z.string().optional(),
    preferredTime: z.string().optional(),
    photos: z.array(z.string()).optional(),
});

export async function GET(req: NextRequest) {
    try {
        const session = await getSession();
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const status = searchParams.get('status');

        const customerProfile = await prisma.customerProfile.findUnique({
            where: { userId: session.user.id },
        });

        if (!customerProfile) {
            return NextResponse.json({ error: 'Customer profile not found' }, { status: 404 });
        }

        const quoteRequests = await prisma.quoteRequest.findMany({
            where: {
                customerId: customerProfile.id,
                ...(status ? { status: status as any } : {}),
            },
            include: {
                category: true,
                quotes: {
                    include: {
                        provider: true,
                    },
                },
                _count: {
                    select: { quotes: true },
                },
            },
            orderBy: { createdAt: 'desc' },
        });

        return NextResponse.json(quoteRequests);
    } catch (error) {
        console.error('Error fetching quote requests:', error);
        return NextResponse.json(
            { error: 'Failed to fetch quote requests' },
            { status: 500 }
        );
    }
}

export async function POST(req: NextRequest) {
    try {
        const session = await getSession();
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const result = quoteRequestSchema.safeParse(body);

        if (!result.success) {
            return NextResponse.json(
                { error: 'Invalid input', details: result.error.flatten() },
                { status: 400 }
            );
        }

        const data = result.data;

        const customerProfile = await prisma.customerProfile.findUnique({
            where: { userId: session.user.id },
        });

        if (!customerProfile) {
            return NextResponse.json({ error: 'Customer profile not found' }, { status: 404 });
        }

        // Geocode postcode
        const geocodeResult = await geocodePostcode(data.postcode);

        // Calculate expiry
        const config = await prisma.platformConfig.findUnique({
            where: { key: 'quote_expiry_hours' },
        });
        const expiryHours = config ? parseInt(config.value) : 72;
        const expiresAt = new Date(Date.now() + expiryHours * 60 * 60 * 1000);

        // Create quote request
        const quoteRequest = await prisma.quoteRequest.create({
            data: {
                customerId: customerProfile.id,
                categoryId: data.categoryId,
                title: data.title,
                description: data.description,
                postcode: data.postcode.toUpperCase(),
                city: geocodeResult?.city || null,
                latitude: geocodeResult?.latitude || null,
                longitude: geocodeResult?.longitude || null,
                urgency: data.urgency,
                budgetMin: data.budgetMin,
                budgetMax: data.budgetMax,
                preferredDate: data.preferredDate ? new Date(data.preferredDate) : null,
                preferredTime: data.preferredTime,
                photos: data.photos || [],
                expiresAt,
            },
        });

        // Match and invite providers (async)
        matchAndInviteProviders(quoteRequest.id).catch(console.error);

        return NextResponse.json({ quoteRequestId: quoteRequest.id });
    } catch (error) {
        console.error('Error creating quote request:', error);
        return NextResponse.json(
            { error: 'Failed to create quote request' },
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
                    city: data.result.admin_district || data.result.region,
                };
            }
        }
    } catch (error) {
        console.error('Geocoding error:', error);
    }
    return null;
}

async function matchAndInviteProviders(quoteRequestId: string) {
    const quoteRequest = await prisma.quoteRequest.findUnique({
        where: { id: quoteRequestId },
        include: { category: true },
    });

    if (!quoteRequest) return;

    const providers = await prisma.providerProfile.findMany({
        where: {
            status: 'ACTIVE',
            onboardingComplete: true,
            services: {
                some: { categoryId: quoteRequest.categoryId, isActive: true },
            },
        },
        include: {
            locations: true,
            user: true,
        },
        orderBy: [
            { avgRating: 'desc' },
            { responseRate: 'desc' },
        ],
        take: 20,
    });

    // Filter by distance if geo data available
    let matchingProviders = providers;
    if (quoteRequest.latitude && quoteRequest.longitude) {
        matchingProviders = providers.filter((provider) => {
            const location = provider.locations.find((l) => l.isDefault) || provider.locations[0];
            if (!location) return false;

            const distance = calculateDistance(
                quoteRequest.latitude!,
                quoteRequest.longitude!,
                location.latitude,
                location.longitude
            );
            return distance <= location.radius;
        });
    }

    // Create invitations
    const inviteCount = Math.min(matchingProviders.length, quoteRequest.maxQuotes * 2);
    for (let i = 0; i < inviteCount; i++) {
        await prisma.quoteInvitation.create({
            data: {
                quoteRequestId,
                providerId: matchingProviders[i].id,
            },
        });
    }

    // Update invite count
    await prisma.quoteRequest.update({
        where: { id: quoteRequestId },
        data: { invitedCount: inviteCount },
    });
}

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 3959; // Earth radius in miles
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
