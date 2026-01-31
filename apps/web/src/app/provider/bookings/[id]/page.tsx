export const dynamic = "force-dynamic";
import { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { getSession } from '@/lib/auth';
import { prisma } from '@service-match/db';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Calendar, MapPin, Clock, FileText, CheckCircle, User } from 'lucide-react';
import { CompleteBookingButton } from '@/components/provider/CompleteBookingButton';

export const metadata: Metadata = {
    title: 'Job Details | Provider | Serious Control',
};

export default async function ProviderBookingDetailsPage({ params }: { params: { id: string } }) {
    const session = await getSession();

    if (!session?.user) {
        redirect('/auth/signin?callbackUrl=/provider/bookings/' + params.id);
    }

    const provider = await prisma.providerProfile.findUnique({
        where: { userId: session.user.id },
    });

    if (!provider) {
        redirect('/');
    }

    const booking = await prisma.booking.findUnique({
        where: { id: params.id },
        include: {
            customer: { include: { user: true } },
            service: true,
            quote: true,
        },
    });

    if (!booking || booking.providerId !== provider.id) {
        notFound();
    }

    return (
        <div className="container mx-auto px-4 py-8 max-w-4xl">
            <Link
                href="/provider/bookings"
                className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6"
            >
                <ArrowLeft className="h-4 w-4" />
                Back to Jobs
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
                            <CardTitle className="text-lg">Job Details</CardTitle>
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
                            <CardTitle className="text-lg">Customer</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-lg font-bold">
                                    {booking.customer.user.firstName?.[0] || '?'}
                                </div>
                                <div>
                                    <p className="font-medium">{booking.customer.user.firstName || 'Unknown'} {booking.customer.user.lastName || ''}</p>
                                    <p className="text-sm text-muted-foreground">Customer</p>
                                </div>
                                <Link href={`/provider/messages`} className="ml-auto">
                                    <Button variant="outline" size="sm">
                                        Message
                                    </Button>
                                </Link>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div>
                    <Card>
                        <CardHeader>
                            <CardTitle>Earnings</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Total Quoted</span>
                                    <span>£{Number(booking.total).toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Platform Fee</span>
                                    <span>-£{Number(booking.platformFee).toFixed(2)}</span>
                                </div>
                                <div className="pt-2 border-t flex justify-between font-bold text-lg">
                                    <span>You Earn</span>
                                    <span>£{Number(booking.providerEarnings).toFixed(2)}</span>
                                </div>
                            </div>

                            {(booking.status === 'PAID' || booking.status === 'ACCEPTED') && (
                                <CompleteBookingButton bookingId={booking.id} />
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
