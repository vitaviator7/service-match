import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@service-match/db';
import { stripe } from '@/lib/stripe';

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

        const payout = await prisma.payout.findUnique({
            where: { id: payoutId },
            include: { provider: true }
        });

        if (!payout) {
            return new NextResponse('Payout not found', { status: 404 });
        }

        if (payout.status === 'PAID') {
            return new NextResponse('Payout already processed', { status: 400 });
        }

        if (!payout.provider.stripeAccountId) {
            return new NextResponse('Provider has no Stripe account', { status: 400 });
        }

        // 1. Trigger Stripe Transfer
        const transfer = await stripe.transfers.create({
            amount: Math.round(payout.amount.toNumber() * 100),
            currency: 'gbp',
            destination: payout.provider.stripeAccountId,
            description: `Payout for job(s) - ID: ${payout.id}`,
            metadata: {
                payoutId: payout.id,
                providerId: payout.providerId,
            }
        });

        // 2. Update DB status
        await prisma.payout.update({
            where: { id: payoutId },
            data: {
                status: 'PAID',
                processedAt: new Date(),
                stripeTransferId: transfer.id,
            }
        });

        return NextResponse.json({ success: true, transferId: transfer.id });
    } catch (error: any) {
        console.error('Error processing payout:', error);
        return new NextResponse(error.message || 'Internal Error', { status: 500 });
    }
}
