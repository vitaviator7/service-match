import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY is not set');
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2023-10-16',
    typescript: true,
});

// =============================================================================
// Checkout Session Helpers
// =============================================================================

export async function createBookingCheckoutSession(params: {
    bookingId: string;
    customerId: string;
    customerEmail: string;
    amount: number;
    serviceName: string;
    providerConnectAccountId: string;
    platformFeeAmount: number;
    successUrl: string;
    cancelUrl: string;
}) {
    const session = await stripe.checkout.sessions.create({
        mode: 'payment',
        customer_email: params.customerEmail,
        line_items: [
            {
                price_data: {
                    currency: 'gbp',
                    unit_amount: Math.round(params.amount * 100), // Convert to pence
                    product_data: {
                        name: params.serviceName,
                        description: `Booking ID: ${params.bookingId}`,
                    },
                },
                quantity: 1,
            },
        ],
        payment_intent_data: {
            application_fee_amount: Math.round(params.platformFeeAmount * 100),
            transfer_data: {
                destination: params.providerConnectAccountId,
            },
            metadata: {
                bookingId: params.bookingId,
                customerId: params.customerId,
            },
        },
        metadata: {
            bookingId: params.bookingId,
            customerId: params.customerId,
            type: 'booking_payment',
        },
        success_url: params.successUrl,
        cancel_url: params.cancelUrl,
    });

    return session;
}

export async function createSubscriptionCheckoutSession(params: {
    userId: string;
    email: string;
    priceId: string;
    successUrl: string;
    cancelUrl: string;
    trialDays?: number;
}) {
    // Get or create Stripe customer
    let stripeCustomerId: string;

    const existingCustomers = await stripe.customers.list({
        email: params.email,
        limit: 1,
    });

    if (existingCustomers.data.length > 0) {
        stripeCustomerId = existingCustomers.data[0].id;
    } else {
        const customer = await stripe.customers.create({
            email: params.email,
            metadata: {
                userId: params.userId,
            },
        });
        stripeCustomerId = customer.id;
    }

    const session = await stripe.checkout.sessions.create({
        mode: 'subscription',
        customer: stripeCustomerId,
        line_items: [
            {
                price: params.priceId,
                quantity: 1,
            },
        ],
        subscription_data: params.trialDays
            ? {
                trial_period_days: params.trialDays,
                metadata: {
                    userId: params.userId,
                },
            }
            : {
                metadata: {
                    userId: params.userId,
                },
            },
        metadata: {
            userId: params.userId,
            type: 'subscription',
        },
        success_url: params.successUrl,
        cancel_url: params.cancelUrl,
    });

    return session;
}

// =============================================================================
// Connect Account Helpers
// =============================================================================

export async function createConnectAccount(params: {
    email: string;
    providerId: string;
    businessName: string;
    returnUrl: string;
    refreshUrl: string;
}) {
    // Create Express Connect account
    const account = await stripe.accounts.create({
        type: 'express',
        country: 'GB',
        email: params.email,
        business_type: 'individual',
        capabilities: {
            card_payments: { requested: true },
            transfers: { requested: true },
        },
        business_profile: {
            name: params.businessName,
            mcc: '7699', // Miscellaneous Repair Services
            url: `${process.env.NEXT_PUBLIC_APP_URL}/provider/${params.providerId}`,
        },
        metadata: {
            providerId: params.providerId,
        },
    });

    // Create account link for onboarding
    const accountLink = await stripe.accountLinks.create({
        account: account.id,
        refresh_url: params.refreshUrl,
        return_url: params.returnUrl,
        type: 'account_onboarding',
    });

    return { account, accountLink };
}

export async function getConnectAccountStatus(accountId: string) {
    const account = await stripe.accounts.retrieve(accountId);

    return {
        id: account.id,
        chargesEnabled: account.charges_enabled,
        payoutsEnabled: account.payouts_enabled,
        detailsSubmitted: account.details_submitted,
        requirements: account.requirements,
    };
}

export async function createConnectLoginLink(accountId: string) {
    const loginLink = await stripe.accounts.createLoginLink(accountId);
    return loginLink.url;
}

// =============================================================================
// Transfer & Payout Helpers
// =============================================================================

export async function createTransferToPlatform(params: {
    amount: number;
    paymentIntentId: string;
    description: string;
}) {
    const transfer = await stripe.transfers.create({
        amount: Math.round(params.amount * 100),
        currency: 'gbp',
        source_transaction: params.paymentIntentId,
        description: params.description,
    });

    return transfer;
}

export async function createPayoutToProvider(params: {
    accountId: string;
    amount: number;
    description: string;
    metadata?: Record<string, string>;
}) {
    const payout = await stripe.payouts.create(
        {
            amount: Math.round(params.amount * 100),
            currency: 'gbp',
            description: params.description,
            metadata: params.metadata,
        },
        {
            stripeAccount: params.accountId,
        }
    );

    return payout;
}

// =============================================================================
// Refund Helpers
// =============================================================================

export async function createRefund(params: {
    paymentIntentId: string;
    amount?: number;
    reason?: 'duplicate' | 'fraudulent' | 'requested_by_customer';
    metadata?: Record<string, string>;
}) {
    const refund = await stripe.refunds.create({
        payment_intent: params.paymentIntentId,
        amount: params.amount ? Math.round(params.amount * 100) : undefined,
        reason: params.reason,
        metadata: params.metadata,
    });

    return refund;
}

// =============================================================================
// Webhook Verification
// =============================================================================

export function constructWebhookEvent(
    payload: Buffer,
    signature: string,
    webhookSecret: string
) {
    return stripe.webhooks.constructEvent(payload, signature, webhookSecret);
}

export function verifyStripeWebhook(
    payload: string,
    signature: string
): Stripe.Event | null {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!webhookSecret) {
        console.error('STRIPE_WEBHOOK_SECRET is not set');
        return null;
    }

    try {
        return stripe.webhooks.constructEvent(
            payload,
            signature,
            webhookSecret
        );
    } catch (err) {
        console.error('Webhook signature verification failed:', err);
        return null;
    }
}
