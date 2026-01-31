'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Mail, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

function VerifyContent() {
    const searchParams = useSearchParams();
    const email = searchParams.get('email');

    return (
        <Card className="shadow-lg">
            <CardHeader className="text-center pb-2">
                <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                    <Mail className="w-6 h-6 text-primary" />
                </div>
                <CardTitle className="text-2xl">Check your email</CardTitle>
                <CardDescription>
                    A sign in link has been sent to your email address.
                </CardDescription>
            </CardHeader>
            <CardContent className="pt-4 text-center">
                {email && (
                    <p className="mb-4 text-sm font-medium text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 p-2 rounded">
                        {email}
                    </p>
                )}

                <p className="text-muted-foreground text-sm mb-6">
                    Click the link in the email to verify your account and sign in.
                    If you don't see it, check your spam folder.
                </p>

                <div className="space-y-4">
                    <Link href="/auth/signin">
                        <Button variant="outline" className="w-full">
                            Back to Sign In
                        </Button>
                    </Link>

                    <p className="text-xs text-muted-foreground">
                        Did not receive the email?{' '}
                        <Link href="/auth/signin" className="text-primary hover:underline">
                            Try again
                        </Link>
                    </p>
                </div>
            </CardContent>
        </Card>
    );
}

export default function VerifyRequestPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800 px-4 py-12">
            <div className="w-full max-w-md">
                <Suspense fallback={<div>Loading...</div>}>
                    <VerifyContent />
                </Suspense>
            </div>
        </div>
    );
}
