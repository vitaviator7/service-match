'use client';

import { useState, useEffect } from 'react';
import { Loader2, AlertTriangle, Check, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

interface Review {
    id: string;
    overallRating: number;
    title?: string;
    comment: string;
    status: string;
    createdAt: string;
    flaggedReason?: string;
    provider: { businessName: string };
    customer: { user: { firstName: string; lastName: string } };
}

export default function AdminReviewsPage() {
    const { toast } = useToast();
    const [reviews, setReviews] = useState<Review[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionId, setActionId] = useState<string | null>(null);

    useEffect(() => {
        fetchReviews();
    }, []);

    const fetchReviews = async () => {
        try {
            const res = await fetch('/api/admin/reviews');
            if (res.ok) {
                const data = await res.json();
                setReviews(data);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const updateStatus = async (id: string, status: string) => {
        setActionId(id);
        try {
            const res = await fetch('/api/admin/reviews', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ reviewId: id, status }),
            });

            if (res.ok) {
                toast({ title: `Review ${status.toLowerCase()}` });
                setReviews(prev => prev.map(r => r.id === id ? { ...r, status } : r));
            } else {
                throw new Error();
            }
        } catch (error) {
            toast({ title: 'Action failed', variant: 'destructive' });
        } finally {
            setActionId(null);
        }
    };

    if (loading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin" /></div>;

    return (
        <div className="container py-8">
            <h1 className="text-3xl font-bold mb-6">Review Moderation</h1>
            <div className="space-y-4">
                {reviews.map((review) => (
                    <div key={review.id} className="bg-white p-6 rounded-lg border shadow-sm flex flex-col md:flex-row gap-6">
                        <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-2">
                                <Badge variant={
                                    review.status === 'PUBLISHED' ? 'secondary' :
                                        review.status === 'FLAGGED' ? 'destructive' : 'outline'
                                }>
                                    {review.status}
                                </Badge>
                                <span className="text-sm text-muted-foreground">
                                    {format(new Date(review.createdAt), 'MMM d, yyyy')}
                                </span>
                            </div>

                            <div className="flex items-baseline gap-2">
                                <span className="font-bold text-lg">{review.overallRating}/5</span>
                                <h3 className="font-semibold">{review.title || 'No Title'}</h3>
                            </div>

                            <p className="text-slate-700">{review.comment}</p>

                            <div className="text-sm text-muted-foreground pt-2 border-t mt-4 flex gap-4">
                                <span>From: <span className="font-medium text-foreground">{review.customer.user.firstName} {review.customer.user.lastName}</span></span>
                                <span>To: <span className="font-medium text-foreground">{review.provider.businessName}</span></span>
                            </div>

                            {review.flaggedReason && (
                                <div className="bg-red-50 text-red-800 p-2 rounded text-sm mt-2 flex items-center gap-2">
                                    <AlertTriangle className="w-4 h-4" />
                                    Flagged: {review.flaggedReason}
                                </div>
                            )}
                        </div>

                        <div className="flex flex-row md:flex-col gap-2 justify-center border-t md:border-t-0 md:border-l pt-4 md:pt-0 md:pl-6 min-w-[140px]">
                            {review.status !== 'PUBLISHED' && (
                                <Button
                                    size="sm"
                                    className="bg-green-600 hover:bg-green-700"
                                    onClick={() => updateStatus(review.id, 'PUBLISHED')}
                                    disabled={!!actionId}
                                >
                                    {actionId === review.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4 mr-2" />}
                                    Publish
                                </Button>
                            )}
                            {review.status !== 'HIDDEN' && (
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => updateStatus(review.id, 'HIDDEN')}
                                    disabled={!!actionId}
                                >
                                    <EyeOff className="w-4 h-4 mr-2" />
                                    Hide
                                </Button>
                            )}
                        </div>
                    </div>
                ))}

                {reviews.length === 0 && (
                    <div className="p-12 text-center text-slate-500 bg-white rounded border">No reviews to moderate.</div>
                )}
            </div>
        </div>
    );
}
