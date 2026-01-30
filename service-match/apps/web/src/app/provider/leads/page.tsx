'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Calendar, Clock, ArrowRight, Filter } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface Lead {
    id: string;
    category: { name: string };
    subcategory?: { name: string };
    postcode: string;
    city: string;
    urgency: string;
    createdAt: string;
    quoteCount: number;
    description: string;
}

export default function ProviderLeadsPage() {
    const [leads, setLeads] = useState<Lead[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchLeads();
    }, []);

    const fetchLeads = async () => {
        try {
            const response = await fetch('/api/provider/leads');
            if (response.ok) {
                const data = await response.json();
                setLeads(data.leads);
            }
        } catch (error) {
            console.error('Error fetching leads:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="container mx-auto px-4 py-8 flex items-center justify-center min-h-[50vh]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold">New Leads</h1>
                    <p className="text-muted-foreground mt-1">
                        Requests matching your services and location
                    </p>
                </div>
                <Button variant="outline">
                    <Filter className="h-4 w-4 mr-2" />
                    Filter
                </Button>
            </div>

            <div className="grid gap-4">
                {leads.length === 0 ? (
                    <Card>
                        <CardContent className="p-8 text-center">
                            <p className="text-muted-foreground">
                                No new leads found matching your criteria.
                            </p>
                        </CardContent>
                    </Card>
                ) : (
                    leads.map((lead) => (
                        <Card key={lead.id} className="hover:border-primary/50 transition-colors">
                            <CardContent className="p-6">
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                    <div className="flex-1">
                                        <div className="flex items-start justify-between mb-2">
                                            <h3 className="font-semibold text-lg">
                                                {lead.category.name}
                                                {lead.subcategory && ` - ${lead.subcategory.name}`}
                                            </h3>
                                            <Badge variant="secondary" className="bg-blue-50 text-blue-700 hover:bg-blue-100">
                                                {lead.urgency.replace('_', ' ')}
                                            </Badge>
                                        </div>

                                        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-3">
                                            <div className="flex items-center gap-1">
                                                <MapPin className="h-4 w-4" />
                                                {lead.city}, {lead.postcode.split(' ')[0]}...
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <Clock className="h-4 w-4" />
                                                Posted {formatDistanceToNow(new Date(lead.createdAt), { addSuffix: true })}
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <span className="font-medium text-foreground">{lead.quoteCount}</span>
                                                quotes so far
                                            </div>
                                        </div>

                                        <p className="text-sm line-clamp-2 text-slate-600">
                                            {lead.description}
                                        </p>
                                    </div>

                                    <div className="flex items-center gap-3 md:border-l md:pl-6">
                                        <Link href={`/provider/leads/${lead.id}`} className="w-full md:w-auto">
                                            <Button className="w-full">
                                                View Details
                                                <ArrowRight className="h-4 w-4 ml-2" />
                                            </Button>
                                        </Link>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
}
