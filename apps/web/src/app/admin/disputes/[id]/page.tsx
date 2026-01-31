export const dynamic = "force-dynamic";

import { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { prisma } from '@service-match/db';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    ArrowLeft,
    AlertTriangle,
    MessageCircle,
    Scale,
    User,
    ArrowRight,
    Calendar,
    CheckCircle2,
    XCircle
} from 'lucide-react';

interface AdminDisputeDetailPageProps {
    params: { id: string };
}

export const metadata: Metadata = {
    title: 'Dispute Case | Admin | Serious Control',
};

export default async function AdminDisputeDetailPage({ params }: AdminDisputeDetailPageProps) {
    const session = await getSession();

    if (!session?.user || session.user.role !== 'ADMIN') {
        redirect('/auth/signin');
    }

    const dispute = await prisma.dispute.findUnique({
        where: { id: params.id },
        include: {
            booking: {
                include: {
                    customer: { include: { user: true } },
                    provider: { include: { user: true } },
                }
            },
            messages: {
                orderBy: { createdAt: 'asc' },
                include: { author: true }
            }
        },
    });

    if (!dispute) {
        notFound();
    }

    const statusColors: Record<string, string> = {
        OPEN: 'bg-blue-100 text-blue-700',
        INVESTIGATING: 'bg-amber-100 text-amber-700',
        RESOLVED: 'bg-green-100 text-green-700',
        CLOSED: 'bg-slate-100 text-slate-700',
    };

    return (
        <div className="container mx-auto px-4 py-8">
            <Link href="/admin/disputes" className="flex items-center text-sm text-muted-foreground hover:text-foreground mb-6">
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back to Disputes
            </Link>

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div className="flex items-center gap-4">
                    <div className="h-16 w-16 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600 border border-amber-100 shadow-sm">
                        <Scale className="h-8 w-8" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-3xl font-bold">Case #{dispute.id.slice(-6).toUpperCase()}</h1>
                            <Badge className={statusColors[dispute.status] || ''}>
                                {dispute.status}
                            </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                            Opened on {new Date(dispute.createdAt).toLocaleDateString()} for Project "{dispute.booking.title}"
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    {dispute.status !== 'RESOLVED' && (
                        <>
                            <Button className="bg-green-600 hover:bg-green-700 flex items-center gap-2">
                                <CheckCircle2 className="h-4 w-4" />
                                Resolve Case
                            </Button>
                            <Button variant="outline" className="text-red-600 hover:text-red-700">Reject Claim</Button>
                        </>
                    )}
                </div>
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                    {/* Reason & Details */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Dispute Reason</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-xl font-medium mb-4">{dispute.reason}</p>
                            <div className="bg-slate-50 p-6 rounded-xl border italic text-slate-700">
                                "{dispute.description}"
                            </div>
                        </CardContent>
                    </Card>

                    {/* Timeline/Messages */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <MessageCircle className="h-5 w-5" />
                                Case Discussion
                            </CardTitle>
                            <CardDescription>Internal log and communications between parties</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-6">
                                {dispute.messages.map((msg, i) => (
                                    <div key={msg.id} className={`flex gap-4 ${msg.authorId === session.user.id ? 'justify-end' : ''}`}>
                                        <div className={`max-w-[80%] p-4 rounded-xl ${msg.isAdminNote ? 'bg-amber-50 border border-amber-100' : 'bg-slate-100'}`}>
                                            <div className="flex items-center justify-between mb-1 gap-4">
                                                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                                                    {msg.author.firstName} {msg.author.lastName} {msg.isAdminNote && '(ADMIN)'}
                                                </span>
                                                <span className="text-[10px] text-muted-foreground">
                                                    {new Date(msg.createdAt).toLocaleString()}
                                                </span>
                                            </div>
                                            <p className="text-sm">{msg.content}</p>
                                        </div>
                                    </div>
                                ))}

                                {dispute.messages.length === 0 && (
                                    <div className="text-center py-12 text-muted-foreground">
                                        <AlertTriangle className="h-8 w-8 mx-auto mb-2 opacity-20" />
                                        <p>No messages in this case yet.</p>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                        <CardFooter className="border-t pt-6">
                            <div className="flex w-full gap-2">
                                <input
                                    type="text"
                                    placeholder="Type an internal note or message..."
                                    className="flex-1 bg-slate-50 border rounded-md px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                                />
                                <Button size="sm">Send</Button>
                            </div>
                        </CardFooter>
                    </Card>
                </div>

                <div className="space-y-6">
                    {/* Parties Involved */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Parties Involved</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-3">
                                <p className="text-xs font-bold text-muted-foreground uppercase">Customer (Claimant)</p>
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center">
                                        <User className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium">{dispute.booking.customer.user.firstName} {dispute.booking.customer.user.lastName}</p>
                                        <Link href={`/admin/users/${dispute.booking.customer.userId}`} className="text-xs text-primary hover:underline">View Profile</Link>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <p className="text-xs font-bold text-muted-foreground uppercase">Provider (Respondent)</p>
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center">
                                        <User className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium">{dispute.booking.provider.user.firstName} {dispute.booking.provider.user.lastName}</p>
                                        <Link href={`/admin/providers/${dispute.booking.provider.id}`} className="text-xs text-primary hover:underline">View Business</Link>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Related Booking */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Related Booking</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="p-4 bg-slate-50 rounded-lg border">
                                <p className="font-semibold text-sm mb-1">{dispute.booking.title}</p>
                                <p className="text-xs text-muted-foreground mb-3">ID: {dispute.booking.id}</p>
                                <div className="flex items-center justify-between text-sm">
                                    <span>Amount</span>
                                    <span className="font-bold">£{dispute.booking.total.toFixed(2)}</span>
                                </div>
                                <div className="flex items-center justify-between text-sm mt-1">
                                    <span>Status</span>
                                    <Badge variant="outline" className="text-[10px] h-5">{dispute.booking.status}</Badge>
                                </div>
                            </div>
                            <Button variant="outline" className="w-full text-xs" asChild>
                                <Link href={`/admin/bookings/${dispute.booking.id}`}>
                                    View Full Booking
                                    <ArrowRight className="ml-2 h-3 w-3" />
                                </Link>
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
