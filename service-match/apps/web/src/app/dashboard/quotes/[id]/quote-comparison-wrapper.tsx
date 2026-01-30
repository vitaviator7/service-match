'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { QuoteComparison } from '@/components/quotes/QuoteComparison';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

interface Quote {
    id: string;
    provider: {
        id: string;
        businessName: string;
        slug: string;
        logoUrl?: string;
        avgRating?: number;
        totalReviews: number;
        identityVerified: boolean;
        insuranceVerified: boolean;
    };
    quoteAmount: number;
    description: string;
    estimatedDuration?: string;
    validUntil: string;
    createdAt: string;
    status: string;
}

interface QuoteComparisonWrapperProps {
    quotes: Quote[];
    quoteRequestId: string;
}

export function QuoteComparisonWrapper({
    quotes,
    quoteRequestId,
}: QuoteComparisonWrapperProps) {
    const router = useRouter();
    const [selectedQuoteId, setSelectedQuoteId] = useState<string | undefined>();
    const [accepting, setAccepting] = useState(false);
    const [error, setError] = useState('');

    const handleAcceptQuote = async () => {
        if (!selectedQuoteId) return;

        setAccepting(true);
        setError('');

        try {
            const response = await fetch(`/api/quotes/${selectedQuoteId}/accept`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ quoteRequestId }),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Failed to accept quote');
            }

            const data = await response.json();

            // Redirect to checkout
            router.push(`/checkout?bookingId=${data.bookingId}`);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to accept quote');
            setAccepting(false);
        }
    };

    return (
        <div>
            <QuoteComparison
                quotes={quotes}
                onSelect={setSelectedQuoteId}
                selectedQuoteId={selectedQuoteId}
            />

            {selectedQuoteId && (
                <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4 shadow-lg z-50">
                    <div className="container mx-auto max-w-4xl flex items-center justify-between gap-4">
                        <div>
                            <p className="font-medium">Quote Selected</p>
                            <p className="text-sm text-muted-foreground">
                                {
                                    quotes.find((q) => q.id === selectedQuoteId)?.provider
                                        .businessName
                                }{' '}
                                - £
                                {(
                                    (quotes.find((q) => q.id === selectedQuoteId)?.quoteAmount ||
                                        0) / 100
                                ).toLocaleString()}
                            </p>
                        </div>
                        <div className="flex gap-3">
                            <Button
                                variant="outline"
                                onClick={() => setSelectedQuoteId(undefined)}
                            >
                                Cancel
                            </Button>
                            <Button onClick={handleAcceptQuote} disabled={accepting}>
                                {accepting ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                        Processing...
                                    </>
                                ) : (
                                    'Accept & Book'
                                )}
                            </Button>
                        </div>
                    </div>
                    {error && (
                        <p className="text-red-600 text-sm text-center mt-2">{error}</p>
                    )}
                </div>
            )}
        </div>
    );
}
