import { prisma } from '@service-match/db';
import { emailQueue } from '../index';

export async function sendReviewReminders() {
    console.log('⭐ Sending review reminders...');

    // Find completed bookings from 24-48 hours ago without reviews
    const cutoffStart = new Date(Date.now() - 48 * 60 * 60 * 1000);
    const cutoffEnd = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const bookings = await prisma.booking.findMany({
        where: {
            status: 'COMPLETED',
            completedAt: {
                gte: cutoffStart,
                lt: cutoffEnd,
            },
            review: null,
        },
        include: {
            customer: {
                include: { user: true },
            },
            provider: true,
            quote: {
                include: { quoteRequest: { include: { category: true } } },
            },
        },
    });

    let sentCount = 0;

    for (const booking of bookings as any[]) {
        // Check if we already sent a reminder
        const existingReminder = await prisma.notification.findFirst({
            where: {
                userId: booking.customer.userId,
                type: 'REVIEW_REQUESTED',
                data: {
                    path: ['bookingId'],
                    equals: booking.id,
                },
            },
        });

        if (existingReminder) continue;

        // Queue review request email
        await emailQueue.add('review-reminder', {
            to: booking.customer.user.email,
            template: 'reviewRequest',
            data: {
                name: booking.customer.user.firstName,
                providerName: booking.provider.businessName,
                service: booking.quote?.quoteRequest?.category?.name || 'Service',
                reviewUrl: `${process.env.NEXT_PUBLIC_APP_URL}/bookings/${booking.id}/review`,
            },
        });

        // Create in-app notification
        await prisma.notification.create({
            data: {
                userId: booking.customer.userId,
                type: 'REVIEW_REQUESTED',
                title: 'How was your experience?',
                message: `Please take a moment to review ${booking.provider.businessName}`,
                data: { bookingId: booking.id },
                channels: ['EMAIL'],
            },
        });

        sentCount++;
    }

    console.log(`⭐ Sent ${sentCount} review reminders`);
}
