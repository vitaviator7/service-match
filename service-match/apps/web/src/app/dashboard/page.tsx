import { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { prisma } from '@service-match/db';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
    FileText,
    Calendar,
    MessageSquare,
    Star,
    CreditCard,
    User,
    Plus,
    ArrowRight,
    Clock,
    CheckCircle,
    AlertCircle,
} from 'lucide-react';

export const metadata: Metadata = {
    title: 'Dashboard | ServiceMatch',
    description: 'Manage your bookings, quotes, and messages',
};

export default async function DashboardPage() {
    const session = await getSession();

    if (!session?.user) {
        redirect('/auth/signin?callbackUrl=/dashboard');
    }

    // Get customer profile with stats
    const customerProfile = await prisma.customerProfile.findUnique({
        where: { userId: session.user.id },
        include: {
            quoteRequests: {
                where: { status: 'OPEN' },
                orderBy: { createdAt: 'desc' },
                take: 3,
                include: {
                    category: true,
                    _count: { select: { quotes: true } },
                },
            },
            bookings: {
                orderBy: { scheduledDate: 'asc' },
                take: 3,
                include: {
                    provider: true,
                    service: true,
                },
            },
        },
    });

    if (!customerProfile) {
        redirect('/onboarding');
    }

    // Get stats
    const [activeQuoteRequests, upcomingBookings, pendingReviews, unreadMessages] =
        await Promise.all([
            prisma.quoteRequest.count({
                where: {
                    customerId: customerProfile.id,
                    status: { in: ['OPEN', 'QUOTES_RECEIVED'] },
                },
            }),
            prisma.booking.count({
                where: {
                    customerId: customerProfile.id,
                    status: { in: ['ACCEPTED', 'PAID'] },
                    scheduledDate: { gte: new Date() },
                },
            }),
            prisma.booking.count({
                where: {
                    customerId: customerProfile.id,
                    status: 'COMPLETED',
                    review: null,
                },
            }),
            prisma.messageThread.aggregate({
                _sum: { customerUnread: true },
                where: { customerId: customerProfile.id },
            }),
        ]);

    const stats = [
        {
            label: 'Active Quote Requests',
            value: activeQuoteRequests,
            icon: FileText,
            href: '/dashboard/quotes',
            color: 'text-blue-600',
            bgColor: 'bg-blue-50',
        },
        {
            label: 'Upcoming Bookings',
            value: upcomingBookings,
            icon: Calendar,
            href: '/dashboard/bookings',
            color: 'text-green-600',
            bgColor: 'bg-green-50',
        },
        {
            label: 'Pending Reviews',
            value: pendingReviews,
            icon: Star,
            href: '/dashboard/reviews',
            color: 'text-amber-600',
            bgColor: 'bg-amber-50',
        },
        {
            label: 'Unread Messages',
            value: unreadMessages._sum.customerUnread || 0,
            icon: MessageSquare,
            href: '/dashboard/messages',
            color: 'text-purple-600',
            bgColor: 'bg-purple-50',
        },
    ];

    return (
        <div className="container mx-auto px-4 py-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-bold">
                        Welcome back, {session.user.firstName || 'there'}!
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Here's what's happening with your service requests.
                    </p>
                </div>
                <Link href="/request">
                    <Button size="lg" className="gap-2">
                        <Plus className="h-5 w-5" />
                        New Request
                    </Button>
                </Link>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {stats.map((stat) => (
                    <Link key={stat.label} href={stat.href}>
                        <Card className="card-hover">
                            <CardContent className="p-4">
                                <div className="flex items-center gap-3">
                                    <div
                                        className={`w-12 h-12 rounded-xl ${stat.bgColor} flex items-center justify-center`}
                                    >
                                        <stat.icon className={`h-6 w-6 ${stat.color}`} />
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
                {/* Active Quote Requests */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle>Active Quote Requests</CardTitle>
                            <CardDescription>Your open requests awaiting quotes</CardDescription>
                        </div>
                        <Link href="/dashboard/quotes">
                            <Button variant="ghost" size="sm">
                                View all <ArrowRight className="h-4 w-4 ml-1" />
                            </Button>
                        </Link>
                    </CardHeader>
                    <CardContent>
                        {customerProfile.quoteRequests.length === 0 ? (
                            <div className="text-center py-8">
                                <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                                <p className="text-muted-foreground mb-4">
                                    No active quote requests
                                </p>
                                <Link href="/request">
                                    <Button variant="outline" size="sm">
                                        Get Your First Quote
                                    </Button>
                                </Link>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {customerProfile.quoteRequests.map((request) => (
                                    <Link
                                        key={request.id}
                                        href={`/dashboard/quotes/${request.id}`}
                                        className="block"
                                    >
                                        <div className="p-4 rounded-lg border hover:border-primary transition-colors">
                                            <div className="flex items-start justify-between">
                                                <div>
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className="text-xl">
                                                            {request.category.icon}
                                                        </span>
                                                        <h4 className="font-medium">
                                                            {request.title}
                                                        </h4>
                                                    </div>
                                                    <p className="text-sm text-muted-foreground">
                                                        {request.category.name} • {request.postcode}
                                                    </p>
                                                </div>
                                                <div className="text-right">
                                                    <span className="inline-flex items-center gap-1 text-sm font-medium text-green-600">
                                                        <MessageSquare className="h-4 w-4" />
                                                        {request._count.quotes} quotes
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Upcoming Bookings */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle>Upcoming Bookings</CardTitle>
                            <CardDescription>Your scheduled appointments</CardDescription>
                        </div>
                        <Link href="/dashboard/bookings">
                            <Button variant="ghost" size="sm">
                                View all <ArrowRight className="h-4 w-4 ml-1" />
                            </Button>
                        </Link>
                    </CardHeader>
                    <CardContent>
                        {customerProfile.bookings.length === 0 ? (
                            <div className="text-center py-8">
                                <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                                <p className="text-muted-foreground">No upcoming bookings</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {customerProfile.bookings.map((booking) => (
                                    <Link
                                        key={booking.id}
                                        href={`/dashboard/bookings/${booking.id}`}
                                        className="block"
                                    >
                                        <div className="p-4 rounded-lg border hover:border-primary transition-colors">
                                            <div className="flex items-start justify-between">
                                                <div>
                                                    <h4 className="font-medium">{booking.title}</h4>
                                                    <p className="text-sm text-muted-foreground">
                                                        {booking.provider.businessName}
                                                    </p>
                                                    <div className="flex items-center gap-2 mt-2 text-sm">
                                                        <Clock className="h-4 w-4" />
                                                        {new Date(
                                                            booking.scheduledDate
                                                        ).toLocaleDateString('en-GB', {
                                                            weekday: 'short',
                                                            day: 'numeric',
                                                            month: 'short',
                                                        })}{' '}
                                                        at {booking.scheduledTime}
                                                    </div>
                                                </div>
                                                <StatusBadge status={booking.status} />
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Quick Actions */}
            <div className="mt-8">
                <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                        {
                            label: 'Request a Quote',
                            icon: Plus,
                            href: '/request',
                            color: 'bg-primary text-primary-foreground',
                        },
                        {
                            label: 'Browse Services',
                            icon: FileText,
                            href: '/services',
                            color: 'bg-slate-100 text-slate-700',
                        },
                        {
                            label: 'View Messages',
                            icon: MessageSquare,
                            href: '/dashboard/messages',
                            color: 'bg-slate-100 text-slate-700',
                        },
                        {
                            label: 'Account Settings',
                            icon: User,
                            href: '/dashboard/settings',
                            color: 'bg-slate-100 text-slate-700',
                        },
                    ].map((action) => (
                        <Link key={action.label} href={action.href}>
                            <Card className={`card-hover ${action.color}`}>
                                <CardContent className="p-4 flex items-center gap-3">
                                    <action.icon className="h-5 w-5" />
                                    <span className="font-medium">{action.label}</span>
                                </CardContent>
                            </Card>
                        </Link>
                    ))}
                </div>
            </div>

            {/* Credits & Membership */}
            <div className="mt-8 grid md:grid-cols-2 gap-4">
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Credit Balance</p>
                                <p className="text-3xl font-bold">
                                    £{customerProfile.creditBalance.toFixed(2)}
                                </p>
                            </div>
                            <CreditCard className="h-8 w-8 text-muted-foreground" />
                        </div>
                        {customerProfile.cashbackBalance.toNumber() > 0 && (
                            <p className="text-sm text-green-600 mt-2">
                                + £{customerProfile.cashbackBalance.toFixed(2)} cashback available
                            </p>
                        )}
                    </CardContent>
                </Card>

                <Card
                    className={
                        customerProfile.subscriptionTier === 'PLUS'
                            ? 'border-primary bg-primary/5'
                            : ''
                    }
                >
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Membership</p>
                                <p className="text-xl font-bold">
                                    {customerProfile.subscriptionTier === 'PLUS'
                                        ? 'Plus Member'
                                        : 'Free'}
                                </p>
                            </div>
                            {customerProfile.subscriptionTier !== 'PLUS' && (
                                <Link href="/plus">
                                    <Button size="sm">Upgrade</Button>
                                </Link>
                            )}
                        </div>
                        {customerProfile.subscriptionTier === 'PLUS' && (
                            <p className="text-sm text-muted-foreground mt-2">
                                5% cashback • Priority support • Extended guarantee
                            </p>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

function StatusBadge({ status }: { status: string }) {
    const statusConfig: Record<
        string,
        { label: string; className: string; icon: typeof CheckCircle }
    > = {
        REQUESTED: {
            label: 'Requested',
            className: 'bg-slate-100 text-slate-700',
            icon: Clock,
        },
        ACCEPTED: {
            label: 'Accepted',
            className: 'bg-blue-100 text-blue-700',
            icon: CheckCircle,
        },
        PAID: {
            label: 'Paid',
            className: 'bg-green-100 text-green-700',
            icon: CheckCircle,
        },
        IN_PROGRESS: {
            label: 'In Progress',
            className: 'bg-amber-100 text-amber-700',
            icon: Clock,
        },
        COMPLETED: {
            label: 'Completed',
            className: 'bg-green-100 text-green-700',
            icon: CheckCircle,
        },
        CANCELLED: {
            label: 'Cancelled',
            className: 'bg-red-100 text-red-700',
            icon: AlertCircle,
        },
    };

    const config = statusConfig[status] || statusConfig.REQUESTED;
    const Icon = config.icon;

    return (
        <span
            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${config.className}`}
        >
            <Icon className="h-3.5 w-3.5" />
            {config.label}
        </span>
    );
}
