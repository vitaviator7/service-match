'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    XCircle,
    RotateCcw,
    Loader2,
    AlertCircle,
    CheckCircle
} from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
    DialogTrigger
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

interface AdminBookingActionsProps {
    bookingId: string;
    status: string;
    paymentStatus: string;
}

export function AdminBookingActions({ bookingId, status, paymentStatus }: AdminBookingActionsProps) {
    const router = useRouter();
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [refundAmount, setRefundAmount] = useState('');
    const [refundReason, setRefundReason] = useState('');
    const [isRefundOpen, setIsRefundOpen] = useState(false);

    const handleRefund = async () => {
        if (!refundAmount || isNaN(Number(refundAmount))) {
            toast({ title: 'Invalid amount', variant: 'destructive' });
            return;
        }

        setLoading(true);
        try {
            const res = await fetch(`/api/admin/bookings/${bookingId}/refund`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    amount: Number(refundAmount),
                    reason: refundReason,
                }),
            });

            const data = await res.json();

            if (res.ok) {
                toast({
                    title: 'Refund successful',
                    description: `Successfully refunded £${Number(refundAmount).toFixed(2)}`,
                });
                setIsRefundOpen(false);
                router.refresh();
            } else {
                toast({
                    title: 'Refund failed',
                    description: data.error || 'Something went wrong',
                    variant: 'destructive',
                });
            }
        } catch (error) {
            toast({
                title: 'Refund error',
                description: 'Failed to communicate with the server',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = async () => {
        if (!confirm('Are you sure you want to cancel this booking as an administrator?')) return;

        setLoading(true);
        try {
            const res = await fetch(`/api/admin/bookings/${bookingId}/cancel`, {
                method: 'POST',
            });

            if (res.ok) {
                toast({ title: 'Booking cancelled' });
                router.refresh();
            } else {
                toast({ title: 'Cancellation failed', variant: 'destructive' });
            }
        } catch (error) {
            toast({ title: 'Error cancelling booking', variant: 'destructive' });
        } finally {
            setLoading(false);
        }
    };

    const canRefund = paymentStatus === 'PAID' || paymentStatus === 'PARTIALLY_REFUNDED';
    const canCancel = status !== 'CANCELLED' && status !== 'COMPLETED';

    return (
        <div className="flex gap-2">
            {canRefund && (
                <Dialog open={isRefundOpen} onOpenChange={setIsRefundOpen}>
                    <DialogTrigger asChild>
                        <Button variant="outline" className="border-red-200 text-red-700 hover:bg-red-50">
                            <RotateCcw className="h-4 w-4 mr-2" />
                            Issue Refund
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Issue Refund</DialogTitle>
                            <DialogDescription>
                                This will return funds to the customer via Stripe. This action is irreversible.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="amount">Refund Amount (£)</Label>
                                <Input
                                    id="amount"
                                    type="number"
                                    step="0.01"
                                    placeholder="0.00"
                                    value={refundAmount}
                                    onChange={(e) => setRefundAmount(e.target.value)}
                                />
                                <p className="text-[10px] text-muted-foreground italic">
                                    Leave blank or enter full amount for total refund.
                                </p>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="reason">Reason for Refund</Label>
                                <Input
                                    id="reason"
                                    placeholder="Customer requested cancellation, quality issue, etc."
                                    value={refundReason}
                                    onChange={(e) => setRefundReason(e.target.value)}
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsRefundOpen(false)} disabled={loading}>
                                Cancel
                            </Button>
                            <Button variant="destructive" onClick={handleRefund} disabled={loading}>
                                {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                                Confirm Refund
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            )}

            {canCancel && (
                <Button variant="ghost" className="text-red-600 hover:text-red-700 hover:bg-red-50" onClick={handleCancel} disabled={loading}>
                    <XCircle className="h-4 w-4 mr-2" />
                    Cancel Booking
                </Button>
            )}
        </div>
    );
}
