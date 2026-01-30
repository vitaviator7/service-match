'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    Calendar,
    Clock,
    MapPin,
    CreditCard,
    Shield,
    CheckCircle,
    Loader2,
    AlertTriangle,
    Star,
} from 'lucide-react';
import { formatPrice } from '@/lib/utils';

interface BookingCheckoutProps {
    quoteId: string;
    quote: {
        id: string;
        amount: number;
        serviceDescription: string;
        estimatedDuration: number;
        validUntil: Date;
        provider: {
            id: string;
            businessName: string;
            avgRating: number | null;
            totalReviews: number;
            avatarUrl?: string;
        };
    };
    service: {
        name: string;
        category: string;
    };
    customer: {
        id: string;
        postcode: string;
        address?: string;
    };
}

export default function BookingCheckout({
    quoteId,
    quote,
    service,
    customer,
}: BookingCheckoutProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [step, setStep] = useState<'schedule' | 'confirm' | 'payment'>('schedule');

    // Booking details
    const [scheduledDate, setScheduledDate] = useState('');
    const [scheduledTime, setScheduledTime] = useState('');
    const [address, setAddress] = useState(customer.address || '');
    const [notes, setNotes] = useState('');

    // Calculate fees
    const platformFeeRate = 0.18; // 18%
    const platformFee = quote.amount * platformFeeRate;
    const total = quote.amount;

    const isQuoteExpired = new Date(quote.validUntil) < new Date();

    const handleCreateBooking = async () => {
        if (!scheduledDate || !scheduledTime || !address) {
            setError('Please fill in all required fields');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const response = await fetch('/api/bookings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    quoteId,
                    scheduledDate,
                    scheduledTime,
                    address,
                    notes,
                }),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Failed to create booking');
            }

            const { bookingId, checkoutUrl } = await response.json();

            // Redirect to Stripe checkout
            if (checkoutUrl) {
                window.location.href = checkoutUrl;
            } else {
                router.push(`/dashboard/bookings/${bookingId}?success=true`);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Something went wrong');
            setLoading(false);
        }
    };

    if (isQuoteExpired) {
        return (
            <Card className="max-w-lg mx-auto">
                <CardContent className="py-12 text-center">
                    <AlertTriangle className="h-12 w-12 mx-auto text-amber-500 mb-4" />
                    <h2 className="text-xl font-bold mb-2">Quote Expired</h2>
                    <p className="text-muted-foreground mb-4">
                        This quote has expired. Please request a new quote from the provider.
                    </p>
                    <Button asChild>
                        <Link href="/request">Request New Quote</Link>
                    </Button>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 py-8">
            <div className="container mx-auto px-4 max-w-4xl">
                <h1 className="text-2xl font-bold mb-6">Complete Your Booking</h1>

                <div className="grid lg:grid-cols-3 gap-6">
                    {/* Main Form */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Provider Card */}
                        <Card>
                            <CardContent className="p-6">
                                <div className="flex items-center gap-4">
                                    <div className="w-16 h-16 rounded-lg bg-primary/10 overflow-hidden">
                                        {quote.provider.avatarUrl ? (
                                            <img
                                                src={quote.provider.avatarUrl}
                                                alt={quote.provider.businessName}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-primary text-xl font-bold">
                                                {quote.provider.businessName[0]}
                                            </div>
                                        )}
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-lg">
                                            {quote.provider.businessName}
                                        </h3>
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                            <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                                            {quote.provider.avgRating?.toFixed(1) || 'New'}
                                            <span>({quote.provider.totalReviews} reviews)</span>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Schedule */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Calendar className="h-5 w-5" />
                                    Schedule Your Appointment
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium mb-2">
                                            Date *
                                        </label>
                                        <Input
                                            type="date"
                                            value={scheduledDate}
                                            onChange={(e) => setScheduledDate(e.target.value)}
                                            min={new Date().toISOString().split('T')[0]}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-2">
                                            Time *
                                        </label>
                                        <select
                                            value={scheduledTime}
                                            onChange={(e) => setScheduledTime(e.target.value)}
                                            className="w-full h-10 px-3 rounded-md border border-input bg-background"
                                        >
                                            <option value="">Select time</option>
                                            <option value="08:00">8:00 AM</option>
                                            <option value="09:00">9:00 AM</option>
                                            <option value="10:00">10:00 AM</option>
                                            <option value="11:00">11:00 AM</option>
                                            <option value="12:00">12:00 PM</option>
                                            <option value="13:00">1:00 PM</option>
                                            <option value="14:00">2:00 PM</option>
                                            <option value="15:00">3:00 PM</option>
                                            <option value="16:00">4:00 PM</option>
                                            <option value="17:00">5:00 PM</option>
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-2">
                                        Address *
                                    </label>
                                    <Input
                                        value={address}
                                        onChange={(e) => setAddress(e.target.value)}
                                        placeholder="Full address for the service"
                                    />
                                    <p className="text-xs text-muted-foreground mt-1">
                                        Postcode: {customer.postcode}
                                    </p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-2">
                                        Notes for Provider (optional)
                                    </label>
                                    <textarea
                                        value={notes}
                                        onChange={(e) => setNotes(e.target.value)}
                                        placeholder="Any additional instructions or access information..."
                                        className="w-full min-h-[80px] p-3 rounded-md border border-input bg-background"
                                    />
                                </div>
                            </CardContent>
                        </Card>

                        {/* Service Details */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Service Details</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Service</span>
                                        <span className="font-medium">{service.name}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Category</span>
                                        <span>{service.category}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">
                                            Estimated Duration
                                        </span>
                                        <span>{quote.estimatedDuration} hours</span>
                                    </div>
                                    {quote.serviceDescription && (
                                        <div className="pt-3 border-t">
                                            <p className="text-sm text-muted-foreground">
                                                {quote.serviceDescription}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Order Summary */}
                    <div className="lg:col-span-1">
                        <Card className="sticky top-4">
                            <CardHeader>
                                <CardTitle>Order Summary</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span>Service fee</span>
                                        <span>{formatPrice(quote.amount)}</span>
                                    </div>
                                    <div className="flex justify-between text-xs text-muted-foreground">
                                        <span>Includes platform fee (18%)</span>
                                        <span>{formatPrice(platformFee)}</span>
                                    </div>
                                </div>

                                <div className="border-t pt-4">
                                    <div className="flex justify-between font-semibold text-lg">
                                        <span>Total</span>
                                        <span>{formatPrice(total)}</span>
                                    </div>
                                </div>

                                {error && (
                                    <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm flex items-center gap-2">
                                        <AlertTriangle className="h-4 w-4" />
                                        {error}
                                    </div>
                                )}

                                <Button
                                    className="w-full"
                                    size="lg"
                                    onClick={handleCreateBooking}
                                    disabled={loading || !scheduledDate || !scheduledTime || !address}
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                            Processing...
                                        </>
                                    ) : (
                                        <>
                                            <CreditCard className="h-4 w-4 mr-2" />
                                            Pay {formatPrice(total)}
                                        </>
                                    )}
                                </Button>

                                <div className="space-y-2 pt-4 text-xs text-muted-foreground">
                                    <div className="flex items-center gap-2">
                                        <Shield className="h-4 w-4 text-green-500" />
                                        Secure payment via Stripe
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <CheckCircle className="h-4 w-4 text-green-500" />
                                        Free cancellation up to 24h before
                                    </div>
                                </div>

                                <p className="text-xs text-muted-foreground text-center pt-2">
                                    By confirming, you agree to our{' '}
                                    <Link href="/terms" className="underline">
                                        Terms of Service
                                    </Link>
                                </p>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
}
