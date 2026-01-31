import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@service-match/db';
import { getSession } from '@/lib/auth';
import { z } from 'zod';
import { createBookingCheckoutSession } from '@/lib/stripe';
export const dynamic = 'force-dynamic';

const bookingSchema = z.object({
    quoteId: z.string(),
    scheduledDate: z.string(),
    scheduledTime: z.string(),
    address: z.string().min(10),
    notes: z.string().optional(),
});

// Get user's bookings
export async function GET(req: NextRequest) {
    try {
        const session = await getSession();
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const status = searchParams.get('status');
        const role = searchParams.get('role') || 'customer';

        // Get profile
        const customerProfile = await prisma.customerProfile.findUnique({
            where: { userId: session.user.id },
        });
        const providerProfile = await prisma.providerProfile.findUnique({
            where: { userId: session.user.id },
        });

        const isProvider = role === 'provider' && providerProfile;

        const where: any = isProvider
            ? { providerId: providerProfile?.id }
            : { customerId: customerProfile?.id };

        if (status) {
            where.status = status.toUpperCase();
        }

        const bookings = await prisma.booking.findMany({
            where,
            include: {
                customer: { include: { user: true } },
                provider: { include: { user: true } },
                service: { include: { category: true } },
            },
            orderBy: { scheduledDate: 'desc' },
        });

        return NextResponse.json(bookings);
    } catch (error) {
        console.error('Error fetching bookings:', error);
        return NextResponse.json(
            { error: 'Failed to fetch bookings' },
            { status: 500 }
        );
    }
}

// Create a booking from an accepted quote
export async function POST(req: NextRequest) {
    try {
        const session = await getSession();
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const result = bookingSchema.safeParse(body);

        if (!result.success) {
            return NextResponse.json(
                { error: 'Invalid input', details: result.error.flatten() },
                { status: 400 }
            );
        }

        const { quoteId, scheduledDate, scheduledTime, address, notes } = result.data;

        // Get customer profile
        const customerProfile = await prisma.customerProfile.findUnique({
            where: { userId: session.user.id },
        });

        if (!customerProfile) {
            return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
        }

        // Get quote and validate
        const quote = await prisma.quote.findUnique({
            where: { id: quoteId },
            include: {
                provider: true,
                service: { include: { category: true } },
                quoteRequest: true,
            },
        });

        if (!quote) {
            return NextResponse.json({ error: 'Quote not found' }, { status: 404 });
        }

        if (quote.quoteRequest.customerId !== customerProfile.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        if (quote.status !== 'ACCEPTED') {
            return NextResponse.json(
                { error: 'Quote must be accepted first' },
                { status: 400 }
            );
        }

        if (new Date(quote.validUntil) < new Date()) {
            return NextResponse.json({ error: 'Quote has expired' }, { status: 400 });
        }

        // Get platform fee rate
        const platformFeeConfig = await prisma.platformConfig.findUnique({
            where: { key: 'platform_fee_rate' },
        });
        const platformFeeRate = platformFeeConfig
            ? parseFloat(platformFeeConfig.value)
            : 0.18;

        // Calculate amounts
        const subtotal = quote.amount.toNumber();
        const platformFee = subtotal * platformFeeRate;
        const providerEarnings = subtotal - platformFee;

        // Parse date and time
        const [hours, minutes] = scheduledTime.split(':').map(Number);
        const bookingDateTime = new Date(scheduledDate);
        bookingDateTime.setHours(hours, minutes, 0, 0);

        // Create booking
        const booking = await prisma.booking.create({
            data: {
                customerId: customerProfile.id,
                providerId: quote.providerId,
                quoteId: quote.id,
                serviceId: quote.serviceId,
                title: `${quote.service?.name || 'Service'} Booking`,
                scheduledDate: bookingDateTime,
                scheduledTime: scheduledTime,
                estimatedDuration: quote.estimatedDuration,
                subtotal,
                platformFee,
                platformFeeRate,
                providerEarnings,
                total: subtotal,
                addressLine1: address,
                city: quote.quoteRequest.city || 'TBD',
                postcode: quote.quoteRequest.postcode,
                customerNotes: notes,
                status: 'PENDING',
                paymentStatus: 'PENDING',
            },
        });

        // Update quote status
        await prisma.quote.update({
            where: { id: quoteId },
            data: { status: 'BOOKED' },
        });

        // Create checkout session
        if (!quote.provider.stripeAccountId) {
            // Provider hasn't connected Stripe - create booking without immediate payment
            await prisma.booking.update({
                where: { id: booking.id },
                data: { status: 'CONFIRMED' },
            });

            return NextResponse.json({
                bookingId: booking.id,
                checkoutUrl: null,
                message: 'Booking confirmed - payment will be collected in person',
            });
        }

        const checkoutSession = await createBookingCheckoutSession({
            bookingId: booking.id,
            customerId: customerProfile.id,
            customerEmail: session.user.email!,
            amount: subtotal,
            serviceName: `${quote.service?.name || 'Service'} by ${quote.provider.businessName}`,
            providerConnectAccountId: quote.provider.stripeAccountId,
            platformFeeAmount: platformFee,
            successUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/bookings/${booking.id}?success=true`,
            cancelUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/quotes/${quote.quoteRequest.id}`,
        });

        // Update booking with checkout session ID
        await prisma.booking.update({
            where: { id: booking.id },
            data: { stripeCheckoutSessionId: checkoutSession.id },
        });

        return NextResponse.json({
            bookingId: booking.id,
            checkoutUrl: checkoutSession.url,
        });
    } catch (error) {
        console.error('Error creating booking:', error);
        return NextResponse.json(
            { error: 'Failed to create booking' },
            { status: 500 }
        );
    }
}

function calculateEndTime(startTime: string, durationHours: number): string {
    const [hours, minutes] = startTime.split(':').map(Number);
    const totalMinutes = hours * 60 + minutes + durationHours * 60;
    const endHours = Math.floor(totalMinutes / 60) % 24;
    const endMinutes = totalMinutes % 60;
    return `${endHours.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}`;
}
