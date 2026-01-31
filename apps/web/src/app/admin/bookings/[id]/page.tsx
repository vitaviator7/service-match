import { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { getSession } from '@/lib/auth';
import { prisma } from '@service-match/db';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    ArrowLeft,
    Calendar,
    MapPin,
    Clock,
    User,
    Building2,
    DollarSign,
    AlertTriangle,
    CheckCircle,
    XCircle,
    History
} from 'lucide-react';
import { format } from 'date-fns';
import { AdminBookingActions } from '@/components/admin/AdminBookingActions';

export const metadata: Metadata = {
    title: 'Booking Details | Admin | Serious Control',
};

export default async function AdminBookingDetailsPage({ params }: { params: { id: string } }) {
    const session = await getSession();

    if (!session?.user || session.user.role !== 'ADMIN') {
        redirect('/auth/signin?callbackUrl=/admin/bookings/' + params.id);
    }

    const booking = await prisma.booking.findUnique({
        where: { id: params.id },
        include: {
            customer: { include: { user: true } },
            provider: { include: { user: true } },
            service: true,
            payments: true,
            refunds: true,
            ledgerEntries: true,
        },
    });

    if (!booking) {
        notFound();
    }

    return (
        <div className="container mx-auto px-4 py-8 max-w-5xl">
            <Link
                href="/admin/bookings"
                className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6"
            >
                <ArrowLeft className="h-4 w-4" />
                Back to Bookings
            </Link>

            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <Badge className="bg-slate-200 text-slate-800 hover:bg-slate-200">
                            ID: {booking.id}
                        </Badge>
                        <Badge variant={booking.status === 'PAID' || booking.status === 'COMPLETED' ? 'success' : 'outline'}>
                            {booking.status}
                        </Badge>
                        {booking.paymentStatus === 'PAID' && (
                            <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Payment: {booking.paymentStatus}
                            </Badge>
                        )}
                    </div>
                    <h1 className="text-3xl font-bold">{booking.title}</h1>
                </div>

                <div className="flex gap-2">
                    <AdminBookingActions
                        bookingId={booking.id}
                        status={booking.status}
                        paymentStatus={booking.paymentStatus}
                    />
                </div>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
                <div className="md:col-span-2 space-y-6">
                    {/* Core Info */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Booking Information</CardTitle>
                        </CardHeader>
                        <CardContent className="grid sm:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <div className="flex items-start gap-3">
                                    <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                                    <div>
                                        <p className="font-medium text-sm">Scheduled Date</p>
                                        <p className="text-slate-600">{format(new Date(booking.scheduledDate), 'PPPP')}</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <Clock className="h-5 w-5 text-muted-foreground mt-0.5" />
                                    <div>
                                        <p className="font-medium text-sm">Time Slot</p>
                                        <p className="text-slate-600">{booking.scheduledTime}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-4">
                                <div className="flex items-start gap-3">
                                    <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                                    <div>
                                        <p className="font-medium text-sm">Location</p>
                                        <p className="text-slate-600">
                                            {booking.addressLine1}<br />
                                            {booking.city}, {booking.postcode}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Participants */}
                    <div className="grid sm:grid-cols-2 gap-6">
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium flex items-center gap-2">
                                    <User className="h-4 w-4 text-muted-foreground" />
                                    Customer
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="font-bold">{booking.customer.user.firstName} {booking.customer.user.lastName}</p>
                                <p className="text-sm text-muted-foreground">{booking.customer.user.email}</p>
                                <p className="text-sm text-muted-foreground">{booking.customer.user.phone || 'No phone'}</p>
                                <Link href={`/admin/users/${booking.customer.userId}`} className="text-xs text-blue-600 hover:underline mt-2 inline-block">
                                    View Profile
                                </Link>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium flex items-center gap-2">
                                    <Building2 className="h-4 w-4 text-muted-foreground" />
                                    Provider
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="font-bold">{booking.provider.businessName}</p>
                                <p className="text-sm text-muted-foreground">{booking.provider.businessEmail || booking.provider.user.email}</p>
                                <p className="text-sm text-xs font-mono text-slate-500 mt-1">ID: {booking.providerId}</p>
                                <Link href={`/admin/providers/${booking.providerId}`} className="text-xs text-blue-600 hover:underline mt-2 inline-block">
                                    View Provider Info
                                </Link>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Financial History */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <History className="h-5 w-5" />
                                Financial Ledger
                            </CardTitle>
                            <CardDescription>All transactions related to this booking</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="border rounded-md overflow-hidden">
                                <table className="w-full text-sm">
                                    <thead className="bg-slate-50 border-b">
                                        <tr>
                                            <th className="px-4 py-2 text-left font-medium">Date</th>
                                            <th className="px-4 py-2 text-left font-medium">Description</th>
                                            <th className="px-4 py-2 text-right font-medium">Amount</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {booking.ledgerEntries.map((entry) => (
                                            <tr key={entry.id}>
                                                <td className="px-4 py-2 text-slate-500">
                                                    {format(new Date(entry.createdAt), 'MMM d, HH:mm')}
                                                </td>
                                                <td className="px-4 py-2">{entry.description}</td>
                                                <td className={`px-4 py-2 text-right font-medium ${entry.amount.toNumber() < 0 ? 'text-red-600' : 'text-slate-900'}`}>
                                                    £{entry.amount.toNumber().toFixed(2)}
                                                </td>
                                            </tr>
                                        ))}
                                        {booking.ledgerEntries.length === 0 && (
                                            <tr>
                                                <td colSpan={3} className="px-4 py-8 text-center text-slate-400 italic">
                                                    No ledger entries found
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="space-y-6">
                    {/* Financial Summary */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Financial Summary</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Subtotal</span>
                                    <span>£{booking.subtotal.toNumber().toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-sm text-red-600">
                                    <span className="">Platform Fee ({(booking.platformFeeRate.toNumber() * 100).toFixed(0)}%)</span>
                                    <span>-£{booking.platformFee.toNumber().toFixed(2)}</span>
                                </div>
                                <div className="pt-2 border-t flex justify-between font-bold text-lg">
                                    <span>Customer Paid</span>
                                    <span className="text-primary">£{booking.total.toNumber().toFixed(2)}</span>
                                </div>
                            </div>

                            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                                <div className="flex justify-between text-sm font-semibold">
                                    <span>Provider Share</span>
                                    <span className="text-green-700">£{booking.providerEarnings.toNumber().toFixed(2)}</span>
                                </div>
                                <p className="text-[10px] text-muted-foreground mt-1">
                                    Transferred to Connect Account: {booking.provider.stripeAccountId || 'N/A'}
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Stripe Details */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm">Stripe Reference</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3 font-mono text-[11px]">
                            <div>
                                <p className="text-slate-400 mb-0.5">Payment Intent ID</p>
                                <p className="break-all bg-slate-100 p-1 rounded">{booking.paymentIntentId || 'None'}</p>
                            </div>
                            <div>
                                <p className="text-slate-400 mb-0.5">Checkout Session ID</p>
                                <p className="break-all bg-slate-100 p-1 rounded">{booking.stripeCheckoutSessionId || 'None'}</p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Help/Support */}
                    <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg">
                        <h4 className="font-semibold text-amber-900 flex items-center gap-2 mb-2">
                            <AlertTriangle className="h-4 w-4" />
                            Internal Note
                        </h4>
                        <p className="text-xs text-amber-800 leading-relaxed">
                            Refunds processed here will be sent back to the customer's original payment method via Stripe.
                            Platform fees are generally not refundable once the transfer has been made.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
