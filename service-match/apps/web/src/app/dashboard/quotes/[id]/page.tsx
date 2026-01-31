import { Metadata } from 'next';
import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { getSession } from '@/lib/auth';
import { prisma } from '@service-match/db';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    ArrowLeft,
    Clock,
    MapPin,
    Calendar,
    FileText,
    CheckCircle,
    Image as ImageIcon,
} from 'lucide-react';
import { QuoteComparisonWrapper } from './quote-comparison-wrapper';

export const metadata: Metadata = {
    title: 'View Quotes | Serious Control',
    description: 'Compare quotes from local professionals',
};

export default async function QuoteRequestPage({
    params,
}: {
    params: { id: string };
}) {
    const session = await getSession();

    if (!session?.user) {
        redirect('/auth/signin?callbackUrl=/dashboard/quotes/' + params.id);
    }

    const customerProfile = await prisma.customerProfile.findUnique({
        where: { userId: session.user.id },
    });

    if (!customerProfile) {
        redirect('/');
    }

    const quoteRequest = await prisma.quoteRequest.findUnique({
        where: { id: params.id },
        include: {
            category: true,
            subcategory: true,
            quotes: {
                where: { status: { not: 'DECLINED' } },
                include: {
                    provider: true,
                },
                orderBy: { createdAt: 'desc' },
            },
            media: true,
            booking: true,
        },
    });

    if (!quoteRequest || quoteRequest.customerId !== customerProfile.id) {
        notFound();
    }

    const statusConfig: Record<string, { label: string; color: string }> = {
        PENDING: { label: 'Waiting for Quotes', color: 'bg-amber-100 text-amber-700' },
        QUOTED: { label: 'Quotes Available', color: 'bg-blue-100 text-blue-700' },
        ACCEPTED: { label: 'Quote Accepted', color: 'bg-green-100 text-green-700' },
        COMPLETED: { label: 'Completed', color: 'bg-slate-100 text-slate-700' },
        CANCELLED: { label: 'Cancelled', color: 'bg-red-100 text-red-700' },
        EXPIRED: { label: 'Expired', color: 'bg-slate-100 text-slate-500' },
    };

    const { label: statusLabel, color: statusColor } =
        statusConfig[quoteRequest.status] || statusConfig.PENDING;

    return (
        <div className="container mx-auto px-4 py-8 max-w-4xl">
            {/* Back Link */}
            <Link
                href="/dashboard/quotes"
                className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6"
            >
                <ArrowLeft className="h-4 w-4" />
                Back to Quote Requests
            </Link>

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold">
                        {quoteRequest.category.name}
                        {quoteRequest.subcategory && ` - ${quoteRequest.subcategory.name}`}
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Requested {new Date(quoteRequest.createdAt).toLocaleDateString('en-GB', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                        })}
                    </p>
                </div>
                <Badge className={statusColor}>{statusLabel}</Badge>
            </div>

            {/* Request Details */}
            <Card className="mb-8">
                <CardHeader>
                    <CardTitle className="text-lg">Request Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid sm:grid-cols-2 gap-4">
                        <div className="flex items-start gap-3">
                            <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                            <div>
                                <p className="font-medium">Location</p>
                                <p className="text-sm text-muted-foreground">
                                    {quoteRequest.postcode}, {quoteRequest.city}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                            <div>
                                <p className="font-medium">Preferred Date</p>
                                <p className="text-sm text-muted-foreground">
                                    {quoteRequest.preferredDate
                                        ? new Date(quoteRequest.preferredDate).toLocaleDateString(
                                            'en-GB',
                                            {
                                                day: 'numeric',
                                                month: 'long',
                                                year: 'numeric',
                                            }
                                        )
                                        : 'Flexible'}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <Clock className="h-5 w-5 text-muted-foreground mt-0.5" />
                            <div>
                                <p className="font-medium">Urgency</p>
                                <p className="text-sm text-muted-foreground capitalize">
                                    {quoteRequest.urgency?.toLowerCase().replace('_', ' ') ||
                                        'Standard'}
                                </p>
                            </div>
                        </div>
                        {quoteRequest.budget && (
                            <div className="flex items-start gap-3">
                                <FileText className="h-5 w-5 text-muted-foreground mt-0.5" />
                                <div>
                                    <p className="font-medium">Budget</p>
                                    <p className="text-sm text-muted-foreground">
                                        £{quoteRequest.budget.toLocaleString()}
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>

                    {quoteRequest.description && (
                        <div className="pt-4 border-t">
                            <p className="font-medium mb-2">Description</p>
                            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                                {quoteRequest.description}
                            </p>
                        </div>
                    )}

                    {quoteRequest.media && quoteRequest.media.length > 0 && (
                        <div className="pt-4 border-t">
                            <p className="font-medium mb-2 flex items-center gap-2">
                                <ImageIcon className="h-4 w-4" />
                                Attached Photos ({quoteRequest.media.length})
                            </p>
                            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                                {quoteRequest.media.map((media) => (
                                    <a
                                        key={media.id}
                                        href={media.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="aspect-square rounded-lg overflow-hidden hover:opacity-80 transition-opacity"
                                    >
                                        <img
                                            src={media.url}
                                            alt="Attached photo"
                                            className="w-full h-full object-cover"
                                        />
                                    </a>
                                ))}
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Booking Info (if accepted) */}
            {quoteRequest.booking && (
                <Card className="mb-8 border-green-200 bg-green-50">
                    <CardContent className="p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <CheckCircle className="h-6 w-6 text-green-600" />
                            <div>
                                <p className="font-semibold text-green-800">Booking Confirmed</p>
                                <p className="text-sm text-green-700">
                                    Reference: {quoteRequest.booking.reference}
                                </p>
                            </div>
                        </div>
                        <Link href={`/dashboard/bookings/${quoteRequest.booking.id}`}>
                            <Button>View Booking Details</Button>
                        </Link>
                    </CardContent>
                </Card>
            )}

            {/* Quotes Comparison */}
            {quoteRequest.status !== 'CANCELLED' &&
                quoteRequest.status !== 'EXPIRED' &&
                !quoteRequest.booking && (
                    <QuoteComparisonWrapper
                        quotes={quoteRequest.quotes.map((q) => ({
                            id: q.id,
                            provider: {
                                id: q.provider.id,
                                businessName: q.provider.businessName,
                                slug: q.provider.slug,
                                logoUrl: q.provider.logoUrl || undefined,
                                avgRating: q.provider.avgRating || undefined,
                                totalReviews: q.provider.totalReviews,
                                identityVerified: q.provider.identityVerified,
                                insuranceVerified: q.provider.insuranceVerified,
                            },
                            quoteAmount: q.amount,
                            description: q.description || '',
                            estimatedDuration: q.estimatedDuration || undefined,
                            validUntil: q.validUntil?.toISOString() || '',
                            createdAt: q.createdAt.toISOString(),
                            status: q.status,
                        }))}
                        quoteRequestId={quoteRequest.id}
                    />
                )}
        </div>
    );
}
