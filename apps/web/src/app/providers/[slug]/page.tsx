import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@service-match/db';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    Star,
    MapPin,
    Clock,
    CheckCircle,
    Phone,
    Mail,
    Globe,
    Shield,
    Award,
    Calendar,
    MessageSquare,
} from 'lucide-react';

interface Props {
    params: { slug: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const provider = await prisma.providerProfile.findUnique({
        where: { slug: params.slug },
        include: {
            services: { include: { category: true }, take: 5 },
            user: true,
        },
    });

    if (!provider) {
        return { title: 'Provider Not Found' };
    }

    const categories = [...new Set(provider.services.map((s) => s.category.name))];

    return {
        title: `${provider.businessName} - ${categories.join(', ')} | ServiceMatch`,
        description:
            provider.shortBio ||
            `${provider.businessName} offers professional ${categories.join(', ').toLowerCase()} services. ${provider.totalReviews} reviews, ${provider.avgRating?.toFixed(1) || 'New'} rating.`,
        openGraph: {
            title: provider.businessName,
            description: provider.shortBio || provider.description?.slice(0, 160),
            images: provider.bannerUrl ? [provider.bannerUrl] : [],
            type: 'profile',
        },
        alternates: {
            canonical: `${process.env.NEXT_PUBLIC_APP_URL}/providers/${params.slug}`,
        },
    };
}

export const dynamic = 'force-dynamic';

export default async function ProviderProfilePage({ params }: Props) {
    const provider = await prisma.providerProfile.findUnique({
        where: { slug: params.slug },
        include: {
            user: {
                select: {
                    firstName: true,
                    lastName: true,
                    avatarUrl: true,
                    createdAt: true,
                },
            },
            services: {
                where: { isActive: true },
                include: { category: true },
            },
            portfolio: {
                orderBy: { createdAt: 'desc' },
                take: 12,
            },
            certifications: {
                where: { isActive: true },
            },
            reviews: {
                where: { status: 'PUBLISHED' },
                include: {
                    customer: {
                        include: { user: true },
                    },
                    photos: true,
                    response: true,
                },
                orderBy: { createdAt: 'desc' },
                take: 10,
            },
            locations: {
                where: { isActive: true },
            },
        },
    });

    if (!provider || provider.status !== 'ACTIVE') {
        notFound();
    }

    // Generate JSON-LD structured data
    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'LocalBusiness',
        name: provider.businessName,
        description: provider.description,
        url: `${process.env.NEXT_PUBLIC_APP_URL}/providers/${provider.slug}`,
        image: provider.bannerUrl || provider.logoUrl,
        address: provider.city
            ? {
                '@type': 'PostalAddress',
                addressLocality: provider.city,
                postalCode: provider.postcode,
                addressCountry: 'GB',
            }
            : undefined,
        geo: provider.latitude
            ? {
                '@type': 'GeoCoordinates',
                latitude: provider.latitude,
                longitude: provider.longitude,
            }
            : undefined,
        telephone: provider.businessPhone,
        aggregateRating: provider.avgRating
            ? {
                '@type': 'AggregateRating',
                ratingValue: provider.avgRating,
                reviewCount: provider.totalReviews,
                bestRating: 5,
                worstRating: 1,
            }
            : undefined,
        review: provider.reviews.slice(0, 5).map((review) => ({
            '@type': 'Review',
            author: {
                '@type': 'Person',
                name: `${review.customer.user.firstName} ${review.customer.user.lastName?.[0] || ''}.`,
            },
            reviewRating: {
                '@type': 'Rating',
                ratingValue: review.overallRating,
                bestRating: 5,
            },
            reviewBody: review.comment,
            datePublished: review.createdAt.toISOString(),
        })),
        hasOfferCatalog: {
            '@type': 'OfferCatalog',
            name: 'Services',
            itemListElement: provider.services.map((service) => ({
                '@type': 'Offer',
                name: service.name,
                description: service.description,
                priceSpecification: service.pricingModel === 'FIXED' && (service.fixedPrice || service.priceFrom)
                    ? {
                        '@type': 'PriceSpecification',
                        price: service.fixedPrice || service.priceFrom,
                        priceCurrency: 'GBP',
                    }
                    : undefined,
            })),
        },
    };

