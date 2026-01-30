import { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { NotificationBell } from '@/components/notifications/NotificationBell';

export const metadata: Metadata = {
    title: 'Provider Dashboard | ServiceMatch',
};

export default async function ProviderLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await getSession();

    if (!session?.user) {
        redirect('/auth/signin?callbackUrl=/provider');
    }

    if (session.user.role !== 'PROVIDER' && session.user.role !== 'ADMIN') {
        redirect('/dashboard');
    }

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Provider Header */}
            <header className="bg-white border-b sticky top-0 z-40">
                <div className="container mx-auto px-4">
                    <nav className="flex items-center gap-6 h-16 overflow-x-auto">
                        <NavLink href="/provider">Dashboard</NavLink>
                        <NavLink href="/provider/leads">Leads</NavLink>
                        <NavLink href="/provider/quotes">Quotes</NavLink>
                        <NavLink href="/provider/bookings">Bookings</NavLink>
                        <NavLink href="/provider/calendar">Calendar</NavLink>
                        <NavLink href="/provider/messages">Messages</NavLink>
                        <NavLink href="/provider/reviews">Reviews</NavLink>
                        <NavLink href="/provider/earnings">Earnings</NavLink>
                        <div className="flex-1"></div>
                        <NotificationBell />
                        <Link href="/provider/settings" className="text-sm font-medium text-muted-foreground hover:text-foreground whitespace-nowrap transition-colors py-2 border-b-2 border-transparent hover:border-primary">
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
