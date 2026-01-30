import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@service-match/db';

export async function GET(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const subcategories = await prisma.category.findMany({
            where: {
                parentId: params.id,
                isActive: true,
            },
            orderBy: { name: 'asc' },
        });

        return NextResponse.json(subcategories);
    } catch (error) {
        console.error('Error fetching subcategories:', error);
        return NextResponse.json(
            { error: 'Failed to fetch subcategories' },
            { status: 500 }
        );
    }
}
