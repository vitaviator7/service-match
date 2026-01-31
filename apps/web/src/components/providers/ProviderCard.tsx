import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, CheckCircle, Star, Clock } from 'lucide-react';

export interface Provider {
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

export function ProviderCard({ provider }: { provider: Provider }) {
    const isFullyVerified =
        provider.verified.identity &&
        provider.verified.insurance &&
        provider.verified.background;

    return (
        <Link href={`/providers/${provider.slug}`}>
            <Card className="overflow-hidden card-hover h-full transition-all hover:shadow-md">
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
                                    <Badge variant="secondary" className="gap-1 bg-green-100 text-green-700 hover:bg-green-100 border-green-200">
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
                                <Badge key={service.id} variant="outline" className="text-xs">
                                    {service.name}
                                </Badge>
                            ))}
                            {provider.services.length > 3 && (
                                <Badge variant="outline" className="text-xs">
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
