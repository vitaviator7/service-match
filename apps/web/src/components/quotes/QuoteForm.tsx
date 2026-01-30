'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface QuoteFormProps {
    quoteRequestId: string;
    onCancel: () => void;
}

export function QuoteForm({ quoteRequestId, onCancel }: QuoteFormProps) {
    const router = useRouter();
    const [amount, setAmount] = useState('');
    const [description, setDescription] = useState('');
    const [duration, setDuration] = useState('');
    const [validUntil, setValidUntil] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const amountInPence = Math.round(parseFloat(amount) * 100);

            const response = await fetch('/api/quotes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    quoteRequestId,
                    amount: amountInPence,
                    description,
                    estimatedDuration: duration,
                    validUntil: validUntil || undefined,
                }),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Failed to submit quote');
            }

            router.push('/provider/quotes'); // Redirect to sent quotes
            router.refresh();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to submit quote');
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-sm font-medium mb-2">
                        Quote Amount (£)
                    </label>
                    <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                            £
                        </span>
                        <input
                            type="number"
                            min="5"
                            step="0.01"
                            required
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            className="w-full pl-8 pr-4 py-2 border rounded-lg"
                            placeholder="0.00"
                        />
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-medium mb-2">
                        Estimated Duration
                    </label>
                    <input
                        type="text"
                        value={duration}
                        onChange={(e) => setDuration(e.target.value)}
                        className="w-full px-4 py-2 border rounded-lg"
                        placeholder="e.g. 2 hours, 3 days"
                    />
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium mb-2">
                    Message to Customer
                </label>
                <textarea
                    required
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg h-32 resize-none"
                    placeholder="Describe what's included in your quote..."
                    minLength={20}
                />
            </div>

            <div>
                <label className="block text-sm font-medium mb-2">
                    Valid Until (Optional)
                </label>
                <input
                    type="date"
                    value={validUntil}
                    min={new Date().toISOString().split('T')[0]}
                    onChange={(e) => setValidUntil(e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg"
                />
            </div>

            {error && (
                <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">
                    {error}
                </div>
            )}

            <div className="flex gap-4 pt-4">
                <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
                    Cancel
                </Button>
                <Button type="submit" disabled={loading} className="flex-1">
                    {loading ? (
                        <>
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            Sending...
                        </>
                    ) : (
                        'Send Quote'
                    )}
                </Button>
            </div>
        </form>
    );
}
