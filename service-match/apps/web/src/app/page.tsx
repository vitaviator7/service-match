import Link from 'next/link';
import { Search, Shield, Star, Clock, CheckCircle, ArrowRight, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';

// Sample categories for homepage (would come from database in production)
const popularCategories = [
    { name: 'Plumbing', slug: 'plumbing', icon: '🔧', color: 'bg-blue-500' },
    { name: 'Electrical', slug: 'electrical', icon: '⚡', color: 'bg-yellow-500' },
    { name: 'Cleaning', slug: 'cleaning', icon: '🧹', color: 'bg-green-500' },
    { name: 'Handyman', slug: 'handyman', icon: '🛠️', color: 'bg-orange-500' },
    { name: 'Gardening', slug: 'gardening', icon: '🌿', color: 'bg-emerald-500' },
    { name: 'Painting', slug: 'painting-decorating', icon: '🎨', color: 'bg-purple-500' },
    { name: 'Heating', slug: 'heating-boilers', icon: '🔥', color: 'bg-red-500' },
    { name: 'Locksmith', slug: 'locksmith', icon: '🔐', color: 'bg-slate-500' },
];

const trustIndicators = [
    { icon: Shield, label: 'Verified Professionals', value: '15,000+' },
    { icon: Star, label: 'Average Rating', value: '4.8/5' },
    { icon: CheckCircle, label: 'Jobs Completed', value: '250,000+' },
    { icon: Clock, label: 'Avg Response Time', value: '< 1 hour' },
];

export default function HomePage() {
    return (
        <div className="min-h-screen">


            {/* Hero Section */}
            <section className="relative overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800">
                <div className="absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.5))] dark:bg-grid-slate-700/25" />

                <div className="container mx-auto px-4 py-20 md:py-32 relative">
                    <div className="max-w-3xl mx-auto text-center">
                        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
                            Find Trusted Local{' '}
                            <span className="gradient-text">Professionals</span>
                        </h1>
                        <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
                            Connect with verified tradespeople in your area. Get free quotes, read reviews, and book with confidence.
                        </p>

                        {/* Search Box */}
                        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-4 md:p-6 max-w-2xl mx-auto">
                            <form className="flex flex-col md:flex-row gap-3">
                                <div className="flex-1">
                                    <label htmlFor="service" className="sr-only">What do you need?</label>
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                                        <Input
                                            id="service"
                                            placeholder="What do you need? e.g. plumber, cleaner..."
                                            className="pl-10 h-12 text-base"
                                        />
                                    </div>
                                </div>
                                <div className="md:w-48">
                                    <label htmlFor="postcode" className="sr-only">Postcode</label>
                                    <Input
                                        id="postcode"
                                        placeholder="Your postcode"
                                        className="h-12 text-base"
                                    />
                                </div>
                                <Button type="submit" size="xl" className="md:w-auto">
                                    Find Pros
                                    <ArrowRight className="ml-2 h-5 w-5" />
                                </Button>
                            </form>
                        </div>

                        {/* Trust Indicators */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-12 max-w-3xl mx-auto">
                            {trustIndicators.map((item) => (
                                <div key={item.label} className="text-center">
                                    <item.icon className="h-6 w-6 mx-auto mb-2 text-primary" />
                                    <p className="text-2xl font-bold">{item.value}</p>
                                    <p className="text-sm text-muted-foreground">{item.label}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* Popular Categories */}
            <section className="py-16 md:py-24">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl font-bold mb-4">Popular Services</h2>
                        <p className="text-muted-foreground max-w-2xl mx-auto">
                            Browse our most requested service categories or search for exactly what you need.
                        </p>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
                        {popularCategories.map((category) => (
                            <Link
                                key={category.slug}
                                href={`/services/${category.slug}`}
                                className="group"
                            >
                                <Card className="card-hover text-center p-6 h-full">
                                    <CardContent className="p-0">
                                        <div className={`w-16 h-16 rounded-2xl ${category.color} text-3xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform`}>
                                            {category.icon}
                                        </div>
                                        <h3 className="font-semibold">{category.name}</h3>
                                    </CardContent>
                                </Card>
                            </Link>
                        ))}
                    </div>

                    <div className="text-center mt-8">
                        <Link href="/services">
                            <Button variant="outline" size="lg">
                                View All Services
                                <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                        </Link>
                    </div>
                </div>
            </section>

            {/* How It Works */}
            <section className="py-16 md:py-24 bg-slate-50 dark:bg-slate-900">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl font-bold mb-4">How It Works</h2>
                        <p className="text-muted-foreground max-w-2xl mx-auto">
                            Getting the help you need is simple and stress-free.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
                        {[
                            {
                                step: '1',
                                title: 'Describe Your Job',
                                description: 'Tell us what you need and where you are. Add photos and details to get accurate quotes.',
                            },
                            {
                                step: '2',
                                title: 'Get Free Quotes',
                                description: 'Receive quotes from verified professionals in your area. Compare prices, reviews, and availability.',
                            },
                            {
                                step: '3',
                                title: 'Book with Confidence',
                                description: 'Choose your preferred provider and book securely. Pay only when the job is complete.',
                            },
                        ].map((item) => (
                            <div key={item.step} className="text-center">
                                <div className="w-12 h-12 rounded-full gradient-primary text-white text-xl font-bold flex items-center justify-center mx-auto mb-4">
                                    {item.step}
                                </div>
                                <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
                                <p className="text-muted-foreground">{item.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA for Providers */}
            <section className="py-16 md:py-24">
                <div className="container mx-auto px-4">
                    <div className="bg-gradient-to-br from-blue-600 to-cyan-500 rounded-3xl p-8 md:p-12 text-center text-white">
                        <h2 className="text-3xl md:text-4xl font-bold mb-4">
                            Grow Your Business with ServiceMatch
                        </h2>
                        <p className="text-lg text-blue-100 mb-8 max-w-2xl mx-auto">
                            Join thousands of professionals earning more with qualified leads.
                            Get verified, build your reputation, and win new customers.
                        </p>
                        <Link href="/provider/signup">
                            <Button size="xl" variant="secondary" className="bg-white text-blue-600 hover:bg-blue-50">
                                Join as a Provider
                                <ArrowRight className="ml-2 h-5 w-5" />
                            </Button>
                        </Link>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-slate-900 text-slate-200 py-12">
                <div className="container mx-auto px-4">
                    <div className="grid md:grid-cols-4 gap-8 mb-8">
                        <div>
                            <Link href="/" className="flex items-center gap-2 mb-4">
                                <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center">
                                    <Zap className="w-6 h-6 text-white" />
                                </div>
                                <span className="text-xl font-bold text-white">ServiceMatch</span>
                            </Link>
                            <p className="text-slate-400 text-sm">
                                The UK's trusted marketplace for local services. Find verified professionals for any job.
                            </p>
                        </div>

                        <div>
                            <h4 className="font-semibold text-white mb-4">Services</h4>
                            <ul className="space-y-2 text-sm text-slate-400">
                                <li><Link href="/services/plumbing" className="hover:text-white transition-colors">Plumbing</Link></li>
                                <li><Link href="/services/electrical" className="hover:text-white transition-colors">Electrical</Link></li>
                                <li><Link href="/services/cleaning" className="hover:text-white transition-colors">Cleaning</Link></li>
                                <li><Link href="/services" className="hover:text-white transition-colors">All Services</Link></li>
                            </ul>
                        </div>

                        <div>
                            <h4 className="font-semibold text-white mb-4">Company</h4>
                            <ul className="space-y-2 text-sm text-slate-400">
                                <li><Link href="/about" className="hover:text-white transition-colors">About Us</Link></li>
                                <li><Link href="/how-it-works" className="hover:text-white transition-colors">How It Works</Link></li>
                                <li><Link href="/contact" className="hover:text-white transition-colors">Contact</Link></li>
                                <li><Link href="/careers" className="hover:text-white transition-colors">Careers</Link></li>
                            </ul>
                        </div>

                        <div>
                            <h4 className="font-semibold text-white mb-4">Legal</h4>
                            <ul className="space-y-2 text-sm text-slate-400">
                                <li><Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link></li>
                                <li><Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
                                <li><Link href="/cookies" className="hover:text-white transition-colors">Cookie Policy</Link></li>
                            </ul>
                        </div>
                    </div>

                    <div className="border-t border-slate-800 pt-8 text-center text-sm text-slate-400">
                        <p>© {new Date().getFullYear()} ServiceMatch Ltd. All rights reserved.</p>
                    </div>
                </div>
            </footer>
        </div>
    );
}