    const isVerified =
        provider.identityVerified &&
        provider.insuranceVerified &&
        provider.backgroundChecked;

    const memberSince = new Date(provider.user.createdAt).toLocaleDateString('en-GB', {
        month: 'long',
        year: 'numeric',
    });

    return (
        <>
            {/* JSON-LD Structured Data */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />

            <div className="min-h-screen bg-slate-50">
                {/* Hero Section */}
                <div className="relative h-64 md:h-80 bg-gradient-to-br from-primary/30 to-primary/10">
                    {provider.bannerUrl && (
                        <img
                            src={provider.bannerUrl}
                            alt={`${provider.businessName} cover`}
                            className="absolute inset-0 w-full h-full object-cover"
                        />
                    )}
                    <div className="absolute inset-0 bg-black/20" />
                </div>

                <div className="container mx-auto px-4">
                    {/* Profile Header */}
                    <div className="relative -mt-20 mb-8">
                        <div className="bg-white rounded-xl shadow-lg p-6">
                            <div className="flex flex-col md:flex-row gap-6">
                                {/* Avatar */}
                                <div className="shrink-0">
                                    <div className="w-32 h-32 rounded-xl bg-primary/10 overflow-hidden border-4 border-white shadow-lg">
                                        {provider.logoUrl || provider.user.avatarUrl ? (
                                            <img
                                                src={provider.logoUrl || provider.user.avatarUrl!}
                                                alt={provider.businessName}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-primary text-4xl font-bold">
                                                {provider.businessName[0]}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Info */}
                                <div className="flex-1">
                                    <div className="flex flex-wrap items-start justify-between gap-4">
                                        <div>
                                            <div className="flex items-center gap-3 mb-2">
                                                <h1 className="text-2xl md:text-3xl font-bold">
                                                    {provider.businessName}
                                                </h1>
                                                {isVerified && (
                                                    <Badge
                                                        variant="success"
                                                        className="gap-1"
                                                    >
                                                        <Shield className="h-3.5 w-3.5" />
                                                        Verified Pro
                                                    </Badge>
                                                )}
                                                {provider.subscriptionTier === 'PREMIUM' && (
                                                    <Badge className="bg-gradient-to-r from-amber-500 to-orange-500">
                                                        Premium
                                                    </Badge>
                                                )}
                                            </div>

                                            {provider.shortBio && (
                                                <p className="text-muted-foreground mb-3">
                                                    {provider.shortBio}
                                                </p>
                                            )}

                                            <div className="flex flex-wrap items-center gap-4 text-sm">
                                                {provider.city && (
                                                    <span className="flex items-center gap-1">
                                                        <MapPin className="h-4 w-4 text-muted-foreground" />
                                                        {provider.city}
                                                    </span>
                                                )}
                                                <span className="flex items-center gap-1">
                                                    <Calendar className="h-4 w-4 text-muted-foreground" />
                                                    Member since {memberSince}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Stats */}
                                        <div className="flex gap-6">
                                            <div className="text-center">
                                                <div className="flex items-center gap-1 text-2xl font-bold">
                                                    <Star className="h-6 w-6 text-amber-500 fill-amber-500" />
                                                    {provider.avgRating?.toFixed(1) || '-'}
                                                </div>
                                                <p className="text-sm text-muted-foreground">
                                                    {provider.totalReviews} reviews
                                                </p>
                                            </div>
                                            {provider.avgResponseTime && (
                                                <div className="text-center">
                                                    <div className="flex items-center gap-1 text-2xl font-bold">
                                                        <Clock className="h-5 w-5 text-green-500" />
                                                        {provider.avgResponseTime < 60
                                                            ? `${provider.avgResponseTime}m`
                                                            : `${Math.round(provider.avgResponseTime / 60)}h`}
                                                    </div>
                                                    <p className="text-sm text-muted-foreground">
                                                        Avg. response
                                                    </p>
                                                </div>
                                            )}
                                            <div className="text-center">
                                                <div className="text-2xl font-bold">
                                                    {provider.totalBookings}
                                                </div>
                                                <p className="text-sm text-muted-foreground">
                                                    Jobs completed
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* CTA Buttons */}
                            <div className="flex flex-wrap gap-3 mt-6 pt-6 border-t">
                                <Link href={`/request?provider=${provider.id}`}>
                                    <Button size="lg" className="gap-2">
                                        <MessageSquare className="h-5 w-5" />
                                        Request a Quote
                                    </Button>
                                </Link>
                                {provider.businessPhone && (
                                    <Button variant="outline" size="lg" className="gap-2" asChild>
                                        <a href={`tel:${provider.businessPhone}`}>
                                            <Phone className="h-5 w-5" />
                                            Call
                                        </a>
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="grid lg:grid-cols-3 gap-8 pb-12">
                        {/* Main Content */}
                        <div className="lg:col-span-2 space-y-8">
                            {/* About */}
                            {provider.description && (
                                <Card>
                                    <CardContent className="p-6">
                                        <h2 className="text-xl font-semibold mb-4">About</h2>
                                        <p className="text-muted-foreground whitespace-pre-line">
                                            {provider.description}
                                        </p>
                                    </CardContent>
                                </Card>
                            )}

                            {/* Services */}
                            <Card>
                                <CardContent className="p-6">
                                    <h2 className="text-xl font-semibold mb-4">Services</h2>
                                    <div className="grid md:grid-cols-2 gap-4">
                                        {provider.services.map((service) => (
                                            <div
                                                key={service.id}
                                                className="p-4 rounded-lg border hover:border-primary transition-colors"
                                            >
                                                <h3 className="font-medium">{service.name}</h3>
                                                <p className="text-sm text-muted-foreground">
                                                    {service.category.name}
                                                </p>
                                                {(service.fixedPrice || service.priceFrom) && (
                                                    <p className="text-sm font-medium text-primary mt-2">
                                                        {service.pricingModel === 'FIXED'
                                                            ? `From £${service.fixedPrice || service.priceFrom}`
                                                            : `£${service.hourlyRate}/hr`}
                                                    </p>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Portfolio */}
                            {provider.portfolio.length > 0 && (
                                <Card>
                                    <CardContent className="p-6">
                                        <h2 className="text-xl font-semibold mb-4">
                                            Portfolio
                                        </h2>
                                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                            {provider.portfolio.map((item) => (
                                                <div
                                                    key={item.id}
                                                    className="aspect-square rounded-lg overflow-hidden bg-slate-100"
                                                >
                                                    <img
                                                        src={item.thumbnailUrl || item.imageUrl}
                                                        alt={item.title || 'Portfolio item'}
                                                        className="w-full h-full object-cover hover:scale-105 transition-transform"
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            )}

                            {/* Reviews */}
                            <Card>
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between mb-6">
                                        <h2 className="text-xl font-semibold">Reviews</h2>
                                        <span className="text-muted-foreground">
                                            {provider.totalReviews} total
                                        </span>
                                    </div>

                                    {provider.reviews.length === 0 ? (
                                        <p className="text-muted-foreground text-center py-8">
                                            No reviews yet
                                        </p>
                                    ) : (
                                        <div className="space-y-6">
                                            {provider.reviews.map((review) => (
                                                <div
                                                    key={review.id}
                                                    className="border-b pb-6 last:border-0"
                                                >
                                                    <div className="flex items-start justify-between mb-2">
                                                        <div>
                                                            <p className="font-medium">
                                                                {review.customer.user.firstName}{' '}
                                                                {review.customer.user.lastName?.[0]}.
                                                            </p>
                                                            <div className="flex items-center gap-1">
                                                                {[...Array(5)].map((_, i) => (
                                                                    <Star
                                                                        key={i}
                                                                        className={`h-4 w-4 ${i < review.overallRating
                                                                            ? 'text-amber-500 fill-amber-500'
                                                                            : 'text-slate-200'
                                                                            }`}
                                                                    />
                                                                ))}
                                                            </div>
                                                        </div>
                                                        <span className="text-sm text-muted-foreground">
                                                            {new Date(
                                                                review.createdAt
                                                            ).toLocaleDateString('en-GB', {
                                                                month: 'short',
                                                                year: 'numeric',
                                                            })}
                                                        </span>
                                                    </div>
                                                    {review.title && (
                                                        <h4 className="font-medium mb-1">
                                                            {review.title}
                                                        </h4>
                                                    )}
                                                    <p className="text-muted-foreground">
                                                        {review.comment}
                                                    </p>

                                                    {/* Review photos */}
                                                    {review.photos.length > 0 && (
                                                        <div className="flex gap-2 mt-3">
                                                            {review.photos.map((media) => (
                                                                <div
                                                                    key={media.id}
                                                                    className="w-16 h-16 rounded overflow-hidden"
                                                                >
                                                                    <img
                                                                        src={media.url}
                                                                        alt=""
                                                                        className="w-full h-full object-cover"
                                                                    />
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}

                                                    {/* Provider response */}
                                                    {review.response && (
                                                        <div className="mt-4 ml-6 p-4 bg-slate-50 rounded-lg">
                                                            <p className="text-sm font-medium mb-1">
                                                                Response from {provider.businessName}
                                                            </p>
                                                            <p className="text-sm text-muted-foreground">
                                                                {review.response.comment}
                                                            </p>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </div>

                        {/* Sidebar */}
                        <div className="space-y-6">
                            {/* Verification */}
                            <Card>
                                <CardContent className="p-6">
                                    <h3 className="font-semibold mb-4">Verified</h3>
                                    <div className="space-y-3">
                                        <VerificationItem
                                            label="Identity Verified"
                                            verified={provider.identityVerified}
                                        />
                                        <VerificationItem
                                            label="Insurance Verified"
                                            verified={provider.insuranceVerified}
                                        />
                                        <VerificationItem
                                            label="Background Checked"
                                            verified={provider.backgroundChecked}
                                        />
                                        <VerificationItem
                                            label="Phone Verified"
                                            verified={provider.phoneVerified}
                                        />
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Certifications */}
                            {provider.certifications.length > 0 && (
                                <Card>
                                    <CardContent className="p-6">
                                        <h3 className="font-semibold mb-4">Certifications</h3>
                                        <div className="space-y-3">
                                            {provider.certifications.map((cert) => (
                                                <div
                                                    key={cert.id}
                                                    className="flex items-center gap-2"
                                                >
                                                    <Award className="h-5 w-5 text-primary" />
                                                    <span className="text-sm">{cert.name}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            )}

                            {/* Contact */}
                            <Card>
                                <CardContent className="p-6">
                                    <h3 className="font-semibold mb-4">Contact</h3>
                                    <div className="space-y-3">
                                        {provider.businessPhone && (
                                            <a
                                                href={`tel:${provider.businessPhone}`}
                                                className="flex items-center gap-2 text-sm hover:text-primary"
                                            >
                                                <Phone className="h-4 w-4" />
                                                {provider.businessPhone}
                                            </a>
                                        )}
                                        {provider.businessEmail && (
                                            <a
                                                href={`mailto:${provider.businessEmail}`}
                                                className="flex items-center gap-2 text-sm hover:text-primary"
                                            >
                                                <Mail className="h-4 w-4" />
                                                {provider.businessEmail}
                                            </a>
                                        )}
                                        {provider.website && (
                                            <a
                                                href={provider.website}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center gap-2 text-sm hover:text-primary"
                                            >
                                                <Globe className="h-4 w-4" />
                                                Website
                                            </a>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Service Areas */}
                            {provider.locations.length > 0 && (
                                <Card>
                                    <CardContent className="p-6">
                                        <h3 className="font-semibold mb-4">Service Areas</h3>
                                        <div className="space-y-2">
                                            {provider.locations.map((location) => (
                                                <div
                                                    key={location.id}
                                                    className="flex items-center gap-2 text-sm"
                                                >
                                                    <MapPin className="h-4 w-4 text-muted-foreground" />
                                                    {location.city} ({location.radius} mile radius)
                                                </div>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

function VerificationItem({
    label,
    verified,
}: {
    label: string;
    verified: boolean;
}) {
    return (
        <div className="flex items-center gap-2">
            {verified ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
            ) : (
                <div className="h-5 w-5 rounded-full border-2 border-slate-200" />
            )}
            <span className={`text-sm ${verified ? '' : 'text-muted-foreground'}`}>
                {label}
            </span>
        </div>
    );
}
