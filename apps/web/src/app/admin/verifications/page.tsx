'use client';

import { useState, useEffect } from 'react';
import { Loader2, ShieldCheck, Check, X, FileText, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface Document {
    id: string;
    type: string;
    name: string;
    fileUrl: string;
    createdAt: string;
    status: string;
    provider: {
        businessName: string;
        user: {
            firstName: string;
            lastName: string;
        };
    };
}

export default function VerificationsPage() {
    const { toast } = useToast();
    const [documents, setDocuments] = useState<Document[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [rejectReason, setRejectReason] = useState('');
    const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);

    useEffect(() => {
        fetchDocs();
    }, []);

    const fetchDocs = async () => {
        try {
            const res = await fetch('/api/admin/verifications');
            if (res.ok) {
                const data = await res.json();
                setDocuments(data);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleAction = async (docId: string, status: 'APPROVED' | 'REJECTED', reason?: string) => {
        setActionLoading(docId);
        try {
            const res = await fetch('/api/admin/verifications', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ documentId: docId, status, rejectionReason: reason }),
            });

            if (res.ok) {
                toast({ title: `Document ${status.toLowerCase()}` });
                setDocuments(prev => prev.filter(d => d.id !== docId));
                setSelectedDoc(null);
            } else {
                throw new Error();
            }
        } catch (error) {
            toast({ title: 'Action failed', variant: 'destructive' });
        } finally {
            setActionLoading(null);
            setRejectReason('');
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="container mx-auto py-8">
            <h1 className="text-3xl font-bold mb-6">Pending Verifications</h1>

            {documents.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground bg-slate-50 rounded-lg border border-dashed">
                    <ShieldCheck className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                    <p>No pending documents to review.</p>
                </div>
            ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {documents.map((doc) => (
                        <Card key={doc.id}>
                            <CardHeader>
                                <div className="flex justify-between items-start">
                                    <div>
                                        <CardTitle className="text-base">{doc.provider.businessName}</CardTitle>
                                        <CardDescription>{doc.provider.user.firstName} {doc.provider.user.lastName}</CardDescription>
                                    </div>
                                    <div className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded font-medium">
                                        {doc.type}
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <FileText className="w-4 h-4" />
                                    <span className="truncate">{doc.name}</span>
                                </div>
                                <div className="text-xs text-muted-foreground">
                                    Submitted {format(new Date(doc.createdAt), 'MMM d, yyyy')}
                                </div>

                                <div className="flex bg-slate-100 p-2 rounded items-center justify-between">
                                    <span className="text-xs font-medium">Preview</span>
                                    <Dialog>
                                        <DialogTrigger asChild>
                                            <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                                                <Eye className="w-4 h-4" />
                                            </Button>
                                        </DialogTrigger>
                                        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                                            <DialogHeader>
                                                <DialogTitle>Document Preview</DialogTitle>
                                            </DialogHeader>
                                            <div className="mt-4">
                                                {/* Use img for images, link for PDFs */}
                                                {doc.fileUrl.endsWith('.pdf') ? (
                                                    <iframe src={doc.fileUrl} className="w-full h-[60vh] border rounded" />
                                                ) : (
                                                    <img src={doc.fileUrl} alt="Document" className="w-full h-auto rounded" />
                                                )}
                                            </div>
                                        </DialogContent>
                                    </Dialog>
                                </div>

                                <div className="flex gap-2 pt-2">
                                    <Button
                                        className="flex-1 bg-green-600 hover:bg-green-700"
                                        size="sm"
                                        onClick={() => handleAction(doc.id, 'APPROVED')}
                                        disabled={!!actionLoading}
                                    >
                                        {actionLoading === doc.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4 mr-2" />}
                                        Approve
                                    </Button>

                                    <Dialog>
                                        <DialogTrigger asChild>
                                            <Button variant="outline" className="flex-1 border-red-200 text-red-700 hover:bg-red-50 hover:text-red-800" size="sm">
                                                <X className="w-4 h-4 mr-2" />
                                                Reject
                                            </Button>
                                        </DialogTrigger>
                                        <DialogContent>
                                            <DialogHeader>
                                                <DialogTitle>Reject Document</DialogTitle>
                                            </DialogHeader>
                                            <div className="py-4">
                                                <Label>Reason for rejection</Label>
                                                <Input
                                                    value={rejectReason}
                                                    onChange={(e) => setRejectReason(e.target.value)}
                                                    placeholder="e.g., Image unclear, Expired document"
                                                    className="mt-2"
                                                />
                                            </div>
                                            <DialogFooter>
                                                <Button
                                                    variant="destructive"
                                                    onClick={() => handleAction(doc.id, 'REJECTED', rejectReason)}
                                                    disabled={!rejectReason}
                                                >
                                                    Confirm Rejection
                                                </Button>
                                            </DialogFooter>
                                        </DialogContent>
                                    </Dialog>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
