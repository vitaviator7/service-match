'use client';

import { useState, useEffect, useCallback, Suspense, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Search,
    MapPin,
    Star,
    Clock,
    CheckCircle,
    Shield,
    Filter,
    ChevronLeft,
    ChevronRight,
    Loader2,
} from 'lucide-react';
import { debounce } from '@/lib/utils';

interface Provider {
    id: string;
    slug: string;
    businessName: string;
    shortBio?: string;
    avatarUrl?: string;
    coverImageUrl?: string;
    avgRating: number | null;
    totalReviews: number;
    responseTime: number | null;
    verified: {
        identity: boolean;
        insurance: boolean;
        background: boolean;
    };
    services: { id: string; name: string; category: string }[];
    portfolio: string[];
    city?: string;
    distance?: number;
    subscriptionTier: string;
}

interface SearchResult {
    providers: Provider[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

function SearchContent() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const [providers, setProviders] = useState<Provider[]>([]);
    const [loading, setLoading] = useState(true);
    const [totalResults, setTotalResults] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    // Filters
    const [query, setQuery] = useState(searchParams.get('q') || '');
    const [postcode, setPostcode] = useState(searchParams.get('postcode') || '');
    const [category, setCategory] = useState(searchParams.get('category') || '');
    const [sortBy, setSortBy] = useState(searchParams.get('sort') || 'rating');
    const [minRating, setMinRating] = useState(searchParams.get('minRating') || '');
    const [verifiedOnly, setVerifiedOnly] = useState(
        searchParams.get('verified') === 'true'
    );

    const [categories, setCategories] = useState<any[]>([]);

    // Fetch categories
    useEffect(() => {
        fetch('/api/categories')
            .then((res) => res.json())
            .then(setCategories)
            .catch(console.error);
    }, []);

    // Build search URL
    const buildSearchUrl = useCallback(() => {
        const params = new URLSearchParams();
        if (query) params.set('q', query);
        if (postcode) params.set('postcode', postcode);
        if (category) params.set('category', category);
        if (sortBy) params.set('sort', sortBy);
        if (minRating) params.set('minRating', minRating);
        if (verifiedOnly) params.set('verified', 'true');
        params.set('page', currentPage.toString());
        return `/api/providers?${params.toString()}`;
    }, [query, postcode, category, sortBy, minRating, verifiedOnly, currentPage]);

    // Search providers
    const searchProviders = useCallback(async () => {
        setLoading(true);
        try {
            const response = await fetch(buildSearchUrl());
            const data: SearchResult = await response.json();
            setProviders(data.providers);
            setTotalResults(data.total);
            setTotalPages(data.totalPages);
        } catch (error) {
            console.error('Search error:', error);
        } finally {
            setLoading(false);
        }
    }, [buildSearchUrl]);

    // Debounced search
    const debouncedSearch = useMemo(
        () => debounce(() => {
            setCurrentPage(1);
            searchProviders();
        }, 300),
        [searchProviders]
    );

    // Initial search
    useEffect(() => {
        searchProviders();
    }, [searchProviders]);

    // Search on query/postcode change (debounced)
    useEffect(() => {
        debouncedSearch();
    }, [debouncedSearch, query, postcode]);

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Search Header */}
            <div className="bg-white border-b sticky top-0 z-30">
                <div className="container mx-auto px-4 py-4">
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                            <Input
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="Search for services or providers..."
                                className="pl-10"
                            />
                        </div>
                        <div className="w-full md:w-48 relative">
                            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                            <Input
                                value={postcode}
                                onChange={(e) => setPostcode(e.target.value.toUpperCase())}
                                placeholder="Postcode"
                                className="pl-10"
                            />
                        </div>
                    </div>

