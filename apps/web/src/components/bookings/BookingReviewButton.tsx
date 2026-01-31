'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Star } from 'lucide-react';
import { ReviewForm } from '@/components/reviews/ReviewForm';
import { useRouter } from 'next/navigation';

interface BookingReviewButtonProps {
    bookingId: string;
    providerName: string;
    serviceName: string;
    hasReview: boolean;
}

export function BookingReviewButton({
    bookingId,
    providerName,
    serviceName,
    hasReview
}: BookingReviewButtonProps) {
    const [isOpen, setIsOpen] = useState(false);
    const router = useRouter();

    if (hasReview) {
        return (
            <div className="bg-slate-50 p-4 rounded-lg flex items-center justify-between border">
                <div className="flex items-center gap-2 text-amber-600">
                    <Star className="h-4 w-4 fill-current" />
                    <span className="text-sm font-medium">Review Submitted</span>
                </div>
                <Button variant="ghost" size="sm" onClick={() => router.refresh()}>
                    View Review
                </Button>
            </div>
        );
    }

    return (
        <>
            <Button
                className="w-full bg-amber-500 hover:bg-amber-600 text-white"
                onClick={() => setIsOpen(true)}
            >
                <Star className="h-4 w-4 mr-2" />
                Leave a Review
            </Button>

            <ReviewForm
                bookingId={bookingId}
                providerName={providerName}
                serviceName={serviceName}
                isOpen={isOpen}
                onClose={() => setIsOpen(false)}
                onSuccess={() => {
                    setIsOpen(false);
                    router.refresh();
                }}
            />
        </>
    );
}
