export const dynamic = "force-dynamic";
import { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { getSession } from '@/lib/auth';
import { prisma } from '@service-match/db';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Calendar, MapPin, Clock, FileText, CheckCircle, Star } from 'lucide-react';
import { BookingPayment } from '@/components/bookings/BookingPayment';
import { BookingReviewButton } from '@/components/bookings/BookingReviewButton';

export const metadata: Metadata = {
    title: 'Booking Details | Serious Control',
};

export default async function BookingDetailsPage({
    params,
    searchParams
}: {
    params: { id: string },
    searchParams: { [key: string]: string | string[] | undefined }
}) {
    const session = await getSession();

    if (!session?.user) {
        redirect('/auth/signin?callbackUrl=/dashboard/bookings/' + params.id);
    }

    const customer = await prisma.customerProfile.findUnique({
        where: { userId: session.user.id },
    });

    if (!customer) {
        redirect('/');
    }

    const booking = await prisma.booking.findUnique({
        where: { id: params.id },
        include: {
            provider: true,
            service: true,
            quote: true,
            review: true,
        },
    });

    if (!booking || booking.customerId !== customer.id) {
        notFound();
    }

    const isPendingPayment = booking.status === 'ACCEPTED' && booking.paymentStatus === 'PENDING';

    return (
        <div className="container mx-auto px-4 py-8 max-w-4xl">
            <Link
                href="/dashboard/bookings"
                className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6"
            >
                <ArrowLeft className="h-4 w-4" />
                Back to Bookings
            </Link>

            <div className="grid md:grid-cols-3 gap-8">
                <div className="md:col-span-2 space-y-6">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <Badge variant={
                                booking.status === 'ACCEPTED' ? 'default' :
                                    booking.status === 'PAID' ? 'success' :
                                        booking.status === 'COMPLETED' ? 'secondary' : 'outline'
                            }>
                                {booking.status}
                            </Badge>
                            {booking.paymentStatus === 'PAID' && (
                                <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">
                                    <CheckCircle className="h-3 w-3 mr-1" />
                                    Paid
                                </Badge>
                            )}
                        </div>
                        <h1 className="text-3xl font-bold mb-4">{booking.title}</h1>
                        <p className="text-lg text-slate-700">{booking.description}</p>
                    </div>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Booking Details</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid sm:grid-cols-2 gap-4">
                                <div className="flex items-start gap-3">
                                    <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                                    <div>
                                        <p className="font-medium">Date & Time</p>
                                        <p className="text-sm text-muted-foreground">
                                            {new Date(booking.scheduledDate).toLocaleDateString()} at {booking.scheduledTime}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                                    <div>
                                        <p className="font-medium">Location</p>
                                        <p className="text-sm text-muted-foreground">
                                            {booking.addressLine1}, {booking.city}, {booking.postcode}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Provider</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-lg font-bold">
                                    {booking.provider.businessName[0]}
                                </div>
                                <div>
                                    <p className="font-medium">{booking.provider.businessName}</p>
                                    <p className="text-sm text-muted-foreground">Service Provider</p>
                                </div>
                                <Link href={`/dashboard/messages`} className="ml-auto">
                                    <Button variant="outline" size="sm">
                                        Message
                                    </Button>
                                </Link>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div>
                    {searchParams.payment === 'success' && booking.paymentStatus === 'PENDING' && (
                        <div className="mb-4 bg-blue-50 border border-blue-200 text-blue-700 p-4 rounded-lg flex items-start gap-3">
                            <Clock className="h-5 w-5 mt-0.5 animate-pulse" />
                            <div>
                                <p className="font-semibold">Processing Payment...</p>
                                <p className="text-sm">We're just confirming your payment with Stripe. This should only take a few seconds.</p>
                            </div>
                        </div>
                    )}

                    {searchParams.payment === 'cancelled' && (
                        <div className="mb-4 bg-amber-50 border border-amber-200 text-amber-700 p-4 rounded-lg flex items-start gap-3">
                            <FileText className="h-5 w-5 mt-0.5" />
                            <div>
                                <p className="font-semibold">Payment Cancelled</p>
                                <p className="text-sm">The payment process was cancelled. You can try again below.</p>
                            </div>
                        </div>
                    )}

                    <Card>
                        <CardHeader>
                            <CardTitle>Summary</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Service Cost</span>
                                    <span>£{Number(booking.subtotal).toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Booking Fee</span>
                                    <span>£{Number(booking.bookingFee).toFixed(2)}</span>
                                </div>
                                <div className="pt-2 border-t flex justify-between font-bold">
                                    <span>Total</span>
                                    <span>£{Number(booking.total).toFixed(2)}</span>
                                </div>
                            </div>

                            {isPendingPayment ? (
                                <BookingPayment
                                    bookingId={booking.id}
                                    amount={Number(booking.total)}
                                />
                            ) : booking.status === 'COMPLETED' ? (
                                <BookingReviewButton
                                    bookingId={booking.id}
                                    providerName={booking.provider.businessName}
                                    serviceName={booking.service?.name || booking.title}
                                    hasReview={!!booking.review}
                                />
                            ) : (
                                <div className="bg-green-50 p-4 rounded-lg text-center text-green-700 border border-green-200">
                                    <CheckCircle className="h-6 w-6 mx-auto mb-2" />
                                    <p className="font-medium">Booking Confirmed</p>
                                    <p className="text-sm text-green-600 mt-1">Payment successfully received</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
