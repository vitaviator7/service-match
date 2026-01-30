import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@service-match/db';

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const parentId = searchParams.get('parent');

        const categories = await prisma.category.findMany({
            where: {
                isActive: true,
                parentId: parentId || null,
            },
            orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
            include: {
                _count: {
                    select: { children: true },
                },
            },
        });

        return NextResponse.json(categories);
    } catch (error) {
        console.error('Error fetching categories:', error);
        return NextResponse.json(
            { error: 'Failed to fetch categories' },
            { status: 500 }
        );
    }
}
