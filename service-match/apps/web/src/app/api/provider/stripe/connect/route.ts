import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@service-match/db';
import { getSession } from '@/lib/auth';
import { createConnectAccount, getConnectAccountStatus, createConnectLoginLink } from '@/lib/stripe';

// Create Stripe Connect account
export async function POST(req: NextRequest) {
    try {
        const session = await getSession();
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const provider = await prisma.providerProfile.findUnique({
            where: { userId: session.user.id },
            include: { user: true },
        });

        if (!provider) {
            return NextResponse.json({ error: 'Provider not found' }, { status: 404 });
        }

        // Check if already has Stripe account
        if (provider.stripeAccountId) {
            // Check status and return appropriate link
            const status = await getConnectAccountStatus(provider.stripeAccountId);

            if (status.detailsSubmitted && status.chargesEnabled) {
                // Already onboarded, return dashboard link
                const loginUrl = await createConnectLoginLink(provider.stripeAccountId);
                return NextResponse.json({
                    accountId: provider.stripeAccountId,
                    status: 'active',
                    dashboardUrl: loginUrl,
                });
            }

            // Need to complete onboarding
            const { accountLink } = await createConnectAccount({
                email: session.user.email!,
                providerId: provider.id,
                businessName: provider.businessName,
                returnUrl: `${process.env.NEXT_PUBLIC_APP_URL}/provider/onboarding/complete`,
                refreshUrl: `${process.env.NEXT_PUBLIC_APP_URL}/provider/onboarding/refresh`,
            });

            return NextResponse.json({
                accountId: provider.stripeAccountId,
                status: 'pending',
                accountLinkUrl: accountLink.url,
            });
        }

        // Create new Connect account
        const { account, accountLink } = await createConnectAccount({
            email: session.user.email!,
            providerId: provider.id,
            businessName: provider.businessName,
            returnUrl: `${process.env.NEXT_PUBLIC_APP_URL}/provider/onboarding/complete`,
            refreshUrl: `${process.env.NEXT_PUBLIC_APP_URL}/provider/onboarding/refresh`,
        });

        // Save account ID
        await prisma.providerProfile.update({
            where: { id: provider.id },
            data: {
                stripeAccountId: account.id,
                stripeAccountStatus: 'ONBOARDING',
            },
        });

        return NextResponse.json({
            accountId: account.id,
            status: 'created',
            accountLinkUrl: accountLink.url,
        });
    } catch (error) {
        console.error('Error creating Stripe Connect account:', error);
        return NextResponse.json(
            { error: 'Failed to create payment account' },
            { status: 500 }
        );
    }
}

// Get Stripe Connect account status
export async function GET(req: NextRequest) {
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

        if (!provider.stripeAccountId) {
            return NextResponse.json({ status: 'not_connected' });
        }

        const status = await getConnectAccountStatus(provider.stripeAccountId);

        // Update local status if needed
        let localStatus: 'ONBOARDING' | 'PENDING' | 'ACTIVE' | 'RESTRICTED' = 'ONBOARDING';
        if (status.chargesEnabled && status.payoutsEnabled && status.detailsSubmitted) {
            localStatus = 'ACTIVE';
        } else if (status.detailsSubmitted) {
            localStatus = 'PENDING';
        } else if (status.requirements?.disabled_reason) {
            localStatus = 'RESTRICTED';
        }

        if (provider.stripeAccountStatus !== localStatus) {
            await prisma.providerProfile.update({
                where: { id: provider.id },
                data: {
                    stripeAccountStatus: localStatus,
                    stripeChargesEnabled: status.chargesEnabled,
                    stripePayoutsEnabled: status.payoutsEnabled,
                    stripeDetailsSubmitted: status.detailsSubmitted,
                },
            });
        }

        // Get dashboard link if active
        let dashboardUrl: string | null = null;
        if (status.chargesEnabled) {
            dashboardUrl = await createConnectLoginLink(provider.stripeAccountId);
        }

        return NextResponse.json({
            accountId: provider.stripeAccountId,
            status: localStatus.toLowerCase(),
            chargesEnabled: status.chargesEnabled,
            payoutsEnabled: status.payoutsEnabled,
            detailsSubmitted: status.detailsSubmitted,
            requirements: status.requirements,
            dashboardUrl,
        });
    } catch (error) {
        console.error('Error getting Stripe account status:', error);
        return NextResponse.json(
            { error: 'Failed to get account status' },
            { status: 500 }
        );
    }
}
