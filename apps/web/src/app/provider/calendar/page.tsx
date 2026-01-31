'use client';

import { useState, useEffect, useCallback } from 'react';
import { Loader2, ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { startOfWeek, endOfWeek, addDays, format, isSameDay, addWeeks, subWeeks, parseISO } from 'date-fns';

interface Booking {
    id: string;
    scheduledDate: string;
    scheduledTime: string;
    estimatedDuration: number;
    status: string;
    title: string;
    customer: {
        user: { firstName?: string; lastName?: string }
    };
}

interface CalendarData {
    bookings: Booking[];
    availability: any[];
    timeOffs: any[];
}

export default function CalendarPage() {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [view, setView] = useState<'week' | 'day'>('week');
    const [data, setData] = useState<CalendarData | null>(null);
    const [loading, setLoading] = useState(true);

    const startDate = startOfWeek(currentDate, { weekStartsOn: 1 }); // Monday
    const endDate = endOfWeek(currentDate, { weekStartsOn: 1 });

    const fetchCalendar = useCallback(async () => {
        setLoading(true);
        try {
            const start = startDate.toISOString();
            const end = endDate.toISOString();
            const res = await fetch(`/api/provider/calendar?start=${start}&end=${end}`);
            if (res.ok) {
                const json = await res.json();
                setData(json);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    }, [startDate, endDate]);

    useEffect(() => {
        fetchCalendar();
    }, [fetchCalendar]);

    const navigate = (direction: 'prev' | 'next') => {
        setCurrentDate(prev => direction === 'next' ? addWeeks(prev, 1) : subWeeks(prev, 1));
    };

    const days = [];
    let day = startDate;
    for (let i = 0; i < 7; i++) {
        days.push(day);
        day = addDays(day, 1);
    }

    if (loading && !data) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-6 h-[calc(100vh-100px)] flex flex-col">
            <div className="flex items-center justify-between shrink-0">
                <div>
                    <h1 className="text-3xl font-bold">Calendar</h1>
                    <p className="text-muted-foreground">Manage your schedule</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon" onClick={() => navigate('prev')}>
                        <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <div className="font-medium min-w-[150px] text-center">
                        {format(startDate, 'MMM d')} - {format(endDate, 'MMM d, yyyy')}
                    </div>
                    <Button variant="outline" size="icon" onClick={() => navigate('next')}>
                        <ChevronRight className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" onClick={() => setCurrentDate(new Date())}>
                        Today
                    </Button>
                </div>
            </div>

            <div className="flex-1 grid grid-cols-7 gap-px bg-slate-200 dark:bg-slate-800 border rounded-lg overflow-hidden min-h-0">
                {days.map((dayDate, i) => {
                    const isToday = isSameDay(dayDate, new Date());
                    const bookingsForDay = data?.bookings.filter(b =>
                        isSameDay(parseISO(b.scheduledDate), dayDate)
                    ) || [];

                    return (
                        <div key={i} className="bg-white dark:bg-slate-950 flex flex-col min-h-0">
                            <div className={`p-2 border-b text-center text-sm font-medium ${isToday ? 'bg-primary/5 text-primary' : 'bg-slate-50 dark:bg-slate-900'}`}>
                                <div>{format(dayDate, 'EEE')}</div>
                                <div className={`text-xl ${isToday ? 'font-bold' : ''}`}>{format(dayDate, 'd')}</div>
                            </div>
                            <div className="flex-1 p-2 space-y-2 overflow-y-auto">
                                {bookingsForDay.length === 0 ? (
                                    <div className="h-full flex items-center justify-center">

                                    </div>
                                ) : (
                                    bookingsForDay.map(booking => (
                                        <div
                                            key={booking.id}
                                            className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded p-2 text-xs hover:shadow-md transition-shadow cursor-pointer group"
                                        >
                                            <div className="font-semibold text-blue-700 dark:text-blue-300 flex items-center gap-1 mb-1">
                                                <Clock className="w-3 h-3" />
                                                {booking.scheduledTime}
                                            </div>
                                            <div className="font-medium truncate" title={booking.title}>{booking.title}</div>
                                            <div className="text-muted-foreground flex items-center gap-1 mt-1 truncate">
                                                <User className="w-3 h-3" />
                                                {booking.customer.user.firstName}
                                            </div>
                                            <div className={`mt-1 inline-block px-1.5 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider
                                                ${booking.status === 'CONFIRMED' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}
                                            `}>
                                                {booking.status}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
