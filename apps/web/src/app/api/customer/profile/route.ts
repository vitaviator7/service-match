import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@service-match/db';
import { getSession } from '@/lib/auth';
import { z } from 'zod';

const customerProfileSchema = z.object({
    firstName: z.string().min(2),
    lastName: z.string().min(2),
    postcode: z.string().min(5),
    city: z.string().min(2),
});

export async function POST(req: NextRequest) {
    try {
        const session = await getSession();
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const result = customerProfileSchema.safeParse(body);

        if (!result.success) {
            return NextResponse.json(
                { error: 'Invalid input', details: result.error.flatten() },
                { status: 400 }
            );
        }

        const { firstName, lastName, postcode, city } = result.data;

        // Update User table
        await prisma.user.update({
            where: { id: session.user.id },
            data: {
                firstName,
                lastName,
                role: 'CUSTOMER'
            },
        });

        // Upsert CustomerProfile
        const customerProfile = await prisma.customerProfile.upsert({
            where: { userId: session.user.id },
            update: {
                postcode,
                city,
            },
            create: {
                userId: session.user.id,
                postcode,
                city,
            },
        });

        return NextResponse.json({ success: true, customerProfile });
    } catch (error) {
        console.error('Error creating customer profile:', error);
        return NextResponse.json(
            { error: 'Failed to create profile' },
            { status: 500 }
        );
    }
}
