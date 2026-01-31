'use client';

import { useState, useEffect } from 'react';
import { Loader2, Bell, Settings, Check, Mail, Smartphone, BellRing } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';

interface Notification {
    id: string;
    title: string;
    message: string;
    readAt: string | null;
    createdAt: string;
    type: string;
}

interface NotificationSettings {
    emailMarketing: boolean;
    emailTransactional: boolean;
    emailQuotes: boolean;
    emailBookings: boolean;
    emailReviews: boolean;
    smsTransactional: boolean;
    smsReminders: boolean;
    pushEnabled: boolean;
    pushQuotes: boolean;
    pushBookings: boolean;
    pushMessages: boolean;
}

export default function NotificationsPage() {
    const { toast } = useToast();
    const [activeTab, setActiveTab] = useState('list');

    // List State
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const [unreadCount, setUnreadCount] = useState(0);

    // Settings State
    const [settings, setSettings] = useState<NotificationSettings | null>(null);
    const [saving, setSaving] = useState(false);

    // Fetch Notifications
    const fetchNotifications = async () => {
        try {
            const res = await fetch('/api/notifications');
            if (res.ok) {
                const data = await res.json();
                setNotifications(data.notifications);
                setUnreadCount(data.unreadCount);
            }
        } catch (error) {
            console.error('Error fetching notifications');
        } finally {
            setLoading(false);
        }
    };

    // Fetch Settings
    const fetchSettings = async () => {
        try {
            const res = await fetch('/api/notifications/settings');
            if (res.ok) {
                const data = await res.json();
                setSettings(data);
            }
        } catch (error) {
            console.error('Error fetching settings');
        }
    };

    useEffect(() => {
        fetchNotifications();
        fetchSettings();
    }, []);

    const markAllRead = async () => {
        try {
            await fetch('/api/notifications/read-all', { method: 'POST' });
            // Optimistic update
            setNotifications(prev => prev.map(n => ({ ...n, readAt: new Date().toISOString() })));
            setUnreadCount(0);
            toast({ title: 'Marked all as read' });
        } catch (error) {
            toast({ title: 'Error', variant: 'destructive' });
        }
    };

    const updateSetting = async (key: keyof NotificationSettings, value: boolean) => {
        if (!settings) return;

        // Optimistic update
        const newSettings = { ...settings, [key]: value };
        setSettings(newSettings);
        setSaving(true);

        try {
            const res = await fetch('/api/notifications/settings', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ [key]: value }),
            });

            if (!res.ok) throw new Error();
        } catch (error) {
            // Revert on error
            setSettings(settings);
            toast({ title: 'Failed to update setting', variant: 'destructive' });
        } finally {
            setSaving(false);
        }
    };

    if (loading && !settings) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Notifications</h1>
                    <p className="text-muted-foreground">
                        Stay updated on your requests and bookings.
                    </p>
                </div>
            </div>

            <Tabs defaultValue="list" className="w-full" onValueChange={setActiveTab}>
                <TabsList>
                    <TabsTrigger value="list" className="gap-2">
                        <Bell className="w-4 h-4" />
                        List
                        {unreadCount > 0 && (
                            <span className="bg-primary text-primary-foreground text-xs rounded-full px-1.5 min-w-[1.25rem]">
                                {unreadCount}
                            </span>
                        )}
                    </TabsTrigger>
                    <TabsTrigger value="settings" className="gap-2">
                        <Settings className="w-4 h-4" />
                        Preferences
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="list" className="mt-6">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle>Recent Notifications</CardTitle>
                            {unreadCount > 0 && (
                                <Button variant="ghost" size="sm" onClick={markAllRead}>
                                    <Check className="w-4 h-4 mr-2" />
                                    Mark all read
                                </Button>
                            )}
                        </CardHeader>
                        <CardContent>
                            {notifications.length === 0 ? (
                                <div className="text-center py-12 text-muted-foreground">
                                    No notifications yet.
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {notifications.map((notification) => (
                                        <div
                                            key={notification.id}
                                            className={`p-4 rounded-lg border ${!notification.readAt ? 'bg-blue-50/50 dark:bg-blue-900/10 border-blue-100' : 'bg-card'}`}
                                        >
                                            <div className="flex justify-between items-start gap-4">
                                                <div>
                                                    <h4 className={`font-semibold ${!notification.readAt ? 'text-primary' : ''}`}>
                                                        {notification.title}
                                                    </h4>
                                                    <p className="text-sm text-foreground/80 mt-1">
                                                        {notification.message}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground mt-2">
                                                        {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                                                    </p>
                                                </div>
                                                {!notification.readAt && (
                                                    <span className="w-2 h-2 rounded-full bg-primary mt-2"></span>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="settings" className="mt-6">
                    <div className="grid gap-6">
                        {settings && (
                            <>
                                <Card>
                                    <CardHeader>
                                        <div className="flex items-center gap-2">
                                            <Mail className="w-5 h-5 text-primary" />
                                            <CardTitle>Email Notifications</CardTitle>
                                        </div>
                                        <CardDescription>
                                            Choose which emails you want to receive.
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-6">
                                        <div className="flex items-center justify-between">
                                            <div className="space-y-0.5">
                                                <Label>Quote Updates</Label>
                                                <p className="text-sm text-muted-foreground">Receive emails when you get new quotes.</p>
                                            </div>
                                            <Switch
                                                checked={settings.emailQuotes}
                                                onCheckedChange={(c) => updateSetting('emailQuotes', c)}
                                            />
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <div className="space-y-0.5">
                                                <Label>Booking Updates</Label>
                                                <p className="text-sm text-muted-foreground">Receive emails about your bookings status.</p>
                                            </div>
                                            <Switch
                                                checked={settings.emailBookings}
                                                onCheckedChange={(c) => updateSetting('emailBookings', c)}
                                            />
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <div className="space-y-0.5">
                                                <Label>Marketing</Label>
                                                <p className="text-sm text-muted-foreground">Receive updates about new features and promos.</p>
                                            </div>
                                            <Switch
                                                checked={settings.emailMarketing}
                                                onCheckedChange={(c) => updateSetting('emailMarketing', c)}
                                            />
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader>
                                        <div className="flex items-center gap-2">
                                            <Smartphone className="w-5 h-5 text-primary" />
                                            <CardTitle>SMS Notifications</CardTitle>
                                        </div>
                                        <CardDescription>
                                            Receive text messages for urgent updates.
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-6">
                                        <div className="flex items-center justify-between">
                                            <div className="space-y-0.5">
                                                <Label>Transactional SMS</Label>
                                                <p className="text-sm text-muted-foreground">Important updates about your service.</p>
                                            </div>
                                            <Switch
                                                checked={settings.smsTransactional}
                                                onCheckedChange={(c) => updateSetting('smsTransactional', c)}
                                            />
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <div className="space-y-0.5">
                                                <Label>Reminders</Label>
                                                <p className="text-sm text-muted-foreground">Get reminded before a scheduled booking.</p>
                                            </div>
                                            <Switch
                                                checked={settings.smsReminders}
                                                onCheckedChange={(c) => updateSetting('smsReminders', c)}
                                            />
                                        </div>
                                    </CardContent>
                                </Card>
                            </>
                        )}
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
