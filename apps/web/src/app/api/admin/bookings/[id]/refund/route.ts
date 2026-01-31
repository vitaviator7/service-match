import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@service-match/db';
import { stripe } from '@/lib/stripe';

export async function POST(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getSession();
        if (!session?.user || session.user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { amount, reason } = await req.json();

        if (!amount || isNaN(amount)) {
            return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
        }

        const booking = await prisma.booking.findUnique({
            where: { id: params.id },
            include: { provider: true }
        });

        if (!booking) {
            return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
        }

        if (!booking.paymentIntentId) {
            return NextResponse.json({ error: 'No payment intent found for this booking' }, { status: 400 });
        }

        // 1. Create Stripe Refund
        const refund = await stripe.refunds.create({
            payment_intent: booking.paymentIntentId,
            amount: Math.round(amount * 100), // convert to cents
            reason: 'requested_by_customer', // standard Stripe reasons
            metadata: {
                bookingId: booking.id,
                adminId: session.user.id,
                reason: reason || 'Admin initiated refund'
            }
        });

        // 2. Update Database (Atomic transaction)
        const updatedBooking = await prisma.$transaction(async (tx) => {
            // Create Refund record
            await tx.refund.create({
                data: {
                    bookingId: booking.id,
                    paymentId: booking.paymentStatus === 'PAID' ? (await tx.payment.findFirst({ where: { bookingId: booking.id } }))?.id || '' : '',
                    customerId: booking.customerId,
                    providerId: booking.providerId,
                    amount: amount,
                    reason: reason || 'Admin initiated refund',
                    status: 'COMPLETED',
                    stripeRefundId: refund.id,
                    processedAt: new Date(),
                }
            });

            // Update Booking status
            const newPaymentStatus = amount >= booking.total.toNumber() ? 'REFUNDED' : 'PARTIALLY_REFUNDED';

            const updated = await tx.booking.update({
                where: { id: booking.id },
                data: {
                    paymentStatus: newPaymentStatus,
                    status: amount >= booking.total.toNumber() ? 'REFUNDED' : booking.status,
                }
            });

            // Create Ledger Entry
            await tx.ledgerEntry.create({
                data: {
                    bookingId: booking.id,
                    providerId: booking.providerId,
                    type: 'REFUND',
                    amount: -amount,
                    description: `Refund issued: ${reason || 'Admin initiated'}`,
                    metadata: {
                        stripeRefundId: refund.id,
                        adminId: session.user.id
                    }
                }
            });

            return updated;
        });

        return NextResponse.json({ success: true, booking: updatedBooking });

    } catch (error: any) {
        console.error('Error processing refund:', error);
        return NextResponse.json({
            error: error.message || 'Failed to process refund',
            details: error.raw?.message || null
        }, { status: 500 });
    }
}
