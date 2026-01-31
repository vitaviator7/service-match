export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@service-match/db';

export async function GET(req: NextRequest) {
    try {
        const categories = await prisma.category.findMany({
            where: {
                isActive: true,
            },
            orderBy: { displayOrder: 'asc' },
            include: {
                subcategories: {
                    where: { isActive: true },
                    orderBy: { displayOrder: 'asc' },
                },
                _count: {
                    select: { subcategories: true },
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
