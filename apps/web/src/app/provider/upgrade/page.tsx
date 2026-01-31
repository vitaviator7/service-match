'use client';

import { Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

const plans = [
    {
        name: 'Starter',
        price: '£0',
        period: '/month',
        description: 'Perfect for getting started',
        features: [
            'Basic Profile',
            'Receive 3 leads per month',
            'Standard search visibility',
            'Email support'
        ],
        buttonText: 'Current Plan',
        current: true,
    },
    {
        name: 'Pro',
        price: '£29',
        period: '/month',
        description: 'For growing businesses',
        features: [
            'Enhanced Profile',
            'Unlimited leads',
            'Priority search visibility',
            'analytics dashboard',
            'SMS notifications'
        ],
        buttonText: 'Upgrade to Pro',
        current: false,
        popular: true,
    },
    {
        name: 'Premium',
        price: '£59',
        period: '/month',
        description: 'Maximum exposure',
        features: [
            'Featured placement',
            'Verified Badge',
            '0% Booking Fees',
            'Dedicated account manager',
            'API Access'
        ],
        buttonText: 'Upgrade to Premium',
        current: false,
    }
];

export default function UpgradePage() {
    const { toast } = useToast();
    const [loading, setLoading] = useState<string | null>(null);

    const handleUpgrade = async (plan: string) => {
        setLoading(plan);
        // Simulate API call
        setTimeout(() => {
            setLoading(null);
            toast({ title: 'Redirecting to checkout...' });
        }, 1000);
    };

    return (
        <div className="container px-4 py-8">
            <div className="text-center mb-10">
                <h1 className="text-3xl font-bold">Upgrade your business</h1>
                <p className="text-muted-foreground mt-2">Choose the plan that fits your growth.</p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                {plans.map((plan) => (
                    <Card key={plan.name} className={`flex flex-col ${plan.popular ? 'border-primary shadow-lg scale-105' : ''}`}>
                        <CardHeader>
                            {plan.popular && (
                                <div className="text-primary text-sm font-bold uppercase tracking-wide mb-2">Most Popular</div>
                            )}
                            <CardTitle className="text-2xl">{plan.name}</CardTitle>
                            <CardDescription>{plan.description}</CardDescription>
                            <div className="mt-4">
                                <span className="text-4xl font-bold">{plan.price}</span>
                                <span className="text-muted-foreground">{plan.period}</span>
                            </div>
                        </CardHeader>
                        <CardContent className="flex-1">
                            <ul className="space-y-3">
                                {plan.features.map((feature) => (
                                    <li key={feature} className="flex items-center gap-2">
                                        <Check className="h-4 w-4 text-primary shrink-0" />
                                        <span className="text-sm">{feature}</span>
                                    </li>
                                ))}
                            </ul>
                        </CardContent>
                        <CardFooter>
                            <Button
                                className="w-full"
                                variant={plan.popular ? 'default' : 'outline'}
                                disabled={plan.current || !!loading}
                                onClick={() => handleUpgrade(plan.name)}
                            >
                                {loading === plan.name ? <Loader2 className="w-4 h-4 animate-spin" /> : plan.buttonText}
                            </Button>
                        </CardFooter>
                    </Card>
                ))}
            </div>
        </div>
    );
}
