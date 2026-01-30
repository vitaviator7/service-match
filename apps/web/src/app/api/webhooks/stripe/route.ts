import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import Stripe from 'stripe';
import { prisma } from '@service-match/db';
import { verifyStripeWebhook } from '@/lib/stripe';

export async function POST(req: NextRequest) {
    try {
        const body = await req.text();
        const signature = headers().get('stripe-signature');

        if (!signature) {
            return NextResponse.json(
                { error: 'Missing Stripe signature' },
                { status: 400 }
            );
        }

        // Verify webhook signature
        const event = verifyStripeWebhook(body, signature);
        if (!event) {
            return NextResponse.json(
                { error: 'Invalid webhook signature' },
                { status: 400 }
            );
        }

        // Log webhook for debugging
        await prisma.webhookLog.create({
            data: {
                source: 'STRIPE',
                eventType: event.type,
                eventId: event.id,
                payload: event as any,
            },
        });

        // Handle different event types
        switch (event.type) {
            // =================================================================
            // Checkout & Payment Events
            // =================================================================
            case 'checkout.session.completed': {
                const session = event.data.object as Stripe.Checkout.Session;
                await handleCheckoutComplete(session);
                break;
            }

            case 'payment_intent.succeeded': {
                const paymentIntent = event.data.object as Stripe.PaymentIntent;
                await handlePaymentSuccess(paymentIntent);
                break;
            }

            case 'payment_intent.payment_failed': {
                const paymentIntent = event.data.object as Stripe.PaymentIntent;
                await handlePaymentFailed(paymentIntent);
                break;
            }

            // =================================================================
            // Subscription Events
            // =================================================================
            case 'customer.subscription.created': {
                const subscription = event.data.object as Stripe.Subscription;
                await handleSubscriptionCreated(subscription);
                break;
            }

            case 'customer.subscription.updated': {
                const subscription = event.data.object as Stripe.Subscription;
                await handleSubscriptionUpdated(subscription);
                break;
            }

            case 'customer.subscription.deleted': {
                const subscription = event.data.object as Stripe.Subscription;
                await handleSubscriptionDeleted(subscription);
                break;
            }

            case 'invoice.payment_succeeded': {
                const invoice = event.data.object as Stripe.Invoice;
                await handleInvoicePaid(invoice);
                break;
            }

            case 'invoice.payment_failed': {
                const invoice = event.data.object as Stripe.Invoice;
                await handleInvoiceFailed(invoice);
                break;
            }

            // =================================================================
            // Connect Account Events
            // =================================================================
            case 'account.updated': {
                const account = event.data.object as Stripe.Account;
                await handleAccountUpdated(account);
                break;
            }

            case 'payout.paid': {
                const payout = event.data.object as Stripe.Payout;
                await handlePayoutPaid(payout);
                break;
            }

            case 'payout.failed': {
                const payout = event.data.object as Stripe.Payout;
                await handlePayoutFailed(payout);
                break;
            }

            // =================================================================
            // Refund Events
            // =================================================================
            case 'charge.refunded': {
                const charge = event.data.object as Stripe.Charge;
                await handleChargeRefunded(charge);
                break;
            }

            default:
                console.log(`Unhandled event type: ${event.type}`);
        }

        // Update webhook log as processed
        await prisma.webhookLog.update({
            where: { eventId: event.id },
            data: { processedAt: new Date(), status: 'PROCESSED' },
        });

        return NextResponse.json({ received: true });
    } catch (error) {
        console.error('Webhook error:', error);

        return NextResponse.json(
            { error: 'Webhook handler failed' },
            { status: 500 }
        );
    }
}

// =============================================================================
// Handler Functions
// =============================================================================

