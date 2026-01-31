import { Metadata } from 'next';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { CheckCircle, Search, MessageSquare, Calendar, CreditCard } from 'lucide-react';

export const metadata: Metadata = {
    title: 'How It Works | Serious Control',
    description: 'Learn how to find and book trusted local professionals.',
};

export default function HowItWorksPage() {
    return (
        <div className="container mx-auto px-4 py-12 min-h-screen">
            <div className="text-center mb-16">
                <h1 className="text-4xl font-bold mb-4">How Serious Control Works</h1>
                <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                    We make it easy to find, book, and pay for reliable local services.
                </p>
            </div>

            <div className="max-w-4xl mx-auto space-y-24">
                {/* Step 1 */}
                <div className="grid md:grid-cols-2 gap-12 items-center">
                    <div className="order-2 md:order-1">
                        <div className="bg-blue-50 p-8 rounded-3xl">
                            <Search className="w-32 h-32 text-blue-500 mx-auto opacity-80" />
                        </div>
                    </div>
                    <div className="order-1 md:order-2">
                        <div className="inline-block px-4 py-1 rounded-full bg-blue-100 text-blue-700 font-semibold mb-4">Step 1</div>
                        <h2 className="text-3xl font-bold mb-4">Post Your Job</h2>
                        <p className="text-lg text-muted-foreground mb-6">
                            Tell us what you need done. Be specific about your requirements, location, and preferred timing. It's completely free to post a request.
                        </p>
                        <ul className="space-y-3">
                            <li className="flex items-center gap-2">
                                <CheckCircle className="w-5 h-5 text-green-500" />
                                <span>Choose from 50+ categories</span>
                            </li>
                            <li className="flex items-center gap-2">
                                <CheckCircle className="w-5 h-5 text-green-500" />
                                <span>Upload photos and details</span>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Step 2 */}
                <div className="grid md:grid-cols-2 gap-12 items-center">
                    <div className="order-1">
                        <div className="inline-block px-4 py-1 rounded-full bg-purple-100 text-purple-700 font-semibold mb-4">Step 2</div>
                        <h2 className="text-3xl font-bold mb-4">Get Quotes & Chat</h2>
                        <p className="text-lg text-muted-foreground mb-6">
                            Verified professionals in your area will review your job and send you competitive quotes. Chat with them directly to ask questions.
                        </p>
                        <ul className="space-y-3">
                            <li className="flex items-center gap-2">
                                <CheckCircle className="w-5 h-5 text-green-500" />
                                <span>Compare prices and profiles</span>
                            </li>
                            <li className="flex items-center gap-2">
                                <CheckCircle className="w-5 h-5 text-green-500" />
                                <span>Use built-in chat for privacy</span>
                            </li>
                        </ul>
                    </div>
                    <div className="order-2">
                        <div className="bg-purple-50 p-8 rounded-3xl">
                            <MessageSquare className="w-32 h-32 text-purple-500 mx-auto opacity-80" />
                        </div>
                    </div>
                </div>

                {/* Step 3 */}
                <div className="grid md:grid-cols-2 gap-12 items-center">
                    <div className="order-2 md:order-1">
                        <div className="bg-green-50 p-8 rounded-3xl">
                            <Calendar className="w-32 h-32 text-green-500 mx-auto opacity-80" />
                        </div>
                    </div>
                    <div className="order-1 md:order-2">
                        <div className="inline-block px-4 py-1 rounded-full bg-green-100 text-green-700 font-semibold mb-4">Step 3</div>
                        <h2 className="text-3xl font-bold mb-4">Book & Pay securely</h2>
                        <p className="text-lg text-muted-foreground mb-6">
                            Choose the best quote and confirm your booking. Your payment is processed securely through Stripe only when you're ready.
                        </p>
                        <ul className="space-y-3">
                            <li className="flex items-center gap-2">
                                <CheckCircle className="w-5 h-5 text-green-500" />
                                <span>Secure online payment</span>
                            </li>
                            <li className="flex items-center gap-2">
                                <CheckCircle className="w-5 h-5 text-green-500" />
                                <span>Satisfaction guarantee</span>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>

            <div className="text-center mt-24">
                <Link href="/request">
                    <Button size="xl" className="text-lg px-8">
                        Post a Job Now
                    </Button>
                </Link>
            </div>
        </div>
    );
}
