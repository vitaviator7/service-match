import { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { NotificationBell } from '@/components/notifications/NotificationBell';

export const metadata: Metadata = {
    title: 'Dashboard | ServiceMatch',
};

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await getSession();

    if (!session?.user) {
        redirect('/auth/signin?callbackUrl=/dashboard');
    }

    // Redirect providers to their dashboard
    if (session.user.role === 'PROVIDER') {
        redirect('/provider');
    }

    // Redirect admins to admin dashboard
    if (session.user.role === 'ADMIN') {
        redirect('/admin');
    }

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Dashboard Header */}
            <header className="bg-white border-b sticky top-0 z-40">
                <div className="container mx-auto px-4">
                    <nav className="flex items-center gap-6 h-16 overflow-x-auto">
                        <NavLink href="/dashboard">Overview</NavLink>
                        <NavLink href="/dashboard/quotes">Quotes</NavLink>
                        <NavLink href="/dashboard/bookings">Bookings</NavLink>
                        <NavLink href="/dashboard/messages">Messages</NavLink>
                        <NavLink href="/dashboard/reviews">Reviews</NavLink>
                        <NavLink href="/dashboard/favorites">Favorites</NavLink>
                        <div className="flex-1"></div>
                        <NotificationBell />
                        <Link href="/dashboard/settings" className="text-sm font-medium text-muted-foreground hover:text-foreground whitespace-nowrap transition-colors py-2 border-b-2 border-transparent hover:border-primary">
                            Settings
                        </Link>
                    </nav>
                </div>
            </header>

            {children}
        </div>
    );
}

function NavLink({
    href,
    children,
}: {
    href: string;
    children: React.ReactNode;
}) {
    return (
        <Link
            href={href}
            className="text-sm font-medium text-muted-foreground hover:text-foreground whitespace-nowrap transition-colors py-2 border-b-2 border-transparent hover:border-primary"
        >
            {children}
        </Link>
    );
}
