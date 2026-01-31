export const dynamic = "force-dynamic";
import { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSession, requireAdmin } from '@/lib/auth';
import { prisma } from '@service-match/db';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Users,
    Building2,
    Calendar,
    DollarSign,
    AlertTriangle,
    TrendingUp,
    MessageSquare,
    Star,
    FileText,
    Settings,
    ShieldCheck,
    Wallet,
    ArrowUpRight,
    ArrowDownRight,
} from 'lucide-react';

export const metadata: Metadata = {
    title: 'Admin Dashboard | Serious Control',
    description: 'Platform administration and operations',
};

export default async function AdminDashboardPage() {
    const session = await getSession();

    if (!session?.user || session.user.role !== 'ADMIN') {
        redirect('/auth/signin?callbackUrl=/admin');
    }

    // Get current period dates
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    // Get key metrics
    const [
        totalUsers,
        newUsersThisMonth,
        totalProviders,
        activeProviders,
        pendingProviders,
        totalBookings,
        bookingsThisMonth,
        bookingsLastMonth,
        openDisputes,
        pendingReviews,
        revenue,
        revenueLastMonth,
    ] = await Promise.all([
        prisma.user.count(),
        prisma.user.count({ where: { createdAt: { gte: startOfMonth } } }),
        prisma.providerProfile.count(),
        prisma.providerProfile.count({ where: { status: 'ACTIVE' } }),
        prisma.providerProfile.count({ where: { status: 'PENDING' } }),
        prisma.booking.count(),
        prisma.booking.count({
            where: { createdAt: { gte: startOfMonth }, status: 'COMPLETED' },
        }),
        prisma.booking.count({
            where: {
                createdAt: { gte: startOfLastMonth, lt: endOfLastMonth },
                status: 'COMPLETED',
            },
        }),
        prisma.dispute.count({ where: { status: { in: ['OPEN', 'INVESTIGATING'] } } }),
        prisma.review.count({ where: { status: 'PENDING' } }),
        prisma.ledgerEntry.aggregate({
            _sum: { amount: true },
            where: {
                type: 'PLATFORM_FEE',
                createdAt: { gte: startOfMonth },
            },
        }),
        prisma.ledgerEntry.aggregate({
            _sum: { amount: true },
            where: {
                type: 'PLATFORM_FEE',
                createdAt: { gte: startOfLastMonth, lt: endOfLastMonth },
            },
        }),
    ]);

    // Calculate GMV and revenue
    const gmvThisMonth = await prisma.booking.aggregate({
        _sum: { total: true },
        where: {
            createdAt: { gte: startOfMonth },
            paymentStatus: 'PAID',
        },
    });

    const gmvLastMonth = await prisma.booking.aggregate({
        _sum: { total: true },
        where: {
            createdAt: { gte: startOfLastMonth, lt: endOfLastMonth },
            paymentStatus: 'PAID',
        },
    });

    const revenueValue = revenue._sum.amount?.toNumber() || 0;
    const revenueLastMonthValue = revenueLastMonth._sum.amount?.toNumber() || 0;
    const revenueChange = revenueLastMonthValue
        ? ((revenueValue - revenueLastMonthValue) / revenueLastMonthValue) * 100
        : 0;

    const bookingsChange = bookingsLastMonth
        ? ((bookingsThisMonth - bookingsLastMonth) / bookingsLastMonth) * 100
        : 0;

    // Get pending actions
    const pendingVerifications = await prisma.providerDocument.count({
        where: { status: 'PENDING' },
    });

    const pendingPayouts = await prisma.payout.count({
        where: { status: 'PENDING' },
    });

    const failedPayouts = await prisma.payout.count({
        where: { status: 'FAILED' },
    });

    return (
        <div className="container mx-auto px-4 py-8">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold">Admin Dashboard</h1>
                <p className="text-muted-foreground mt-1">Platform overview and operations</p>
            </div>

            {/* Alerts */}
            {(openDisputes > 0 || failedPayouts > 0 || pendingVerifications > 0) && (
                <div className="mb-6 grid md:grid-cols-3 gap-4">
                    {openDisputes > 0 && (
                        <Link href="/admin/disputes">
                            <Card className="border-red-200 bg-red-50 cursor-pointer hover:border-red-400 transition-colors">
                                <CardContent className="p-4 flex items-center gap-3">
                                    <AlertTriangle className="h-5 w-5 text-red-600" />
                                    <div>
                                        <p className="font-medium text-red-800">
                                            {openDisputes} Open Disputes
                                        </p>
                                        <p className="text-sm text-red-600">Require attention</p>
                                    </div>
                                </CardContent>
                            </Card>
                        </Link>
                    )}
                    {failedPayouts > 0 && (
                        <Link href="/admin/payouts?status=failed">
                            <Card className="border-amber-200 bg-amber-50 cursor-pointer hover:border-amber-400 transition-colors">
                                <CardContent className="p-4 flex items-center gap-3">
                                    <Wallet className="h-5 w-5 text-amber-600" />
                                    <div>
                                        <p className="font-medium text-amber-800">
                                            {failedPayouts} Failed Payouts
                                        </p>
                                        <p className="text-sm text-amber-600">Need retry</p>
                                    </div>
                                </CardContent>
                            </Card>
                        </Link>
                    )}
                    {pendingVerifications > 0 && (
                        <Link href="/admin/verifications">
                            <Card className="border-blue-200 bg-blue-50 cursor-pointer hover:border-blue-400 transition-colors">
                                <CardContent className="p-4 flex items-center gap-3">
                                    <ShieldCheck className="h-5 w-5 text-blue-600" />
                                    <div>
                                        <p className="font-medium text-blue-800">
                                            {pendingVerifications} Pending Verifications
                                        </p>
                                        <p className="text-sm text-blue-600">Awaiting review</p>
                                    </div>
                                </CardContent>
                            </Card>
                        </Link>
                    )}
                </div>
            )}

            {/* Key Metrics */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <MetricCard
                    title="GMV (This Month)"
                    value={`£${(gmvThisMonth._sum.total?.toNumber() || 0).toLocaleString('en-GB', { minimumFractionDigits: 2 })}`}
                    change={
                        gmvLastMonth._sum.total
                            ? ((gmvThisMonth._sum.total?.toNumber() || 0) - gmvLastMonth._sum.total.toNumber()) /
                            gmvLastMonth._sum.total.toNumber() *
                            100
                            : 0
                    }
                    icon={DollarSign}
                />
                <MetricCard
                    title="Platform Revenue"
                    value={`£${revenueValue.toLocaleString('en-GB', { minimumFractionDigits: 2 })}`}
                    change={revenueChange}
                    icon={TrendingUp}
                />
                <MetricCard
                    title="Bookings (MTD)"
                    value={bookingsThisMonth.toString()}
                    change={bookingsChange}
                    icon={Calendar}
                />
                <MetricCard
                    title="New Users (MTD)"
                    value={newUsersThisMonth.toString()}
                    subtitle={`${totalUsers.toLocaleString()} total`}
                    icon={Users}
                />
            </div>

            {/* Secondary Metrics */}
            <div className="grid grid-cols-2 lg:grid-cols-6 gap-4 mb-8">
                <StatCard
                    label="Active Providers"
                    value={activeProviders}
                    href="/admin/providers?status=active"
                />
                <StatCard
                    label="Pending Providers"
                    value={pendingProviders}
                    href="/admin/providers?status=pending"
                    urgent={pendingProviders > 0}
                />
                <StatCard
                    label="Open Disputes"
                    value={openDisputes}
                    href="/admin/disputes"
                    urgent={openDisputes > 0}
                />
                <StatCard
                    label="Pending Reviews"
                    value={pendingReviews}
                    href="/admin/reviews?status=pending"
                />
                <StatCard
                    label="Pending Payouts"
                    value={pendingPayouts}
                    href="/admin/payouts?status=pending"
                />
                <StatCard label="Total Bookings" value={totalBookings} href="/admin/bookings" />
            </div>

            {/* Quick Links Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <QuickLink
                    href="/admin/users"
                    icon={Users}
                    title="Users"
                    description="Manage customers & providers"
                />
                <QuickLink
                    href="/admin/providers"
                    icon={Building2}
                    title="Providers"
                    description="Verification & management"
                />
                <QuickLink
                    href="/admin/bookings"
                    icon={Calendar}
                    title="Bookings"
                    description="View & manage bookings"
                />
                <QuickLink
                    href="/admin/disputes"
                    icon={AlertTriangle}
                    title="Disputes"
                    description="Resolve customer issues"
                />
                <QuickLink
                    href="/admin/reviews"
                    icon={Star}
                    title="Reviews"
                    description="Moderation queue"
                />
                <QuickLink
                    href="/admin/payouts"
                    icon={Wallet}
                    title="Payouts"
                    description="Provider payouts"
                />
                <QuickLink
                    href="/admin/content"
                    icon={FileText}
                    title="Content"
                    description="SEO & marketing"
                />
                <QuickLink
                    href="/admin/settings"
                    icon={Settings}
                    title="Settings"
                    description="Platform configuration"
                />
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
}: {
    title: string;
    value: string;
    change?: number;
    subtitle?: string;
    icon: typeof DollarSign;
}) {
    const isPositive = change !== undefined && change >= 0;

    return (
        <Card>
            <CardContent className="p-6">
                <div className="flex items-start justify-between">
                    <div>
                        <p className="text-sm text-muted-foreground">{title}</p>
                        <p className="text-2xl font-bold mt-1">{value}</p>
                        {change !== undefined && (
                            <div
                                className={`flex items-center gap-1 text-sm mt-2 ${isPositive ? 'text-green-600' : 'text-red-600'
                                    }`}
                            >
                                {isPositive ? (
                                    <ArrowUpRight className="h-4 w-4" />
                                ) : (
                                    <ArrowDownRight className="h-4 w-4" />
                                )}
                                {Math.abs(change).toFixed(1)}% vs last month
                            </div>
                        )}
                        {subtitle && <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>}
                    </div>
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Icon className="h-5 w-5 text-primary" />
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

function StatCard({
    label,
    value,
    href,
    urgent,
}: {
    label: string;
    value: number;
    href: string;
    urgent?: boolean;
}) {
    return (
        <Link href={href}>
            <Card className={`card-hover ${urgent ? 'border-red-200 bg-red-50' : ''}`}>
                <CardContent className="p-4 text-center">
                    <p className={`text-2xl font-bold ${urgent ? 'text-red-700' : ''}`}>{value}</p>
                    <p className={`text-sm ${urgent ? 'text-red-600' : 'text-muted-foreground'}`}>
                        {label}
                    </p>
                </CardContent>
            </Card>
        </Link>
    );
}

function QuickLink({
    href,
    icon: Icon,
    title,
    description,
}: {
    href: string;
    icon: typeof Users;
    title: string;
    description: string;
}) {
    return (
        <Link href={href}>
            <Card className="card-hover h-full">
                <CardContent className="p-6">
                    <Icon className="h-8 w-8 text-primary mb-3" />
                    <h3 className="font-semibold">{title}</h3>
                    <p className="text-sm text-muted-foreground">{description}</p>
                </CardContent>
            </Card>
        </Link>
    );
}
