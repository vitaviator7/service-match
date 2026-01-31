import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@service-match/db';

export async function GET(req: NextRequest) {
    const session = await getSession();
    if (!session?.user || session.user.role !== 'ADMIN') {
        return new NextResponse('Unauthorized', { status: 401 });
    }

    try {
        const { searchParams } = new URL(req.url);
        const status = searchParams.get('status');

        const where: any = {};
        if (status) { // e.g., 'PENDING', 'PAID'
            where.status = status.toUpperCase();
        }

        const payouts = await prisma.payout.findMany({
            where,
            include: {
                provider: {
                    select: {
                        businessName: true,
                        // bankAccount? Not in profile usually, it's Stripe connected account
                    }
                }
            },
            orderBy: { createdAt: 'desc' },
            take: 50,
        });

        return NextResponse.json(payouts);
    } catch (error) {
        console.error('Error fetching payouts:', error);
        return new NextResponse('Internal Error', { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    const session = await getSession();
    if (!session?.user || session.user.role !== 'ADMIN') {
        return new NextResponse('Unauthorized', { status: 401 });
    }

    try {
        const { payoutId } = await req.json();

        // In real app, triggering Stripe Transfer
        // Here, update DB status

        await prisma.payout.update({
            where: { id: payoutId },
            data: {
                status: 'PAID',
                processedAt: new Date(),
            }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error processing payout:', error);
        return new NextResponse('Internal Error', { status: 500 });
    }
}
