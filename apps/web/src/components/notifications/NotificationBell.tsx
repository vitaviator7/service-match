'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Bell, X, Check, MessageSquare, Star, Calendar, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatDistanceToNow } from 'date-fns';

interface Notification {
    id: string;
    type: string;
    title: string;
    message: string;
    readAt: string | null;
    createdAt: string;
    data?: Record<string, any>;
}

export function NotificationBell() {
    const { data: session } = useSession();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!session?.user) return;

        fetchNotifications();
        // Poll every 30 seconds
        const interval = setInterval(fetchNotifications, 30000);
        return () => clearInterval(interval);
    }, [session?.user]);

    const fetchNotifications = async () => {
        try {
            const response = await fetch('/api/notifications?limit=10');
            if (response.ok) {
                const data = await response.json();
                setNotifications(data.notifications);
                setUnreadCount(data.unreadCount);
            }
        } catch (error) {
            console.error('Error fetching notifications:', error);
        } finally {
            setLoading(false);
        }
    };

    const markAsRead = async (id: string) => {
        try {
            await fetch(`/api/notifications/${id}/read`, { method: 'POST' });
            setNotifications((prev) =>
                prev.map((n) => (n.id === id ? { ...n, readAt: new Date().toISOString() } : n))
            );
            setUnreadCount((prev) => Math.max(0, prev - 1));
        } catch (error) {
            console.error('Error marking notification as read:', error);
        }
    };

    const markAllAsRead = async () => {
        try {
            await fetch('/api/notifications/read-all', { method: 'POST' });
            setNotifications((prev) => prev.map((n) => ({ ...n, readAt: new Date().toISOString() })));
            setUnreadCount(0);
        } catch (error) {
            console.error('Error marking all notifications as read:', error);
        }
    };

    const getIcon = (type: string) => {
        switch (type) {
            case 'NEW_MESSAGE':
                return <MessageSquare className="h-4 w-4 text-blue-500" />;
            case 'NEW_REVIEW':
                return <Star className="h-4 w-4 text-amber-500" />;
            case 'NEW_BOOKING':
            case 'BOOKING_CONFIRMED':
            case 'BOOKING_CANCELLED':
                return <Calendar className="h-4 w-4 text-green-500" />;
            case 'PAYMENT_RECEIVED':
            case 'PAYOUT_SENT':
                return <DollarSign className="h-4 w-4 text-emerald-500" />;
            default:
                return <Bell className="h-4 w-4 text-slate-500" />;
        }
    };

    if (!session?.user) return null;

    return (
        <div className="relative">
            <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(!isOpen)}
                className="relative"
            >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </Button>

            {isOpen && (
                <>
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 z-40"
                        onClick={() => setIsOpen(false)}
                    />

                    {/* Dropdown */}
                    <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border z-50 overflow-hidden">
                        <div className="flex items-center justify-between p-4 border-b">
                            <h3 className="font-semibold">Notifications</h3>
                            {unreadCount > 0 && (
                                <button
                                    onClick={markAllAsRead}
                                    className="text-sm text-primary hover:underline"
                                >
                                    Mark all as read
                                </button>
                            )}
                        </div>

                        <div className="max-h-96 overflow-y-auto">
                            {loading ? (
                                <div className="p-8 text-center text-muted-foreground">
                                    Loading...
                                </div>
                            ) : notifications.length === 0 ? (
                                <div className="p-8 text-center text-muted-foreground">
                                    <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                    <p>No notifications yet</p>
                                </div>
                            ) : (
                                notifications.map((notification) => (
                                    <div
                                        key={notification.id}
                                        className={`p-4 border-b hover:bg-slate-50 cursor-pointer transition-colors ${!notification.readAt ? 'bg-blue-50/50' : ''
                                            }`}
                                        onClick={() => {
                                            if (!notification.readAt) {
                                                markAsRead(notification.id);
                                            }
                                        }}
                                    >
                                        <div className="flex gap-3">
                                            <div className="shrink-0 mt-0.5">
                                                {getIcon(notification.type)}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium text-sm">
                                                    {notification.title}
                                                </p>
                                                <p className="text-sm text-muted-foreground line-clamp-2">
                                                    {notification.message}
                                                </p>
                                                <p className="text-xs text-muted-foreground mt-1">
                                                    {formatDistanceToNow(
                                                        new Date(notification.createdAt),
                                                        { addSuffix: true }
                                                    )}
                                                </p>
                                            </div>
                                            {!notification.readAt && (
                                                <div className="w-2 h-2 rounded-full bg-blue-500 shrink-0 mt-2" />
                                            )}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        <div className="p-3 border-t bg-slate-50">
                            <a
                                href="/dashboard/notifications"
                                className="block text-center text-sm text-primary hover:underline"
                            >
                                View all notifications
                            </a>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}

export default NotificationBell;
