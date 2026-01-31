export const dynamic = "force-dynamic";

import { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { prisma } from '@service-match/db';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, MapPin, ArrowRight, DollarSign, FileText } from 'lucide-react';

export const metadata: Metadata = {
    title: 'My Quotes | Serious Control',
};

export default async function CustomerQuotesPage() {
    const session = await getSession();

    if (!session?.user) {
        redirect('/auth/signin?callbackUrl=/dashboard/quotes');
    }

    const customer = await prisma.customerProfile.findUnique({
        where: { userId: session.user.id },
    });

    if (!customer) {
        redirect('/');
    }

    const quotes = await prisma.quote.findMany({
        where: { customerId: customer.id },
        include: {
            provider: true,
        },
        orderBy: { createdAt: 'desc' },
    });

    return (
        <div className="container mx-auto px-4 py-8 max-w-4xl">
            <h1 className="text-3xl font-bold mb-8">My Quotes</h1>

            <div className="grid gap-4">
                {quotes.length === 0 ? (
                    <Card>
                        <CardContent className="p-8 text-center text-muted-foreground">
                            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            <p>You don't have any quotes yet.</p>
                            <Link href="/request" className="text-primary hover:underline mt-2 inline-block">
                                Request a quote today
                            </Link>
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
                                                Quote from {quote.provider.businessName}
                                            </h3>
                                            <Badge variant={
                                                quote.status === 'ACCEPTED' ? 'default' :
                                                    quote.status === 'REJECTED' ? 'destructive' :
                                                        quote.status === 'EXPIRED' ? 'secondary' : 'outline'
                                            }>
                                                {quote.status}
                                            </Badge>
                                        </div>

                                        <p className="text-sm text-muted-foreground mb-4">
                                            Reference: {quote.id.slice(-8).toUpperCase()}
                                        </p>

                                        <div className="flex flex-wrap items-center gap-4 text-sm font-medium mt-2">
                                            <div className="flex items-center gap-1 text-primary">
                                                <DollarSign className="h-4 w-4" />
                                                £{Number(quote.amount).toFixed(2)}
                                            </div>
                                            <div className="flex items-center gap-1 text-muted-foreground">
                                                <Calendar className="h-4 w-4" />
                                                Expires: {new Date(quote.expiresAt).toLocaleDateString()}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <Link href={`/dashboard/quotes/${quote.id}`}>
                                            <span className="text-sm font-medium text-primary hover:underline flex items-center">
                                                View Details <ArrowRight className="h-3 w-3 ml-1" />
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
