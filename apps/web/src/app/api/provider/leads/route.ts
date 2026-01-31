export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@service-match/db';
import { getSession } from '@/lib/auth';

export async function GET(req: NextRequest) {
    try {
        const session = await getSession();
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const provider = await prisma.providerProfile.findUnique({
            where: { userId: session.user.id },
            include: {
                services: true,
                locations: true,
            },
        });

        if (!provider) {
            return NextResponse.json({ error: 'not_provider' }, { status: 403 });
        }

        const { searchParams } = new URL(req.url);
        const page = parseInt(searchParams.get('page') || '1');
        const limit = 20;

        // Find requests that match provider's services and location
        // For simple MVP, we just match by category matching
        const categoryIds = provider.services.map(s => s.categoryId);

        // In a real app, we'd do geospatial query here using the provider's location/radius
        // For now, let's just match category and ensure status is open

        const where: any = {
            status: { in: ['OPEN', 'QUOTES_RECEIVED'] },
            categoryId: { in: categoryIds },
            // Don't show requests the provider has already quoted
            quotes: {
                none: {
                    providerId: provider.id
                }
            }
        };

        const [leads, total] = await Promise.all([
            prisma.quoteRequest.findMany({
                where,
                include: {
                    category: true,
                    _count: { select: { quotes: true } }
                },
                orderBy: { createdAt: 'desc' },
                skip: (page - 1) * limit,
                take: limit,
            }),
            prisma.quoteRequest.count({ where }),
        ]);

        return NextResponse.json({
            leads: leads.map(lead => ({
                ...lead,
                quoteCount: (lead as any)._count?.quotes || 0
            })),
            total,
            totalPages: Math.ceil(total / limit),
        });

    } catch (error) {
        console.error('Error fetching leads:', error);
        return NextResponse.json(
            { error: 'Failed to fetch leads' },
            { status: 500 }
        );
    }
}
