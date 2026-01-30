'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { getPusherClient, channels, events } from '@/lib/pusher';
import {
    Send,
    Loader2,
    Image as ImageIcon,
    Paperclip,
    MoreVertical,
    Phone,
    AlertCircle,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface Message {
    id: string;
    senderType: 'CUSTOMER' | 'PROVIDER' | 'SYSTEM';
    content: string;
    createdAt: Date | string;
}

interface MessageThreadProps {
    threadId: string;
    otherPartyName: string;
    otherPartyAvatar?: string;
    isProvider?: boolean;
}

export function MessageThread({
    threadId,
    otherPartyName,
    otherPartyAvatar,
    isProvider = false,
}: MessageThreadProps) {
    const { data: session } = useSession();
    const [messages, setMessages] = useState<Message[]>([]);
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [newMessage, setNewMessage] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const myType = isProvider ? 'PROVIDER' : 'CUSTOMER';

    // Scroll to bottom
    const scrollToBottom = useCallback(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, []);

    // Fetch messages
    useEffect(() => {
        async function fetchMessages() {
            try {
                const response = await fetch(`/api/messages?threadId=${threadId}`);
                const data = await response.json();
                setMessages(data.messages);
            } catch (err) {
                setError('Failed to load messages');
            } finally {
                setLoading(false);
            }
        }

        fetchMessages();
    }, [threadId]);

    // Scroll on new messages
    useEffect(() => {
        scrollToBottom();
    }, [messages, scrollToBottom]);

    // Real-time updates via Pusher
    useEffect(() => {
        const pusher = getPusherClient();
        if (!pusher) return;

        const channel = pusher.subscribe(channels.thread(threadId));

        channel.bind(events.MESSAGE_NEW, (message: Message) => {
            setMessages((prev) => [...prev, message]);
        });

        channel.bind(
            events.MESSAGE_TYPING,
            (data: { userId: string; isTyping: boolean }) => {
                if (data.userId !== session?.user?.id) {
                    setIsTyping(data.isTyping);
                }
            }
        );

        return () => {
            channel.unbind_all();
            pusher.unsubscribe(channels.thread(threadId));
        };
    }, [threadId, session?.user?.id]);

    // Send message
    const handleSend = async () => {
        if (!newMessage.trim() || sending) return;

        const content = newMessage.trim();
        setNewMessage('');
        setSending(true);
        setError(null);

        // Optimistic update
        const tempMessage: Message = {
            id: `temp-${Date.now()}`,
            senderType: myType,
            content,
            createdAt: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, tempMessage]);

        try {
            const response = await fetch('/api/messages', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ threadId, content }),
            });

            if (!response.ok) throw new Error('Failed to send');

            const savedMessage = await response.json();

            // Replace temp with real
            setMessages((prev) =>
                prev.map((m) =>
                    m.id === tempMessage.id ? savedMessage : m
                )
            );
        } catch (err) {
            // Remove optimistic message on error
            setMessages((prev) => prev.filter((m) => m.id !== tempMessage.id));
            setError('Failed to send message');
            setNewMessage(content); // Restore message
        } finally {
            setSending(false);
            inputRef.current?.focus();
        }
    };

    // Handle enter key
    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-white rounded-xl shadow-lg overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 overflow-hidden">
                        {otherPartyAvatar ? (
                            <img
                                src={otherPartyAvatar}
                                alt={otherPartyName}
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-primary font-bold">
                                {otherPartyName[0]}
                            </div>
                        )}
                    </div>
                    <div>
                        <h3 className="font-semibold">{otherPartyName}</h3>
                        {isTyping && (
                            <p className="text-xs text-muted-foreground animate-pulse">
                                Typing...
                            </p>
                        )}
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon">
                        <Phone className="h-5 w-5" />
                    </Button>
                    <Button variant="ghost" size="icon">
                        <MoreVertical className="h-5 w-5" />
                    </Button>
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
                {messages.length === 0 ? (
                    <div className="text-center text-muted-foreground py-8">
                        <p>No messages yet</p>
                        <p className="text-sm">Send a message to start the conversation</p>
                    </div>
                ) : (
                    messages.map((message) => (
                        <MessageBubble
                            key={message.id}
                            message={message}
                            isMine={message.senderType === myType}
                        />
                    ))
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Error */}
            {error && (
                <div className="px-4 py-2 bg-red-50 text-red-600 text-sm flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    {error}
                </div>
            )}

            {/* Input */}
            <div className="p-4 border-t bg-white">
                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" className="shrink-0">
                        <Paperclip className="h-5 w-5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="shrink-0">
                        <ImageIcon className="h-5 w-5" />
                    </Button>
                    <Input
                        ref={inputRef}
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Type a message..."
                        className="flex-1"
                        disabled={sending}
                    />
                    <Button
                        onClick={handleSend}
                        disabled={!newMessage.trim() || sending}
                        size="icon"
                        className="shrink-0"
                    >
                        {sending ? (
                            <Loader2 className="h-5 w-5 animate-spin" />
                        ) : (
                            <Send className="h-5 w-5" />
                        )}
                    </Button>
                </div>
            </div>
        </div>
    );
}

function MessageBubble({
    message,
    isMine,
}: {
    message: Message;
    isMine: boolean;
}) {
    const isSystem = message.senderType === 'SYSTEM';

    if (isSystem) {
        return (
            <div className="flex justify-center">
                <div className="px-4 py-2 bg-slate-200 rounded-full text-sm text-slate-600">
                    {message.content}
                </div>
            </div>
        );
    }

    const timeAgo = formatDistanceToNow(new Date(message.createdAt), {
        addSuffix: true,
    });

    return (
        <div className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
            <div
                className={`max-w-[70%] px-4 py-2 rounded-2xl ${isMine
                        ? 'bg-primary text-primary-foreground rounded-br-sm'
                        : 'bg-white border rounded-bl-sm shadow-sm'
                    }`}
            >
                <p className="whitespace-pre-wrap break-words">{message.content}</p>
                <p
                    className={`text-xs mt-1 ${isMine ? 'text-primary-foreground/70' : 'text-muted-foreground'
                        }`}
                >
                    {timeAgo}
                </p>
            </div>
        </div>
    );
}

export default MessageThread;
