import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import '@/styles/globals.css';
import { Providers } from './providers';
import { Toaster } from '@/components/ui/toaster';
import { Navbar } from '@/components/layout/Navbar';
import { SpeedInsights } from '@vercel/speed-insights/next';

const inter = Inter({
    subsets: ['latin'],
    variable: '--font-inter',
});

export const metadata: Metadata = {
    title: {
        default: 'Serious Control - Find Trusted Local Professionals',
        template: '%s | Serious Control',
    },
    description:
        'Find trusted tradespeople and service providers in your area. Get free quotes from verified plumbers, electricians, cleaners, and more. Book with confidence.',
    keywords: [
        'local services',
        'tradespeople',
        'plumber',
        'electrician',
        'cleaner',
        'handyman',
        'UK services',
        'home services',
        'find tradesman',
        'get quotes',
    ],
    authors: [{ name: 'Serious Control' }],
    creator: 'Serious Control',
    publisher: 'Serious Control',
    metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://servicematch.co.uk'),
    openGraph: {
        type: 'website',
        locale: 'en_GB',
        url: '/',
        title: 'Serious Control - Find Trusted Local Professionals',
        description:
            'Find trusted tradespeople and service providers in your area. Get free quotes from verified professionals.',
        siteName: 'Serious Control',
        images: [
            {
                url: '/og-image.png',
                width: 1200,
                height: 630,
                alt: 'Serious Control - Find Trusted Local Professionals',
            },
        ],
    },
    twitter: {
        card: 'summary_large_image',
        title: 'Serious Control - Find Trusted Local Professionals',
        description:
            'Find trusted tradespeople and service providers in your area. Get free quotes from verified professionals.',
        images: ['/og-image.png'],
    },
    robots: {
        index: true,
        follow: true,
        googleBot: {
            index: true,
            follow: true,
            'max-video-preview': -1,
            'max-image-preview': 'large',
            'max-snippet': -1,
        },
    },
    manifest: '/manifest.json',
    icons: {
        icon: '/favicon.ico',
        shortcut: '/favicon-16x16.png',
        apple: '/apple-touch-icon.png',
    },
};

export const viewport: Viewport = {
    themeColor: [
        { media: '(prefers-color-scheme: light)', color: '#ffffff' },
        { media: '(prefers-color-scheme: dark)', color: '#0f172a' },
    ],
    width: 'device-width',
    initialScale: 1,
    maximumScale: 5,
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en" suppressHydrationWarning>
            <body className={`${inter.variable} font-sans antialiased`}>
                <Providers>
                    <Navbar />
                    {children}
                    <Toaster />
                </Providers>
                <SpeedInsights />
            </body>
        </html>
    );
}
