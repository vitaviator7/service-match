'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { ShieldCheck, Menu, User, LogOut, LayoutDashboard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export function Navbar() {
    const { data: session, status } = useSession();
    const pathname = usePathname();
    const isLoading = status === 'loading';

    // Hide navbar on dashboard/provider routes as they have their own layouts
    if (pathname?.startsWith('/dashboard') || pathname?.startsWith('/provider') || pathname?.startsWith('/admin')) {
        return null;
    }

    const dashboardLink = session?.user?.role === 'PROVIDER' ? '/provider' : '/dashboard';

    return (
        <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
            <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                <Link href="/" className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
                        <ShieldCheck className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-indigo-600 dark:from-white dark:to-slate-400">
                        Serious Control
                    </span>
                </Link>

                <nav className="hidden md:flex items-center gap-8">
                    <Link href="/services" className="text-sm font-medium hover:text-primary transition-colors">
                        Browse Services
                    </Link>
                    <Link href="/how-it-works" className="text-sm font-medium hover:text-primary transition-colors">
                        How it Works
                    </Link>
                    <Link href="/about" className="text-sm font-medium hover:text-primary transition-colors">
                        About Us
                    </Link>
                </nav>

                <div className="flex items-center gap-3">
                    {isLoading ? (
                        <div className="w-20 h-9 bg-muted animate-pulse rounded-md" />
                    ) : session ? (
                        <>
                            {/* Mobile Dashboard Link */}
                            <Link href={dashboardLink} className="md:hidden">
                                <Button variant="ghost" size="icon">
                                    <LayoutDashboard className="h-5 w-5" />
                                </Button>
                            </Link>

                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                                        <Avatar className="h-9 w-9">
                                            <AvatarImage src={session.user.image || ''} alt={session.user.name || ''} />
                                            <AvatarFallback>
                                                {session.user.name ? session.user.name.charAt(0).toUpperCase() : <User className="h-4 w-4" />}
                                            </AvatarFallback>
                                        </Avatar>
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="w-56" align="end" forceMount>
                                    <DropdownMenuLabel className="font-normal">
                                        <div className="flex flex-col space-y-1">
                                            <p className="text-sm font-medium leading-none">{session.user.name}</p>
                                            <p className="text-xs leading-none text-muted-foreground">
                                                {session.user.email}
                                            </p>
                                        </div>
                                    </DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem asChild>
                                        <Link href={dashboardLink} className="cursor-pointer">
                                            <LayoutDashboard className="mr-2 h-4 w-4" />
                                            Dashboard
                                        </Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem asChild>
                                        <Link href="/dashboard/settings" className="cursor-pointer">
                                            <User className="mr-2 h-4 w-4" />
                                            Profile Settings
                                        </Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                        className="cursor-pointer text-red-600 focus:text-red-600"
                                        onClick={() => signOut({ callbackUrl: '/' })}
                                    >
                                        <LogOut className="mr-2 h-4 w-4" />
                                        Sign out
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </>
                    ) : (
                        <>
                            <Link href="/auth/signin">
                                <Button variant="ghost" size="sm">
                                    Sign In
                                </Button>
                            </Link>
                            <Link href="/auth/signup">
                                <Button size="sm">
                                    Get Started
                                </Button>
                            </Link>
                        </>
                    )}
                </div>
            </div>
        </header>
    );
}
