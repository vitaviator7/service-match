export const dynamic = "force-dynamic";
import { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { prisma } from '@service-match/db';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, MapPin, ArrowRight, FileText } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export const metadata: Metadata = {
    title: 'My Quotes | Provider | Serious Control',
};

export default async function ProviderQuotesPage() {
    const session = await getSession();

    if (!session?.user) {
        redirect('/auth/signin?callbackUrl=/provider/quotes');
    }

    const provider = await prisma.providerProfile.findUnique({
        where: { userId: session.user.id },
    });

    if (!provider) {
        redirect('/');
    }

    const quotes = await prisma.quote.findMany({
        where: {
            providerId: provider.id,
        },
        include: {
            quoteRequest: {
                include: {
                    category: true,
                }
            }
        },
        orderBy: { createdAt: 'desc' },
    });

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold mb-8">My Quotes</h1>

            <div className="grid gap-4">
                {quotes.length === 0 ? (
                    <Card>
                        <CardContent className="p-8 text-center text-muted-foreground">
                            You haven't sent any quotes yet.
                        </CardContent>
                    </Card>
                ) : (
                    quotes.map((quote) => (
                        <Card key={quote.id} className="hover:border-primary/50 transition-colors">
                            <CardContent className="p-6">
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                    <div className="flex-1">
                                        <div className="flex items-start justify-between mb-2">
                                            <h3 className="font-semibold text-lg">
                                                {quote.quoteRequest.title}
                                            </h3>
                                            <Badge variant={
                                                quote.status === 'ACCEPTED' ? 'default' :
                                                    quote.status === 'DECLINED' ? 'destructive' :
                                                        quote.status === 'VIEWED' ? 'secondary' : 'outline'
                                            }>
                                                {quote.status}
                                            </Badge>
                                        </div>

                                        <p className="text-sm text-muted-foreground mb-4">
                                            Ref: {quote.quoteRequest.category.name} • {quote.quoteRequest.postcode}
                                        </p>

                                        <div className="flex flex-wrap items-center gap-6 text-sm">
                                            <div className="flex items-center gap-2">
                                                <FileText className="h-4 w-4 text-muted-foreground" />
                                                <span className="font-medium">£{(quote.amount as any).toNumber().toFixed(2)}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-muted-foreground">
                                                <Calendar className="h-4 w-4" />
                                                Sent {formatDistanceToNow(new Date(quote.createdAt), { addSuffix: true })}
                                            </div>
                                            {quote.viewedAt && (
                                                <div className="flex items-center gap-2 text-blue-600">
                                                    <Clock className="h-4 w-4" />
                                                    Viewed {formatDistanceToNow(new Date(quote.viewedAt), { addSuffix: true })}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <Link href={`/provider/leads/${quote.quoteRequest.id}`}>
                                            <span className="text-sm font-medium text-primary hover:underline flex items-center">
                                                View Request <ArrowRight className="h-3 w-3 ml-1" />
                                            </span>
                                        </Link>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
}