                    {/* Filters Row */}
                    <div className="flex flex-wrap items-center gap-3 mt-4">
                        <Select value={category} onValueChange={setCategory}>
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="All Categories" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="">All Categories</SelectItem>
                                {categories.map((cat) => (
                                    <SelectItem key={cat.id} value={cat.slug}>
                                        {cat.icon} {cat.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <Select value={sortBy} onValueChange={setSortBy}>
                            <SelectTrigger className="w-[160px]">
                                <SelectValue placeholder="Sort by" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="rating">Top Rated</SelectItem>
                                <SelectItem value="reviews">Most Reviews</SelectItem>
                                <SelectItem value="response">Fastest Response</SelectItem>
                                <SelectItem value="newest">Newest</SelectItem>
                            </SelectContent>
                        </Select>

                        <Select value={minRating} onValueChange={setMinRating}>
                            <SelectTrigger className="w-[140px]">
                                <SelectValue placeholder="Any Rating" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="">Any Rating</SelectItem>
                                <SelectItem value="4">4+ Stars</SelectItem>
                                <SelectItem value="4.5">4.5+ Stars</SelectItem>
                            </SelectContent>
                        </Select>

                        <Button
                            variant={verifiedOnly ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setVerifiedOnly(!verifiedOnly)}
                            className="gap-2"
                        >
                            <Shield className="h-4 w-4" />
                            Verified Only
                        </Button>

                        <span className="text-sm text-muted-foreground ml-auto">
                            {totalResults} providers found
                        </span>
                    </div>
                </div>
            </div>

            {/* Results */}
            <div className="container mx-auto px-4 py-8">
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                ) : providers.length === 0 ? (
                    <div className="text-center py-20">
                        <Search className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                        <h2 className="text-2xl font-bold mb-2">No providers found</h2>
                        <p className="text-muted-foreground mb-4">
                            Try adjusting your filters or search in a different area
                        </p>
                        <Button
                            variant="outline"
                            onClick={() => {
                                setQuery('');
                                setPostcode('');
                                setCategory('');
                                setMinRating('');
                                setVerifiedOnly(false);
                            }}
                        >
                            Clear Filters
                        </Button>
                    </div>
                ) : (
                    <>
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {providers.map((provider) => (
                                <ProviderCard key={provider.id} provider={provider} />
                            ))}
                        </div>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="flex items-center justify-center gap-2 mt-8">
                                <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={() => setCurrentPage(currentPage - 1)}
                                    disabled={currentPage === 1}
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                </Button>
                                <span className="text-sm text-muted-foreground px-4">
                                    Page {currentPage} of {totalPages}
                                </span>
                                <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={() => setCurrentPage(currentPage + 1)}
                                    disabled={currentPage === totalPages}
                                >
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}

export default function SearchPage() {
    return (
        <Suspense fallback={
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
        }>
            <SearchContent />
        </Suspense>
    );
}

function ProviderCard({ provider }: { provider: Provider }) {
    const isFullyVerified =
        provider.verified.identity &&
        provider.verified.insurance &&
        provider.verified.background;

    return (
        <Link href={`/providers/${provider.slug}`}>
            <Card className="overflow-hidden card-hover h-full">
                {/* Cover Image */}
                <div className="h-32 bg-gradient-to-br from-primary/20 to-primary/5 relative">
                    {provider.coverImageUrl && (
                        <img
                            src={provider.coverImageUrl}
                            alt=""
                            className="w-full h-full object-cover"
                        />
                    )}
                    {provider.subscriptionTier === 'PREMIUM' && (
                        <Badge className="absolute top-2 right-2 bg-gradient-to-r from-amber-500 to-orange-500">
                            Premium
                        </Badge>
                    )}
                </div>

                <CardContent className="p-4 -mt-8 relative">
                    {/* Avatar */}
                    <div className="w-16 h-16 rounded-full bg-white border-4 border-white shadow-md overflow-hidden">
                        {provider.avatarUrl ? (
                            <img
                                src={provider.avatarUrl}
                                alt={provider.businessName}
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <div className="w-full h-full bg-primary/10 flex items-center justify-center text-primary text-xl font-bold">
                                {provider.businessName[0]}
                            </div>
                        )}
                    </div>

                    {/* Info */}
                    <div className="mt-2">
                        <div className="flex items-start justify-between gap-2">
                            <div>
                                <h3 className="font-semibold text-lg line-clamp-1">
                                    {provider.businessName}
                                </h3>
                                {provider.city && (
                                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                                        <MapPin className="h-3 w-3" />
                                        {provider.city}
                                        {provider.distance !== undefined && (
                                            <span> • {provider.distance} miles</span>
                                        )}
                                    </p>
                                )}
                            </div>
                            {isFullyVerified && (
                                <div className="shrink-0">
                                    <Badge variant="success" className="gap-1">
                                        <CheckCircle className="h-3 w-3" />
                                        Verified
                                    </Badge>
                                </div>
                            )}
                        </div>

                        {provider.shortBio && (
                            <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                                {provider.shortBio}
                            </p>
                        )}

                        {/* Services */}
                        <div className="flex flex-wrap gap-1 mt-3">
                            {provider.services.slice(0, 3).map((service) => (
                                <Badge key={service.id} variant="secondary" className="text-xs">
                                    {service.name}
                                </Badge>
                            ))}
                            {provider.services.length > 3 && (
                                <Badge variant="secondary" className="text-xs">
                                    +{provider.services.length - 3}
                                </Badge>
                            )}
                        </div>

                        {/* Stats */}
                        <div className="flex items-center gap-4 mt-4 pt-4 border-t">
                            <div className="flex items-center gap-1">
                                <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                                <span className="font-medium">
                                    {provider.avgRating?.toFixed(1) || '-'}
                                </span>
                                <span className="text-sm text-muted-foreground">
                                    ({provider.totalReviews})
                                </span>
                            </div>
                            {provider.responseTime && (
                                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                    <Clock className="h-4 w-4" />
                                    {provider.responseTime < 60
                                        ? `${provider.responseTime}m`
                                        : `${Math.round(provider.responseTime / 60)}h`}{' '}
                                    response
                                </div>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>
        </Link>
    );
}
