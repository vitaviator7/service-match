import { prisma } from '@service-match/db';

export async function expireQuotes() {
    console.log('⏰ Checking for expired quotes...');

    const now = new Date();

    // Expire quote requests older than 7 days
    const expiredRequests = await prisma.quoteRequest.updateMany({
        where: {
            status: { in: ['OPEN', 'QUOTES_RECEIVED'] },
            expiresAt: { lt: now },
        },
        data: {
            status: 'EXPIRED',
        },
    });

    console.log(`📋 Expired ${expiredRequests.count} quote requests`);

    // Expire individual quotes past their valid date
    const expiredQuotes = await prisma.quote.updateMany({
        where: {
            status: { in: ['SENT', 'VIEWED'] },
            validUntil: { lt: now },
        },
        data: {
            status: 'EXPIRED',
        },
    });

    console.log(`📄 Expired ${expiredQuotes.count} individual quotes`);
}
