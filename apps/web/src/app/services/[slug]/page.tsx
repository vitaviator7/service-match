import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { prisma } from '@service-match/db';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowRight, CheckCircle } from 'lucide-react';

interface ServicePageProps {
    params: { slug: string };
}

export async function generateMetadata({ params }: ServicePageProps): Promise<Metadata> {
    const category = await prisma.category.findUnique({
        where: { slug: params.slug },
    });

    if (!category) return { title: 'Not Found' };

    return {
        title: `${category.name} Services | ServiceMatch`,
        description: category.description || `Find trusted ${category.name} professionals near you.`,
    };
}

export default async function ServicePage({ params }: ServicePageProps) {
    const category = await prisma.category.findUnique({
        where: { slug: params.slug },
        include: {
            subcategories: {
                where: { isActive: true },
                orderBy: { displayOrder: 'asc' },
            },
        },
    });

    if (!category) {
        notFound();
    }

    const hasSubcategories = category.subcategories.length > 0;

    return (
        <div className="container mx-auto px-4 py-12 min-h-screen">
            <div className="max-w-4xl mx-auto">
                {/* Breadcrumb-ish */}
                <div className="mb-8 flex items-center gap-2 text-sm text-muted-foreground">
                    <Link href="/services" className="hover:text-primary">Services</Link>
                    <span>/</span>
                    <span className="text-foreground font-medium">{category.name}</span>
                </div>

                <div className="text-center mb-16">
                    <h1 className="text-4xl md:text-5xl font-bold mb-6">{category.name}</h1>
                    <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
                        {category.description || `Get free quotes from verified ${category.name.toLowerCase()} professionals in your area.`}
                    </p>

                    {!hasSubcategories && (
                        <Link href={`/request?category=${category.slug}`}>
                            <Button size="xl" className="text-lg px-8">
                                Get Quotes Now
                                <ArrowRight className="ml-2 h-5 w-5" />
                            </Button>
                        </Link>
                    )}
                </div>

                {!hasSubcategories ? (
                    // Leaf Category (No subcategories) Content
                    <div className="grid md:grid-cols-2 gap-12 items-center">
                        <div className="space-y-6">
                            <h2 className="text-2xl font-bold">Why use ServiceMatch?</h2>
                            <div className="space-y-4">
                                <div className="flex gap-4">
                                    <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                                        <CheckCircle className="w-6 h-6 text-green-600" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-lg">Verified Professionals</h3>
                                        <p className="text-muted-foreground">Every provider is vetted including ID and insurance checks.</p>
                                    </div>
                                </div>
                                <div className="flex gap-4">
                                    <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center shrink-0">
                                        <CheckCircle className="w-6 h-6 text-purple-600" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-lg">Secure Payments</h3>
                                        <p className="text-muted-foreground">Pay securely only when you are satisfied with the work.</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-slate-50 p-8 rounded-2xl border">
                            <h3 className="font-semibold text-xl mb-4">Start your request</h3>
                            <p className="text-muted-foreground mb-6">
                                Tell us about your job and get quotes from local {category.name.toLowerCase()} experts.
                            </p>
                            <Link href={`/request?category=${category.slug}`} className="block">
                                <Button className="w-full">
                                    Get Started
                                    <ArrowRight className="ml-2 h-4 w-4" />
                                </Button>
                            </Link>
                        </div>
                    </div>
                ) : (
                    // Parent Category - Show Subcategories
                    <div>
                        <h2 className="text-2xl font-bold mb-6 text-center">Select a Specific Service</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {category.subcategories.map((sub) => (
                                <Link
                                    key={sub.id}
                                    href={`/request?category=${category.slug}&subcategory=${sub.slug}`}
                                >
                                    <Card className="hover:border-primary/50 hover:shadow-md transition-all cursor-pointer h-full">
                                        <CardContent className="p-6 flex items-center justify-between">
                                            <span className="font-medium text-lg">{sub.name}</span>
                                            <ArrowRight className="h-4 w-4 text-muted-foreground" />
                                        </CardContent>
                                    </Card>
                                </Link>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
