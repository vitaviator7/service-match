import Pusher from 'pusher';
import { prisma } from '@service-match/db';

const pusher = new Pusher({
    appId: process.env.PUSHER_APP_ID!,
    key: process.env.NEXT_PUBLIC_PUSHER_KEY!,
    secret: process.env.PUSHER_SECRET!,
    cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
    useTLS: true,
});

interface SendPushNotificationParams {
    userId: string;
    title: string;
    body: string;
    data?: Record<string, any>;
}

export async function sendPushNotification({
    userId,
    title,
    body,
    data,
}: SendPushNotificationParams) {
    // Check notification preferences
    const prefs = await prisma.notificationPreference.findUnique({
        where: { userId },
    });

    if (!prefs?.pushEnabled) {
        console.log(`Push notifications disabled for user ${userId}`);
        return;
    }

    // Send real-time notification via Pusher
    await pusher.trigger(`private-user-${userId}`, 'notification', {
        title,
        body,
        data,
        timestamp: new Date().toISOString(),
    });

    // Also store in-app notification
    await prisma.notification.create({
        data: {
            userId,
            type: data?.type || 'GENERAL',
            title,
            message: body,
            data: data || {},
            channel: 'PUSH',
        },
    });
}

// Send to multiple users
export async function sendBulkPushNotification(
    userIds: string[],
    title: string,
    body: string,
    data?: Record<string, any>
) {
    const promises = userIds.map((userId) =>
        sendPushNotification({ userId, title, body, data })
    );

    await Promise.allSettled(promises);
}

// Real-time chat message
export async function sendChatMessage(
    threadId: string,
    message: {
        id: string;
        content: string;
        senderId: string;
        senderName: string;
        senderAvatar?: string;
        createdAt: string;
    }
) {
    await pusher.trigger(`private-thread-${threadId}`, 'new-message', message);
}

// Real-time booking status update
export async function sendBookingStatusUpdate(
    bookingId: string,
    userId: string,
    status: string
) {
    await pusher.trigger(`private-user-${userId}`, 'booking-status', {
        bookingId,
        status,
        timestamp: new Date().toISOString(),
    });
}

// Real-time quote notification
export async function sendQuoteNotification(
    customerId: string,
    quoteRequestId: string,
    quotesCount: number
) {
    await pusher.trigger(`private-user-${customerId}`, 'new-quote', {
        quoteRequestId,
        quotesCount,
        timestamp: new Date().toISOString(),
    });
}

// Presence channel for typing indicators in chat
export async function triggerTypingIndicator(
    threadId: string,
    userId: string,
    isTyping: boolean
) {
    await pusher.trigger(`presence-thread-${threadId}`, 'typing', {
        userId,
        isTyping,
    });
}
