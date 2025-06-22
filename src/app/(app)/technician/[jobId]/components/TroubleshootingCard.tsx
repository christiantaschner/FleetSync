
"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, BookOpen, AlertTriangle, Sparkles, Send } from 'lucide-react';
import { troubleshootEquipmentAction } from '@/actions/fleet-actions';
import type { TroubleshootEquipmentOutput } from '@/types';

interface TroubleshootingCardProps {
    jobTitle: string;
}

const TroubleshootingCard: React.FC<TroubleshootingCardProps> = ({ jobTitle }) => {
    const { toast } = useToast();
    const [query, setQuery] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState<TroubleshootEquipmentOutput | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!query.trim()) {
            toast({ title: "Query required", description: "Please enter a problem to troubleshoot.", variant: "destructive" });
            return;
        }

        setIsLoading(true);
        setError(null);
        setResult(null);

        const response = await troubleshootEquipmentAction({ query });
        
        if (response.error) {
            setError(response.error);
            toast({ title: "Error", description: response.error, variant: "destructive" });
        } else {
            setResult(response.data);
        }
        setIsLoading(false);
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="font-headline flex items-center gap-2">
                    <BookOpen /> AI Troubleshooting
                </CardTitle>
                <CardDescription>
                    Get step-by-step diagnostic help for issues related to "{jobTitle}".
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="flex items-center gap-2 mb-4">
                    <Input
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="e.g., Compressor is short-cycling"
                        disabled={isLoading}
                    />
                    <Button type="submit" disabled={isLoading || !query.trim()}>
                        {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                        Get Steps
                    </Button>
                </form>

                {isLoading && (
                    <div className="flex items-center justify-center p-6 space-x-2">
                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                        <span className="text-muted-foreground">AI is generating steps...</span>
                    </div>
                )}
                
                {error && (
                    <Alert variant="destructive">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertTitle>Error</AlertTitle>
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}

                {result && (
                    <div className="space-y-4">
                        <Alert>
                           <Sparkles className="h-4 w-4" />
                           <AlertTitle className="font-semibold">AI Generated Guide</AlertTitle>
                           <AlertDescription>
                                <ul className="list-decimal pl-5 mt-2 space-y-2">
                                    {result.steps.map((step, index) => (
                                        <li key={index}>{step}</li>
                                    ))}
                                </ul>
                           </AlertDescription>
                        </Alert>
                         <Alert variant="destructive">
                           <AlertTriangle className="h-4 w-4" />
                           <AlertTitle className="font-semibold">Safety First</AlertTitle>
                           <AlertDescription>{result.disclaimer}</AlertDescription>
                        </Alert>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

export default TroubleshootingCard;
