'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Send, Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface Message {
    id: string;
    content: string;
    senderType: 'CUSTOMER' | 'PROVIDER';
    createdAt: string;
}

interface ChatInterfaceProps {
    threadId: string;
    currentUserType: 'CUSTOMER' | 'PROVIDER';
    recipientName: string;
}

export function ChatInterface({ threadId, currentUserType, recipientName }: ChatInterfaceProps) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const fetchMessages = useCallback(async () => {
        try {
            const res = await fetch(`/api/messages?threadId=${threadId}&limit=50`);
            if (res.ok) {
                const data = await res.json();
                setMessages(data.messages);
            }
        } catch (error) {
            console.error('Error fetching messages:', error);
        } finally {
            setLoading(false);
        }
    }, [threadId]);

    useEffect(() => {
        fetchMessages();
        const interval = setInterval(fetchMessages, 10000); // 10s polling
        return () => clearInterval(interval);
    }, [fetchMessages]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim()) return;

        setSending(true);
        try {
            const res = await fetch('/api/messages', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    threadId,
                    content: newMessage,
                }),
            });

            if (res.ok) {
                const message = await res.json();
                setMessages((prev) => [...prev, message]);
                setNewMessage('');
            }
        } catch (error) {
            console.error('Error sending message:', error);
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="flex flex-col h-[600px] border rounded-lg bg-white overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b bg-slate-50">
                <h3 className="font-semibold">Conversation with {recipientName}</h3>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {loading ? (
                    <div className="flex justify-center py-8">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                ) : messages.length === 0 ? (
                    <div className="text-center text-muted-foreground py-12">
                        No messages yet. Start the conversation!
                    </div>
                ) : (
                    messages.map((message) => {
                        const isMe = message.senderType === currentUserType;
                        return (
                            <div
                                key={message.id}
                                className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                            >
                                <div
                                    className={`max-w-[75%] rounded-lg px-4 py-2 ${isMe
                                        ? 'bg-primary text-primary-foreground'
                                        : 'bg-slate-100 text-slate-900'
                                        }`}
                                >
                                    <p className="whitespace-pre-wrap">{message.content}</p>
                                    <p
                                        className={`text-xs mt-1 ${isMe ? 'text-primary-foreground/70' : 'text-slate-500'
                                            }`}
                                    >
                                        {formatDistanceToNow(new Date(message.createdAt), {
                                            addSuffix: true,
                                        })}
                                    </p>
                                </div>
                            </div>
                        );
                    })
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <form onSubmit={handleSend} className="p-4 border-t bg-slate-50">
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type a message..."
                        className="flex-1 px-4 py-2 border rounded-full focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    <Button type="submit" disabled={sending || !newMessage.trim()} size="icon" className="rounded-full">
                        {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    </Button>
                </div>
            </form>
        </div>
    );
}
