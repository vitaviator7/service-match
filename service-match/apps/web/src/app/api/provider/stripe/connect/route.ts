import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@service-match/db';
import { getSession } from '@/lib/auth';
import { stripe, createConnectAccount, createConnectLoginLink } from '@/lib/stripe';

export async function POST(req: NextRequest) {
    try {
        const session = await getSession();
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const provider = await prisma.providerProfile.findUnique({
            where: { userId: session.user.id },
        });

        if (!provider) {
            return NextResponse.json({ error: 'Provider not found' }, { status: 404 });
        }

        // If already connected and active, return dashboard link
        if (provider.stripeAccountId && provider.stripeAccountStatus === 'active') { // Note: verify 'active' matches schema
            const url = await createConnectLoginLink(provider.stripeAccountId);
            return NextResponse.json({ url });
        }

        let accountId = provider.stripeAccountId;

        if (!accountId) {
            // Create new account
            const { account } = await createConnectAccount({
                email: session.user.email,
                providerId: provider.id,
                businessName: provider.businessName,
                returnUrl: `${process.env.NEXT_PUBLIC_APP_URL}/provider/settings`,
                refreshUrl: `${process.env.NEXT_PUBLIC_APP_URL}/provider/settings`,
            });
            accountId = account.id;

            await prisma.providerProfile.update({
                where: { id: provider.id },
                data: { stripeAccountId: accountId },
            });

            // createConnectAccount returns { account, accountLink }, but I need to extract the link URL
            // Wait, createConnectAccount helper helper returns `accountLink` object.
            // But I can't easily access it if I didn't return it above.
            // Actually, the helper DOES return it.

            // Let's just create a new link here to be sure, or use logic below.
        }

        // Create Account Link for onboarding (resume or start)
        const accountLink = await stripe.accountLinks.create({
            account: accountId,
            refresh_url: `${process.env.NEXT_PUBLIC_APP_URL}/provider/settings`,
            return_url: `${process.env.NEXT_PUBLIC_APP_URL}/provider/settings`,
            type: 'account_onboarding',
        });

        return NextResponse.json({ url: accountLink.url });

    } catch (error) {
        console.error('Error connecting Stripe:', error);
        return NextResponse.json({ error: 'Failed to connect Stripe' }, { status: 500 });
    }
}
