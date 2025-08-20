
"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Loader2, Bot, Lightbulb } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { TroubleshootEquipmentOutput } from '@/types';
import { troubleshootEquipmentAction } from '@/actions/ai-actions';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface TroubleshootingCardProps {
    jobTitle: string;
}

const TroubleshootingCard: React.FC<TroubleshootingCardProps> = ({ jobTitle }) => {
    const { toast } = useToast();
    const [query, setQuery] = useState('');
    const [isThinking, setIsThinking] = useState(false);
    const [suggestion, setSuggestion] = useState<TroubleshootEquipmentOutput | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!query.trim()) return;

        setIsThinking(true);
        setSuggestion(null);

        const fullQuery = `For a job titled "${jobTitle}", the issue is: ${query}`;
        const result = await troubleshootEquipmentAction({ query: fullQuery });

        if (result.error) {
            toast({ title: 'Error', description: result.error, variant: 'destructive' });
        } else if (result.data) {
            setSuggestion(result.data);
        }
        setIsThinking(false);
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="font-headline flex items-center gap-2">
                    <Lightbulb /> AI Troubleshooting Assistant
                </CardTitle>
                <CardDescription>
                    Describe the problem you're seeing, and Fleety will suggest diagnostic steps.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <Textarea 
                        placeholder="e.g., 'The unit is making a loud humming noise but the fan isn't spinning.'"
                        value={query}
                        onChange={e => setQuery(e.target.value)}
                        rows={3}
                        disabled={isThinking}
                    />
                    <Button type="submit" disabled={isThinking || !query.trim()}>
                        {isThinking ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Bot className="mr-2 h-4 w-4" />}
                        Ask Fleety for Help
                    </Button>
                </form>

                {suggestion && (
                    <div className="mt-6 space-y-4">
                        <Alert>
                            <Bot className="h-4 w-4" />
                            <AlertTitle className="font-semibold">Fleety's Diagnostic Suggestions</AlertTitle>
                            <AlertDescription>
                                <ul className="list-decimal pl-5 mt-2 space-y-1">
                                    {suggestion.steps.map((step, index) => <li key={index}>{step}</li>)}
                                </ul>
                            </AlertDescription>
                        </Alert>
                         <Alert variant="destructive">
                            <AlertTitle>Safety Disclaimer</AlertTitle>
                            <AlertDescription>{suggestion.disclaimer}</AlertDescription>
                        </Alert>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

export default TroubleshootingCard;
