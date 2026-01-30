import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@service-match/db';
import { getSession } from '@/lib/auth';

// Mark notification as read
export async function POST(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getSession();
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const notification = await prisma.notification.findUnique({
            where: { id: params.id },
        });

        if (!notification || notification.userId !== session.user.id) {
            return NextResponse.json({ error: 'Not found' }, { status: 404 });
        }

        await prisma.notification.update({
            where: { id: params.id },
            data: { isRead: true, readAt: new Date() },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error marking notification as read:', error);
        return NextResponse.json(
            { error: 'Failed to mark as read' },
            { status: 500 }
        );
    }
}
