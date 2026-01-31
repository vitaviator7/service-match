import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@service-match/db';

export async function GET(req: NextRequest) {
    const session = await getSession();
    if (!session?.user || session.user.role !== 'ADMIN') {
        return new NextResponse('Unauthorized', { status: 401 });
    }

    try {
        const reviews = await prisma.review.findMany({
            where: { status: { in: ['PENDING', 'FLAGGED', 'PUBLISHED'] } },
            include: {
                provider: { select: { businessName: true } },
                customer: {
                    select: {
                        user: { select: { firstName: true, lastName: true } }
                    }
                }
            },
            orderBy: { createdAt: 'desc' },
            take: 50,
        });

        return NextResponse.json(reviews);
    } catch (error) {
        console.error('Error fetching admin reviews:', error);
        return new NextResponse('Internal Error', { status: 500 });
    }
}

export async function PUT(req: NextRequest) {
    const session = await getSession();
    if (!session?.user || session.user.role !== 'ADMIN') {
        return new NextResponse('Unauthorized', { status: 401 });
    }

    try {
        const { reviewId, status } = await req.json(); // e.g. PUBLISHED, HIDDEN

        await prisma.review.update({
            where: { id: reviewId },
            data: {
                status,
                moderatedAt: new Date(),
                moderatedBy: session.user.id,
            }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error moderating review:', error);
        return new NextResponse('Internal Error', { status: 500 });
    }
}
