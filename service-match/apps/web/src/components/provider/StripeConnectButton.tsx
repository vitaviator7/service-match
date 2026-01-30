'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, ExternalLink } from 'lucide-react';

export function StripeConnectButton({ isConnected }: { isConnected: boolean }) {
    const [loading, setLoading] = useState(false);

    const handleConnect = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/provider/stripe/connect', {
                method: 'POST',
            });

            if (res.ok) {
                const { url } = await res.json();
                if (url) {
                    window.location.href = url;
                }
            }
        } catch (error) {
            console.error('Error:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Button
            onClick={handleConnect}
            disabled={loading}
            variant={isConnected ? "outline" : "default"}
        >
            {loading ? (
                <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                </>
            ) : isConnected ? (
                <>
                    Manage Payouts
                    <ExternalLink className="ml-2 h-4 w-4" />
                </>
            ) : (
                'Connect Stripe'
            )}
        </Button>
    );
}
