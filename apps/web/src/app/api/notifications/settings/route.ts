import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@service-match/db';
import { z } from 'zod';

const settingsSchema = z.object({
    emailMarketing: z.boolean().optional(),
    emailTransactional: z.boolean().optional(),
    emailQuotes: z.boolean().optional(),
    emailBookings: z.boolean().optional(),
    emailReviews: z.boolean().optional(),
    smsTransactional: z.boolean().optional(),
    smsReminders: z.boolean().optional(),
    pushEnabled: z.boolean().optional(),
    pushQuotes: z.boolean().optional(),
    pushBookings: z.boolean().optional(),
    pushMessages: z.boolean().optional(),
});

export async function GET(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
        return new NextResponse('Unauthorized', { status: 401 });
    }

    try {
        let prefs = await prisma.notificationPreference.findUnique({
            where: { userId: session.user.id },
        });

        if (!prefs) {
            // Create defaults
            prefs = await prisma.notificationPreference.create({
                data: { userId: session.user.id },
            });
        }

        return NextResponse.json(prefs);
    } catch (error) {
        console.error('Error fetching notification settings:', error);
        return new NextResponse('Internal Error', { status: 500 });
    }
}

export async function PATCH(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
        return new NextResponse('Unauthorized', { status: 401 });
    }

    try {
        const body = await req.json();
        const result = settingsSchema.safeParse(body);

        if (!result.success) {
            return new NextResponse('Invalid input', { status: 400 });
        }

        const prefs = await prisma.notificationPreference.upsert({
            where: { userId: session.user.id },
            update: result.data,
            create: {
                userId: session.user.id,
                ...result.data,
            },
        });

        return NextResponse.json(prefs);
    } catch (error) {
        console.error('Error updating notification settings:', error);
        return new NextResponse('Internal Error', { status: 500 });
    }
}
