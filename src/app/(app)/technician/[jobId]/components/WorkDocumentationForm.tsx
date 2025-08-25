
"use client";

import React, { useState, useRef } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useToast } from "@/hooks/use-toast";
import { Loader2, Camera, Trash2, Edit3, Save } from 'lucide-react';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

interface WorkDocumentationFormProps {
    onSubmit: (notes: string, photos: File[], isFirstTimeFix: boolean, reasonForFollowUp?: string) => void;
    isSubmitting: boolean;
}

const WorkDocumentationForm: React.FC<WorkDocumentationFormProps> = ({ onSubmit, isSubmitting }) => {
    const { toast } = useToast();
    const [notes, setNotes] = useState('');
    const [photos, setPhotos] = useState<File[]>([]);
    const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
    const [isFirstTimeFix, setIsFirstTimeFix] = useState<boolean | null>(null);
    const [reasonForFollowUp, setReasonForFollowUp] = useState('');
    
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
        if (isFirstTimeFix === null) {
            toast({ title: "Required Field", description: "Please confirm if this was a first-time fix.", variant: "destructive" });
            return;
        }
        if (isFirstTimeFix === false && !reasonForFollowUp.trim()) {
            toast({ title: "Reason Required", description: "Please provide a reason for the follow-up visit.", variant: "destructive" });
            return;
        }

        onSubmit(notes, photos, isFirstTimeFix, reasonForFollowUp);
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="font-headline flex items-center gap-2"><Edit3 /> Document Work</CardTitle>
                <CardDescription>Add notes, photos, and job completion status. You can save multiple times.</CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <Label htmlFor="notes">Work Notes</Label>
                        <Textarea
                            id="notes"
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Describe the work completed, any issues encountered, and parts used."
                            rows={4}
                            disabled={isSubmitting}
                        />
                    </div>
                    <div>
                        <Label htmlFor="photos">Upload Photos</Label>
                        <Button type="button" variant="outline" className="w-full mt-1" onClick={() => fileInputRef.current?.click()} disabled={isSubmitting}>
                            <Camera className="mr-2 h-4 w-4" />
                            Add Photos (Before & After)
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
                                            disabled={isSubmitting}
                                        >
                                            <Trash2 className="h-3 w-3" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                    
                    <div className="space-y-3">
                        <Label>Was this issue resolved in one visit (First-Time Fix)?</Label>
                        <RadioGroup 
                            value={isFirstTimeFix === null ? undefined : String(isFirstTimeFix)} 
                            onValueChange={(value) => setIsFirstTimeFix(value === 'true')}
                            disabled={isSubmitting}
                        >
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="true" id="ftf-yes" />
                                <Label htmlFor="ftf-yes">Yes, the job is complete.</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="false" id="ftf-no" />
                                <Label htmlFor="ftf-no">No, a follow-up visit is required.</Label>
                            </div>
                        </RadioGroup>
                    </div>

                    {isFirstTimeFix === false && (
                         <div>
                            <Label htmlFor="reasonForFollowUp">Reason for Follow-up</Label>
                            <Textarea
                                id="reasonForFollowUp"
                                value={reasonForFollowUp}
                                onChange={(e) => setReasonForFollowUp(e.target.value)}
                                placeholder="e.g., 'Needed a specific part not in van stock', 'Issue was more complex than described', etc."
                                rows={2}
                                disabled={isSubmitting}
                                required
                            />
                        </div>
                    )}
                    
                    <Button type="submit" disabled={isSubmitting} className="w-full">
                        {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                        Save Documentation & Status
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
};

export default WorkDocumentationForm;
