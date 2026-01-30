import { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { prisma } from '@service-match/db';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    Building2,
    Star,
    MapPin,
    CheckCircle,
    Clock,
    AlertTriangle,
    XCircle,
    TrendingUp,
    DollarSign,
    Search,
} from 'lucide-react';

export const metadata: Metadata = {
    title: 'Providers | Admin | ServiceMatch',
    description: 'Manage service providers on the platform',
};

export default async function AdminProvidersPage({
    searchParams,
}: {
    searchParams: { status?: string; verified?: string; search?: string; page?: string };
}) {
    const session = await getSession();

    if (!session?.user || session.user.role !== 'ADMIN') {
        redirect('/auth/signin?callbackUrl=/admin/providers');
    }

    const status = searchParams.status || 'all';
    const verified = searchParams.verified || 'all';
    const search = searchParams.search || '';
    const page = parseInt(searchParams.page || '1');
    const limit = 20;

    const where: any = {};

    if (status !== 'all') {
        where.status = status.toUpperCase();
    }
    if (verified === 'verified') {
        where.identityVerified = true;
        where.insuranceVerified = true;
    } else if (verified === 'unverified') {
        where.OR = [{ identityVerified: false }, { insuranceVerified: false }];
    }
    if (search) {
        where.OR = [
            { businessName: { contains: search, mode: 'insensitive' } },
            { user: { email: { contains: search, mode: 'insensitive' } } },
        ];
    }

    const [providers, total] = await Promise.all([
        prisma.providerProfile.findMany({
            where,
            include: {
                user: true,
                services: { take: 3, include: { category: true } },
            },
            orderBy: { createdAt: 'desc' },
            skip: (page - 1) * limit,
            take: limit,
        }),
        prisma.providerProfile.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    // Stats
    const [
        totalProviders,
        activeProviders,
        pendingProviders,
        verifiedProviders,
    ] = await Promise.all([
        prisma.providerProfile.count(),
        prisma.providerProfile.count({ where: { status: 'ACTIVE' } }),
        prisma.providerProfile.count({ where: { status: { in: ['PENDING', 'ONBOARDING'] } } }),
        prisma.providerProfile.count({
            where: { identityVerified: true, insuranceVerified: true },
        }),
    ]);

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold">Providers</h1>
                    <p className="text-muted-foreground mt-1">
                        Manage and verify service providers
                    </p>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <Card>
                    <CardContent className="p-4">
                        <div className="text-2xl font-bold">
                            {totalProviders.toLocaleString()}
                        </div>
                        <p className="text-sm text-muted-foreground">Total Providers</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <div className="text-2xl font-bold text-green-600">
                            {activeProviders.toLocaleString()}
                        </div>
                        <p className="text-sm text-muted-foreground">Active</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <div className="text-2xl font-bold text-amber-600">
                            {pendingProviders.toLocaleString()}
                        </div>
                        <p className="text-sm text-muted-foreground">Pending Review</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <div className="text-2xl font-bold text-blue-600">
                            {verifiedProviders.toLocaleString()}
                        </div>
                        <p className="text-sm text-muted-foreground">Verified</p>
                    </CardContent>
                </Card>
            </div>

            {/* Filters */}
            <Card className="mb-6">
                <CardContent className="p-4">
                    <form className="flex flex-wrap items-center gap-4">
                        <div className="flex-1 min-w-[200px]">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <input
                                    type="text"
                                    name="search"
                                    defaultValue={search}
                                    placeholder="Search by business name or email..."
                                    className="w-full pl-10 pr-4 py-2 border rounded-lg"
                                />
                            </div>
                        </div>
                        <select
                            name="status"
                            defaultValue={status}
                            className="px-3 py-2 border rounded-lg"
                        >
                            <option value="all">All Statuses</option>
                            <option value="active">Active</option>
                            <option value="pending">Pending</option>
                            <option value="onboarding">Onboarding</option>
                            <option value="suspended">Suspended</option>
                        </select>
                        <select
                            name="verified"
                            defaultValue={verified}
                            className="px-3 py-2 border rounded-lg"
                        >
                            <option value="all">All Verification</option>
                            <option value="verified">Verified</option>
                            <option value="unverified">Unverified</option>
                        </select>
                        <Button type="submit">Filter</Button>
                    </form>
                </CardContent>
            </Card>

            {/* Providers Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {providers.map((provider) => (
                    <Link
                        key={provider.id}
                        href={`/admin/providers/${provider.id}`}
                    >
                        <Card className="card-hover h-full">
                            <CardContent className="p-6">
                                <div className="flex items-start gap-4 mb-4">
                                    <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                                        {provider.logoUrl ? (
                                            <img
                                                src={provider.logoUrl}
                                                alt={provider.businessName}
                                                className="w-full h-full rounded-xl object-cover"
                                            />
                                        ) : (
                                            <Building2 className="h-7 w-7 text-primary" />
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-semibold truncate">
                                            {provider.businessName}
                                        </h3>
                                        <p className="text-sm text-muted-foreground truncate">
                                            {provider.user.email}
                                        </p>
                                    </div>
                                </div>

                                {/* Badges */}
                                <div className="flex flex-wrap gap-2 mb-4">
                                    <ProviderStatusBadge status={provider.status} />
                                    {provider.identityVerified && provider.insuranceVerified && (
                                        <Badge variant="success" className="gap-1">
                                            <CheckCircle className="h-3 w-3" />
                                            Verified
                                        </Badge>
                                    )}
                                </div>

                                {/* Stats */}
                                <div className="grid grid-cols-3 gap-4 pt-4 border-t text-center">
                                    <div>
                                        <div className="flex items-center justify-center gap-1 font-semibold">
                                            <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                                            {provider.avgRating?.toFixed(1) || '-'}
                                        </div>
                                        <p className="text-xs text-muted-foreground">Rating</p>
                                    </div>
                                    <div>
                                        <div className="font-semibold">
                                            {provider.totalBookings}
                                        </div>
                                        <p className="text-xs text-muted-foreground">Bookings</p>
                                    </div>
                                    <div>
                                        <div className="font-semibold">
                                            {provider.totalReviews}
                                        </div>
                                        <p className="text-xs text-muted-foreground">Reviews</p>
                                    </div>
                                </div>

                                {/* Location */}
                                {provider.city && (
                                    <div className="flex items-center gap-1 mt-4 text-sm text-muted-foreground">
                                        <MapPin className="h-4 w-4" />
                                        {provider.city}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </Link>
                ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-8">
                    <Button
                        variant="outline"
                        size="sm"
                        disabled={page === 1}
                        asChild
                    >
                        <Link
                            href={`/admin/providers?status=${status}&verified=${verified}&search=${search}&page=${page - 1}`}
                        >
                            Previous
                        </Link>
                    </Button>
                    <span className="text-sm text-muted-foreground px-4">
                        Page {page} of {totalPages}
                    </span>
                    <Button
                        variant="outline"
                        size="sm"
                        disabled={page === totalPages}
                        asChild
                    >
                        <Link
                            href={`/admin/providers?status=${status}&verified=${verified}&search=${search}&page=${page + 1}`}
                        >
                            Next
                        </Link>
                    </Button>
                </div>
            )}
        </div>
    );
}

function ProviderStatusBadge({ status }: { status: string }) {
    const config: Record<
        string,
        { label: string; variant: 'default' | 'success' | 'warning' | 'destructive' }
    > = {
        ACTIVE: { label: 'Active', variant: 'success' },
        PENDING: { label: 'Pending', variant: 'warning' },
        ONBOARDING: { label: 'Onboarding', variant: 'default' },
        SUSPENDED: { label: 'Suspended', variant: 'destructive' },
        INACTIVE: { label: 'Inactive', variant: 'default' },
    };

    const { label, variant } = config[status] || config.PENDING;

    return <Badge variant={variant as any}>{label}</Badge>;
}
