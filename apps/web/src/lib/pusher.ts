// =============================================================================
// Pusher Client & Server Configuration
// =============================================================================

import Pusher from 'pusher';
import PusherClient from 'pusher-js';

// Server-side Pusher instance
export const pusherServer =
    process.env.PUSHER_APP_ID &&
        process.env.PUSHER_KEY &&
        process.env.PUSHER_SECRET
        ? new Pusher({
            appId: process.env.PUSHER_APP_ID,
            key: process.env.PUSHER_KEY,
            secret: process.env.PUSHER_SECRET,
            cluster: process.env.PUSHER_CLUSTER || 'eu',
            useTLS: true,
        })
        : null;

// Client-side Pusher instance
let pusherClientInstance: PusherClient | null = null;

export function getPusherClient(): PusherClient | null {
    if (typeof window === 'undefined') return null;

    const key = process.env.NEXT_PUBLIC_PUSHER_KEY;
    const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER || 'eu';

    if (!key) return null;

    if (!pusherClientInstance) {
        pusherClientInstance = new PusherClient(key, {
            cluster,
            forceTLS: true,
        });
    }

    return pusherClientInstance;
}

// =============================================================================
// Channel Names
// =============================================================================

export const channels = {
    // Private channel for a specific user
    user: (userId: string) => `private-user-${userId}`,

    // Private channel for a message thread
    thread: (threadId: string) => `private-thread-${threadId}`,

    // Presence channel for online status
    presence: (providerId: string) => `presence-provider-${providerId}`,
};

// =============================================================================
// Event Types
// =============================================================================

export const events = {
    // Message events
    MESSAGE_NEW: 'message:new',
    MESSAGE_READ: 'message:read',
    MESSAGE_TYPING: 'message:typing',

    // Notification events
    NOTIFICATION_NEW: 'notification:new',
    NOTIFICATION_READ: 'notification:read',

    // Quote events
    QUOTE_NEW: 'quote:new',
    QUOTE_ACCEPTED: 'quote:accepted',
    QUOTE_DECLINED: 'quote:declined',

    // Booking events
    BOOKING_CONFIRMED: 'booking:confirmed',
    BOOKING_STARTED: 'booking:started',
    BOOKING_COMPLETED: 'booking:completed',
    BOOKING_CANCELLED: 'booking:cancelled',

    // Review events
    REVIEW_NEW: 'review:new',
    REVIEW_RESPONSE: 'review:response',
};

// =============================================================================
// Helper Functions
// =============================================================================

export async function triggerEvent(
    channel: string,
    event: string,
    data: any
): Promise<boolean> {
    if (!pusherServer) {
        console.warn('Pusher not configured, skipping event trigger');
        return false;
    }

    try {
        await pusherServer.trigger(channel, event, data);
        return true;
    } catch (error) {
        console.error('Failed to trigger Pusher event:', error);
        return false;
    }
}

export async function triggerUserNotification(
    userId: string,
    notification: {
        type: string;
        title: string;
        body: string;
        data?: any;
    }
): Promise<boolean> {
    return triggerEvent(
        channels.user(userId),
        events.NOTIFICATION_NEW,
        notification
    );
}

export async function triggerNewMessage(
    threadId: string,
    message: {
        id: string;
        senderId: string;
        senderType: 'CUSTOMER' | 'PROVIDER' | 'SYSTEM';
        content: string;
        createdAt: Date;
    }
): Promise<boolean> {
    return triggerEvent(channels.thread(threadId), events.MESSAGE_NEW, message);
}

export async function triggerTypingIndicator(
    threadId: string,
    userId: string,
    isTyping: boolean
): Promise<boolean> {
    return triggerEvent(channels.thread(threadId), events.MESSAGE_TYPING, {
        userId,
        isTyping,
    });
}
