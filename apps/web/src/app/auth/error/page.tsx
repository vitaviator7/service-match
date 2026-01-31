'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { AlertTriangle, ArrowLeft } from 'lucide-react';

export default function AuthErrorPage() {
    const searchParams = useSearchParams();
    const error = searchParams.get('error');

    const errorMessages: Record<string, string> = {
        Configuration: 'There is a problem with the server configuration. Please contact support.',
        AccessDenied: 'You do not have permission to sign in.',
        Verification: 'The verification link has expired or has already been used.',
        AccountSuspended: 'Your account has been suspended. Please contact support.',
        AccountBanned: 'Your account has been banned.',
        Default: 'An unexpected authentication error occurred.',
    };

    const message = errorMessages[error as string] || errorMessages.Default;

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
            <Card className="max-w-md w-full">
                <CardHeader className="text-center">
                    <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                        <AlertTriangle className="h-6 w-6" />
                    </div>
                    <CardTitle className="text-2xl font-bold">Authentication Error</CardTitle>
                    <CardDescription>{message}</CardDescription>
                </CardHeader>
                <CardContent className="text-center text-sm text-muted-foreground">
                    <p>Error Code: <span className="font-mono bg-slate-100 px-1 rounded text-red-600">{error || 'Unknown'}</span></p>
                </CardContent>
                <CardFooter className="flex flex-col gap-3">
                    <Link href="/auth/signin" className="w-full">
                        <Button className="w-full">Try Signing In Again</Button>
                    </Link>
                    <Link href="/" className="w-full">
                        <Button variant="ghost" className="w-full">
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Back to Home
                        </Button>
                    </Link>
                </CardFooter>
            </Card>
        </div>
    );
}
