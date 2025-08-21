"use client";

import React, { useState, useRef } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useToast } from "@/hooks/use-toast";
import { Loader2, Camera, Star, Edit, ThumbsUp, ThumbsDown, Trash2, Edit3 } from 'lucide-react';
import Image from 'next/image';
import SignatureCanvas from 'react-signature-canvas';
import { cn } from '@/lib/utils';
import { Slider } from '@/components/ui/slider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface WorkDocumentationFormProps {
    onSubmit: (notes: string, photos: File[]) => void;
    isSubmitting: boolean;
}

const WorkDocumentationForm: React.FC<WorkDocumentationFormProps> = ({ onSubmit, isSubmitting }) => {
    const { toast } = useToast();
    const [notes, setNotes] = useState('');
    const [photos, setPhotos] = useState<File[]>([]);
    const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handlePhotoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files) {
            const newFiles = Array.from(event.target.files);
            const validFiles = newFiles.filter(file => file.size <= 4 * 1024 * 1024); // 4MB limit
            
            if (validFiles.length !== newFiles.length) {
                toast({ title: "File too large", description: "One or more images exceeded the 4MB size limit and were not added.", variant: "destructive" });
            }

            setPhotos(prev => [...prev, ...validFiles]);
            const newPreviews = validFiles.map(file => URL.createObjectURL(file));
            setPhotoPreviews(prev => [...prev, ...newPreviews]);
        }
    };
    
    const removePhoto = (index: number) => {
        URL.revokeObjectURL(photoPreviews[index]);
        setPhotos(prev => prev.filter((_, i) => i !== index));
        setPhotoPreviews(prev => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = (e: React.Event) => {
        e.preventDefault();
        onSubmit(notes, photos);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
             <Card>
                <CardHeader>
                    <CardTitle className="font-headline flex items-center gap-2"><Edit3 /> Document Work</CardTitle>
                    <CardDescription>Add notes and photos before completing the job.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <Label htmlFor="notes">Work Notes</Label>
                        <Textarea
                            id="notes"
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Describe the work completed, any issues encountered, and parts used."
                            rows={4}
                        />
                    </div>
                    <div>
                        <Label htmlFor="photos">Upload Photos (Before & After)</Label>
                        <Button type="button" variant="outline" className="w-full mt-1" onClick={() => fileInputRef.current?.click()}>
                            <Camera className="mr-2 h-4 w-4" />
                            Add Photos
                        </Button>
                        <input id="photos" ref={fileInputRef} type="file" multiple accept="image/*" onChange={handlePhotoChange} className="hidden" />
                        {photoPreviews.length > 0 && (
                            <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 gap-2">
                                {photoPreviews.map((src, index) => (
                                    <div key={index} className="relative aspect-square">
                                        <Image src={src} alt={`Preview ${index}`} layout="fill" objectFit="cover" className="rounded-md" />
                                        <Button
                                            type="button"
                                            variant="destructive"
                                            size="icon"
                                            className="absolute top-1 right-1 h-6 w-6"
                                            onClick={() => removePhoto(index)}
                                        >
                                            <Trash2 className="h-3 w-3" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </CardContent>
             </Card>
        </form>
    );
};

export default WorkDocumentationForm;
