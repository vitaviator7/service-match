import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@service-match/db';
import { getSession } from '@/lib/auth';
import { createBookingCheckoutSession } from '@/lib/stripe';
export const dynamic = 'force-dynamic';

export async function POST(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getSession();
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const booking = await prisma.booking.findUnique({
            where: { id: params.id },
            include: {
                provider: true,
                customer: { include: { user: true } },
                service: true,
            },
        });

        if (!booking) {
            return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
        }

        if (booking.customerId !== (await prisma.customerProfile.findUnique({ where: { userId: session.user.id } }))?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        if (booking.status !== 'ACCEPTED' || booking.paymentStatus !== 'PENDING') {
            return NextResponse.json(
                { error: 'Booking is not ready for payment or already paid' },
                { status: 400 }
            );
        }

        if (!booking.provider.stripeAccountId) {
            return NextResponse.json(
                { error: 'Provider has not set up payments yet' },
                { status: 400 }
            );
        }

        const checkoutSession = await createBookingCheckoutSession({
            bookingId: booking.id,
            customerId: booking.customer.stripeCustomerId || '', // Assuming we have it, or create it?
            customerEmail: booking.customer.user.email,
            amount: Number(booking.total),
            serviceName: booking.title,
            providerConnectAccountId: booking.provider.stripeAccountId,
            platformFeeAmount: Number(booking.platformFee),
            successUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/bookings/${booking.id}?payment=success`,
            cancelUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/bookings/${booking.id}?payment=cancelled`,
        });

        return NextResponse.json({ url: checkoutSession.url });

    } catch (error) {
        console.error('Error creating checkout session:', error);
        return NextResponse.json(
            { error: 'Failed to create checkout session' },
            { status: 500 }
        );
    }
}
