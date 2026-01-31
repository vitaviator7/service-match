import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@service-match/db';

export async function POST(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getSession();
        if (!session?.user || session.user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const booking = await prisma.booking.findUnique({
            where: { id: params.id }
        });

        if (!booking) {
            return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
        }

        // Update Booking status to CANCELLED
        const updatedBooking = await prisma.booking.update({
            where: { id: params.id },
            data: {
                status: 'CANCELLED',
                cancelledAt: new Date(),
                cancelledBy: 'ADMIN',
                cancellationReason: 'Cancelled by Administrator',
            }
        });

        // Add to notification
        await prisma.notification.createMany({
            data: [
                {
                    userId: (await prisma.customerProfile.findUnique({ where: { id: booking.customerId } }))!.userId,
                    type: 'BOOKING_CANCELLED',
                    title: 'Booking Cancelled',
                    message: `Your booking "${booking.title}" has been cancelled by an administrator.`,
                },
                {
                    userId: (await prisma.providerProfile.findUnique({ where: { id: booking.providerId } }))!.userId,
                    type: 'BOOKING_CANCELLED',
                    title: 'Booking Cancelled',
                    message: `Booking "${booking.title}" has been cancelled by an administrator.`,
                }
            ]
        });

        return NextResponse.json({ success: true, booking: updatedBooking });

    } catch (error: any) {
        console.error('Error cancelling booking:', error);
        return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
    }
}
