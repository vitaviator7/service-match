export const dynamic = "force-dynamic";
import { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { getSession } from '@/lib/auth';
import { prisma } from '@service-match/db';
import { ChatInterface } from '@/components/chat/ChatInterface';
import { ArrowLeft } from 'lucide-react';

export const metadata: Metadata = {
    title: 'Chat | Provider | Serious Control',
};

export default async function ProviderChatPage({ params }: { params: { id: string } }) {
    const session = await getSession();

    if (!session?.user) {
        redirect('/auth/signin?callbackUrl=/provider/messages/' + params.id);
    }

    const providerProfile = await prisma.providerProfile.findUnique({
        where: { userId: session.user.id },
    });

    if (!providerProfile) {
        redirect('/');
    }

    const thread = await prisma.messageThread.findUnique({
        where: { id: params.id },
        include: {
            customer: { include: { user: true } },
            quoteRequest: true,
        },
    });

    if (!thread || thread.providerId !== providerProfile.id) {
        notFound();
    }

    return (
        <div className="container mx-auto px-4 py-8 max-w-4xl">
            <Link
                href="/provider/messages"
                className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4"
            >
                <ArrowLeft className="h-4 w-4" />
                Back to Messages
            </Link>

            <ChatInterface
                threadId={thread.id}
                currentUserType="PROVIDER"
                recipientName={`${thread.customer.user.firstName} ${thread.customer.user.lastName}`}
            />
        </div>
    );
}
