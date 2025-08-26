
"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { HelpCircle, Loader2, Send, Sparkles, User, Bot, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { answerUserQuestionAction } from '@/actions/ai-actions';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/auth-context';
import { useTranslation } from '@/hooks/use-language';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const HelpAssistant: React.FC = () => {
  const { toast } = useToast();
  const { isHelpOpen, setHelpOpen, company } = useAuth();
  const { language } = useTranslation();
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  
  const showFloatingButton = !company?.settings?.hideHelpButton;

  const quickQuestions = [
    "How do I add a new job?",
    "How does AI assignment work?",
    "Can I import jobs from a CSV?",
    "How do I change a technician's skills?",
  ];

  useEffect(() => {
    if (messages.length) {
      scrollAreaRef.current?.scrollTo({
        top: scrollAreaRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [messages]);

  const handleQuickQuestion = async (question: string) => {
    setInput(question);
    await handleSubmit(null, question);
  };
  
  const handleSubmit = async (e?: React.FormEvent<HTMLFormElement> | null, question?: string) => {
    if (e) e.preventDefault();
    const userMessage = question || input;
    if (!userMessage.trim()) return;

    const newMessages: Message[] = [...messages, { role: 'user', content: userMessage }];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    try {
        const result = await answerUserQuestionAction({ question: userMessage, language });
        if (result.error) {
            setMessages([...newMessages, { role: 'assistant', content: `Sorry, I encountered an error: ${result.error}` }]);
        } else if (result.data) {
            setMessages([...newMessages, { role: 'assistant', content: result.data.answer }]);
        }
    } catch (err) {
        setMessages([...newMessages, { role: 'assistant', content: "An unexpected error occurred. Please try again." }]);
        toast({ title: "Error", description: "Could not get a response from the assistant.", variant: "destructive" });
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <Popover open={isHelpOpen} onOpenChange={setHelpOpen}>
      {showFloatingButton && (
         <PopoverTrigger asChild>
          <Button
            variant="default"
            className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg"
            aria-label="Open AI Assistant"
          >
            <HelpCircle className="h-7 w-7" />
          </Button>
        </PopoverTrigger>
      )}
      <PopoverContent
        side="top"
        align="end"
        className="w-[90vw] max-w-md p-0 border-0 shadow-2xl"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <Card className="flex flex-col h-[70vh]">
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="space-y-1">
                <CardTitle className="font-headline flex items-center gap-2"><Sparkles className="h-5 w-5 text-primary" />AI Assistant</CardTitle>
                <CardDescription>Ask me anything about using the app.</CardDescription>
            </div>
            <Button variant="ghost" size="icon" onClick={() => setHelpOpen(false)} className="h-7 w-7"><X className="h-4 w-4" /></Button>
          </CardHeader>
          <CardContent className="flex-1 overflow-hidden p-3">
            <ScrollArea className="h-full" ref={scrollAreaRef as any}>
              <div className="space-y-4 pr-3">
                 <div className={cn("flex items-start gap-3 text-sm")}>
                    <div className="flex h-8 w-8 shrink-0 select-none items-center justify-center rounded-md border bg-secondary text-secondary-foreground shadow-sm">
                        <Bot />
                    </div>
                    <div className="flex-1 space-y-2 overflow-hidden">
                        <p className="rounded-lg bg-muted p-3">
                            Hello! I'm your AI assistant. How can I help you today?
                        </p>
                    </div>
                </div>
                {messages.map((message, index) => (
                    <div key={index} className={cn("flex items-start gap-3 text-sm", message.role === 'user' && "justify-end")}>
                        {message.role === 'assistant' && (
                             <div className="flex h-8 w-8 shrink-0 select-none items-center justify-center rounded-md border bg-secondary text-secondary-foreground shadow-sm">
                                <Bot />
                            </div>
                        )}
                         <div className="flex-1 space-y-2 overflow-hidden">
                            <p className={cn("rounded-lg p-3", message.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted')}>
                                {message.content}
                            </p>
                        </div>
                         {message.role === 'user' && (
                             <div className="flex h-8 w-8 shrink-0 select-none items-center justify-center rounded-md border bg-background text-foreground shadow-sm">
                                <User />
                            </div>
                        )}
                    </div>
                ))}
                {isLoading && (
                    <div className="flex items-center justify-center py-4">
                        <Loader2 className="h-5 w-5 animate-spin text-primary" />
                    </div>
                )}
                {messages.length === 0 && (
                    <div className="flex flex-wrap gap-2 pt-2">
                        {quickQuestions.map(q => (
                            <Badge key={q} variant="outline" className="cursor-pointer hover:bg-muted" onClick={() => handleQuickQuestion(q)}>{q}</Badge>
                        ))}
                    </div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
          <CardFooter className="pt-4 border-t">
            <form onSubmit={handleSubmit} className="flex w-full items-center space-x-2">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type your question..."
                className="flex-1 min-h-0 resize-none"
                rows={1}
                disabled={isLoading}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSubmit();
                    }
                }}
              />
              <Button type="submit" size="icon" disabled={isLoading || !input.trim()}>
                 {isLoading ? <Loader2 className="h-4 w-4 animate-spin"/> : <Send className="h-4 w-4" />}
                <span className="sr-only">Send</span>
              </Button>
            </form>
          </CardFooter>
        </Card>
      </PopoverContent>
    </Popover>
  );
};

export default HelpAssistant;
