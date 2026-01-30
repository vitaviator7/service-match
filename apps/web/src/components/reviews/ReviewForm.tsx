'use client';

import { useState } from 'react';
import { Star, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';

interface ReviewFormProps {
    bookingId: string;
    providerName: string;
    serviceName: string;
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export function ReviewForm({
    bookingId,
    providerName,
    serviceName,
    isOpen,
    onClose,
    onSuccess,
}: ReviewFormProps) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Ratings
    const [overallRating, setOverallRating] = useState(0);
    const [qualityRating, setQualityRating] = useState(0);
    const [valueRating, setValueRating] = useState(0);
    const [punctualityRating, setPunctualityRating] = useState(0);
    const [communicationRating, setCommunicationRating] = useState(0);

    // Text
    const [title, setTitle] = useState('');
    const [comment, setComment] = useState('');
    const [wouldRecommend, setWouldRecommend] = useState(true);

    const handleSubmit = async () => {
        if (!overallRating) {
            setError('Please select an overall rating');
            return;
        }
        if (comment.length < 20) {
            setError('Please write at least 20 characters in your review');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const response = await fetch('/api/reviews', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    bookingId,
                    overallRating,
                    qualityRating: qualityRating || undefined,
                    valueRating: valueRating || undefined,
                    punctualityRating: punctualityRating || undefined,
                    communicationRating: communicationRating || undefined,
                    title: title || undefined,
                    comment,
                    wouldRecommend,
                }),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Failed to submit review');
            }

            onSuccess();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to submit review');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Leave a Review</DialogTitle>
                    <DialogDescription>
                        Share your experience with {providerName} for {serviceName}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {/* Overall Rating */}
                    <div>
                        <label className="block text-sm font-medium mb-2">
                            Overall Rating *
                        </label>
                        <StarRating
                            value={overallRating}
                            onChange={setOverallRating}
                            size="lg"
                        />
                    </div>

                    {/* Detailed Ratings */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-2">Quality</label>
                            <StarRating value={qualityRating} onChange={setQualityRating} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2">Value</label>
                            <StarRating value={valueRating} onChange={setValueRating} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2">Punctuality</label>
                            <StarRating
                                value={punctualityRating}
                                onChange={setPunctualityRating}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2">Communication</label>
                            <StarRating
                                value={communicationRating}
                                onChange={setCommunicationRating}
                            />
                        </div>
                    </div>

                    {/* Title */}
                    <div>
                        <label className="block text-sm font-medium mb-2">
                            Review Title (optional)
                        </label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Summarize your experience"
                            maxLength={100}
                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                        />
                    </div>

                    {/* Comment */}
                    <div>
                        <label className="block text-sm font-medium mb-2">
                            Your Review *
                        </label>
                        <textarea
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            placeholder="Tell others about your experience..."
                            rows={4}
                            maxLength={2000}
                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                            {comment.length}/2000 characters (minimum 20)
                        </p>
                    </div>

                    {/* Would Recommend */}
                    <div className="flex items-center gap-3">
                        <input
                            type="checkbox"
                            id="recommend"
                            checked={wouldRecommend}
                            onChange={(e) => setWouldRecommend(e.target.checked)}
                            className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                        />
                        <label htmlFor="recommend" className="text-sm">
                            I would recommend this professional to others
                        </label>
                    </div>

                    {error && (
                        <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">
                            {error}
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-3 pt-4">
                        <Button
                            variant="outline"
                            onClick={onClose}
                            disabled={loading}
                            className="flex-1"
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleSubmit}
                            disabled={loading}
                            className="flex-1"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                    Submitting...
                                </>
                            ) : (
                                'Submit Review'
                            )}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}

function StarRating({
    value,
    onChange,
    size = 'md',
}: {
    value: number;
    onChange: (value: number) => void;
    size?: 'md' | 'lg';
}) {
    const [hovered, setHovered] = useState(0);
    const iconSize = size === 'lg' ? 'h-8 w-8' : 'h-5 w-5';

    return (
        <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
                <button
                    key={star}
                    type="button"
                    onMouseEnter={() => setHovered(star)}
                    onMouseLeave={() => setHovered(0)}
                    onClick={() => onChange(star)}
                    className="focus:outline-none transition-transform hover:scale-110"
                >
                    <Star
                        className={`${iconSize} ${star <= (hovered || value)
                                ? 'text-amber-500 fill-amber-500'
                                : 'text-gray-300'
                            }`}
                    />
                </button>
            ))}
        </div>
    );
}

export default ReviewForm;
