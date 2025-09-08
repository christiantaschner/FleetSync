
"use client";

import React, { useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Loader2, Bot, Lightbulb, Camera, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { TroubleshootEquipmentOutput, Job } from '@/types';
import { troubleshootEquipmentAction } from '@/actions/ai-actions';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import Image from 'next/image';

interface TroubleshootingCardProps {
    job: Job;
    serviceHistory: Job[];
}

const TroubleshootingCard: React.FC<TroubleshootingCardProps> = ({ job, serviceHistory }) => {
    const { toast } = useToast();
    const [query, setQuery] = useState('');
    const [photo, setPhoto] = useState<File | null>(null);
    const [photoPreview, setPhotoPreview] = useState<string | null>(null);
    const [isThinking, setIsThinking] = useState(false);
    const [suggestion, setSuggestion] = useState<TroubleshootEquipmentOutput | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handlePhotoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            if (file.size > 4 * 1024 * 1024) { // 4MB limit
                toast({ title: "File too large", description: "Image must be less than 4MB.", variant: "destructive" });
                return;
            }
            setPhoto(file);
            setPhotoPreview(URL.createObjectURL(file));
        }
    };

    const removePhoto = () => {
        if (photoPreview) URL.revokeObjectURL(photoPreview);
        setPhoto(null);
        setPhotoPreview(null);
    };
    
    const fileToDataUri = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!query.trim()) return;

        setIsThinking(true);
        setSuggestion(null);

        let photoDataUri: string | undefined;
        if (photo) {
            photoDataUri = await fileToDataUri(photo);
        }
        
        const historyNotes = serviceHistory.map(h => `On ${new Date(h.completedAt!).toLocaleDateString()}: "${h.title}" - Notes: ${h.notes || 'N/A'}`);

        const result = await troubleshootEquipmentAction({
            query: query,
            jobDescription: `Job Title: ${job.title}. Job Description: ${job.description}`,
            serviceHistory: historyNotes,
            photoDataUri
        });

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
                    Describe the problem you're seeing, and the AI will suggest diagnostic steps based on the job history. Add a photo for more accurate help.
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
                    {photoPreview ? (
                        <div className="relative w-32 h-32">
                           <Image src={photoPreview} alt="Preview" layout="fill" objectFit="cover" className="rounded-md border" />
                           <Button type="button" variant="destructive" size="icon" className="absolute -top-2 -right-2 h-6 w-6 rounded-full" onClick={removePhoto}><X className="h-4 w-4"/></Button>
                        </div>
                    ) : (
                         <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                            <Camera className="mr-2 h-4 w-4"/> Add Photo
                        </Button>
                    )}
                    <input type="file" ref={fileInputRef} onChange={handlePhotoChange} className="hidden" accept="image/*" />

                    <Button type="submit" disabled={isThinking || !query.trim()}>
                        {isThinking ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Bot className="mr-2 h-4 w-4" />}
                        Ask for Help
                    </Button>
                </form>

                {suggestion && (
                    <div className="mt-6 space-y-4">
                        <Alert>
                            <Bot className="h-4 w-4" />
                            <AlertTitle className="font-semibold">AI Diagnostic Suggestions</AlertTitle>
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