async function handleCheckoutComplete(session: Stripe.Checkout.Session) {
    const bookingId = session.metadata?.bookingId;
    const subscriptionType = session.metadata?.subscriptionType;

    if (bookingId) {
        // Booking payment
        const booking = await prisma.booking.update({
            where: { id: bookingId },
            data: {
                status: 'PAID',
                paymentStatus: 'PAID',
                paymentIntentId: session.payment_intent as string,
                paidAt: new Date(),
            },
        });

        // Create payment record
        await prisma.payment.create({
            data: {
                bookingId,
                customerId: booking.customerId,
                providerId: booking.providerId,
                amount: booking.total,
                platformFee: booking.platformFee,
                providerAmount: booking.providerEarnings,
                currency: 'GBP',
                status: 'COMPLETED',
                stripePaymentIntentId: session.payment_intent as string,
                stripeChargeId: session.payment_intent as string, // Will be updated
            },
        });

        // Create ledger entries
        await prisma.ledgerEntry.createMany({
            data: [
                {
                    bookingId,
                    type: 'BOOKING_PAYMENT',
                    amount: booking.total,
                    currency: 'GBP',
                    description: `Payment for booking ${booking.id}`,
                },
                {
                    bookingId,
                    type: 'PLATFORM_FEE',
                    amount: booking.platformFee,
                    currency: 'GBP',
                    description: `Platform fee (${(booking.platformFeeRate.toNumber() * 100).toFixed(0)}%)`,
                },
            ],
        });

        // TODO: Send confirmation emails
        console.log(`Booking ${bookingId} paid successfully`);
    }
}

async function handlePaymentSuccess(paymentIntent: Stripe.PaymentIntent) {
    const bookingId = paymentIntent.metadata?.bookingId;

    if (bookingId) {
        await prisma.booking.update({
            where: { id: bookingId },
            data: {
                paymentStatus: 'PAID',
                paidAt: new Date(),
            },
        });
    }
}

async function handlePaymentFailed(paymentIntent: Stripe.PaymentIntent) {
    const bookingId = paymentIntent.metadata?.bookingId;

    if (bookingId) {
        await prisma.booking.update({
            where: { id: bookingId },
            data: {
                paymentStatus: 'FAILED',
            },
        });
    }
}

async function handleSubscriptionCreated(subscription: Stripe.Subscription) {
    const customerId = subscription.metadata?.customerId;
    const providerId = subscription.metadata?.providerId;
    const planType = subscription.metadata?.planType as
        | 'CUSTOMER_PLUS'
        | 'PROVIDER_STARTER'
        | 'PROVIDER_PRO'
        | 'PROVIDER_PREMIUM';

    if (customerId) {
        await prisma.subscription.create({
            data: {
                customerId,
                stripeSubscriptionId: subscription.id,
                stripePriceId: subscription.items.data[0].price.id,
                planType,
                status: subscription.status.toUpperCase() as any,
                currentPeriodStart: new Date(subscription.current_period_start * 1000),
                currentPeriodEnd: new Date(subscription.current_period_end * 1000),
            },
        });

        // Update customer profile
        await prisma.customerProfile.update({
            where: { id: customerId },
            data: { subscriptionTier: 'PLUS' },
        });
    } else if (providerId) {
        await prisma.subscription.create({
            data: {
                providerId,
                stripeSubscriptionId: subscription.id,
                stripePriceId: subscription.items.data[0].price.id,
                planType,
                status: subscription.status.toUpperCase() as any,
                currentPeriodStart: new Date(subscription.current_period_start * 1000),
                currentPeriodEnd: new Date(subscription.current_period_end * 1000),
            },
        });

        // Update provider profile
        const tier = planType?.replace('PROVIDER_', '') as 'STARTER' | 'PRO' | 'PREMIUM';
        await prisma.providerProfile.update({
            where: { id: providerId },
            data: { subscriptionTier: tier || 'STARTER' },
        });
    }
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
    const existingSub = await prisma.subscription.findUnique({
        where: { stripeSubscriptionId: subscription.id },
    });

    if (existingSub) {
        await prisma.subscription.update({
            where: { id: existingSub.id },
            data: {
                status: subscription.status.toUpperCase() as any,
                currentPeriodStart: new Date(subscription.current_period_start * 1000),
                currentPeriodEnd: new Date(subscription.current_period_end * 1000),
                cancelAtPeriodEnd: subscription.cancel_at_period_end,
                canceledAt: subscription.canceled_at
                    ? new Date(subscription.canceled_at * 1000)
                    : null,
            },
        });
    }
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
    const existingSub = await prisma.subscription.findUnique({
        where: { stripeSubscriptionId: subscription.id },
        include: { customer: true, provider: true },
    });

    if (existingSub) {
        await prisma.subscription.update({
            where: { id: existingSub.id },
            data: {
                status: 'CANCELED',
                endedAt: new Date(),
            },
        });

        // Downgrade user
        if (existingSub.customerId) {
            await prisma.customerProfile.update({
                where: { id: existingSub.customerId },
                data: { subscriptionTier: 'FREE' },
            });
        } else if (existingSub.providerId) {
            await prisma.providerProfile.update({
                where: { id: existingSub.providerId },
                data: { subscriptionTier: 'STARTER' },
            });
        }
    }
}

