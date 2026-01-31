export const dynamic = "force-dynamic";

import { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { prisma } from '@service-match/db';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, User, Shield, Calendar, Mail, Phone, MapPin, AlertCircle } from 'lucide-react';

interface AdminUserDetailPageProps {
    params: { id: string };
}

export const metadata: Metadata = {
    title: 'User Details | Admin | Serious Control',
};

export default async function AdminUserDetailPage({ params }: AdminUserDetailPageProps) {
    const session = await getSession();

    if (!session?.user || session.user.role !== 'ADMIN') {
        redirect('/auth/signin');
    }

    const targetUser = await prisma.user.findUnique({
        where: { id: params.id },
        include: {
            customerProfile: true,
            providerProfile: true,
            _count: {
                select: {
                    sentMessages: true,
                    receivedMessages: true,
                    notifications: true,
                }
            }
        },
    });

    if (!targetUser) {
        notFound();
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <Link href="/admin/users" className="flex items-center text-sm text-muted-foreground hover:text-foreground mb-6">
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back to Users
            </Link>

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div className="flex items-center gap-4">
                    <div className="h-16 w-16 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 border-2 border-white shadow-sm overflow-hidden">
                        {targetUser.avatarUrl ? (
                            <img src={targetUser.avatarUrl} alt="" className="h-full w-full object-cover" />
                        ) : (
                            <User className="h-8 w-8" />
                        )}
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold">
                            {targetUser.firstName} {targetUser.lastName}
                        </h1>
                        <div className="flex items-center gap-2 mt-1">
                            <Badge variant={targetUser.role === 'ADMIN' ? 'destructive' : 'default'}>
                                {targetUser.role}
                            </Badge>
                            <Badge variant={targetUser.status === 'ACTIVE' ? 'success' : 'outline'}>
                                {targetUser.status}
                            </Badge>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <Button variant="outline">Edit User</Button>
                    <Button variant="destructive">Suspend Account</Button>
                </div>
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                    <Card>
                        <CardHeader>
                            <CardTitle>Account Information</CardTitle>
                        </CardHeader>
                        <CardContent className="grid md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <div className="flex items-center gap-3 text-sm">
                                    <Mail className="h-4 w-4 text-muted-foreground" />
                                    <span>{targetUser.email}</span>
                                </div>
                                <div className="flex items-center gap-3 text-sm">
                                    <Shield className="h-4 w-4 text-muted-foreground" />
                                    <span>2FA: {targetUser.twoFactorEnabled ? 'Enabled' : 'Disabled'}</span>
                                </div>
                                <div className="flex items-center gap-3 text-sm">
                                    <Calendar className="h-4 w-4 text-muted-foreground" />
                                    <span>Joined: {new Date(targetUser.createdAt).toLocaleDateString()}</span>
                                </div>
                            </div>
                            <div className="space-y-4">
                                <div className="flex items-center gap-3 text-sm">
                                    <Phone className="h-4 w-4 text-muted-foreground" />
                                    <span>Phone Verified: {targetUser.phoneVerified ? 'Yes' : 'No'}</span>
                                </div>
                                <div className="flex items-center gap-3 text-sm">
                                    <AlertCircle className="h-4 w-4 text-muted-foreground" />
                                    <span>Status: {targetUser.status}</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {targetUser.customerProfile && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Customer Profile</CardTitle>
                                <CardDescription>Usage stats and preferences</CardDescription>
                            </CardHeader>
                            <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="p-4 bg-slate-50 rounded-xl">
                                    <p className="text-xs text-muted-foreground mb-1">Balance</p>
                                    <p className="text-xl font-bold">£{targetUser.customerProfile.creditBalance.toFixed(2)}</p>
                                </div>
                                <div className="p-4 bg-slate-50 rounded-xl">
                                    <p className="text-xs text-muted-foreground mb-1">Tier</p>
                                    <p className="text-xl font-bold uppercase">{targetUser.customerProfile.subscriptionTier}</p>
                                </div>
                                <div className="p-4 bg-slate-50 rounded-xl">
                                    <p className="text-xs text-muted-foreground mb-1">City</p>
                                    <p className="text-xl font-bold">{targetUser.customerProfile.city || 'N/A'}</p>
                                </div>
                                <div className="p-4 bg-slate-50 rounded-xl">
                                    <p className="text-xs text-muted-foreground mb-1">Postcode</p>
                                    <p className="text-xl font-bold">{targetUser.customerProfile.postcode || 'N/A'}</p>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {targetUser.providerProfile && (
                        <Card className="border-primary/20 bg-primary/5">
                            <CardHeader>
                                <CardTitle>Provider Profile</CardTitle>
                                <CardDescription>Business details and verification status</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="flex flex-col md:flex-row justify-between gap-6">
                                    <div>
                                        <p className="font-semibold text-lg">{targetUser.providerProfile.businessName}</p>
                                        <p className="text-sm text-muted-foreground mt-1">{targetUser.providerProfile.shortBio}</p>
                                        <div className="flex items-center gap-2 mt-4">
                                            <Badge variant={targetUser.providerProfile.isVerified ? 'success' : 'outline'}>
                                                {targetUser.providerProfile.isVerified ? 'Verified' : 'Pending Verification'}
                                            </Badge>
                                            <Badge variant="secondary">
                                                Score: {targetUser.providerProfile.profileScore}%
                                            </Badge>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <Link href={`/admin/providers/${targetUser.providerProfile.id}`}>
                                            <Button variant="outline" size="sm">View Business Dashboard</Button>
                                        </Link>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>

                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Activity</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-muted-foreground">Messages Sent</span>
                                <span className="font-medium font-mono">{targetUser._count.sentMessages}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-muted-foreground">Messages Received</span>
                                <span className="font-medium font-mono">{targetUser._count.receivedMessages}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-muted-foreground">Notifications</span>
                                <span className="font-medium font-mono">{targetUser._count.notifications}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm border-t pt-4 mt-4">
                                <span className="text-muted-foreground">Last Login</span>
                                <span className="font-medium">{targetUser.lastLoginAt ? new Date(targetUser.lastLoginAt).toLocaleString() : 'Never'}</span>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Permissions</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs font-mono text-slate-600">
                                {targetUser.role === 'ADMIN' ? 'ALL_PERMISSIONS' : 'STANDARD_USER_ACCESS'}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
