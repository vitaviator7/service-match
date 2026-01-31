'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle } from 'lucide-react';
import { completeBooking } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';

export function CompleteBookingButton({ bookingId }: { bookingId: string }) {
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();

    const handleComplete = async () => {
        if (!confirm('Mark this job as completed? This will notify the customer.')) return;

        setLoading(true);
        try {
            const result = await completeBooking(bookingId);
            if (result.success) {
                toast({ title: 'Job Completed' });
            } else {
                toast({ title: 'Error', description: result.error, variant: 'destructive' });
            }
        } catch (error) {
            toast({ title: 'Error', description: 'Failed to complete job', variant: 'destructive' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Button
            className="w-full bg-green-600 hover:bg-green-700 text-white"
            onClick={handleComplete}
            disabled={loading}
        >
            {loading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
                <CheckCircle className="h-4 w-4 mr-2" />
            )}
            Mark as Completed
        </Button>
    );
}
