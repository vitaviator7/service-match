export const dynamic = "force-dynamic";

import { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { prisma } from '@service-match/db';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    ArrowLeft,
    Building2,
    Star,
    ShieldCheck,
    MapPin,
    Phone,
    Globe,
    Wrench,
    Wallet,
    Info,
    Calendar,
    ArrowUpRight
} from 'lucide-react';

interface AdminProviderDetailPageProps {
    params: { id: string };
}

export const metadata: Metadata = {
    title: 'Provider Details | Admin | Serious Control',
};

export default async function AdminProviderDetailPage({ params }: AdminProviderDetailPageProps) {
    const session = await getSession();

    if (!session?.user || session.user.role !== 'ADMIN') {
        redirect('/auth/signin');
    }

    const provider = await prisma.providerProfile.findUnique({
        where: { id: params.id },
        include: {
            user: true,
            services: {
                include: { category: true }
            },
            locations: true,
            _count: {
                select: {
                    bookings: true,
                    quotes: true,
                    reviews: true,
                    leads: true,
                }
            }
        },
    });

    if (!provider) {
        notFound();
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <Link href="/admin/providers" className="flex items-center text-sm text-muted-foreground hover:text-foreground mb-6">
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back to Providers
            </Link>

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div className="flex items-center gap-4">
                    <div className="h-16 w-16 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 border border-indigo-100 shadow-sm">
                        <Building2 className="h-8 w-8" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold">{provider.businessName}</h1>
                        <div className="flex items-center gap-2 mt-1">
                            <Badge variant={provider.isVerified ? 'success' : 'outline'}>
                                {provider.isVerified ? 'Verified' : 'Pending Verification'}
                            </Badge>
                            <Badge variant="secondary" className="capitalize">
                                {provider.subscriptionTier} Plan
                            </Badge>
                            <div className="flex items-center text-amber-500 ml-2">
                                <Star className="h-4 w-4 fill-current mr-1" />
                                <span className="text-sm font-bold">{provider.rating.toFixed(1)}</span>
                                <span className="text-xs text-muted-foreground ml-1">({provider.reviewCount})</span>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    {!provider.isVerified && (
                        <Button className="bg-green-600 hover:bg-green-700">Verify Business</Button>
                    )}
                    <Button variant="outline" asChild>
                        <Link href={`/providers/${provider.slug}`} target="_blank">
                            Public Profile
                            <ArrowUpRight className="ml-2 h-4 w-4" />
                        </Link>
                    </Button>
                </div>
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                    {/* Stats Overview */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-white p-6 rounded-2xl shadow-sm border text-center">
                            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Bookings</p>
                            <p className="text-3xl font-bold">{provider._count.bookings}</p>
                        </div>
                        <div className="bg-white p-6 rounded-2xl shadow-sm border text-center">
                            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Quotes</p>
                            <p className="text-3xl font-bold">{provider._count.quotes}</p>
                        </div>
                        <div className="bg-white p-6 rounded-2xl shadow-sm border text-center">
                            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Leads</p>
                            <p className="text-3xl font-bold">{provider._count.leads}</p>
                        </div>
                        <div className="bg-white p-6 rounded-2xl shadow-sm border text-center">
                            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Conversion</p>
                            <p className="text-3xl font-bold">
                                {provider._count.leads > 0 ? ((provider._count.quotes / provider._count.leads) * 100).toFixed(0) : 0}%
                            </p>
                        </div>
                    </div>

                    <Card>
                        <CardHeader>
                            <CardTitle>Business Details</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid md:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <div className="flex items-start gap-3 text-sm">
                                        <Info className="h-4 w-4 text-muted-foreground mt-0.5" />
                                        <div>
                                            <p className="font-medium">Bio</p>
                                            <p className="text-muted-foreground">{provider.shortBio || 'No bio provided'}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 text-sm">
                                        <Phone className="h-4 w-4 text-muted-foreground" />
                                        <span>{provider.businessPhone || 'No phone'}</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-sm">
                                        <Globe className="h-4 w-4 text-muted-foreground" />
                                        <span>{provider.website || 'No website'}</span>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <div className="flex items-start gap-3 text-sm">
                                        <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                                        <div>
                                            <p className="font-medium">Main Hub</p>
                                            <p className="text-muted-foreground">{provider.city}, {provider.postcode}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 text-sm">
                                        <Wallet className="h-4 w-4 text-muted-foreground" />
                                        <span>Stripe Status: <Badge variant="outline" className="ml-1">{provider.stripeAccountStatus}</Badge></span>
                                    </div>
                                    <div className="flex items-center gap-3 text-sm text-green-600 font-medium">
                                        <ShieldCheck className="h-4 w-4" />
                                        <span>Trust Score: {provider.trustScore}/100</span>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-6 border-t">
                                <h4 className="font-medium mb-4 flex items-center gap-2">
                                    <Wrench className="h-4 w-4" />
                                    Services Offered
                                </h4>
                                <div className="flex flex-wrap gap-2">
                                    {provider.services.map(s => (
                                        <Badge key={s.id} variant="secondary">
                                            {s.category.name}
                                        </Badge>
                                    ))}
                                    {provider.services.length === 0 && <span className="text-sm text-muted-foreground">No services listed</span>}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Owner Information</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <Link href={`/admin/users/${provider.user.id}`} className="flex items-center gap-3 p-3 rounded-lg border hover:bg-slate-50 transition-colors">
                                <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                                    <Calendar className="h-5 w-5" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium">{provider.user.firstName} {provider.user.lastName}</p>
                                    <p className="text-xs text-muted-foreground">{provider.user.email}</p>
                                </div>
                            </Link>
                            <div className="text-xs text-muted-foreground mt-6 text-center">
                                Account Manager: System / Auto
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Locations</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {provider.locations.map(loc => (
                                    <div key={loc.id} className="text-sm flex items-center justify-between">
                                        <span>{loc.city} ({loc.postcode})</span>
                                        <span className="text-xs text-muted-foreground">{loc.radius}mi radius</span>
                                    </div>
                                ))}
                                {provider.locations.length === 0 && <span className="text-sm text-muted-foreground">No locations set</span>}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
