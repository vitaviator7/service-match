export const dynamic = "force-dynamic";
import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getSession } from '@/lib/auth';
import { prisma } from '@service-match/db';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Clock, User, Building2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export const metadata: Metadata = {
    title: 'Messages | Serious Control',
    description: 'Your conversations with service providers',
};

export default async function MessagesPage() {
    const session = await getSession();

    if (!session?.user) {
        redirect('/auth/signin?callbackUrl=/dashboard/messages');
    }

    const customerProfile = await prisma.customerProfile.findUnique({
        where: { userId: session.user.id },
    });

    if (!customerProfile) {
        redirect('/onboarding');
    }

    const threads = await prisma.messageThread.findMany({
        where: { customerId: customerProfile.id },
        include: {
            provider: {
                include: { user: true },
            },
            quoteRequest: {
                select: { title: true },
            },
            booking: {
                select: { id: true, status: true },
            },
        },
        orderBy: { lastMessageAt: 'desc' },
    });

    const totalUnread = threads.reduce(
        (acc, thread) => acc + thread.customerUnread,
        0
    );

    return (
        <div className="container mx-auto px-4 py-8 max-w-4xl">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold">Messages</h1>
                    <p className="text-muted-foreground">
                        {threads.length} conversation{threads.length !== 1 && 's'}
                        {totalUnread > 0 && ` • ${totalUnread} unread`}
                    </p>
                </div>
            </div>

            {threads.length === 0 ? (
                <Card>
                    <CardContent className="py-12 text-center">
                        <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                        <h3 className="text-lg font-medium mb-2">No messages yet</h3>
                        <p className="text-muted-foreground">
                            When you start a conversation with a provider, it will appear here
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-3">
                    {threads.map((thread) => (
                        <Link
                            key={thread.id}
                            href={`/dashboard/messages/${thread.id}`}
                        >
                            <Card
                                className={`card-hover ${thread.customerUnread > 0 ? 'border-primary/50 bg-primary/5' : ''
                                    }`}
                            >
                                <CardContent className="p-4">
                                    <div className="flex items-start gap-4">
                                        {/* Avatar */}
                                        <div className="w-12 h-12 rounded-full bg-primary/10 overflow-hidden shrink-0">
                                            {thread.provider.user.avatarUrl ? (
                                                <img
                                                    src={thread.provider.user.avatarUrl}
                                                    alt={thread.provider.businessName}
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-primary font-bold text-lg">
                                                    {thread.provider.businessName[0]}
                                                </div>
                                            )}
                                        </div>

                                        {/* Content */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between gap-2">
                                                <h3 className="font-semibold truncate">
                                                    {thread.provider.businessName}
                                                </h3>
                                                <span className="text-xs text-muted-foreground whitespace-nowrap">
                                                    {formatDistanceToNow(
                                                        new Date(thread.lastMessageAt),
                                                        { addSuffix: true }
                                                    )}
                                                </span>
                                            </div>

                                            {thread.quoteRequest && (
                                                <p className="text-sm text-muted-foreground truncate">
                                                    Re: {thread.quoteRequest.title}
                                                </p>
                                            )}

                                            <p
                                                className={`text-sm mt-1 truncate ${thread.customerUnread > 0
                                                        ? 'font-medium text-foreground'
                                                        : 'text-muted-foreground'
                                                    }`}
                                            >
                                                {thread.lastMessagePreview || 'No messages'}
                                            </p>

                                            {/* Badges */}
                                            <div className="flex items-center gap-2 mt-2">
                                                {thread.customerUnread > 0 && (
                                                    <Badge variant="default" className="text-xs">
                                                        {thread.customerUnread} new
                                                    </Badge>
                                                )}
                                                {thread.booking && (
                                                    <Badge
                                                        variant={
                                                            thread.booking.status === 'COMPLETED'
                                                                ? 'success'
                                                                : 'secondary'
                                                        }
                                                        className="text-xs"
                                                    >
                                                        {thread.booking.status === 'COMPLETED'
                                                            ? 'Completed'
                                                            : 'Active booking'}
                                                    </Badge>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}
