
"use client";

import React, { useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, BookOpen, AlertTriangle, Sparkles, Send, Paperclip, X } from 'lucide-react';
import { troubleshootEquipmentAction } from '@/actions/fleet-actions';
import type { TroubleshootEquipmentOutput } from '@/types';
import Image from 'next/image';

interface TroubleshootingCardProps {
    jobTitle: string;
}

const TroubleshootingCard: React.FC<TroubleshootingCardProps> = ({ jobTitle }) => {
    const { toast } = useToast();
    const [query, setQuery] = useState('');
    const [attachment, setAttachment] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState<TroubleshootEquipmentOutput | null>(null);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const fileToDataUri = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 4 * 1024 * 1024) { // 4MB limit
                 toast({
                    title: "File too large",
                    description: "Please upload an image smaller than 4MB.",
                    variant: "destructive",
                });
                return;
            }
            setAttachment(file);
            setPreview(URL.createObjectURL(file));
        }
    };
    
    const removeAttachment = () => {
        setAttachment(null);
        if (preview) {
            URL.revokeObjectURL(preview);
        }
        setPreview(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!query.trim()) {
            toast({ title: "Query required", description: "Please enter a problem to troubleshoot.", variant: "destructive" });
            return;
        }

        setIsLoading(true);
        setError(null);
        setResult(null);

        let photoDataUri: string | undefined = undefined;
        if (attachment) {
            try {
                photoDataUri = await fileToDataUri(attachment);
            } catch (err) {
                console.error(err);
                setError("Failed to read the attached image.");
                setIsLoading(false);
                return;
            }
        }

        const response = await troubleshootEquipmentAction({ query, photoDataUri });
        
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
                    Describe an issue. You can also attach a photo of a model number or error code.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="flex flex-col gap-4 mb-4">
                    <Input
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="e.g., Compressor is short-cycling"
                        disabled={isLoading}
                    />
                     {preview && (
                        <div className="relative w-40 h-40">
                            <Image src={preview} alt="Preview" layout="fill" objectFit="cover" className="rounded-md border" />
                            <Button
                                type="button"
                                variant="destructive"
                                size="icon"
                                className="absolute top-1 right-1 h-6 w-6 z-10"
                                onClick={removeAttachment}
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                    )}
                    <div className="flex items-center gap-2">
                        <Button type="submit" disabled={isLoading || !query.trim()} className="flex-1">
                            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                            Get Steps
                        </Button>
                         <Button
                            type="button"
                            variant="outline"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isLoading}
                         >
                            <Paperclip className="mr-2 h-4 w-4" />
                            {attachment ? 'Change Photo' : 'Attach Photo'}
                        </Button>
                         <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            className="hidden"
                            accept="image/*"
                         />
                    </div>
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
