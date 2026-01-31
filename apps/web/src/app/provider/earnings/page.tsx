'use client';

import { useState, useEffect } from 'react';
import { Loader2, DollarSign, TrendingUp, CreditCard, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { format } from 'date-fns';

interface Payout {
    id: string;
    amount: string; // Decimal comes as string often
    status: string;
    processedAt: string | null;
    createdAt: string;
}

interface ChartData {
    month: string;
    amount: number;
}

interface EarningsData {
    balances: {
        available: string;
        pending: string;
        totalRevenue: string;
    };
    payouts: Payout[];
    chartData: ChartData[];
}

export default function EarningsPage() {
    const [data, setData] = useState<EarningsData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/provider/earnings')
            .then((res) => {
                if (res.ok) return res.json();
                throw new Error('Failed to fetch');
            })
            .then(setData)
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!data) return <div className="p-8">Failed to load earnings data.</div>;

    const maxChartAmount = Math.max(...data.chartData.map(d => d.amount), 100);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Earnings & Payouts</h1>
                    <p className="text-muted-foreground">
                        Track your revenue and manage your payouts.
                    </p>
                </div>
                <Button>
                    <Download className="w-4 h-4 mr-2" />
                    Download CSV
                </Button>
            </div>

            {/* Stats Cards */}
            <div className="grid md:grid-cols-3 gap-6">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Available Balance</CardTitle>
                        <DollarSign className="w-4 h-4 text-emerald-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">£{Number(data.balances.available).toFixed(2)}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Available for immediate payout
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Pending Balance</CardTitle>
                        <CreditCard className="w-4 h-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">£{Number(data.balances.pending).toFixed(2)}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Processing from recent bookings
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                        <TrendingUp className="w-4 h-4 text-primary" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">£{Number(data.balances.totalRevenue).toFixed(2)}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Lifetime earnings on platform
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Simple CSS Chart */}
            <Card>
                <CardHeader>
                    <CardTitle>Revenue Overview</CardTitle>
                    <CardDescription>Earnings over the last 6 months</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="h-64 flex items-end justify-between gap-2 mt-4">
                        {data.chartData.map((item) => (
                            <div key={item.month} className="flex flex-col items-center flex-1 gap-2 group">
                                <div className="relative w-full flex justify-center">
                                    <div
                                        className="w-full max-w-[40px] bg-primary/90 rounded-t-sm transition-all group-hover:bg-primary"
                                        style={{ height: `${(item.amount / maxChartAmount) * 200}px` }}
                                    ></div>
                                    <div className="absolute -top-8 opacity-0 group-hover:opacity-100 transition-opacity bg-black text-white text-xs px-2 py-1 rounded">
                                        £{item.amount.toFixed(2)}
                                    </div>
                                </div>
                                <span className="text-xs text-muted-foreground font-medium">{item.month}</span>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Payouts Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Recent Payouts</CardTitle>
                </CardHeader>
                <CardContent>
                    {data.payouts.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            No payouts found.
                        </div>
                    ) : (
                        <div className="rounded-md border">
                            <table className="w-full text-sm">
                                <thead className="bg-slate-50 border-b">
                                    <tr>
                                        <th className="h-10 px-4 text-left font-medium text-muted-foreground">Status</th>
                                        <th className="h-10 px-4 text-left font-medium text-muted-foreground">Date</th>
                                        <th className="h-10 px-4 text-right font-medium text-muted-foreground">Amount</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {data.payouts.map((payout) => (
                                        <tr key={payout.id} className="border-b last:border-0 hover:bg-slate-50/50">
                                            <td className="p-4">
                                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium 
                                                    ${payout.status === 'PAID' ? 'bg-green-100 text-green-700' :
                                                        payout.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' :
                                                            'bg-slate-100 text-slate-700'}`}>
                                                    {payout.status}
                                                </span>
                                            </td>
                                            <td className="p-4">
                                                {format(new Date(payout.createdAt), 'MMM d, yyyy')}
                                            </td>
                                            <td className="p-4 text-right font-medium">
                                                £{Number(payout.amount).toFixed(2)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
