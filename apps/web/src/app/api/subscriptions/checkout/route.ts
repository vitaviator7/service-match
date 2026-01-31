import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@service-match/db';
import { getSession } from '@/lib/auth';
import { createSubscriptionCheckoutSession } from '@/lib/stripe';

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
    try {
        const session = await getSession();
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { planId } = await req.json();

        if (!planId) {
            return NextResponse.json({ error: 'Plan ID is required' }, { status: 400 });
        }

        let priceId = '';
        let successUrl = '';
        let cancelUrl = '';
        let type: 'CUSTOMER' | 'PROVIDER' = 'CUSTOMER';

        switch (planId) {
            case 'PLUS':
                priceId = process.env.STRIPE_CUSTOMER_PLUS_PRICE_ID || '';
                successUrl = `${process.env.NEXT_PUBLIC_APP_URL}/plus?session_id={CHECKOUT_SESSION_ID}`;
                cancelUrl = `${process.env.NEXT_PUBLIC_APP_URL}/plus`;
                type = 'CUSTOMER';
                break;
            case 'PRO':
                priceId = process.env.STRIPE_PROVIDER_PRO_PRICE_ID || '';
                successUrl = `${process.env.NEXT_PUBLIC_APP_URL}/provider/upgrade?session_id={CHECKOUT_SESSION_ID}`;
                cancelUrl = `${process.env.NEXT_PUBLIC_APP_URL}/provider/upgrade`;
                type = 'PROVIDER';
                break;
            case 'PREMIUM':
                priceId = process.env.STRIPE_PROVIDER_PREMIUM_PRICE_ID || '';
                successUrl = `${process.env.NEXT_PUBLIC_APP_URL}/provider/upgrade?session_id={CHECKOUT_SESSION_ID}`;
                cancelUrl = `${process.env.NEXT_PUBLIC_APP_URL}/provider/upgrade`;
                type = 'PROVIDER';
                break;
            default:
                return NextResponse.json({ error: 'Invalid plan ID' }, { status: 400 });
        }

        if (!priceId) {
            return NextResponse.json({ error: 'Stripe Price ID not configured for this plan' }, { status: 500 });
        }

        const metadata: Record<string, string> = {};
        if (type === 'CUSTOMER') {
            const customer = await prisma.customerProfile.findUnique({
                where: { userId: session.user.id }
            });
            if (!customer) return NextResponse.json({ error: 'Customer profile not found' }, { status: 404 });
            metadata.customerId = customer.id;
            metadata.planType = 'CUSTOMER_PLUS';
        } else {
            const provider = await prisma.providerProfile.findUnique({
                where: { userId: session.user.id }
            });
            if (!provider) return NextResponse.json({ error: 'Provider profile not found' }, { status: 404 });
            metadata.providerId = provider.id;
            metadata.planType = planId === 'PRO' ? 'PROVIDER_PRO' : 'PROVIDER_PREMIUM';
        }

        const checkoutSession = await createSubscriptionCheckoutSession({
            userId: session.user.id,
            email: session.user.email!,
            priceId,
            successUrl,
            cancelUrl,
            metadata,
        });

        return NextResponse.json({ url: checkoutSession.url });

    } catch (error) {
        console.error('Error creating subscription session:', error);
        return NextResponse.json({ error: 'Failed to create subscription session' }, { status: 500 });
    }
}
