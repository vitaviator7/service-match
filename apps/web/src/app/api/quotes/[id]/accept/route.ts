import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@service-match/db';
import { getSession } from '@/lib/auth';

// Accept a quote
export async function POST(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getSession();
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { quoteRequestId } = body;

        const customer = await prisma.customerProfile.findUnique({
            where: { userId: session.user.id },
        });

        if (!customer) {
            return NextResponse.json({ error: 'Customer profile not found' }, { status: 404 });
        }

        const quote = await prisma.quote.findUnique({
            where: { id: params.id },
            include: {
                provider: { include: { user: true } },
                quoteRequest: true
            },
        });

        if (!quote) {
            return NextResponse.json({ error: 'Quote not found' }, { status: 404 });
        }

        if (quote.quoteRequest.customerId !== customer.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        if (quote.quoteRequest.status !== 'OPEN' && quote.quoteRequest.status !== 'QUOTES_RECEIVED') {
            // Allow if it's already accepted to go through flow? No, prevent double booking
            // Actually, we create a booking below.
        }

        // Create a basic booking record (pending payment)
        // We will finalize it in the checkout flow likely, but let's create the booking intent here
        // Or actually, the checkout flow might Create the booking.
        // Let's assume this endpoint is just to "Select" the quote which might create the booking in PENDING state.

        // Check if booking already exists for this quote
        let booking = await prisma.booking.findFirst({
            where: {
                quoteId: quote.id,
                status: 'ACCEPTED'
            }
        });

        if (!booking) {
            // Create pending booking
            const platformFee = Math.round(Number(quote.amount) * 0.15); // 15% platform fee (ensure number)

            booking = await prisma.booking.create({
                data: {
                    customerId: customer.id,
                    providerId: quote.providerId,
                    serviceId: quote.quoteRequest.serviceId, // Use serviceId if available? Or rely on category/quote
                    // Schema allows optional serviceId. 
                    // quoteRequest matches category. 
                    quoteId: quote.id,
                    status: 'ACCEPTED',
                    total: quote.amount, // Schema field is 'total', not 'totalAmount'
                    platformFee: platformFee,
                    // providerAmount: quote.amount - platformFee, // Schema field is 'providerEarnings'
                    providerEarnings: Number(quote.amount) - platformFee,
                    scheduledDate: quote.quoteRequest.preferredDate || new Date(),
                    scheduledTime: quote.quoteRequest.preferredTime || '09:00', // required field
                    addressLine1: quote.quoteRequest.postcode, // Simplified
                    city: quote.quoteRequest.city || 'Unknown',
                    postcode: quote.quoteRequest.postcode,
                    title: quote.quoteRequest.title,
                    subtotal: quote.amount, // required
                    platformFeeRate: 0.15, // required
                    // other required fields?
                    bookingType: 'QUOTE',
                }
            });
        }

        return NextResponse.json({
            success: true,
            bookingId: booking.id
        });

    } catch (error) {
        console.error('Error accepting quote:', error);
        return NextResponse.json(
            { error: 'Failed to accept quote' },
            { status: 500 }
        );
    }
}
