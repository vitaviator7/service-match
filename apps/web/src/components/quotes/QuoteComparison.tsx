'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
    Star,
    CheckCircle,
    Clock,
    Shield,
    MessageSquare,
    Calendar,
    ChevronDown,
    ChevronUp,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';

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
        responseTime?: string;
    };
    quoteAmount: number;
    description: string;
    estimatedDuration?: string;
    validUntil: string;
    createdAt: string;
    status: string;
}

interface QuoteComparisonProps {
    quotes: Quote[];
    onSelect: (quoteId: string) => void;
    selectedQuoteId?: string;
}

export function QuoteComparison({
    quotes,
    onSelect,
    selectedQuoteId,
}: QuoteComparisonProps) {
    const [expandedQuotes, setExpandedQuotes] = useState<Set<string>>(new Set());
    const [sortBy, setSortBy] = useState<'price' | 'rating' | 'recent'>('price');

    const toggleExpand = (quoteId: string) => {
        const newExpanded = new Set(expandedQuotes);
        if (newExpanded.has(quoteId)) {
            newExpanded.delete(quoteId);
        } else {
            newExpanded.add(quoteId);
        }
        setExpandedQuotes(newExpanded);
    };

    const sortedQuotes = [...quotes].sort((a, b) => {
        switch (sortBy) {
            case 'price':
                return a.quoteAmount - b.quoteAmount;
            case 'rating':
                return (b.provider.avgRating || 0) - (a.provider.avgRating || 0);
            case 'recent':
                return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
            default:
                return 0;
        }
    });

    const lowestPrice = Math.min(...quotes.map((q) => q.quoteAmount));
    const highestRated = quotes.reduce(
        (best, q) =>
            (q.provider.avgRating || 0) > (best.provider.avgRating || 0) ? q : best,
        quotes[0]
    );

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-xl font-semibold">
                        {quotes.length} Quote{quotes.length !== 1 ? 's' : ''} Received
                    </h2>
                    <p className="text-sm text-muted-foreground">
                        Compare quotes and choose the best provider for your job
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Sort by:</span>
                    <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as any)}
                        className="px-3 py-1.5 border rounded-lg text-sm"
                    >
                        <option value="price">Lowest Price</option>
                        <option value="rating">Highest Rated</option>
                        <option value="recent">Most Recent</option>
                    </select>
                </div>
            </div>

            {/* Quotes List */}
            <div className="space-y-4">
                {sortedQuotes.map((quote) => {
                    const isExpanded = expandedQuotes.has(quote.id);
                    const isSelected = selectedQuoteId === quote.id;
                    const isBestPrice = quote.quoteAmount === lowestPrice;
                    const isBestRated = quote.id === highestRated?.id;

                    return (
                        <Card
                            key={quote.id}
                            className={`transition-all ${isSelected
                                    ? 'ring-2 ring-primary border-primary'
                                    : 'hover:border-slate-300'
                                }`}
                        >
                            <CardContent className="p-6">
                                {/* Provider Header */}
                                <div className="flex items-start gap-4">
                                    <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                                        {quote.provider.logoUrl ? (
                                            <img
                                                src={quote.provider.logoUrl}
                                                alt={quote.provider.businessName}
                                                className="w-full h-full rounded-xl object-cover"
                                            />
                                        ) : (
                                            <span className="text-2xl font-bold text-primary">
                                                {quote.provider.businessName[0]}
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-4">
                                            <div>
                                                <Link
                                                    href={`/providers/${quote.provider.slug}`}
                                                    className="font-semibold text-lg hover:text-primary"
                                                >
                                                    {quote.provider.businessName}
                                                </Link>
                                                <div className="flex flex-wrap items-center gap-2 mt-1">
                                                    {quote.provider.avgRating && (
                                                        <div className="flex items-center gap-1">
                                                            <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                                                            <span className="font-medium">
                                                                {quote.provider.avgRating.toFixed(1)}
                                                            </span>
                                                            <span className="text-muted-foreground">
                                                                ({quote.provider.totalReviews})
                                                            </span>
                                                        </div>
                                                    )}
                                                    {quote.provider.identityVerified && (
                                                        <Badge variant="outline" className="gap-1 text-green-600">
                                                            <CheckCircle className="h-3 w-3" />
                                                            Verified
                                                        </Badge>
                                                    )}
                                                    {quote.provider.insuranceVerified && (
                                                        <Badge variant="outline" className="gap-1 text-blue-600">
                                                            <Shield className="h-3 w-3" />
                                                            Insured
                                                        </Badge>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-2xl font-bold">
                                                    £{(quote.quoteAmount / 100).toLocaleString()}
                                                </div>
                                                <div className="flex gap-1 mt-1">
                                                    {isBestPrice && (
                                                        <Badge className="bg-green-500">Best Price</Badge>
                                                    )}
                                                    {isBestRated && !isBestPrice && (
                                                        <Badge className="bg-amber-500">Top Rated</Badge>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Quote Details */}
                                <div className="mt-4 pt-4 border-t">
                                    <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-3">
                                        {quote.estimatedDuration && (
                                            <div className="flex items-center gap-1">
                                                <Clock className="h-4 w-4" />
                                                {quote.estimatedDuration}
                                            </div>
                                        )}
                                        <div className="flex items-center gap-1">
                                            <Calendar className="h-4 w-4" />
                                            Valid until{' '}
                                            {new Date(quote.validUntil).toLocaleDateString('en-GB', {
                                                day: 'numeric',
                                                month: 'short',
                                            })}
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <MessageSquare className="h-4 w-4" />
                                            Received{' '}
                                            {formatDistanceToNow(new Date(quote.createdAt), {
                                                addSuffix: true,
                                            })}
                                        </div>
                                    </div>

                                    <p
                                        className={`text-sm ${isExpanded ? '' : 'line-clamp-2'
                                            }`}
                                    >
                                        {quote.description}
                                    </p>

                                    {quote.description.length > 150 && (
                                        <button
                                            onClick={() => toggleExpand(quote.id)}
                                            className="flex items-center gap-1 text-sm text-primary mt-2 hover:underline"
                                        >
                                            {isExpanded ? (
                                                <>
                                                    Show less <ChevronUp className="h-4 w-4" />
                                                </>
                                            ) : (
                                                <>
                                                    Read more <ChevronDown className="h-4 w-4" />
                                                </>
                                            )}
                                        </button>
                                    )}
                                </div>

                                {/* Actions */}
                                <div className="flex gap-3 mt-4 pt-4 border-t">
                                    <Button
                                        variant={isSelected ? 'default' : 'outline'}
                                        className="flex-1"
                                        onClick={() => onSelect(quote.id)}
                                    >
                                        {isSelected ? (
                                            <>
                                                <CheckCircle className="h-4 w-4 mr-2" />
                                                Selected
                                            </>
                                        ) : (
                                            'Select This Quote'
                                        )}
                                    </Button>
                                    <Link href={`/messages?provider=${quote.provider.id}`}>
                                        <Button variant="outline">
                                            <MessageSquare className="h-4 w-4 mr-2" />
                                            Message
                                        </Button>
                                    </Link>
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            {quotes.length === 0 && (
                <Card>
                    <CardContent className="p-8 text-center">
                        <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="font-semibold text-lg mb-2">Waiting for Quotes</h3>
                        <p className="text-muted-foreground">
                            Local professionals are reviewing your request. You'll receive quotes
                            soon!
                        </p>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}

export default QuoteComparison;
