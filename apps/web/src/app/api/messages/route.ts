import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@service-match/db';
import { getSession } from '@/lib/auth';
import { z } from 'zod';
import { triggerNewMessage } from '@/lib/pusher';

const messageSchema = z.object({
    threadId: z.string(),
    content: z.string().min(1).max(5000),
});

// Get messages for a thread
export async function GET(req: NextRequest) {
    try {
        const session = await getSession();
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const threadId = searchParams.get('threadId');

        if (!threadId) {
            return NextResponse.json({ error: 'Thread ID required' }, { status: 400 });
        }

        // Verify access to thread
        const thread = await prisma.messageThread.findUnique({
            where: { id: threadId },
            include: {
                customer: true,
                provider: true,
            },
        });

        if (!thread) {
            return NextResponse.json({ error: 'Thread not found' }, { status: 404 });
        }

        const customerProfile = await prisma.customerProfile.findUnique({
            where: { userId: session.user.id },
        });
        const providerProfile = await prisma.providerProfile.findUnique({
            where: { userId: session.user.id },
        });

        const hasAccess =
            (customerProfile && thread.customerId === customerProfile.id) ||
            (providerProfile && thread.providerId === providerProfile.id);

        if (!hasAccess) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        // Get messages
        const cursor = searchParams.get('cursor');
        const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);

        const messages = await prisma.message.findMany({
            where: { threadId },
            orderBy: { createdAt: 'desc' },
            take: limit + 1,
            ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
        });

        const hasMore = messages.length > limit;
        if (hasMore) messages.pop();

        // Mark as read
        const isCustomer = customerProfile?.id === thread.customerId;
        if (isCustomer) {
            await prisma.messageThread.update({
                where: { id: threadId },
                data: { customerUnread: 0 },
            });
        } else {
            await prisma.messageThread.update({
                where: { id: threadId },
                data: { providerUnread: 0 },
            });
        }

        return NextResponse.json({
            messages: messages.reverse(),
            hasMore,
            nextCursor: hasMore ? messages[messages.length - 1]?.id : null,
        });
    } catch (error) {
        console.error('Error fetching messages:', error);
        return NextResponse.json(
            { error: 'Failed to fetch messages' },
            { status: 500 }
        );
    }
}

// Send a message
export async function POST(req: NextRequest) {
    try {
        const session = await getSession();
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const result = messageSchema.safeParse(body);

        if (!result.success) {
            return NextResponse.json(
                { error: 'Invalid input', details: result.error.flatten() },
                { status: 400 }
            );
        }

        const { threadId, content } = result.data;

        // Get thread and verify access
        const thread = await prisma.messageThread.findUnique({
            where: { id: threadId },
            include: {
                customer: { include: { user: true } },
                provider: { include: { user: true } },
            },
        });

        if (!thread) {
            return NextResponse.json({ error: 'Thread not found' }, { status: 404 });
        }

        // Determine sender type
        const customerProfile = await prisma.customerProfile.findUnique({
            where: { userId: session.user.id },
        });
        const providerProfile = await prisma.providerProfile.findUnique({
            where: { userId: session.user.id },
        });

        let senderType: 'CUSTOMER' | 'PROVIDER';
        let senderId: string;

        if (customerProfile && thread.customerId === customerProfile.id) {
            senderType = 'CUSTOMER';
            senderId = customerProfile.id;
        } else if (providerProfile && thread.providerId === providerProfile.id) {
            senderType = 'PROVIDER';
            senderId = providerProfile.id;
        } else {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        // Create message
        const message = await prisma.message.create({
            data: {
                threadId,
                senderType,
                content,
            },
        });

        // Update thread
        const updateData: any = {
            lastMessageAt: new Date(),
            lastMessagePreview: content.slice(0, 100),
        };

        if (senderType === 'CUSTOMER') {
            updateData.providerUnread = { increment: 1 };
        } else {
            updateData.customerUnread = { increment: 1 };
        }

        await prisma.messageThread.update({
            where: { id: threadId },
            data: updateData,
        });

        // Trigger real-time notification
        await triggerNewMessage(threadId, {
            id: message.id,
            senderId,
            senderType,
            content,
            createdAt: message.createdAt,
        });

        return NextResponse.json(message);
    } catch (error) {
        console.error('Error sending message:', error);
        return NextResponse.json(
            { error: 'Failed to send message' },
            { status: 500 }
        );
    }
}
