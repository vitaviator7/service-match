// =============================================================================
// ServiceMatch Worker Service
// Background job processing with BullMQ
// =============================================================================

import { Worker, Queue } from 'bullmq';
import IORedis from 'ioredis';
import { prisma } from '@service-match/db';
import { Prisma } from '@prisma/client';
import { sendEmail } from './services/email';
import { sendSMS } from './services/sms';
import { sendPushNotification } from './services/push';
import { processPayouts } from './jobs/payouts';
import { expireQuotes } from './jobs/expire-quotes';
import { sendReviewReminders } from './jobs/review-reminders';
import { updateSearchIndex } from './jobs/search-index';

// Redis connection
const connection = new IORedis(process.env.REDIS_URL!, {
    maxRetriesPerRequest: null,
});

console.log('🚀 ServiceMatch Worker starting...');

// =============================================================================
// Queue Definitions
// =============================================================================

export const emailQueue = new Queue('email', { connection });
export const smsQueue = new Queue('sms', { connection });
export const pushQueue = new Queue('push', { connection });
export const scheduledQueue = new Queue('scheduled', { connection });

// =============================================================================
// Email Worker
// =============================================================================

const emailWorker = new Worker(
    'email',
    async (job) => {
        console.log(`📧 Processing email job: ${job.id}`);

        const { to, template, data } = job.data;

        try {
            await sendEmail({ to, template, data });
            console.log(`✅ Email sent to ${to}`);
        } catch (error) {
            console.error(`❌ Failed to send email to ${to}:`, error);
            throw error;
        }
    },
    {
        connection,
        concurrency: 10,
        limiter: {
            max: 100,
            duration: 60000, // 100 emails per minute
        },
    }
);

emailWorker.on('completed', (job) => {
    console.log(`📧 Email job ${job.id} completed`);
});

emailWorker.on('failed', (job, err) => {
    console.error(`📧 Email job ${job?.id} failed:`, err.message);
});

// =============================================================================
// SMS Worker
// =============================================================================

const smsWorker = new Worker(
    'sms',
    async (job) => {
        console.log(`📱 Processing SMS job: ${job.id}`);

        const { to, message, userId } = job.data;

        // Check user notification preferences
        if (userId) {
            const prefs = await prisma.notificationPreference.findUnique({
                where: { userId },
            });

            if (!prefs?.smsTransactional) {
                console.log(`📱 SMS disabled for user ${userId}, skipping`);
                return;
            }
        }

        try {
            await sendSMS({ to, message });
            console.log(`✅ SMS sent to ${to}`);
        } catch (error) {
            console.error(`❌ Failed to send SMS to ${to}:`, error);
            throw error;
        }
    },
    {
        connection,
        concurrency: 5,
        limiter: {
            max: 30,
            duration: 60000, // 30 SMS per minute
        },
    }
);

smsWorker.on('completed', (job) => {
    console.log(`📱 SMS job ${job.id} completed`);
});

smsWorker.on('failed', (job, err) => {
    console.error(`📱 SMS job ${job?.id} failed:`, err.message);
});

// =============================================================================
// Push Notification Worker
// =============================================================================

const pushWorker = new Worker(
    'push',
    async (job) => {
        console.log(`🔔 Processing push job: ${job.id}`);

        const { userId, title, body, data } = job.data;

        try {
            await sendPushNotification({ userId, title, body, data });
            console.log(`✅ Push notification sent to user ${userId}`);
        } catch (error) {
            console.error(`❌ Failed to send push to user ${userId}:`, error);
            throw error;
        }
    },
    {
        connection,
        concurrency: 20,
    }
);

// =============================================================================
// Scheduled Jobs Worker
// =============================================================================

const scheduledWorker = new Worker(
    'scheduled',
    async (job) => {
        console.log(`⏰ Processing scheduled job: ${job.name}`);

        switch (job.name) {
            case 'process-payouts':
                await processPayouts();
                break;

            case 'expire-quotes':
                await expireQuotes();
                break;

            case 'review-reminders':
                await sendReviewReminders();
                break;

            case 'update-search-index':
                await updateSearchIndex();
                break;

            case 'auto-confirm-bookings':
                await autoConfirmBookings();
                break;

            default:
                console.log(`Unknown scheduled job: ${job.name}`);
        }
    },
    { connection }
);

// =============================================================================
// Auto-confirm Bookings (48 hours after completion)
// =============================================================================

async function autoConfirmBookings() {
    const cutoff = new Date(Date.now() - 48 * 60 * 60 * 1000);

    const bookings = await prisma.booking.findMany({
        where: {
            status: 'COMPLETED',
            completedAt: { lt: cutoff },
            confirmedAt: null,
        },
        include: {
            customer: true,
            provider: true,
        },
    });

    for (const booking of bookings) {
        await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
            // Confirm booking
            await tx.booking.update({
                where: { id: booking.id },
                data: { confirmedAt: new Date() },
            });

            // Update provider balance
            await tx.providerProfile.update({
                where: { id: booking.providerId },
                data: {
                    pendingBalance: { decrement: booking.providerEarnings },
                    availableBalance: { increment: booking.providerEarnings },
                },
            });

            // Create ledger entry
            await tx.ledgerEntry.create({
                data: {
                    providerId: booking.providerId,
                    bookingId: booking.id,
                    type: 'BOOKING_CONFIRMED',
                    amount: booking.providerEarnings,
                    runningBalance: 0,
                    description: `Booking #${booking.id.slice(0, 8)} auto-confirmed`,
                },
            });
        });

        console.log(`✅ Auto-confirmed booking ${booking.id}`);
    }

    console.log(`⏰ Auto-confirmed ${bookings.length} bookings`);
}

// =============================================================================
// Setup Recurring Jobs
// =============================================================================

async function setupRecurringJobs() {
    // Process payouts - Every Friday at 6 AM
    await scheduledQueue.upsertJobScheduler(
        'process-payouts-scheduler',
        { pattern: '0 6 * * 5' }, // Friday 6 AM
        { name: 'process-payouts' }
    );

    // Expire quotes - Every hour
    await scheduledQueue.upsertJobScheduler(
        'expire-quotes-scheduler',
        { pattern: '0 * * * *' }, // Every hour
        { name: 'expire-quotes' }
    );

    // Review reminders - Every day at 10 AM
    await scheduledQueue.upsertJobScheduler(
        'review-reminders-scheduler',
        { pattern: '0 10 * * *' }, // 10 AM daily
        { name: 'review-reminders' }
    );

    // Update search index - Every 15 minutes
    await scheduledQueue.upsertJobScheduler(
        'search-index-scheduler',
        { pattern: '*/15 * * * *' }, // Every 15 min
        { name: 'update-search-index' }
    );

    // Auto-confirm bookings - Every 6 hours
    await scheduledQueue.upsertJobScheduler(
        'auto-confirm-scheduler',
        { pattern: '0 */6 * * *' }, // Every 6 hours
        { name: 'auto-confirm-bookings' }
    );

    console.log('✅ Recurring jobs scheduled');
}

// =============================================================================
// Graceful Shutdown
// =============================================================================

async function shutdown() {
    console.log('🛑 Shutting down workers...');

    await emailWorker.close();
    await smsWorker.close();
    await pushWorker.close();
    await scheduledWorker.close();
    await connection.quit();

    console.log('👋 Workers shut down gracefully');
    process.exit(0);
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

// =============================================================================
// Start
// =============================================================================

setupRecurringJobs().then(() => {
    console.log('✅ ServiceMatch Worker running');
});