async function handleInvoicePaid(invoice: Stripe.Invoice) {
    const subscriptionId = invoice.subscription as string;

    if (subscriptionId) {
        // Update subscription billing info
        await prisma.subscription.updateMany({
            where: { stripeSubscriptionId: subscriptionId },
            data: {
                status: 'ACTIVE',
            },
        });
    }
}

async function handleInvoiceFailed(invoice: Stripe.Invoice) {
    const subscriptionId = invoice.subscription as string;

    if (subscriptionId) {
        await prisma.subscription.updateMany({
            where: { stripeSubscriptionId: subscriptionId },
            data: {
                status: 'PAST_DUE',
            },
        });

        // TODO: Send payment failed notification
    }
}

async function handleAccountUpdated(account: Stripe.Account) {
    // Find provider by Stripe account ID
    const provider = await prisma.providerProfile.findFirst({
        where: { stripeAccountId: account.id },
    });

    if (provider) {
        const chargesEnabled = account.charges_enabled;
        const payoutsEnabled = account.payouts_enabled;
        const detailsSubmitted = account.details_submitted;

        let status: 'ONBOARDING' | 'PENDING' | 'ACTIVE' | 'RESTRICTED' = 'ONBOARDING';

        if (chargesEnabled && payoutsEnabled && detailsSubmitted) {
            status = 'ACTIVE';
        } else if (detailsSubmitted) {
            status = 'PENDING';
        } else if (account.requirements?.disabled_reason) {
            status = 'RESTRICTED';
        }

        await prisma.providerProfile.update({
            where: { id: provider.id },
            data: {
                stripeAccountStatus: status,
                stripePayoutsEnabled: payoutsEnabled,
                stripeChargesEnabled: chargesEnabled,
                stripeDetailsSubmitted: detailsSubmitted,
            },
        });

        console.log(`Provider ${provider.id} Stripe account updated: ${status}`);
    }
}

async function handlePayoutPaid(payout: Stripe.Payout) {
    // Find payout record
    const payoutRecord = await prisma.payout.findFirst({
        where: { stripePayoutId: payout.id },
    });

    if (payoutRecord) {
        await prisma.payout.update({
            where: { id: payoutRecord.id },
            data: {
                status: 'PAID',
                paidAt: new Date(),
            },
        });
    }
}

async function handlePayoutFailed(payout: Stripe.Payout) {
    const payoutRecord = await prisma.payout.findFirst({
        where: { stripePayoutId: payout.id },
    });

    if (payoutRecord) {
        await prisma.payout.update({
            where: { id: payoutRecord.id },
            data: {
                status: 'FAILED',
                failureReason: payout.failure_message || 'Unknown error',
            },
        });
    }
}

async function handleChargeRefunded(charge: Stripe.Charge) {
    // Find booking by payment intent
    const booking = await prisma.booking.findFirst({
        where: { paymentIntentId: charge.payment_intent as string },
    });

    if (booking && charge.refunds?.data[0]) {
        const refund = charge.refunds.data[0];

        await prisma.refund.create({
            data: {
                bookingId: booking.id,
                paymentId: booking.id, // Simplified - should link to actual payment
                amount: refund.amount / 100,
                reason: (refund.reason as any) || 'REQUESTED_BY_CUSTOMER',
                status: 'COMPLETED',
                stripeRefundId: refund.id,
                processedAt: new Date(),
            },
        });

        // Update booking status if fully refunded
        if (charge.amount_refunded >= charge.amount) {
            await prisma.booking.update({
                where: { id: booking.id },
                data: {
                    status: 'CANCELLED',
                    paymentStatus: 'REFUNDED',
                },
            });
        } else {
            await prisma.booking.update({
                where: { id: booking.id },
                data: {
                    paymentStatus: 'PARTIALLY_REFUNDED',
                },
            });
        }
    }
}
