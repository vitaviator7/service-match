'use client';

import { useEffect } from 'react';
import { signOut } from 'next-auth/react';
import { Loader2 } from 'lucide-react';

export default function SignOutPage() {
    useEffect(() => {
        signOut({ callbackUrl: '/' });
    }, []);

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
            <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
                <h1 className="text-xl font-medium">Signing you out...</h1>
                <p className="text-muted-foreground mt-2">Please wait a moment.</p>
            </div>
        </div>
    );
}
