import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@service-match/db';
import { getSession } from '@/lib/auth';
import { z } from 'zod';
import { slugify } from '@/lib/utils';

const profileSchema = z.object({
    businessName: z.string().min(3).max(100),
    shortBio: z.string().max(150).optional(),
    description: z.string().max(2000).optional(),
    businessPhone: z.string().min(10).max(20),
    businessEmail: z.string().email().optional().or(z.literal('')),
    website: z.string().url().optional().or(z.literal('')),
    postcode: z.string().optional(),
    city: z.string().optional(),
    serviceRadius: z.number().min(5).max(100).optional(),
    categoryIds: z.array(z.string()).optional(),
});

// Get provider profile
export async function GET(req: NextRequest) {
    try {
        const session = await getSession();
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const provider = await prisma.providerProfile.findUnique({
            where: { userId: session.user.id },
            include: {
                services: { include: { category: true } },
                locations: true,
                certifications: true,
                user: {
                    select: {
                        email: true,
                        firstName: true,
                        lastName: true,
                        avatarUrl: true,
                    },
                },
            },
        });

        if (!provider) {
            return NextResponse.json({ exists: false });
        }

        return NextResponse.json({ exists: true, provider });
    } catch (error) {
        console.error('Error fetching provider profile:', error);
        return NextResponse.json(
            { error: 'Failed to fetch profile' },
            { status: 500 }
        );
    }
}

// Create or update provider profile
export async function PUT(req: NextRequest) {
    try {
        const session = await getSession();
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const result = profileSchema.safeParse(body);

        if (!result.success) {
            return NextResponse.json(
                { error: 'Invalid input', details: result.error.flatten() },
                { status: 400 }
            );
        }

        const data = result.data;

        // Check if provider exists
        const existingProvider = await prisma.providerProfile.findUnique({
            where: { userId: session.user.id },
        });

        // Generate unique slug
        let slug = slugify(data.businessName);
        const existingSlug = await prisma.providerProfile.findUnique({
            where: { slug },
        });
        if (existingSlug && existingSlug.userId !== session.user.id) {
            slug = `${slug}-${Date.now().toString(36)}`;
        }

        // Geocode postcode if provided
        let latitude: number | null = null;
        let longitude: number | null = null;
        let cityFromGeo: string | null = null;

        if (data.postcode) {
            try {
                const geocodeResponse = await fetch(
                    `https://api.postcodes.io/postcodes/${encodeURIComponent(data.postcode)}`
                );
                if (geocodeResponse.ok) {
                    const geoData = await geocodeResponse.json();
                    if (geoData.result) {
                        latitude = geoData.result.latitude;
                        longitude = geoData.result.longitude;
                        cityFromGeo = geoData.result.admin_district || geoData.result.region;
                    }
                }
            } catch (e) {
                console.error('Geocoding error:', e);
            }
        }

        const profileData = {
            businessName: data.businessName,
            slug,
            shortBio: data.shortBio || null,
            description: data.description || null,
            businessPhone: data.businessPhone,
            businessEmail: data.businessEmail || null,
            website: data.website || null,
            postcode: data.postcode || null,
            city: data.city || cityFromGeo || null,
            latitude,
            longitude,
        };

        let provider;

        if (existingProvider) {
            // Update existing
            provider = await prisma.providerProfile.update({
                where: { id: existingProvider.id },
                data: profileData,
            });
        } else {
            // Create new
            provider = await prisma.providerProfile.create({
                data: {
                    ...profileData,
                    userId: session.user.id,
                    status: 'ONBOARDING',
                },
            });

            // Update user role
            await prisma.user.update({
                where: { id: session.user.id },
                data: { role: 'PROVIDER' },
            });
        }

        // Update services/categories if provided
        if (data.categoryIds && data.categoryIds.length > 0) {
            // Delete existing services
            await prisma.providerService.deleteMany({
                where: { providerId: provider.id },
            });

            // Create new services for each category
            for (const categoryId of data.categoryIds) {
                const category = await prisma.category.findUnique({
                    where: { id: categoryId },
                });

                if (category) {
                    await prisma.providerService.create({
                        data: {
                            providerId: provider.id,
                            categoryId,
                            name: category.name,
                            description: `${category.name} services`,
                        },
                    });
                }
            }
        }

        // Create or update location
        if (data.postcode && latitude && longitude) {
            const existingLocation = await prisma.serviceLocation.findFirst({
                where: { providerId: provider.id, isDefault: true },
            });

            if (existingLocation) {
                await prisma.serviceLocation.update({
                    where: { id: existingLocation.id },
                    data: {
                        postcode: data.postcode,
                        city: data.city || cityFromGeo || '',
                        latitude,
                        longitude,
                        radius: data.serviceRadius || 15,
                    },
                });
            } else {
                await prisma.serviceLocation.create({
                    data: {
                        providerId: provider.id,
                        name: 'Primary Location',
                        postcode: data.postcode,
                        city: data.city || cityFromGeo || '',
                        latitude,
                        longitude,
                        radius: data.serviceRadius || 15,
                        isDefault: true,
                    },
                });
            }
        }

        return NextResponse.json({ providerId: provider.id });
    } catch (error) {
        console.error('Error updating provider profile:', error);
        return NextResponse.json(
            { error: 'Failed to update profile' },
            { status: 500 }
        );
    }
}
