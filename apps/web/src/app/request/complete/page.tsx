import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { CheckCircle, ArrowRight, Calendar, MessageSquare, ShieldCheck } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export default function RequestCompletePage() {
    return (
        <div className="min-h-[80vh] flex items-center justify-center bg-slate-50 py-12 px-4">
            <div className="max-w-2xl w-full text-center">
                <div className="mb-8 flex justify-center">
                    <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center animate-in zoom-in duration-500">
                        <CheckCircle className="h-12 w-12 text-green-600" />
                    </div>
                </div>

                <h1 className="text-4xl font-bold mb-4">Request Submitted Successfully!</h1>
                <p className="text-xl text-muted-foreground mb-10">
                    Your request has been sent to verified professionals in your area.
                    You'll start receiving quotes shortly.
                </p>

                <div className="grid md:grid-cols-3 gap-6 mb-12">
                    <Card className="bg-white border-0 shadow-sm">
                        <CardContent className="p-6">
                            <Calendar className="h-6 w-6 text-primary mx-auto mb-3" />
                            <h3 className="font-semibold mb-1">Stay Notified</h3>
                            <p className="text-xs text-muted-foreground">We'll email you as soon as a quote arrives.</p>
                        </CardContent>
                    </Card>
                    <Card className="bg-white border-0 shadow-sm">
                        <CardContent className="p-6">
                            <MessageSquare className="h-6 w-6 text-primary mx-auto mb-3" />
                            <h3 className="font-semibold mb-1">Message Directly</h3>
                            <p className="text-xs text-muted-foreground">Chat with providers to discuss details once they quote.</p>
                        </CardContent>
                    </Card>
                    <Card className="bg-white border-0 shadow-sm">
                        <CardContent className="p-6">
                            <ShieldCheck className="h-6 w-6 text-primary mx-auto mb-3" />
                            <h3 className="font-semibold mb-1">Secure Booking</h3>
                            <p className="text-xs text-muted-foreground">Book and pay securely through Serious Control.</p>
                        </CardContent>
                    </Card>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                    <Link href="/dashboard/quotes" className="w-full sm:w-auto">
                        <Button size="xl" className="w-full px-8">
                            View Your Quotes
                            <ArrowRight className="ml-2 h-5 w-5" />
                        </Button>
                    </Link>
                    <Link href="/search" className="w-full sm:w-auto">
                        <Button variant="outline" size="xl" className="w-full px-8">
                            Browse More Services
                        </Button>
                    </Link>
                </div>

                <p className="mt-12 text-sm text-muted-foreground">
                    Need to change something? You can edit your request from your{' '}
                    <Link href="/dashboard" className="text-primary hover:underline">
                        dashboard
                    </Link>
                    .
                </p>
            </div>
        </div>
    );
}
