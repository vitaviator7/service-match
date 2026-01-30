import { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { getSession } from '@/lib/auth';
import { prisma } from '@service-match/db';
import { ChatInterface } from '@/components/chat/ChatInterface';
import { ArrowLeft } from 'lucide-react';

export const metadata: Metadata = {
    title: 'Chat | ServiceMatch',
};

export default async function CustomerChatPage({ params }: { params: { id: string } }) {
    const session = await getSession();

    if (!session?.user) {
        redirect('/auth/signin?callbackUrl=/dashboard/messages/' + params.id);
    }

    const customerProfile = await prisma.customerProfile.findUnique({
        where: { userId: session.user.id },
    });

    if (!customerProfile) {
        redirect('/');
    }

    const thread = await prisma.messageThread.findUnique({
        where: { id: params.id },
        include: {
            provider: true, // Only need basic info
            quoteRequest: true,
        },
    });

    if (!thread || thread.customerId !== customerProfile.id) {
        notFound();
    }

    return (
        <div className="container mx-auto px-4 py-8 max-w-4xl">
            <Link
                href="/dashboard/messages"
                className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4"
            >
                <ArrowLeft className="h-4 w-4" />
                Back to Messages
            </Link>

            <ChatInterface
                threadId={thread.id}
                currentUserType="CUSTOMER"
                recipientName={thread.provider.businessName}
            />
        </div>
    );
}
