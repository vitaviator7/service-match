'use client';

import { Check, Loader2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

export default function PlusPage() {
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);

    const handleSubscribe = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/subscriptions/checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ planId: 'PLUS' }),
            });

            const data = await res.json();
            if (data.url) {
                window.location.href = data.url;
            } else {
                throw new Error(data.error || 'Failed to create checkout session');
            }
        } catch (error: any) {
            toast({
                title: 'Error',
                description: error.message || 'Something went wrong',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container px-4 py-16">
            <div className="text-center mb-16 space-y-4">
                <div className="inline-flex items-center justify-center p-3 bg-primary/10 rounded-full mb-4">
                    <Sparkles className="w-8 h-8 text-primary" />
                </div>
                <h1 className="text-4xl font-bold">ServiceMatch Plus</h1>
                <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                    Get more from every booking with our premium membership for homeowners and customers.
                </p>
            </div>

            <div className="max-w-md mx-auto">
                <Card className="border-primary shadow-xl overflow-hidden">
                    <div className="h-2 bg-gradient-to-r from-primary to-purple-600"></div>
                    <CardHeader className="text-center">
                        <CardTitle className="text-2xl">Member Access</CardTitle>
                        <div className="mt-4">
                            <span className="text-5xl font-bold">£9.99</span>
                            <span className="text-muted-foreground">/month</span>
                        </div>
                        <CardDescription className="mt-2">Cancel anytime</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6 pt-4">
                        <div className="space-y-4">
                            {[
                                '5% Discount on all service bookings',
                                'Priority Customer Support (24/7)',
                                'Extended Cancellation Protection',
                                'Free "Urgent" booking upgrades',
                                'Exclusive seasonal offers'
                            ].map((feature) => (
                                <div key={feature} className="flex items-center gap-3">
                                    <div className="bg-primary/20 p-1 rounded-full">
                                        <Check className="h-4 w-4 text-primary" />
                                    </div>
                                    <span className="font-medium">{feature}</span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                    <CardFooter className="pb-8 pt-4">
                        <Button
                            className="w-full h-12 text-lg"
                            size="lg"
                            onClick={handleSubscribe}
                            disabled={loading}
                        >
                            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Join ServiceMatch Plus'}
                        </Button>
                    </CardFooter>
                </Card>
                <p className="text-center text-sm text-muted-foreground mt-6">
                    By joining, you agree to our Terms of Service. Membership renews automatically.
                </p>
            </div>
        </div>
    );
}
