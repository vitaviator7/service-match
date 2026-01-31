import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { prisma } from '@service-match/db';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    DollarSign,
    TrendingUp,
    TrendingDown,
    Users,
    Building2,
    Calendar,
    Star,
    ArrowUpRight,
    ArrowDownRight,
} from 'lucide-react';

export const metadata: Metadata = {
    title: 'Reports | Admin | Serious Control',
    description: 'Platform analytics and reporting',
};

export default async function AdminReportsPage() {
    const session = await getSession();

    if (!session?.user || session.user.role !== 'ADMIN') {
        redirect('/auth/signin?callbackUrl=/admin/reports');
    }

    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const startOfLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const endOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 0);
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());

    // Revenue metrics
    const [thisMonthRevenue, lastMonthRevenue, thisMonthPlatformFees] = await Promise.all([
        prisma.booking.aggregate({
            where: {
                status: 'COMPLETED',
                completedAt: { gte: startOfMonth },
            },
            _sum: { totalAmount: true },
        }),
        prisma.booking.aggregate({
            where: {
                status: 'COMPLETED',
                completedAt: { gte: startOfLastMonth, lte: endOfLastMonth },
            },
            _sum: { totalAmount: true },
        }),
        prisma.booking.aggregate({
            where: {
                status: 'COMPLETED',
                completedAt: { gte: startOfMonth },
            },
            _sum: { platformFee: true },
        }),
    ]);

    // Booking metrics
    const [
        thisMonthBookings,
        lastMonthBookings,
        cancelledBookings,
        avgBookingValue,
    ] = await Promise.all([
        prisma.booking.count({
            where: { createdAt: { gte: startOfMonth } },
        }),
        prisma.booking.count({
            where: { createdAt: { gte: startOfLastMonth, lte: endOfLastMonth } },
        }),
        prisma.booking.count({
            where: { status: 'CANCELLED', createdAt: { gte: startOfMonth } },
        }),
        prisma.booking.aggregate({
            where: { status: 'COMPLETED' },
            _avg: { totalAmount: true },
        }),
    ]);

    // User metrics
    const [newUsers, newProviders, newCustomers] = await Promise.all([
        prisma.user.count({ where: { createdAt: { gte: startOfMonth } } }),
        prisma.providerProfile.count({ where: { createdAt: { gte: startOfMonth } } }),
        prisma.customerProfile.count({ where: { createdAt: { gte: startOfMonth } } }),
    ]);

    // Review metrics
    const [totalReviews, avgRating] = await Promise.all([
        prisma.review.count({ where: { createdAt: { gte: startOfMonth } } }),
        prisma.review.aggregate({
            where: { createdAt: { gte: startOfMonth } },
            _avg: { overallRating: true },
        }),
    ]);

    // Quote metrics
    const [quoteRequests, quotesSubmitted, conversionRate] = await Promise.all([
        prisma.quoteRequest.count({ where: { createdAt: { gte: startOfMonth } } }),
        prisma.quote.count({ where: { createdAt: { gte: startOfMonth } } }),
        prisma.quoteRequest.count({
            where: {
                createdAt: { gte: startOfMonth },
                status: 'COMPLETED',
            },
        }),
    ]);

    // Top categories
    const topCategories = await prisma.quoteRequest.groupBy({
        by: ['categoryId'],
        where: { createdAt: { gte: startOfMonth } },
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: 5,
    });

    const categories = await prisma.category.findMany({
        where: { id: { in: topCategories.map((c) => c.categoryId) } },
    });

    const topCategoriesWithNames = topCategories.map((tc) => ({
        name: categories.find((c) => c.id === tc.categoryId)?.name || 'Unknown',
        count: tc._count.id,
    }));

    // Top providers
    const topProviders = await prisma.providerProfile.findMany({
        orderBy: { totalBookings: 'desc' },
        take: 5,
        select: {
            businessName: true,
            totalBookings: true,
            avgRating: true,
            totalRevenue: true,
        },
    });

    // Calculate changes
    const revenueChange =
        lastMonthRevenue._sum.totalAmount && lastMonthRevenue._sum.totalAmount > 0
            ? (((thisMonthRevenue._sum.totalAmount || 0) - lastMonthRevenue._sum.totalAmount) /
                lastMonthRevenue._sum.totalAmount) *
            100
            : 0;

    const bookingsChange =
        lastMonthBookings > 0
            ? ((thisMonthBookings - lastMonthBookings) / lastMonthBookings) * 100
            : 0;

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold">Reports & Analytics</h1>
                <p className="text-muted-foreground mt-1">
                    Platform performance overview for {today.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}
                </p>
            </div>

            {/* Revenue Section */}
            <section className="mb-8">
                <h2 className="text-xl font-semibold mb-4">Revenue</h2>
                <div className="grid md:grid-cols-4 gap-4">
                    <MetricCard
                        title="Gross Revenue"
                        value={`£${((thisMonthRevenue._sum.totalAmount || 0) / 100).toLocaleString()}`}
                        change={revenueChange}
                        icon={DollarSign}
                    />
                    <MetricCard
                        title="Platform Fees"
                        value={`£${((thisMonthPlatformFees._sum.platformFee || 0) / 100).toLocaleString()}`}
                        icon={TrendingUp}
                    />
                    <MetricCard
                        title="Avg Booking Value"
                        value={`£${((avgBookingValue._avg.totalAmount || 0) / 100).toFixed(2)}`}
                        icon={DollarSign}
                    />
                    <MetricCard
                        title="Last Month"
                        value={`£${((lastMonthRevenue._sum.totalAmount || 0) / 100).toLocaleString()}`}
                        subtitle="Comparison"
                        icon={Calendar}
                    />
                </div>
            </section>

            {/* Bookings Section */}
            <section className="mb-8">
                <h2 className="text-xl font-semibold mb-4">Bookings</h2>
                <div className="grid md:grid-cols-4 gap-4">
                    <MetricCard
                        title="Total Bookings"
                        value={thisMonthBookings.toLocaleString()}
                        change={bookingsChange}
                        icon={Calendar}
                    />
                    <MetricCard
                        title="Cancelled"
                        value={cancelledBookings.toLocaleString()}
                        subtitle={`${((cancelledBookings / thisMonthBookings) * 100 || 0).toFixed(1)}% rate`}
                        icon={Calendar}
                        negative
                    />
                    <MetricCard
                        title="Quote Requests"
                        value={quoteRequests.toLocaleString()}
                        icon={Calendar}
                    />
                    <MetricCard
                        title="Conversion Rate"
                        value={`${((conversionRate / quoteRequests) * 100 || 0).toFixed(1)}%`}
                        subtitle="Requests → Bookings"
                        icon={TrendingUp}
                    />
                </div>
            </section>

            {/* Users Section */}
            <section className="mb-8">
                <h2 className="text-xl font-semibold mb-4">Users</h2>
                <div className="grid md:grid-cols-4 gap-4">
                    <MetricCard
                        title="New Users"
                        value={newUsers.toLocaleString()}
                        subtitle="This month"
                        icon={Users}
                    />
                    <MetricCard
                        title="New Customers"
                        value={newCustomers.toLocaleString()}
                        icon={Users}
                    />
                    <MetricCard
                        title="New Providers"
                        value={newProviders.toLocaleString()}
                        icon={Building2}
                    />
                    <MetricCard
                        title="New Reviews"
                        value={totalReviews.toLocaleString()}
                        subtitle={`${(avgRating._avg.overallRating || 0).toFixed(1)} avg`}
                        icon={Star}
                    />
                </div>
            </section>

            {/* Detailed Analytics */}
            <div className="grid lg:grid-cols-2 gap-6">
                {/* Top Categories */}
                <Card>
                    <CardHeader>
                        <CardTitle>Top Categories</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {topCategoriesWithNames.map((category, index) => (
                                <div key={index} className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-sm flex items-center justify-center font-medium">
                                            {index + 1}
                                        </span>
                                        <span>{category.name}</span>
                                    </div>
                                    <span className="font-medium">{category.count} requests</span>
                                </div>
                            ))}
                            {topCategoriesWithNames.length === 0 && (
                                <p className="text-muted-foreground text-center py-4">
                                    No data available
                                </p>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Top Providers */}
                <Card>
                    <CardHeader>
                        <CardTitle>Top Providers</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {topProviders.map((provider, index) => (
                                <div key={index} className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-sm flex items-center justify-center font-medium">
                                            {index + 1}
                                        </span>
                                        <div>
                                            <p className="font-medium">{provider.businessName}</p>
                                            <p className="text-sm text-muted-foreground">
                                                {provider.avgRating?.toFixed(1) || '-'} ⭐ · {provider.totalBookings} bookings
                                            </p>
                                        </div>
                                    </div>
                                    <span className="font-medium text-green-600">
                                        £{((provider.totalRevenue || 0) / 100).toLocaleString()}
                                    </span>
                                </div>
                            ))}
                            {topProviders.length === 0 && (
                                <p className="text-muted-foreground text-center py-4">
                                    No data available
                                </p>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

function MetricCard({
    title,
    value,
    change,
    subtitle,
    icon: Icon,
    negative,
}: {
    title: string;
    value: string;
    change?: number;
    subtitle?: string;
    icon: React.ElementType;
    negative?: boolean;
}) {
    const isPositive = change !== undefined && change > 0;
    const isNegative = change !== undefined && change < 0;

    return (
        <Card>
            <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                    <span className="text-sm text-muted-foreground">{title}</span>
                    <Icon className={`h-4 w-4 ${negative ? 'text-red-500' : 'text-muted-foreground'}`} />
                </div>
                <div className="text-2xl font-bold">{value}</div>
                {change !== undefined && (
                    <div className={`flex items-center gap-1 mt-1 text-sm ${isPositive ? 'text-green-600' : isNegative ? 'text-red-600' : 'text-muted-foreground'}`}>
                        {isPositive ? (
                            <ArrowUpRight className="h-4 w-4" />
                        ) : isNegative ? (
                            <ArrowDownRight className="h-4 w-4" />
                        ) : null}
                        {Math.abs(change).toFixed(1)}% vs last month
                    </div>
                )}
                {subtitle && !change && (
                    <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
                )}
            </CardContent>
        </Card>
    );
}
