'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Clock, Zap, ArrowRight, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const MOCK_OPPORTUNITIES = [
    {
        id: 1,
        proName: 'David M.',
        role: 'Electrician',
        action: 'Finishing job',
        location: '0.3 miles away',
        discount: '15% OFF',
        expiresIn: 12, // minutes
        avatarColor: 'bg-yellow-100 text-yellow-700'
    },
    {
        id: 2,
        proName: 'Sarah K.',
        role: 'Plumber',
        action: 'En route to area',
        location: '0.8 miles away',
        discount: 'Free Call-out',
        expiresIn: 25,
        avatarColor: 'bg-blue-100 text-blue-700'
    },
    {
        id: 3,
        proName: 'GreenClean Co.',
        role: 'Cleaner',
        action: 'Gap in schedule',
        location: '1.2 miles away',
        discount: '£20 OFF',
        expiresIn: 45,
        avatarColor: 'bg-green-100 text-green-700'
    }
];

export default function RouteMatch() {
    const [opportunities, setOpportunities] = useState(MOCK_OPPORTUNITIES);

    // Simulate ticking clock
    useEffect(() => {
        const timer = setInterval(() => {
            setOpportunities(prev => prev.map(opp => ({
                ...opp,
                expiresIn: opp.expiresIn > 1 ? opp.expiresIn : 59 // Reset loop for demo
            })));
        }, 60000); // Update every minute
        return () => clearInterval(timer);
    }, []);

    return (
        <section className="py-12 bg-slate-50 dark:bg-slate-900 overflow-hidden">
            <div className="container mx-auto px-4">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <Badge variant="outline" className="border-blue-500 text-blue-600 bg-blue-50">
                                RouteMatch™ Technology
                            </Badge>
                            <span className="flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-green-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                            </span>
                            <span className="text-xs font-medium text-green-600">Live Activity</span>
                        </div>
                        <h2 className="text-3xl font-bold">Nearby Opportunities</h2>
                        <p className="text-muted-foreground mt-1">
                            Professionals working in your neighborhood right now. Book them to save travel costs.
                        </p>
                    </div>
                </div>

                <div className="grid md:grid-cols-3 gap-6">
                    <AnimatePresence>
                        {opportunities.map((opp, index) => (
                            <motion.div
                                key={opp.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                            >
                                <Card className="p-5 border-l-4 border-l-blue-500 hover:shadow-lg transition-shadow relative overflow-hidden group">
                                    {/* Abstract Map Background Effect */}
                                    <div className="absolute top-0 right-0 w-32 h-32 opacity-5 pointer-events-none">
                                        <svg viewBox="0 0 100 100" className="w-full h-full text-slate-900">
                                            <path d="M10 10 H 90 V 90 H 10 L 10 10" fill="none" stroke="currentColor" strokeWidth="2" />
                                            <path d="M30 10 V 90 M 50 10 V 90 M 70 10 V 90" fill="none" stroke="currentColor" strokeWidth="1" />
                                            <path d="M10 30 H 90 M 10 50 H 90 M 10 70 H 90" fill="none" stroke="currentColor" strokeWidth="1" />
                                        </svg>
                                    </div>

                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${opp.avatarColor}`}>
                                                {opp.role.charAt(0)}
                                            </div>
                                            <div>
                                                <h4 className="font-semibold">{opp.role}</h4>
                                                <div className="text-sm text-muted-foreground flex items-center gap-1">
                                                    <User className="w-3 h-3" /> {opp.proName}
                                                </div>
                                            </div>
                                        </div>
                                        <Badge variant="destructive" className="animate-pulse">
                                            {opp.discount}
                                        </Badge>
                                    </div>

                                    <div className="space-y-3 mb-4">
                                        <div className="flex items-center text-sm text-slate-600 dark:text-slate-300">
                                            <MapPin className="w-4 h-4 mr-2 text-blue-500" />
                                            {opp.action} • <strong>{opp.location}</strong>
                                        </div>
                                        <div className="flex items-center text-sm text-orange-600 dark:text-orange-400 font-medium">
                                            <Clock className="w-4 h-4 mr-2" />
                                            Expires in {opp.expiresIn} mins
                                        </div>
                                    </div>

                                    <Button className="w-full group-hover:bg-blue-600 transition-colors">
                                        Grab this Slot
                                        <Zap className="w-4 h-4 ml-2 fill-current" />
                                    </Button>
                                </Card>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            </div>
        </section>
    );
}
