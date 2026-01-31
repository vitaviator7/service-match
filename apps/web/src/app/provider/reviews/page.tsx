'use client';

import { useState, useEffect } from 'react';
import { Loader2, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { format } from 'date-fns';

interface Review {
    id: string;
    overallRating: number;
    title?: string;
    comment: string;
    createdAt: string;
    customer: {
        id: string;
        user: {
            firstName: string;
            lastName: string;
            avatarUrl?: string;
        }
    };
    booking?: {
        service?: {
            name: string;
        };
        scheduledDate: string;
    };
}

export default function ProviderReviewsPage() {
    const [reviews, setReviews] = useState<Review[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/reviews?mine=provider')
            .then((res) => {
                if (res.ok) return res.json();
                throw new Error('Failed to fetch reviews');
            })
            .then((data) => {
                setReviews(data.reviews);
            })
            .catch((err) => console.error(err))
            .finally(() => setLoading(false));
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    if (reviews.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh] text-center px-4">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-6">
                    <Star className="w-8 h-8 text-slate-400" />
                </div>
                <h1 className="text-2xl font-bold mb-2">No reviews yet</h1>
                <p className="text-muted-foreground max-w-md mb-8">
                    You haven't received any reviews yet. Complete more bookings to build your reputation!
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold">Reviews</h1>
                <p className="text-muted-foreground">
                    Feedback from your customers.
                </p>
            </div>

            <div className="space-y-4">
                {reviews.map((review) => (
                    <Card key={review.id} className="overflow-hidden bg-card">
                        <CardHeader className="bg-slate-50 dark:bg-slate-900/50 p-4 flex flex-row items-center gap-4">
                            <Avatar className="h-12 w-12 border-2 border-white shadow-sm">
                                <AvatarImage src={review.customer.user.avatarUrl} />
                                <AvatarFallback>{review.customer.user.firstName?.[0]}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                                <h3 className="font-semibold text-lg">
                                    {review.customer.user.firstName} {review.customer.user.lastName}
                                </h3>
                                <div className="text-sm text-muted-foreground flex items-center gap-2">
                                    <span>{review.booking?.service?.name || 'Service'}</span>
                                    <span>•</span>
                                    <span>{format(new Date(review.createdAt), 'MMM d, yyyy')}</span>
                                </div>
                            </div>
                            <div className="flex flex-col items-end">
                                <div className="flex items-center gap-1 bg-white dark:bg-slate-800 px-2 py-1 rounded-full border shadow-sm">
                                    <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                                    <span className="font-bold">{review.overallRating.toFixed(1)}</span>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-6">
                            {review.title && <h4 className="font-semibold mb-2">{review.title}</h4>}
                            <p className="text-muted-foreground whitespace-pre-wrap">{review.comment}</p>

                            {/* TODO: Add Reply Button */}
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
