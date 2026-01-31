import { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { prisma } from '@service-match/db';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    AlertTriangle,
    Clock,
    CheckCircle,
    XCircle,
    MessageSquare,
    Calendar,
    DollarSign,
    User,
    Building2,
} from 'lucide-react';

export const metadata: Metadata = {
    title: 'Disputes | Admin | ServiceMatch',
    description: 'Manage and resolve customer disputes',
};

export default async function AdminDisputesPage({
    searchParams,
}: {
    searchParams: { status?: string; page?: string };
}) {
    const session = await getSession();

    if (!session?.user || session.user.role !== 'ADMIN') {
        redirect('/auth/signin?callbackUrl=/admin/disputes');
    }

    const status = searchParams.status || 'open';
    const page = parseInt(searchParams.page || '1');
    const limit = 20;

    const statusFilter = status === 'all' ? {} : { status: status.toUpperCase() as any };

    const [disputes, total, openCount, investigatingCount, resolvedCount] = await Promise.all([
        prisma.dispute.findMany({
            where: statusFilter,
            include: {
                booking: {
                    include: {
                        customer: { include: { user: true } },
                        provider: { include: { user: true } },
                        service: true,
                    },
                },
            },
            orderBy: [
                { priority: 'desc' },
                { createdAt: 'asc' },
            ],
            skip: (page - 1) * limit,
            take: limit,
        }),
        prisma.dispute.count({ where: statusFilter }),
        prisma.dispute.count({ where: { status: 'OPEN' } }),
        prisma.dispute.count({ where: { status: 'INVESTIGATING' } }),
        prisma.dispute.count({ where: { status: { in: ['RESOLVED', 'CLOSED'] } } }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold">Disputes</h1>
                    <p className="text-muted-foreground mt-1">
                        Manage and resolve customer complaints and disputes
                    </p>
                </div>
            </div>

            {/* Status Tabs */}
            <Tabs value={status} className="mb-6">
                <TabsList>
                    <TabsTrigger value="open" asChild>
                        <Link href="/admin/disputes?status=open">
                            Open
                            {openCount > 0 && (
                                <Badge variant="destructive" className="ml-2">
                                    {openCount}
                                </Badge>
                            )}
                        </Link>
                    </TabsTrigger>
                    <TabsTrigger value="investigating" asChild>
                        <Link href="/admin/disputes?status=investigating">
                            Investigating
                            {investigatingCount > 0 && (
                                <Badge variant="warning" className="ml-2">
                                    {investigatingCount}
                                </Badge>
                            )}
                        </Link>
                    </TabsTrigger>
                    <TabsTrigger value="resolved" asChild>
                        <Link href="/admin/disputes?status=resolved">Resolved</Link>
                    </TabsTrigger>
                    <TabsTrigger value="all" asChild>
                        <Link href="/admin/disputes?status=all">All</Link>
                    </TabsTrigger>
                </TabsList>
            </Tabs>

            {/* Disputes List */}
            {disputes.length === 0 ? (
                <Card>
                    <CardContent className="py-12 text-center">
                        <CheckCircle className="h-12 w-12 mx-auto text-green-500 mb-4" />
                        <h3 className="text-lg font-medium">No disputes found</h3>
                        <p className="text-muted-foreground">
                            {status === 'open'
                                ? 'Great! There are no open disputes to handle.'
                                : 'No disputes match the current filter.'}
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-4">
                    {disputes.map((dispute: any) => (
                        <DisputeCard key={dispute.id} dispute={dispute} />
                    ))}
                </div>
            )}

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
                            href={`/admin/disputes?status=${status}&page=${page - 1}`}
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
                            href={`/admin/disputes?status=${status}&page=${page + 1}`}
                        >
                            Next
                        </Link>
                    </Button>
                </div>
            )}
        </div>
    );
}

function DisputeCard({ dispute }: { dispute: any }) {
    const statusConfig: Record<
        string,
        { label: string; variant: 'default' | 'destructive' | 'warning' | 'success' }
    > = {
        OPEN: { label: 'Open', variant: 'destructive' },
        INVESTIGATING: { label: 'Investigating', variant: 'warning' },
        AWAITING_RESPONSE: { label: 'Awaiting Response', variant: 'warning' },
        RESOLVED: { label: 'Resolved', variant: 'success' },
        CLOSED: { label: 'Closed', variant: 'default' },
    };

    const priorityConfig: Record<string, { label: string; className: string }> = {
        HIGH: { label: 'High Priority', className: 'text-red-600 bg-red-50' },
        MEDIUM: { label: 'Medium', className: 'text-amber-600 bg-amber-50' },
        LOW: { label: 'Low', className: 'text-slate-600 bg-slate-50' },
    };

    const config = statusConfig[dispute.status] || statusConfig.OPEN;
    const priority = priorityConfig[dispute.priority] || priorityConfig.MEDIUM;

    const daysSinceCreated = Math.floor(
        (Date.now() - new Date(dispute.createdAt).getTime()) / (1000 * 60 * 60 * 24)
    );

    return (
        <Link href={`/admin/disputes/${dispute.id}`}>
            <Card className="card-hover">
                <CardContent className="p-6">
                    <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                                <Badge variant={config.variant as any}>{config.label}</Badge>
                                <span
                                    className={`text-xs px-2 py-0.5 rounded-full ${priority.className}`}
                                >
                                    {priority.label}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                    #{dispute.id.slice(-8)}
                                </span>
                            </div>

                            <h3 className="font-semibold text-lg mb-1">
                                {dispute.reason.replace(/_/g, ' ')}
                            </h3>
                            <p className="text-muted-foreground line-clamp-2 mb-3">
                                {dispute.description}
                            </p>

                            {/* Booking Info */}
                            <div className="flex flex-wrap gap-4 text-sm">
                                <div className="flex items-center gap-1.5">
                                    <User className="h-4 w-4 text-muted-foreground" />
                                    <span>
                                        {dispute.booking.customer.user.firstName}{' '}
                                        {dispute.booking.customer.user.lastName}
                                    </span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <Building2 className="h-4 w-4 text-muted-foreground" />
                                    <span>{dispute.booking.provider.businessName}</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                                    <span>£{dispute.booking.total.toFixed(2)}</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <Calendar className="h-4 w-4 text-muted-foreground" />
                                    <span>
                                        {new Date(dispute.booking.scheduledDate).toLocaleDateString(
                                            'en-GB',
                                            {
                                                day: 'numeric',
                                                month: 'short',
                                            }
                                        )}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="text-right shrink-0">
                            <div className="flex items-center gap-1 text-sm text-muted-foreground mb-2">
                                <Clock className="h-4 w-4" />
                                {daysSinceCreated === 0
                                    ? 'Today'
                                    : daysSinceCreated === 1
                                        ? '1 day ago'
                                        : `${daysSinceCreated} days ago`}
                            </div>
                            {dispute.refundAmount && (
                                <div className="text-lg font-semibold text-red-600">
                                    £{dispute.refundAmount.toFixed(2)}
                                    <p className="text-xs font-normal text-muted-foreground">
                                        requested refund
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* SLA Warning */}
                    {dispute.status === 'OPEN' && daysSinceCreated >= 2 && (
                        <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-lg flex items-center gap-2 text-sm">
                            <AlertTriangle className="h-4 w-4" />
                            SLA Warning: This dispute has been open for {daysSinceCreated} days
                        </div>
                    )}
                </CardContent>
            </Card>
        </Link>
    );
}
