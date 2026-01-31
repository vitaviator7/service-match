import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@service-match/db';
import { z } from 'zod';

const updateSchema = z.object({
    documentId: z.string(),
    status: z.enum(['APPROVED', 'REJECTED']),
    rejectionReason: z.string().optional(),
});

export async function GET(req: NextRequest) {
    const session = await getSession();
    if (!session?.user || session.user.role !== 'ADMIN') {
        return new NextResponse('Unauthorized', { status: 401 });
    }

    try {
        const documents = await prisma.providerDocument.findMany({
            where: { status: 'PENDING' },
            include: {
                provider: {
                    select: {
                        businessName: true,
                        user: {
                            select: {
                                firstName: true,
                                lastName: true,
                            }
                        }
                    }
                }
            },
            orderBy: { createdAt: 'asc' },
        });

        return NextResponse.json(documents);
    } catch (error) {
        console.error('Error fetching verifications:', error);
        return new NextResponse('Internal Error', { status: 500 });
    }
}

export async function PUT(req: NextRequest) {
    const session = await getSession();
    if (!session?.user || session.user.role !== 'ADMIN') {
        return new NextResponse('Unauthorized', { status: 401 });
    }

    try {
        const body = await req.json();
        const { documentId, status, rejectionReason } = updateSchema.parse(body);

        const document = await prisma.providerDocument.update({
            where: { id: documentId },
            data: {
                status,
                notes: rejectionReason,
                reviewedBy: session.user.id,
                reviewedAt: new Date(),
            },
            include: { provider: true } // Need providerId to update profile
        });

        // Auto-update provider profile flags if approved
        if (status === 'APPROVED') {
            if (document.type === 'IDENTITY') {
                await prisma.providerProfile.update({
                    where: { id: document.providerId },
                    data: { identityVerified: true }
                });
            } else if (document.type === 'INSURANCE') {
                await prisma.providerProfile.update({
                    where: { id: document.providerId },
                    data: { insuranceVerified: true }
                });
            } else if (document.type === 'CERTIFICATION') {
                // Maybe find matching certification? Skipping strictly for now as logic is complex
            }

            // Create notification
            await prisma.notification.create({
                data: {
                    userId: document.provider.userId,
                    type: 'VERIFICATION_APPROVED',
                    title: 'Document Approved',
                    message: `Your ${document.type.toLowerCase().replace('_', ' ')} document has been approved.`,
                }
            });
        } else {
            // Rejection notification
            await prisma.notification.create({
                data: {
                    userId: document.provider.userId,
                    type: 'VERIFICATION_REJECTED',
                    title: 'Document Rejected',
                    message: `Your ${document.type.toLowerCase().replace('_', ' ')} document was rejected. Reason: ${rejectionReason || 'Not specified'}`,
                }
            });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error updating verification:', error);
        return new NextResponse('Internal Error', { status: 500 });
    }
}
