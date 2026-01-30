import { Metadata } from 'next';
import { Card, CardContent } from '@/components/ui/card';

export const metadata: Metadata = {
    title: 'About Us | ServiceMatch',
    description: 'The story behind ServiceMatch.',
};

export default function AboutPage() {
    return (
        <div className="container mx-auto px-4 py-12 min-h-screen">
            <div className="max-w-3xl mx-auto">
                <h1 className="text-4xl font-bold mb-8">About Us</h1>

                <div className="prose prose-lg dark:prose-invert">
                    <p className="lead text-xl text-muted-foreground mb-6">
                        ServiceMatch is the UK's most trusted marketplace for connecting homeowners with local, vetted professionals.
                    </p>

                    <p>
                        Founded in 2024, our mission is to simplify the traditionally chaotic process of finding reliable tradespeople. whether you need a plumber for an emergency leak, an electrician for a new installation, or a cleaner for regular upkeep, ServiceMatch brings the professionals to you.
                    </p>

                    <h2 className="text-2xl font-bold mt-12 mb-4">Our Values</h2>

                    <div className="grid sm:grid-cols-2 gap-6 not-prose mb-12">
                        <Card>
                            <CardContent className="p-6">
                                <h3 className="font-bold text-lg mb-2">Trust & Safety</h3>
                                <p className="text-muted-foreground">We rigorously vet every provider on our platform to ensure your safety and peace of mind.</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="p-6">
                                <h3 className="font-bold text-lg mb-2">Transparency</h3>
                                <p className="text-muted-foreground">Clear pricing, honest reviews, and no hidden fees. We believe in fair dealings for everyone.</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="p-6">
                                <h3 className="font-bold text-lg mb-2">Quality</h3>
                                <p className="text-muted-foreground">We support professionals who take pride in their work and deliver exceptional results.</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="p-6">
                                <h3 className="font-bold text-lg mb-2">Innovation</h3>
                                <p className="text-muted-foreground">Using technology to make booking services as easy as ordering a taxi.</p>
                            </CardContent>
                        </Card>
                    </div>

                    <h2 className="text-2xl font-bold mt-8 mb-4">Our Commitment</h2>
                    <p>
                        We are committed to building a community where customers get great service and skilled professionals can grow their sustainable businesses. We handle the marketing, booking, and payments so our providers can focus on what they do best.
                    </p>
                </div>
            </div>
        </div>
    );
}
