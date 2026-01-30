import { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { prisma } from '@service-match/db';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
    Inbox,
    Calendar,
    MessageSquare,
    Star,
    Wallet,
    TrendingUp,
    AlertCircle,
    CheckCircle,
    Clock,
    ArrowRight,
    DollarSign,
    Users,
    Activity,
} from 'lucide-react';

export const metadata: Metadata = {
    title: 'Provider Dashboard | ServiceMatch',
    description: 'Manage your leads, quotes, bookings, and earnings',
};

export default async function ProviderDashboardPage() {
    const session = await getSession();

    if (!session?.user) {
        redirect('/auth/signin?callbackUrl=/provider');
    }

    if (session.user.role !== 'PROVIDER' && session.user.role !== 'ADMIN') {
        redirect('/dashboard');
    }

    const providerProfile = await prisma.providerProfile.findUnique({
        where: { userId: session.user.id },
        include: {
            user: true,
        },
    });

    if (!providerProfile) {
        redirect('/provider/onboarding');
    }

    // Get stats
    const [
        newLeads,
        activeQuotes,
        upcomingBookings,
        unreadMessages,
        completedThisMonth,
        pendingEarnings,
    ] = await Promise.all([
        prisma.quoteInvitation.count({
            where: {
                providerId: providerProfile.id,
                status: 'PENDING',
                quoteRequest: { status: 'OPEN' },
            },
        }),
        prisma.quote.count({
            where: {
                providerId: providerProfile.id,
                status: { in: ['SENT', 'VIEWED'] },
            },
        }),
        prisma.booking.count({
            where: {
                providerId: providerProfile.id,
                status: { in: ['ACCEPTED', 'PAID'] },
                scheduledDate: { gte: new Date() },
            },
        }),
        prisma.messageThread.aggregate({
            _sum: { providerUnread: true },
            where: { providerId: providerProfile.id },
        }),
        prisma.booking.count({
            where: {
                providerId: providerProfile.id,
                status: 'COMPLETED',
                customerConfirmedAt: {
                    gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
                },
            },
        }),
        prisma.booking.aggregate({
            _sum: { providerEarnings: true },
            where: {
                providerId: providerProfile.id,
                paymentStatus: 'PAID',
                payoutStatus: 'PENDING',
            },
        }),
    ]);

    // Get recent leads
    const recentLeads = await prisma.quoteInvitation.findMany({
        where: {
            providerId: providerProfile.id,
            status: 'PENDING',
            quoteRequest: { status: 'OPEN' },
        },
        include: {
            quoteRequest: {
                include: { category: true },
            },
        },
        orderBy: { sentAt: 'desc' },
        take: 5,
    });

    // Get upcoming bookings
    const upcomingBookingsList = await prisma.booking.findMany({
        where: {
            providerId: providerProfile.id,
            status: { in: ['ACCEPTED', 'PAID', 'IN_PROGRESS'] },
            scheduledDate: { gte: new Date() },
        },
        include: {
            customer: { include: { user: true } },
            service: true,
        },
        orderBy: { scheduledDate: 'asc' },
        take: 5,
    });

    const stats = [
        {
            label: 'New Leads',
            value: newLeads,
            icon: Inbox,
            href: '/provider/leads',
            color: 'text-blue-600',
            bgColor: 'bg-blue-50',
            urgent: newLeads > 0,
        },
        {
            label: 'Active Quotes',
            value: activeQuotes,
            icon: Activity,
            href: '/provider/quotes',
            color: 'text-purple-600',
            bgColor: 'bg-purple-50',
        },
        {
            label: 'Upcoming Jobs',
            value: upcomingBookings,
            icon: Calendar,
            href: '/provider/bookings',
            color: 'text-green-600',
            bgColor: 'bg-green-50',
        },
        {
            label: 'Messages',
            value: unreadMessages._sum.providerUnread || 0,
            icon: MessageSquare,
            href: '/provider/messages',
            color: 'text-amber-600',
            bgColor: 'bg-amber-50',
            urgent: (unreadMessages._sum.providerUnread || 0) > 0,
        },
    ];

    // Profile completeness check
    const isProfileIncomplete = providerProfile.profileScore < 75;
    const isStripeIncomplete = providerProfile.stripeAccountStatus !== 'ACTIVE';

    return (
        <div className="container mx-auto px-4 py-8">
            {/* Alerts */}
            {(isProfileIncomplete || isStripeIncomplete) && (
                <div className="mb-6 space-y-3">
                    {isProfileIncomplete && (
                        <div className="flex items-center gap-3 p-4 bg-amber-50 text-amber-800 rounded-lg border border-amber-200">
                            <AlertCircle className="h-5 w-5 shrink-0" />
                            <div className="flex-1">
                                <p className="font-medium">Complete your profile</p>
                                <p className="text-sm">
                                    Your profile is {providerProfile.profileScore}% complete. A
                                    complete profile gets more leads.
                                </p>
                            </div>
                            <Link href="/provider/settings/profile">
                                <Button size="sm" variant="outline">
                                    Complete
                                </Button>
                            </Link>
                        </div>
                    )}
                    {isStripeIncomplete && (
                        <div className="flex items-center gap-3 p-4 bg-red-50 text-red-800 rounded-lg border border-red-200">
                            <AlertCircle className="h-5 w-5 shrink-0" />
                            <div className="flex-1">
                                <p className="font-medium">Set up payments</p>
                                <p className="text-sm">
                                    Connect your bank account to start receiving payments.
                                </p>
                            </div>
                            <Link href="/provider/settings/payments">
                                <Button size="sm" variant="outline">
                                    Connect
                                </Button>
                            </Link>
                        </div>
                    )}
                </div>
            )}

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-bold">
                        Welcome back, {providerProfile.businessName}
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        {completedThisMonth} jobs completed this month
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="text-right">
                        <p className="text-sm text-muted-foreground">Pending Earnings</p>
                        <p className="text-2xl font-bold">
                            £{(pendingEarnings._sum.providerEarnings?.toNumber() || 0).toFixed(2)}
                        </p>
                    </div>
                    <Link href="/provider/earnings">
                        <Button variant="outline" size="sm">
                            View Earnings
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {stats.map((stat) => (
                    <Link key={stat.label} href={stat.href}>
                        <Card className={`card-hover ${stat.urgent ? 'border-primary ring-1 ring-primary' : ''}`}>
                            <CardContent className="p-4">
                                <div className="flex items-center gap-3">
                                    <div
                                        className={`w-12 h-12 rounded-xl ${stat.bgColor} flex items-center justify-center relative`}
                                    >
                                        <stat.icon className={`h-6 w-6 ${stat.color}`} />
                                        {stat.urgent && (
                                            <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                                        )}
                                    </div>
                                    <div>
                                        <p className="text-2xl font-bold">{stat.value}</p>
                                        <p className="text-sm text-muted-foreground">{stat.label}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </Link>
                ))}
            </div>

            <div className="grid lg:grid-cols-2 gap-8">
                {/* New Leads */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle>New Leads</CardTitle>
                            <CardDescription>Quote requests in your area</CardDescription>
                        </div>
                        <Link href="/provider/leads">
                            <Button variant="ghost" size="sm">
                                View all <ArrowRight className="h-4 w-4 ml-1" />
                            </Button>
                        </Link>
                    </CardHeader>
                    <CardContent>
                        {recentLeads.length === 0 ? (
                            <div className="text-center py-8">
                                <Inbox className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                                <p className="text-muted-foreground">No new leads right now</p>
                                <p className="text-sm text-muted-foreground mt-1">
                                    Check back soon or expand your service area
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {recentLeads.map((lead) => (
                                    <Link
                                        key={lead.id}
                                        href={`/provider/leads/${lead.quoteRequestId}`}
                                        className="block"
                                    >
                                        <div className="p-4 rounded-lg border hover:border-primary transition-colors">
                                            <div className="flex items-start justify-between">
                                                <div>
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className="text-xl">
                                                            {lead.quoteRequest.category.icon}
                                                        </span>
                                                        <h4 className="font-medium">
                                                            {lead.quoteRequest.title}
                                                        </h4>
                                                    </div>
                                                    <p className="text-sm text-muted-foreground">
                                                        {lead.quoteRequest.category.name} •{' '}
                                                        {lead.quoteRequest.postcode}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground mt-1">
                                                        {formatTimeAgo(lead.sentAt)}
                                                    </p>
                                                </div>
                                                <UrgencyBadge urgency={lead.quoteRequest.urgency} />
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Upcoming Jobs */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle>Upcoming Jobs</CardTitle>
                            <CardDescription>Your scheduled appointments</CardDescription>
                        </div>
                        <Link href="/provider/bookings">
                            <Button variant="ghost" size="sm">
                                View all <ArrowRight className="h-4 w-4 ml-1" />
                            </Button>
                        </Link>
                    </CardHeader>
                    <CardContent>
                        {upcomingBookingsList.length === 0 ? (
                            <div className="text-center py-8">
                                <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                                <p className="text-muted-foreground">No upcoming jobs</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {upcomingBookingsList.map((booking) => (
                                    <Link
                                        key={booking.id}
                                        href={`/provider/bookings/${booking.id}`}
                                        className="block"
                                    >
                                        <div className="p-4 rounded-lg border hover:border-primary transition-colors">
                                            <div className="flex items-start justify-between">
                                                <div>
                                                    <h4 className="font-medium">{booking.title}</h4>
                                                    <p className="text-sm text-muted-foreground">
                                                        {booking.customer.user.firstName}{' '}
                                                        {booking.customer.user.lastName}
                                                    </p>
                                                    <div className="flex items-center gap-4 mt-2 text-sm">
                                                        <span className="flex items-center gap-1">
                                                            <Clock className="h-4 w-4" />
                                                            {new Date(
                                                                booking.scheduledDate
                                                            ).toLocaleDateString('en-GB', {
                                                                weekday: 'short',
                                                                day: 'numeric',
                                                                month: 'short',
                                                            })}{' '}
                                                            at {booking.scheduledTime}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <span className="font-semibold">
                                                        £{booking.providerEarnings.toFixed(2)}
                                                    </span>
                                                    <StatusBadge status={booking.status} />
                                                </div>
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Performance Metrics */}
            <div className="mt-8">
                <h2 className="text-xl font-semibold mb-4">Performance</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                                    <Star className="h-5 w-5 text-amber-600" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold">
                                        {providerProfile.avgRating?.toFixed(1) || '-'}
                                    </p>
                                    <p className="text-sm text-muted-foreground">Rating</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                                    <TrendingUp className="h-5 w-5 text-green-600" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold">
                                        {providerProfile.responseRate?.toFixed(0) || 0}%
                                    </p>
                                    <p className="text-sm text-muted-foreground">Response Rate</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                                    <Clock className="h-5 w-5 text-blue-600" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold">
                                        {providerProfile.avgResponseTime
                                            ? `${providerProfile.avgResponseTime}m`
                                            : '-'}
                                    </p>
                                    <p className="text-sm text-muted-foreground">Avg Response</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                                    <Users className="h-5 w-5 text-purple-600" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold">
                                        {providerProfile.repeatCustomerRate?.toFixed(0) || 0}%
                                    </p>
                                    <p className="text-sm text-muted-foreground">Repeat Customers</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Subscription & Lead Wallet */}
            <div className="mt-8 grid md:grid-cols-2 gap-4">
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Subscription</p>
                                <p className="text-xl font-bold">{providerProfile.subscriptionTier}</p>
                                {providerProfile.subscriptionTier === 'STARTER' && (
                                    <p className="text-sm text-muted-foreground mt-1">
                                        {5 - providerProfile.leadQuotaUsed}/{5} free leads remaining
                                    </p>
                                )}
                            </div>
                            {providerProfile.subscriptionTier === 'STARTER' && (
                                <Link href="/provider/upgrade">
                                    <Button size="sm">Upgrade to Pro</Button>
                                </Link>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {providerProfile.subscriptionTier === 'STARTER' && (
                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-muted-foreground">Lead Wallet</p>
                                    <p className="text-2xl font-bold">
                                        £{providerProfile.leadWalletBalance.toFixed(2)}
                                    </p>
                                    <p className="text-sm text-muted-foreground mt-1">
                                        £3 per lead after free quota
                                    </p>
                                </div>
                                <Wallet className="h-8 w-8 text-muted-foreground" />
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
}

function StatusBadge({ status }: { status: string }) {
    const statusConfig: Record<string, { label: string; className: string }> = {
        REQUESTED: { label: 'Requested', className: 'bg-slate-100 text-slate-700' },
        ACCEPTED: { label: 'Confirmed', className: 'bg-blue-100 text-blue-700' },
        PAID: { label: 'Paid', className: 'bg-green-100 text-green-700' },
        IN_PROGRESS: { label: 'In Progress', className: 'bg-amber-100 text-amber-700' },
        COMPLETED: { label: 'Completed', className: 'bg-green-100 text-green-700' },
    };

    const config = statusConfig[status] || statusConfig.REQUESTED;

    return (
        <span
            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${config.className} mt-1`}
        >
            {config.label}
        </span>
    );
}

function UrgencyBadge({ urgency }: { urgency: string }) {
    const urgencyConfig: Record<string, { label: string; className: string }> = {
        EMERGENCY: { label: 'Emergency', className: 'bg-red-100 text-red-700' },
        URGENT: { label: 'Urgent', className: 'bg-orange-100 text-orange-700' },
        THIS_WEEK: { label: 'This Week', className: 'bg-yellow-100 text-yellow-700' },
        THIS_MONTH: { label: 'This Month', className: 'bg-blue-100 text-blue-700' },
        FLEXIBLE: { label: 'Flexible', className: 'bg-slate-100 text-slate-700' },
    };

    const config = urgencyConfig[urgency] || urgencyConfig.FLEXIBLE;

    return (
        <span
            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${config.className}`}
        >
            {config.label}
        </span>
    );
}

function formatTimeAgo(date: Date): string {
    const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);

    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
}
