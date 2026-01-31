import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Home, ArrowLeft, Search } from 'lucide-react';

export default function NotFound() {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 px-4 text-center">
            <div className="relative mb-8">
                <div className="text-[12rem] font-bold text-slate-200 leading-none select-none">
                    404
                </div>
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-24 h-24 bg-white rounded-2xl shadow-xl flex items-center justify-center border border-slate-100 animate-bounce">
                        <Search className="h-12 w-12 text-primary" />
                    </div>
                </div>
            </div>

            <h1 className="text-3xl font-bold mb-4">Page Not Found</h1>
            <p className="text-muted-foreground max-w-md mx-auto mb-10 text-lg">
                Sorry, we couldn't find the page you're looking for. It might have been moved, deleted, or never existed.
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-4">
                <Link href="/">
                    <Button size="lg" className="px-8 flex items-center gap-2">
                        <Home className="h-4 w-4" />
                        Go Home
                    </Button>
                </Link>
                <Button
                    variant="outline"
                    size="lg"
                    className="px-8 flex items-center gap-2"
                    onClick={() => window.history.back()}
                >
                    <ArrowLeft className="h-4 w-4" />
                    Go Back
                </Button>
            </div>

            <div className="mt-16 text-sm text-slate-400">
                <p>Need help? <Link href="/contact" className="text-primary hover:underline">Contact Support</Link></p>
            </div>
        </div>
    );
}
