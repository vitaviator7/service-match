import { NextResponse } from 'next/server';
import { hash } from 'bcryptjs';
import { prisma } from '@service-match/db';
import { signUpSchema } from '@service-match/shared';

export async function POST(request: Request) {
    try {
        const body = await request.json();

        // Validate input
        const validation = signUpSchema.safeParse(body);
        if (!validation.success) {
            return NextResponse.json(
                {
                    success: false,
                    error: {
                        code: 'VALIDATION_ERROR',
                        message: 'Invalid input',
                        details: validation.error.flatten().fieldErrors,
                    },
                },
                { status: 400 }
            );
        }

        const { email, password, firstName, lastName, role } = validation.data;
        const normalizedEmail = email.toLowerCase();

        // Check if user exists
        const existingUser = await prisma.user.findUnique({
            where: { email: normalizedEmail },
        });

        if (existingUser) {
            return NextResponse.json(
                {
                    success: false,
                    error: {
                        code: 'ALREADY_EXISTS',
                        message: 'An account with this email already exists',
                    },
                },
                { status: 409 }
            );
        }

        // Hash password
        const passwordHash = await hash(password, 12);

        // Create user
        const user = await prisma.user.create({
            data: {
                email: normalizedEmail,
                passwordHash,
                firstName,
                lastName,
                role: role || 'CUSTOMER',
                status: 'PENDING_VERIFICATION',
            },
        });

        // Create profile based on role
        if (role === 'PROVIDER') {
            await prisma.providerProfile.create({
                data: {
                    userId: user.id,
                    businessName: `${firstName} ${lastName}`,
                    slug: `${firstName.toLowerCase()}-${lastName.toLowerCase()}-${user.id.slice(0, 8)}`,
                },
            });
        } else {
            await prisma.customerProfile.create({
                data: {
                    userId: user.id,
                },
            });
        }

        // Create notification preferences
        await prisma.notificationPreference.create({
            data: {
                userId: user.id,
            },
        });

        // TODO: Send verification email via SendGrid

        return NextResponse.json(
            {
                success: true,
                data: {
                    id: user.id,
                    email: user.email,
                    role: user.role,
                },
            },
            { status: 201 }
        );
    } catch (error) {
        console.error('Signup error:', error);
        return NextResponse.json(
            {
                success: false,
                error: {
                    code: 'INTERNAL_ERROR',
                    message: 'An unexpected error occurred',
                },
            },
            { status: 500 }
        );
    }
}
