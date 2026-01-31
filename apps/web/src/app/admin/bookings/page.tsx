import { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { prisma } from '@service-match/db';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    Calendar,
    Search,
    DollarSign,
    Clock,
    CheckCircle,
    XCircle,
    AlertTriangle,
    User,
    Building2,
} from 'lucide-react';

export const metadata: Metadata = {
    title: 'Bookings | Admin | ServiceMatch',
    description: 'Manage all bookings on the platform',
};

export default async function AdminBookingsPage({
    searchParams,
}: {
    searchParams: { status?: string; search?: string; page?: string; from?: string; to?: string };
}) {
    const session = await getSession();

    if (!session?.user || session.user.role !== 'ADMIN') {
        redirect('/auth/signin?callbackUrl=/admin/bookings');
    }

    const status = searchParams.status || 'all';
    const search = searchParams.search || '';
    const page = parseInt(searchParams.page || '1');
    const limit = 25;

    const where: any = {};

    if (status !== 'all') {
        where.status = status.toUpperCase();
    }
    if (search) {
        where.OR = [
            { reference: { contains: search, mode: 'insensitive' } },
            { provider: { businessName: { contains: search, mode: 'insensitive' } } },
            { customer: { user: { email: { contains: search, mode: 'insensitive' } } } },
        ];
    }
    if (searchParams.from) {
        where.scheduledDate = { gte: new Date(searchParams.from) };
    }
    if (searchParams.to) {
        where.scheduledDate = {
            ...(where.scheduledDate || {}),
            lte: new Date(searchParams.to),
        };
    }

    const [bookings, total] = await Promise.all([
        prisma.booking.findMany({
            where,
            include: {
                customer: { include: { user: true } },
                provider: true,
                service: true,
            },
            orderBy: { createdAt: 'desc' },
            skip: (page - 1) * limit,
            take: limit,
        }),
        prisma.booking.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    // Stats
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    const [
        totalBookings,
        confirmedBookings,
        completedBookings,
        monthlyRevenue,
    ] = await Promise.all([
        prisma.booking.count(),
        prisma.booking.count({ where: { status: 'CONFIRMED' } }),
        prisma.booking.count({ where: { status: 'COMPLETED' } }),
        prisma.booking.aggregate({
            where: {
                status: 'COMPLETED',
                completedAt: { gte: startOfMonth },
            },
            _sum: { total: true },
        }),
    ]);

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold">Bookings</h1>
                    <p className="text-muted-foreground mt-1">
                        View and manage all platform bookings
                    </p>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <Card>
                    <CardContent className="p-4">
                        <div className="text-2xl font-bold">
                            {totalBookings.toLocaleString()}
                        </div>
                        <p className="text-sm text-muted-foreground">Total Bookings</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <div className="text-2xl font-bold text-blue-600">
                            {confirmedBookings.toLocaleString()}
                        </div>
                        <p className="text-sm text-muted-foreground">Confirmed</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <div className="text-2xl font-bold text-green-600">
                            {completedBookings.toLocaleString()}
                        </div>
                        <p className="text-sm text-muted-foreground">Completed</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <div className="text-2xl font-bold text-emerald-600">
                            £{(((monthlyRevenue as any)._sum.total || 0) / 100).toLocaleString()}
                        </div>
                        <p className="text-sm text-muted-foreground">This Month</p>
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
                                    placeholder="Search by reference, provider, or customer..."
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
                            <option value="pending">Pending</option>
                            <option value="confirmed">Confirmed</option>
                            <option value="in_progress">In Progress</option>
                            <option value="completed">Completed</option>
                            <option value="cancelled">Cancelled</option>
                        </select>
                        <input
                            type="date"
                            name="from"
                            defaultValue={searchParams.from}
                            className="px-3 py-2 border rounded-lg"
                            placeholder="From"
                        />
                        <input
                            type="date"
                            name="to"
                            defaultValue={searchParams.to}
                            className="px-3 py-2 border rounded-lg"
                            placeholder="To"
                        />
                        <Button type="submit">Filter</Button>
                    </form>
                </CardContent>
            </Card>

            {/* Bookings Table */}
            <Card>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="border-b bg-slate-50">
                            <tr>
                                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                                    Reference
                                </th>
                                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                                    Customer
                                </th>
                                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                                    Provider
                                </th>
                                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                                    Service
                                </th>
                                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                                    Date
                                </th>
                                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                                    Amount
                                </th>
                                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                                    Status
                                </th>
                                <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {bookings.map((booking: any) => (
                                <tr key={booking.id} className="hover:bg-slate-50">
                                    <td className="px-4 py-4">
                                        <span className="font-mono text-sm">
                                            {booking.reference}
                                        </span>
                                    </td>
                                    <td className="px-4 py-4">
                                        <div className="flex items-center gap-2">
                                            <User className="h-4 w-4 text-muted-foreground" />
                                            <span className="text-sm">
                                                {booking.customer.user.email}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-4">
                                        <div className="flex items-center gap-2">
                                            <Building2 className="h-4 w-4 text-muted-foreground" />
                                            <span className="text-sm">
                                                {booking.provider.businessName}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-4 text-sm">
                                        {booking.service?.name || 'N/A'}
                                    </td>
                                    <td className="px-4 py-4 text-sm">
                                        {booking.scheduledDate
                                            ? new Date(booking.scheduledDate).toLocaleDateString(
                                                'en-GB',
                                                {
                                                    day: 'numeric',
                                                    month: 'short',
                                                    year: 'numeric',
                                                }
                                            )
                                            : 'TBD'}
                                    </td>
                                    <td className="px-4 py-4 font-medium">
                                        £{(booking.total / 100).toFixed(2)}
                                    </td>
                                    <td className="px-4 py-4">
                                        <BookingStatusBadge status={booking.status} />
                                    </td>
                                    <td className="px-4 py-4 text-right">
                                        <Link href={`/admin/bookings/${booking.id}`}>
                                            <Button variant="ghost" size="sm">
                                                View
                                            </Button>
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-between p-4 border-t">
                        <p className="text-sm text-muted-foreground">
                            Showing {(page - 1) * limit + 1} to{' '}
                            {Math.min(page * limit, total)} of {total}
                        </p>
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={page === 1}
                                asChild
                            >
                                <Link
                                    href={`/admin/bookings?status=${status}&search=${search}&page=${page - 1}`}
                                >
                                    Previous
                                </Link>
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={page === totalPages}
                                asChild
                            >
                                <Link
                                    href={`/admin/bookings?status=${status}&search=${search}&page=${page + 1}`}
                                >
                                    Next
                                </Link>
                            </Button>
                        </div>
                    </div>
                )}
            </Card>
        </div>
    );
}

function BookingStatusBadge({ status }: { status: string }) {
    const config: Record<
        string,
        { label: string; className: string; icon: React.ElementType }
    > = {
        PENDING: {
            label: 'Pending',
            className: 'bg-amber-100 text-amber-700',
            icon: Clock,
        },
        CONFIRMED: {
            label: 'Confirmed',
            className: 'bg-blue-100 text-blue-700',
            icon: CheckCircle,
        },
        IN_PROGRESS: {
            label: 'In Progress',
            className: 'bg-purple-100 text-purple-700',
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
            icon: XCircle,
        },
    };

    const { label, className, icon: Icon } = config[status] || config.PENDING;

    return (
        <span
            className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${className}`}
        >
            <Icon className="h-3 w-3" />
            {label}
        </span>
    );
}
