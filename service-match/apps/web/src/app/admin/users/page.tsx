export const dynamic = "force-dynamic";
import { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { prisma } from '@service-match/db';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    Users,
    Search,
    MoreVertical,
    Mail,
    Phone,
    Calendar,
    Shield,
    AlertTriangle,
    CheckCircle,
    XCircle,
} from 'lucide-react';

export const metadata: Metadata = {
    title: 'Users | Admin | Serious Control',
    description: 'Manage users on the platform',
};

export default async function AdminUsersPage({
    searchParams,
}: {
    searchParams: { role?: string; status?: string; search?: string; page?: string };
}) {
    const session = await getSession();

    if (!session?.user || session.user.role !== 'ADMIN') {
        redirect('/auth/signin?callbackUrl=/admin/users');
    }

    const role = searchParams.role || 'all';
    const status = searchParams.status || 'all';
    const search = searchParams.search || '';
    const page = parseInt(searchParams.page || '1');
    const limit = 25;

    const where: any = {};

    if (role !== 'all') {
        where.role = role.toUpperCase();
    }
    if (status !== 'all') {
        where.status = status.toUpperCase();
    }
    if (search) {
        where.OR = [
            { email: { contains: search, mode: 'insensitive' } },
            { firstName: { contains: search, mode: 'insensitive' } },
            { lastName: { contains: search, mode: 'insensitive' } },
        ];
    }

    const [users, total] = await Promise.all([
        prisma.user.findMany({
            where,
            include: {
                customerProfile: true,
                providerProfile: true,
            },
            orderBy: { createdAt: 'desc' },
            skip: (page - 1) * limit,
            take: limit,
        }),
        prisma.user.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    // Stats
    const [totalUsers, totalCustomers, totalProviders, totalAdmins] = await Promise.all([
        prisma.user.count(),
        prisma.user.count({ where: { role: 'CUSTOMER' } }),
        prisma.user.count({ where: { role: 'PROVIDER' } }),
        prisma.user.count({ where: { role: 'ADMIN' } }),
    ]);

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold">Users</h1>
                    <p className="text-muted-foreground mt-1">
                        Manage customers, providers, and admins
                    </p>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <Card>
                    <CardContent className="p-4">
                        <div className="text-2xl font-bold">{totalUsers.toLocaleString()}</div>
                        <p className="text-sm text-muted-foreground">Total Users</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <div className="text-2xl font-bold">{totalCustomers.toLocaleString()}</div>
                        <p className="text-sm text-muted-foreground">Customers</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <div className="text-2xl font-bold">{totalProviders.toLocaleString()}</div>
                        <p className="text-sm text-muted-foreground">Providers</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <div className="text-2xl font-bold">{totalAdmins.toLocaleString()}</div>
                        <p className="text-sm text-muted-foreground">Admins</p>
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
                                    placeholder="Search by email or name..."
                                    className="w-full pl-10 pr-4 py-2 border rounded-lg"
                                />
                            </div>
                        </div>
                        <select
                            name="role"
                            defaultValue={role}
                            className="px-3 py-2 border rounded-lg"
                        >
                            <option value="all">All Roles</option>
                            <option value="customer">Customers</option>
                            <option value="provider">Providers</option>
                            <option value="admin">Admins</option>
                        </select>
                        <select
                            name="status"
                            defaultValue={status}
                            className="px-3 py-2 border rounded-lg"
                        >
                            <option value="all">All Statuses</option>
                            <option value="active">Active</option>
                            <option value="suspended">Suspended</option>
                            <option value="deactivated">Deactivated</option>
                        </select>
                        <Button type="submit">Filter</Button>
                    </form>
                </CardContent>
            </Card>

            {/* Users Table */}
            <Card>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="border-b bg-slate-50">
                            <tr>
                                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                                    User
                                </th>
                                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                                    Role
                                </th>
                                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                                    Status
                                </th>
                                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                                    Joined
                                </th>
                                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                                    Last Login
                                </th>
                                <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {users.map((user) => (
                                <tr key={user.id} className="hover:bg-slate-50">
                                    <td className="px-4 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                                {user.avatarUrl ? (
                                                    <img
                                                        src={user.avatarUrl}
                                                        alt=""
                                                        className="w-full h-full rounded-full object-cover"
                                                    />
                                                ) : (
                                                    <span className="text-primary font-medium">
                                                        {user.firstName?.[0] || user.email[0].toUpperCase()}
                                                    </span>
                                                )}
                                            </div>
                                            <div>
                                                <p className="font-medium">
                                                    {user.firstName
                                                        ? `${user.firstName} ${user.lastName || ''}`
                                                        : user.email}
                                                </p>
                                                <p className="text-sm text-muted-foreground">
                                                    {user.email}
                                                </p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-4">
                                        <RoleBadge role={user.role} />
                                    </td>
                                    <td className="px-4 py-4">
                                        <StatusBadge status={user.status} />
                                    </td>
                                    <td className="px-4 py-4 text-sm text-muted-foreground">
                                        {new Date(user.createdAt).toLocaleDateString('en-GB', {
                                            day: 'numeric',
                                            month: 'short',
                                            year: 'numeric',
                                        })}
                                    </td>
                                    <td className="px-4 py-4 text-sm text-muted-foreground">
                                        {user.lastLoginAt
                                            ? new Date(user.lastLoginAt).toLocaleDateString('en-GB', {
                                                day: 'numeric',
                                                month: 'short',
                                                year: 'numeric',
                                            })
                                            : 'Never'}
                                    </td>
                                    <td className="px-4 py-4 text-right">
                                        <Link href={`/admin/users/${user.id}`}>
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
                                    href={`/admin/users?role=${role}&status=${status}&search=${search}&page=${page - 1}`}
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
                                    href={`/admin/users?role=${role}&status=${status}&search=${search}&page=${page + 1}`}
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

function RoleBadge({ role }: { role: string }) {
    const config: Record<string, { label: string; className: string }> = {
        CUSTOMER: { label: 'Customer', className: 'bg-blue-100 text-blue-700' },
        PROVIDER: { label: 'Provider', className: 'bg-purple-100 text-purple-700' },
        ADMIN: { label: 'Admin', className: 'bg-red-100 text-red-700' },
    };

    const { label, className } = config[role] || config.CUSTOMER;

    return (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${className}`}>
            {label}
        </span>
    );
}

function StatusBadge({ status }: { status: string }) {
    const config: Record<string, { icon: React.ElementType; className: string }> = {
        ACTIVE: { icon: CheckCircle, className: 'text-green-600' },
        SUSPENDED: { icon: AlertTriangle, className: 'text-amber-600' },
        DEACTIVATED: { icon: XCircle, className: 'text-red-600' },
    };

    const { icon: Icon, className } = config[status] || config.ACTIVE;

    return (
        <span className={`flex items-center gap-1 text-sm ${className}`}>
            <Icon className="h-4 w-4" />
            {status.charAt(0) + status.slice(1).toLowerCase()}
        </span>
    );
}
