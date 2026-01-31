'use client';

import { useState } from 'react';
import { Search, Info, TrendingUp, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import Link from 'next/link';

export default function FairPrice() {
    const [query, setQuery] = useState('');
    const [analyzing, setAnalyzing] = useState(false);
    const [result, setResult] = useState<null | { low: number; avg: number; high: number }>(null);

    const handleAnalyze = (e: React.FormEvent) => {
        e.preventDefault();
        if (!query) return;

        setAnalyzing(true);
        // Simulate API call
        setTimeout(() => {
            // Mock data generation based on random seed
            const basePrice = Math.floor(Math.random() * 200) + 100;
            setResult({
                low: basePrice - 40,
                avg: basePrice,
                high: basePrice + 80
            });
            setAnalyzing(false);
        }, 1500);
    };

    return (
        <section className="py-20 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800">
            <div className="container mx-auto px-4">
                <div className="grid lg:grid-cols-2 gap-12 items-center">

                    {/* Left: Content */}
                    <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-300 text-sm font-medium mb-6">
                            <TrendingUp className="w-4 h-4" />
                            FairPrice™ AI Estimator
                        </div>
                        <h2 className="text-4xl font-bold mb-6 text-slate-900 dark:text-white">
                            Never Overpay Again.
                            <br />
                            <span className="text-indigo-600">Know the Real Market Rate.</span>
                        </h2>
                        <p className="text-lg text-slate-600 dark:text-slate-400 mb-8 leading-relaxed">
                            Stop guessing. Our AI analyzes thousands of completed invoices in your area to tell you exactly what a job should cost *before* you book. We believe in radical transparency.
                        </p>

                        <div className="space-y-4">
                            {[
                                'Instant price bands based on realtime data',
                                'Upload offline quotes to audit them for fairness',
                                'Guaranteed fixed-price booking options available'
                            ].map((item, i) => (
                                <div key={i} className="flex items-center gap-3">
                                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center">
                                        <Check className="w-4 h-4" />
                                    </div>
                                    <span className="text-slate-700 dark:text-slate-300">{item}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Right: Interactive Tool */}
                    <div className="relative">
                        {/* Decorative blob */}
                        <div className="absolute -inset-4 bg-gradient-to-r from-indigo-500 to-purple-500 opacity-20 blur-2xl rounded-full"></div>

                        <Card className="relative bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-xl p-6 md:p-8">
                            <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                                <Info className="w-5 h-5 text-indigo-500" />
                                Check a Price
                            </h3>

                            <form onSubmit={handleAnalyze} className="mb-8">
                                <div className="flex gap-2">
                                    <Input
                                        placeholder="e.g. Boiler Service, Paint Bedroom..."
                                        value={query}
                                        onChange={(e) => setQuery(e.target.value)}
                                        className="h-12 text-base"
                                    />
                                    <Button size="lg" type="submit" className="bg-indigo-600 hover:bg-indigo-700 h-12">
                                        {analyzing ? '...' : 'Analyze'}
                                    </Button>
                                </div>
                            </form>

                            {result ? (
                                <div className="space-y-6 animate-in slide-in-from-bottom-4 fade-in duration-500">
                                    <div className="flex justify-between items-end mb-2">
                                        <div className="text-center w-1/3">
                                            <div className="text-sm text-slate-500 mb-1">Budget</div>
                                            <div className="text-xl font-bold text-green-600">£{result.low}</div>
                                        </div>
                                        <div className="text-center w-1/3 relative">
                                            <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-xs py-1 px-3 rounded shadow-lg whitespace-nowrap">
                                                Market Average
                                                <div className="absolute bottom-[-4px] left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-900 rotate-45"></div>
                                            </div>
                                            <div className="text-3xl font-bold text-indigo-600">£{result.avg}</div>
                                        </div>
                                        <div className="text-center w-1/3">
                                            <div className="text-sm text-slate-500 mb-1">Premium</div>
                                            <div className="text-xl font-bold text-slate-900 dark:text-white">£{result.high}</div>
                                        </div>
                                    </div>

                                    {/* Visual Bar Representation */}
                                    <div className="h-4 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden flex">
                                        <div style={{ width: '25%' }} className="h-full bg-green-200/50"></div>
                                        <div style={{ width: '50%' }} className="h-full bg-indigo-500 relative">
                                            {/* Center marker */}
                                            <div className="absolute top-0 bottom-0 left-1/2 w-0.5 bg-white/50"></div>
                                        </div>
                                        <div style={{ width: '25%' }} className="h-full bg-slate-200/50"></div>
                                    </div>

                                    <p className="text-xs text-center text-slate-400 mt-2">
                                        Based on 1,240 recent jobs in your area.
                                    </p>

                                    <Link href={`/request?title=${encodeURIComponent(query)}&budgetMax=${result.avg}`} className="block mt-4">
                                        <Button className="w-full bg-slate-900 text-white hover:bg-slate-800 h-12" size="lg">
                                            Get a Guaranteed Quote for £{result.avg}
                                        </Button>
                                    </Link>
                                </div>
                            ) : (
                                <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-6 text-center border-2 border-dashed border-slate-200 dark:border-slate-700">
                                    <div className="flex justify-center gap-4 mb-4 opacity-50">
                                        <div className="w-2 h-16 bg-slate-300 rounded-full"></div>
                                        <div className="w-2 h-24 bg-slate-300 rounded-full"></div>
                                        <div className="w-2 h-12 bg-slate-300 rounded-full"></div>
                                    </div>
                                    <p className="text-sm text-muted-foreground">
                                        Enter a job to see real-time market data.
                                    </p>
                                </div>
                            )}
                        </Card>
                    </div>

                </div>
            </div>
        </section>
    );
}
