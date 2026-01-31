export const dynamic = "force-dynamic";
import { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { getSession } from '@/lib/auth';
import { prisma } from '@service-match/db';
import { QuoteForm } from '@/components/quotes/QuoteForm';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, MapPin, Calendar, Clock, FileText, ImageIcon } from 'lucide-react';

export const metadata: Metadata = {
    title: 'Lead Details | Provider | Serious Control',
};

export default async function LeadDetailsPage({ params }: { params: { id: string } }) {
    const session = await getSession();

    if (!session?.user) {
        redirect('/auth/signin?callbackUrl=/provider/leads/' + params.id);
    }

    const provider = await prisma.providerProfile.findUnique({
        where: { userId: session.user.id },
    });

    if (!provider) {
        redirect('/');
    }

    const lead = await prisma.quoteRequest.findUnique({
        where: { id: params.id },
        include: {
            category: true,
            quotes: {
                where: { providerId: provider.id }
            }
        },
    });

    if (!lead) {
        notFound();
    }

    // If already quoted, redirect to view sent quote? Or just show status
    // Cast to any to avoid TS issues with relation inference if standard types are used
    const leadWithRelations = lead as any;
    const existingQuote = leadWithRelations.quotes[0];

    return (
        <div className="container mx-auto px-4 py-8 max-w-4xl">
            <Link
                href="/provider/leads"
                className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6"
            >
                <ArrowLeft className="h-4 w-4" />
                Back to Leads
            </Link>

            <div className="grid md:grid-cols-3 gap-8">
                <div className="md:col-span-2 space-y-6">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <Badge variant="outline">{leadWithRelations.category.name}</Badge>
                            <Badge className={lead.urgency === 'EMERGENCY' ? 'bg-red-100 text-red-700' : 'bg-blue-50 text-blue-700'}>
                                {lead.urgency}
                            </Badge>
                        </div>
                        <h1 className="text-3xl font-bold mb-4">Lead Details</h1>
                        <p className="text-lg text-slate-700 whitespace-pre-wrap">{lead.description}</p>
                    </div>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Job Information</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid sm:grid-cols-2 gap-4">
                                <div className="flex items-start gap-3">
                                    <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                                    <div>
                                        <p className="font-medium">Location</p>
                                        <p className="text-sm text-muted-foreground">
                                            {lead.city}, {lead.postcode.split(' ')[0]}...
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                                    <div>
                                        <p className="font-medium">Preferred Date</p>
                                        <p className="text-sm text-muted-foreground">
                                            {lead.preferredDate
                                                ? new Date(lead.preferredDate).toLocaleDateString()
                                                : 'Flexible'}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {lead.photos && lead.photos.length > 0 && (
                                <div className="pt-4 border-t">
                                    <p className="font-medium mb-3 flex items-center gap-2">
                                        <ImageIcon className="h-4 w-4" />
                                        Photos
                                    </p>
                                    <div className="grid grid-cols-4 gap-2">
                                        {lead.photos.map((url, i) => (
                                            <a key={i} href={url} target="_blank" className="block aspect-square rounded-lg overflow-hidden bg-slate-100">
                                                <img src={url} alt="Job photo" className="w-full h-full object-cover" />
                                            </a>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                <div>
                    <Card className="sticky top-6">
                        <CardHeader>
                            <CardTitle>Submit Quote</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {existingQuote ? (
                                <div className="text-center py-6">
                                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-100 text-green-600 mb-4">
                                        <FileText className="h-6 w-6" />
                                    </div>
                                    <h3 className="font-semibold mb-2">Quote Submitted</h3>
                                    <p className="text-sm text-muted-foreground mb-4">
                                        You submitted a quote for £{(existingQuote.amount).toFixed(2)}
                                    </p>
                                    <Badge variant="outline" className="bg-slate-50">
                                        {existingQuote.status}
                                    </Badge>
                                </div>
                            ) : lead.status !== 'OPEN' && lead.status !== 'QUOTES_RECEIVED' ? (
                                <div className="text-center py-6 text-muted-foreground">
                                    This lead is no longer accepting quotes.
                                </div>
                            ) : (
                                <QuoteForm
                                    quoteRequestId={lead.id}
                                    onCancel={() => { }} // In a real app maybe navigate back
                                />
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
