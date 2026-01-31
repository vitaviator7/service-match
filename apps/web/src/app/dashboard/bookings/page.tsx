export const dynamic = "force-dynamic";
import { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { prisma } from '@service-match/db';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, MapPin, ArrowRight, DollarSign } from 'lucide-react';

export const metadata: Metadata = {
    title: 'My Bookings | Serious Control',
};

export default async function CustomerBookingsPage() {
    const session = await getSession();

    if (!session?.user) {
        redirect('/auth/signin?callbackUrl=/dashboard/bookings');
    }

    const customer = await prisma.customerProfile.findUnique({
        where: { userId: session.user.id },
    });

    if (!customer) {
        redirect('/');
    }

    const bookings = await prisma.booking.findMany({
        where: { customerId: customer.id },
        include: {
            provider: true,
            service: true,
        },
        orderBy: { scheduledDate: 'desc' },
    });

    return (
        <div className="container mx-auto px-4 py-8 max-w-4xl">
            <h1 className="text-3xl font-bold mb-8">My Bookings</h1>

            <div className="grid gap-4">
                {bookings.length === 0 ? (
                    <Card>
                        <CardContent className="p-8 text-center text-muted-foreground">
                            You don't have any bookings yet.
                        </CardContent>
                    </Card>
                ) : (
                    bookings.map((booking) => (
                        <Card key={booking.id} className="hover:border-primary/50 transition-colors">
                            <CardContent className="p-6">
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                    <div className="flex-1">
                                        <div className="flex items-start justify-between mb-2">
                                            <h3 className="font-semibold text-lg">
                                                {booking.title}
                                            </h3>
                                            <Badge variant={
                                                booking.status === 'ACCEPTED' ? 'default' :
                                                    booking.status === 'PAID' ? 'success' :
                                                        booking.status === 'COMPLETED' ? 'secondary' : 'outline'
                                            }>
                                                {booking.status}
                                            </Badge>
                                        </div>

                                        <p className="text-sm font-medium mb-1">
                                            Provider: {booking.provider.businessName}
                                        </p>

                                        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mt-2">
                                            <div className="flex items-center gap-1">
                                                <Calendar className="h-4 w-4" />
                                                {new Date(booking.scheduledDate).toLocaleDateString()} at {booking.scheduledTime}
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <MapPin className="h-4 w-4" />
                                                {booking.city}
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <DollarSign className="h-4 w-4" />
                                                £{Number(booking.total).toFixed(2)}
                                            </div>
                                        </div>

                                        {booking.paymentStatus === 'PENDING' && booking.status === 'ACCEPTED' && (
                                            <p className="text-sm text-amber-600 mt-2 font-medium">
                                                Payment Pending - Please pay to confirm
                                            </p>
                                        )}
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <Link href={`/dashboard/bookings/${booking.id}`}>
                                            <span className="text-sm font-medium text-primary hover:underline flex items-center">
                                                View Details <ArrowRight className="h-3 w-3 ml-1" />
                                            </span>
                                        </Link>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
}
