import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@service-match/db';
import { getSession } from '@/lib/auth';
import { z } from 'zod';

const quoteSchema = z.object({
    quoteRequestId: z.string(),
    amount: z.number().min(500), // Minimum £5.00
    description: z.string().min(20).max(1000),
    estimatedDuration: z.string().optional(),
    validUntil: z.string().optional(), // ISO date string
});

export async function POST(req: NextRequest) {
    try {
        const session = await getSession();
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const provider = await prisma.providerProfile.findUnique({
            where: { userId: session.user.id },
            select: { id: true, status: true, businessName: true },
        });

        if (!provider) {
            return NextResponse.json({ error: 'Provider profile not found' }, { status: 404 });
        }

        if (provider.status !== 'ACTIVE') {
            return NextResponse.json(
                { error: 'Your account must be active to submit quotes' },
                { status: 403 }
            );
        }

        const body = await req.json();
        const result = quoteSchema.safeParse(body);

        if (!result.success) {
            return NextResponse.json(
                { error: 'Invalid input', details: result.error.flatten() },
                { status: 400 }
            );
        }

        const data = result.data;

        // Check if request exists and is open
        const request = await prisma.quoteRequest.findUnique({
            where: { id: data.quoteRequestId },
        });

        if (!request) {
            return NextResponse.json({ error: 'Quote request not found' }, { status: 404 });
        }

        if (request.status !== 'OPEN' && request.status !== 'QUOTES_RECEIVED') {
            return NextResponse.json(
                { error: 'This request is no longer accepting quotes' },
                { status: 400 }
            );
        }

        // Check if already quoted
        const existingQuote = await prisma.quote.findFirst({
            where: {
                quoteRequestId: data.quoteRequestId,
                providerId: provider.id,
            },
        });

        if (existingQuote) {
            return NextResponse.json(
                { error: 'You have already submitted a quote for this request' },
                { status: 400 }
            );
        }

        // Parse duration (simple implementation: try to extract number, otherwise defaults)
        let durationMinutes = 60; // default 1 hour
        if (data.estimatedDuration) {
            const match = data.estimatedDuration.match(/(\d+)/);
            if (match) {
                durationMinutes = parseInt(match[0]);
                if (data.estimatedDuration.toLowerCase().includes('hour')) {
                    durationMinutes *= 60;
                } else if (data.estimatedDuration.toLowerCase().includes('day')) {
                    durationMinutes *= 60 * 8; // 8 hour work day
                }
            }
        }

        // Create quote
        const quote = await prisma.quote.create({
            data: {
                quoteRequestId: data.quoteRequestId,
                providerId: provider.id,
                amount: data.amount / 100, // stored as decimal, input in pence
                message: data.description,
                estimatedDuration: durationMinutes,
                validUntil: data.validUntil ? new Date(data.validUntil) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                status: 'SENT',
            },
        });

        // Update request status
        if (request.status === 'OPEN') {
            await prisma.quoteRequest.update({
                where: { id: request.id },
                data: { status: 'QUOTES_RECEIVED' },
            });
        }

        // Notify customer
        await prisma.notification.create({
            data: {
                userId: await getUserIdByCustomerId(request.customerId),
                type: 'NEW_QUOTE',
                title: 'New Quote Received',
                body: `${provider.businessName} has sent you a quote for your request.`,
                data: {
                    quoteId: quote.id,
                    quoteRequestId: request.id,
                    providerId: provider.id
                },
                isRead: false,
            },
        });

        return NextResponse.json(quote);
    } catch (error) {
        console.error('Error creating quote:', error);
        return NextResponse.json(
            { error: 'Failed to submit quote' },
            { status: 500 }
        );
    }
}

async function getUserIdByCustomerId(customerId: string): Promise<string> {
    const customer = await prisma.customerProfile.findUnique({
        where: { id: customerId },
        select: { userId: true },
    });
    return customer?.userId || '';
}
