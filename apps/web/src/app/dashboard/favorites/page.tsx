'use client';

import { useState, useEffect } from 'react';
import { Loader2, Heart, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Provider, ProviderCard } from '@/components/providers/ProviderCard';

export default function FavoritesPage() {
    const [favorites, setFavorites] = useState<Provider[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/favorites')
            .then((res) => {
                if (res.ok) return res.json();
                throw new Error('Failed to fetch favorites');
            })
            .then((data) => {
                setFavorites(data.favorites);
            })
            .catch((err) => console.error(err))
            .finally(() => setLoading(false));
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    if (favorites.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh] text-center px-4">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-6">
                    <Heart className="w-8 h-8 text-slate-400" />
                </div>
                <h1 className="text-2xl font-bold mb-2">No favorites yet</h1>
                <p className="text-muted-foreground max-w-md mb-8">
                    Save providers you love to access them quickly later.
                </p>
                <Link href="/search">
                    <Button>
                        <Search className="w-4 h-4 mr-2" />
                        Find Providers
                    </Button>
                </Link>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold">My Favorites</h1>
                <p className="text-muted-foreground">
                    Providers you have saved for later.
                </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6">
                {favorites.map((provider) => (
                    <div key={provider.id} className="h-full">
                        <ProviderCard provider={provider} />
                    </div>
                ))}
            </div>
        </div>
    );
}
