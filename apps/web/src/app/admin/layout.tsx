import { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { NotificationBell } from '@/components/notifications/NotificationBell';

export const metadata: Metadata = {
    title: 'Admin | ServiceMatch',
};

export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await getSession();

    if (!session?.user || session.user.role !== 'ADMIN') {
        redirect('/auth/signin?callbackUrl=/admin');
    }

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Admin Header */}
            <header className="bg-slate-900 text-white sticky top-0 z-40">
                <div className="container mx-auto px-4">
                    <div className="flex items-center justify-between h-12">
                        <div className="flex items-center gap-6">
                            <span className="font-bold text-lg">ServiceMatch Admin</span>
                        </div>
                        <nav className="flex items-center gap-6 overflow-x-auto">
                            <AdminNavLink href="/admin">Dashboard</AdminNavLink>
                            <AdminNavLink href="/admin/users">Users</AdminNavLink>
                            <AdminNavLink href="/admin/providers">Providers</AdminNavLink>
                            <AdminNavLink href="/admin/bookings">Bookings</AdminNavLink>
                            <AdminNavLink href="/admin/disputes">Disputes</AdminNavLink>
                            <AdminNavLink href="/admin/payouts">Payouts</AdminNavLink>
                            <AdminNavLink href="/admin/reports">Reports</AdminNavLink>
                            <AdminNavLink href="/admin/settings">Settings</AdminNavLink>
                            <div className="text-slate-300">
                                <NotificationBell />
                            </div>
                        </nav>
                    </div>
                </div>
            </header>

            {children}
        </div>
    );
}

function AdminNavLink({
    href,
    children,
}: {
    href: string;
    children: React.ReactNode;
}) {
    return (
        <Link
            href={href}
            className="text-sm font-medium text-slate-300 hover:text-white whitespace-nowrap transition-colors py-2"
        >
            {children}
        </Link>
    );
}
