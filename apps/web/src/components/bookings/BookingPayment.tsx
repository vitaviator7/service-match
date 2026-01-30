'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { CreditCard, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface BookingPaymentProps {
    bookingId: string;
    amount: number;
}

export function BookingPayment({ bookingId, amount }: BookingPaymentProps) {
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handlePayment = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/bookings/${bookingId}/checkout`, {
                method: 'POST',
            });

            if (res.ok) {
                const { url } = await res.json();
                if (url) {
                    window.location.href = url;
                }
            } else {
                console.error('Failed to create checkout session');
            }
        } catch (error) {
            console.error('Error:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-slate-50 p-6 rounded-lg border">
            <h3 className="font-semibold mb-2">Payment Required</h3>
            <p className="text-sm text-muted-foreground mb-4">
                Please complete payment to confirm your booking.
            </p>
            <div className="flex items-center justify-between mb-6">
                <span className="text-sm font-medium">Total to pay:</span>
                <span className="text-xl font-bold">£{amount.toFixed(2)}</span>
            </div>
            <Button onClick={handlePayment} disabled={loading} className="w-full">
                {loading ? (
                    <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                    </>
                ) : (
                    <>
                        <CreditCard className="mr-2 h-4 w-4" />
                        Pay Now
                    </>
                )}
            </Button>
        </div>
    );
}
