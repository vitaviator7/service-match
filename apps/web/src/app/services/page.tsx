import { Metadata } from 'next';
import Link from 'next/link';
import { prisma } from '@service-match/db';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowRight, Wrench, Zap, Home, Paintbrush, Truck, MoreHorizontal } from 'lucide-react';

export const metadata: Metadata = {
    title: 'Browse Services | ServiceMatch',
    description: 'Find trusted local professionals for any job.',
};

// Helper to get icon based on slug
const getIcon = (slug: string) => {
    if (slug.includes('plumb')) return <Wrench className="h-8 w-8 mb-4 text-blue-500" />;
    if (slug.includes('electric')) return <Zap className="h-8 w-8 mb-4 text-yellow-500" />;
    if (slug.includes('clean')) return <Home className="h-8 w-8 mb-4 text-green-500" />;
    if (slug.includes('paint')) return <Paintbrush className="h-8 w-8 mb-4 text-purple-500" />;
    if (slug.includes('remov')) return <Truck className="h-8 w-8 mb-4 text-red-500" />;
    return <MoreHorizontal className="h-8 w-8 mb-4 text-slate-500" />;
};

export default async function ServicesPage() {
    const categories = await prisma.category.findMany({
        where: {
            isActive: true,
        },
        orderBy: { displayOrder: 'asc' },
        include: {
            _count: {
                select: { subcategories: true },
            },
        },
    });

    return (
        <div className="container mx-auto px-4 py-12 min-h-screen">
            <div className="text-center mb-16">
                <h1 className="text-4xl font-bold mb-4">Browse Services</h1>
                <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                    Select a category to find the right professional for your needs.
                </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {categories.map((category) => (
                    <Link key={category.id} href={`/services/${category.slug}`} className="group">
                        <Card className="h-full hover:border-primary/50 hover:shadow-lg transition-all">
                            <CardContent className="p-8 flex flex-col items-center text-center">
                                {getIcon(category.slug)}
                                <h3 className="text-lg font-semibold mb-2 group-hover:text-primary transition-colors">
                                    {category.name}
                                </h3>
                                {(category.description) && (
                                    <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                                        {category.description}
                                    </p>
                                )}
                                <div className="mt-auto flex items-center text-sm font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                                    View Services <ArrowRight className="ml-1 h-4 w-4" />
                                </div>
                            </CardContent>
                        </Card>
                    </Link>
                ))}
            </div>

            {categories.length === 0 && (
                <div className="text-center text-muted-foreground py-12">
                    <p>No services found. Please run the database seed.</p>
                </div>
            )}
        </div>
    );
}
