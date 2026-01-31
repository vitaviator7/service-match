import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { prisma } from '@service-match/db';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { StripeConnectButton } from '@/components/provider/StripeConnectButton';

export const metadata: Metadata = {
    title: 'Settings | Provider | Serious Control',
};

export default async function ProviderSettingsPage() {
    const session = await getSession();

    if (!session?.user) {
        redirect('/auth/signin?callbackUrl=/provider/settings');
    }

    const provider = await prisma.providerProfile.findUnique({
        where: { userId: session.user.id },
        include: { user: true },
    });

    if (!provider) {
        redirect('/');
    }

    const isStripeConnected = !!provider.stripeAccountId; // Simple check

    return (
        <div className="container mx-auto px-4 py-8 max-w-2xl">
            <h1 className="text-3xl font-bold mb-8">Settings</h1>

            <div className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Profile Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>Business Name</Label>
                            <Input defaultValue={provider.businessName} disabled />
                        </div>
                        <div className="space-y-2">
                            <Label>Email Address</Label>
                            <Input defaultValue={provider.user.email} disabled />
                        </div>
                        <div className="space-y-2">
                            <Label>Phone</Label>
                            <Input defaultValue={provider.businessPhone || ''} disabled />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Payments</CardTitle>
                        <CardDescription>
                            Connect with Stripe to receive payments directly to your bank account.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-medium">Stripe Account</p>
                                <p className="text-sm text-muted-foreground">
                                    {isStripeConnected
                                        ? 'Your account is connected.'
                                        : 'Connect your account to accept payments.'}
                                </p>
                            </div>
                            <StripeConnectButton isConnected={isStripeConnected} />
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
