'use client';

import { useState, useEffect } from 'react';
import { Loader2, DollarSign, CheckCircle, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface Payout {
    id: string;
    amount: string;
    currency: string;
    status: string;
    createdAt: string;
    processedAt?: string;
    provider: {
        businessName: string;
    };
}

export default function PayoutsPage() {
    const { toast } = useToast();
    const [payouts, setPayouts] = useState<Payout[]>([]);
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState<string | null>(null);

    useEffect(() => {
        fetchPayouts();
    }, []);

    const fetchPayouts = async () => {
        try {
            const res = await fetch('/api/admin/payouts'); // Fetches all recently
            if (res.ok) {
                const data = await res.json();
                setPayouts(data);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const processPayout = async (id: string) => {
        setProcessingId(id);
        try {
            const res = await fetch('/api/admin/payouts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ payoutId: id }),
            });

            if (res.ok) {
                toast({ title: 'Payout processed' });
                setPayouts(prev => prev.map(p =>
                    p.id === id ? { ...p, status: 'PAID', processedAt: new Date().toISOString() } : p
                ));
            } else {
                throw new Error();
            }
        } catch (error) {
            toast({ title: 'Failed to process', variant: 'destructive' });
        } finally {
            setProcessingId(null);
        }
    };

    if (loading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin" /></div>;

    return (
        <div className="container py-8">
            <h1 className="text-3xl font-bold mb-6">Payouts Management</h1>
            <div className="bg-white rounded-md border shadow-sm overflow-hidden">
                <table className="w-full text-sm">
                    <thead className="bg-slate-50 border-b">
                        <tr>
                            <th className="px-6 py-4 text-left font-medium text-slate-500">Provider</th>
                            <th className="px-6 py-4 text-left font-medium text-slate-500">Requested</th>
                            <th className="px-6 py-4 text-left font-medium text-slate-500">Amount</th>
                            <th className="px-6 py-4 text-left font-medium text-slate-500">Status</th>
                            <th className="px-6 py-4 text-right font-medium text-slate-500">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {payouts.map((payout) => (
                            <tr key={payout.id} className="hover:bg-slate-50/50">
                                <td className="px-6 py-4 font-medium">{payout.provider.businessName}</td>
                                <td className="px-6 py-4 text-slate-500">
                                    {format(new Date(payout.createdAt), 'MMM d, h:mm a')}
                                </td>
                                <td className="px-6 py-4 font-bold">
                                    {payout.currency} {Number(payout.amount).toFixed(2)}
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                                        ${payout.status === 'PAID' ? 'bg-green-100 text-green-800' :
                                            payout.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                                                'bg-red-100 text-red-800'}`}>
                                        {payout.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    {payout.status === 'PENDING' && (
                                        <Button
                                            size="sm"
                                            onClick={() => processPayout(payout.id)}
                                            disabled={!!processingId}
                                        >
                                            {processingId === payout.id ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Process'}
                                        </Button>
                                    )}
                                    {payout.status === 'PAID' && (
                                        <span className="text-slate-400 text-xs">
                                            Processed {format(new Date(payout.processedAt!), 'MMM d')}
                                        </span>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {payouts.length === 0 && (
                    <div className="p-12 text-center text-slate-500">No payouts found.</div>
                )}
            </div>
        </div>
    );
}
