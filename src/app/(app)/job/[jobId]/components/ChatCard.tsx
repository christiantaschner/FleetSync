
"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from "@/hooks/use-toast";
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import type { Job, Technician, ChatMessage } from '@/types';
import { useAuth } from '@/contexts/auth-context';
import { sendChatMessageAction } from '@/actions/chat-actions';
import { Loader2, Send, Paperclip, X, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';
import { mockChatMessages } from '@/lib/mock-data';

interface ChatCardProps {
    job: Job;
    technician: Technician;
    appId: string;
}

const ChatCard: React.FC<ChatCardProps> = ({ job, technician, appId }) => {
    const { user, userProfile } = useAuth();
    const { toast } = useToast();
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [attachment, setAttachment] = useState<File | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isSending, setIsSending] = useState(false);
    const scrollAreaRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (job && appId) {
            setIsLoading(true);

            if (process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true') {
                const jobMessages = mockChatMessages.filter(m => m.jobId === job.id);
                setMessages(jobMessages);
                setIsLoading(false);
                return;
            }

            const q = query(
                collection(db, `artifacts/${appId}/public/data/chatMessages`),
                where('companyId', '==', job.companyId),
                where('jobId', '==', job.id),
                orderBy('timestamp', 'asc')
            );

            const unsubscribe = onSnapshot(q, (snapshot) => {
                const msgs = snapshot.docs.map(doc => {
                    const data = doc.data();
                    return {
                        id: doc.id,
                        ...data,
                        timestamp: data.timestamp?.toDate ? data.timestamp.toDate().toISOString() : new Date().toISOString()
                    } as ChatMessage;
                });
                setMessages(msgs);
                setIsLoading(false);
            }, (error) => {
                console.error("Error fetching chat messages: ", error);
                toast({ title: "Error", description: "Could not load chat history.", variant: "destructive" });
                setIsLoading(false);
            });

            return () => unsubscribe();
        }
    }, [job, toast, appId]);

    useEffect(() => {
        // Scroll to bottom when messages change
        if (scrollAreaRef.current) {
            scrollAreaRef.current.scrollTo({ top: scrollAreaRef.current.scrollHeight, behavior: 'smooth' });
        }
    }, [messages]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if ((!newMessage.trim() && !attachment) || !job || !user || !technician || !userProfile || !appId) return;
        
        setIsSending(true);

        const result = await sendChatMessageAction({
            jobId: job.id,
            companyId: userProfile.companyId!,
            senderId: user.uid,
            senderName: userProfile.role === 'admin' ? "Dispatcher" : technician.name,
            receiverId: technician.id,
            text: newMessage.trim(),
            attachment: attachment || undefined,
            appId,
        });
        
        setIsSending(false);

        if (result.error) {
            toast({ title: "Message Failed", description: result.error, variant: "destructive" });
        } else {
            setNewMessage('');
            setAttachment(null);
            if(fileInputRef.current) fileInputRef.current.value = "";
        }
    };
    
    const handleAttachmentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setAttachment(e.target.files[0]);
        }
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="font-headline flex items-center gap-2">
                    <MessageSquare /> Job Chat
                </CardTitle>
                <CardDescription>
                    Real-time chat with {technician?.name || 'technician'}.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex flex-col h-96 border rounded-md">
                     <ScrollArea className="flex-1 p-4" ref={scrollAreaRef as any}>
                        {isLoading ? (
                            <div className="flex items-center justify-center h-full">
                                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                            </div>
                        ) : messages.length > 0 ? (
                            <div className="space-y-4">
                                {messages.map(msg => (
                                    <div key={msg.id} className={cn(
                                        "flex gap-2 text-sm",
                                        msg.senderId === user?.uid ? "justify-end" : "justify-start"
                                    )}>
                                        <div className={cn(
                                            "rounded-lg p-3 max-w-xs",
                                            msg.senderId === user?.uid 
                                                ? "bg-primary text-primary-foreground" 
                                                : "bg-secondary"
                                        )}>
                                            <p className="font-bold text-xs mb-1">{msg.senderName}</p>
                                            {msg.imageUrl && (
                                                <a href={msg.imageUrl} target="_blank" rel="noopener noreferrer">
                                                    <img src={msg.imageUrl} alt="attachment" className="rounded-md my-2 max-w-full h-auto" />
                                                </a>
                                            )}
                                            <p className="whitespace-pre-wrap">{msg.text}</p>
                                            <p className="text-xs opacity-70 mt-1 text-right">
                                                {new Date(msg.timestamp).toLocaleString([], { hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="flex items-center justify-center h-full">
                                <p className="text-muted-foreground">No messages yet for this job.</p>
                            </div>
                        )}
                    </ScrollArea>
                    <form onSubmit={handleSendMessage} className="border-t p-2">
                        {attachment && (
                            <div className="mb-2 text-xs p-2 bg-muted rounded-md flex justify-between items-center">
                                <p className="truncate">Attachment: {attachment.name}</p>
                                <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => {
                                    setAttachment(null);
                                    if(fileInputRef.current) fileInputRef.current.value = "";
                                }}>
                                    <X className="h-3 w-3"/>
                                </Button>
                            </div>
                        )}
                        <div className="flex items-center gap-2">
                            <Input
                                id="message"
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                placeholder="Type a message..."
                                autoComplete="off"
                                disabled={isSending}
                            />
                            <Button
                                type="button"
                                size="icon"
                                variant="outline"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={isSending}
                            >
                                <Paperclip className="h-4 w-4" />
                                <span className="sr-only">Attach file</span>
                            </Button>
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleAttachmentChange}
                                className="hidden"
                                accept="image/*"
                            />
                            <Button type="submit" size="icon" disabled={isSending || (!newMessage.trim() && !attachment)}>
                                {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                                <span className="sr-only">Send</span>
                            </Button>
                        </div>
                    </form>
                </div>
            </CardContent>
        </Card>
    );
};

export default ChatCard;
