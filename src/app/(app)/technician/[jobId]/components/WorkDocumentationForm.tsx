"use client";

import React, { useState, useRef } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useToast } from "@/hooks/use-toast";
import { Loader2, Camera, Star, Edit, ThumbsUp, ThumbsDown, Trash2, Edit3, FileSignature, Smile, Save } from 'lucide-react';
import Image from 'next/image';
import SignatureCanvas from 'react-signature-canvas';
import { cn } from '@/lib/utils';
import { Slider } from '@/components/ui/slider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';


interface WorkDocumentationFormProps {
    onSubmit: (notes: string, photos: File[], signatureDataUrl: string | null, satisfactionScore: number) => void;
    isSubmitting: boolean;
    initialSatisfactionScore?: number;
}

const WorkDocumentationForm: React.FC<WorkDocumentationFormProps> = ({ onSubmit, isSubmitting, initialSatisfactionScore }) => {
    const { toast } = useToast();
    const [notes, setNotes] = useState('');
    const [photos, setPhotos] = useState<File[]>([]);
    const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
    const [satisfactionScore, setSatisfactionScore] = useState<number>(initialSatisfactionScore || 0);
    
    const signaturePadRef = useRef<SignatureCanvas>(null);
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
    
    const clearSignature = () => {
        signaturePadRef.current?.clear();
    };


    const handleSubmit = (e: React.Event) => {
        e.preventDefault();
        const signatureDataUrl = signaturePadRef.current?.isEmpty()
            ? null
            : signaturePadRef.current?.getTrimmedCanvas().toDataURL('image/png');
            
        onSubmit(notes, photos, signatureDataUrl, satisfactionScore);
    };
    
    const satisfactionIcons = [
        { icon: ThumbsDown, color: 'text-red-500', label: 'Poor' },
        { icon: Star, color: 'text-orange-400', label: 'Fair' },
        { icon: Star, color: 'text-yellow-400', label: 'Good' },
        { icon: Star, color: 'text-lime-500', label: 'Very Good' },
        { icon: ThumbsUp, color: 'text-green-500', label: 'Excellent' }
    ];

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
             <Card>
                <CardHeader>
                    <CardTitle className="font-headline flex items-center gap-2"><FileSignature /> Customer Sign-off</CardTitle>
                    <CardDescription>Capture customer signature and satisfaction rating to confirm completion.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div>
                        <Label>Customer Satisfaction ({satisfactionScore > 0 ? `${satisfactionScore}/5 - ${satisfactionIcons[satisfactionScore - 1].label}` : 'Not Rated'})</Label>
                        <div className="flex items-center gap-2 mt-2">
                            <Slider 
                                defaultValue={[satisfactionScore]}
                                value={[satisfactionScore]}
                                max={5} 
                                step={1} 
                                onValueChange={(value) => setSatisfactionScore(value[0])}
                            />
                            {satisfactionScore > 0 ? (
                                React.createElement(satisfactionIcons[satisfactionScore - 1].icon, {
                                    className: cn("h-6 w-6", satisfactionIcons[satisfactionScore - 1].color)
                                })
                            ) : <Smile className="h-6 w-6 text-muted-foreground" />}
                        </div>
                    </div>
                    <div>
                        <div className="flex justify-between items-center mb-1">
                            <Label>Customer Signature</Label>
                            <Button type="button" variant="ghost" size="sm" onClick={clearSignature}>Clear</Button>
                        </div>
                        <div className="border rounded-md bg-white">
                            <SignatureCanvas
                                ref={signaturePadRef}
                                penColor="black"
                                canvasProps={{ className: 'w-full h-32' }}
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>

             <Button type="submit" disabled={isSubmitting} className="w-full">
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Save Documentation
            </Button>
        </form>
    );
};

export default WorkDocumentationForm;
