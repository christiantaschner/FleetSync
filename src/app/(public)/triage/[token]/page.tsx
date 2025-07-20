
"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { getTriageJobInfoAction } from '@/actions/fleet-actions';
import { submitTriagePhotosAction } from '@/actions/ai-actions';
import { Loader2, AlertTriangle, FileUp, CheckCircle, Image as ImageIcon, X } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Logo } from '@/components/common/logo';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import Image from 'next/image';

const MAX_FILES = 5;
const MAX_FILE_SIZE_MB = 4;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

export default function TriagePage() {
    const params = useParams();
    const searchParams = useSearchParams();
    const token = params.token as string;
    const appId = searchParams.get('appId');
    const { toast } = useToast();

    const [jobTitle, setJobTitle] = useState('');
    const [customerName, setCustomerName] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const [files, setFiles] = useState<File[]>([]);
    const [previews, setPreviews] = useState<string[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const fetchInfo = async () => {
            setIsLoading(true);
            if (!token || !appId) {
                setError("This link is invalid or incomplete.");
                setIsLoading(false);
                return;
            }

            const result = await getTriageJobInfoAction({ token, appId });
            if (result.error) {
                setError(result.error);
            } else if (result.data) {
                setJobTitle(result.data.jobTitle);
                setCustomerName(result.data.customerName);
            }
            setIsLoading(false);
        };
        fetchInfo();
    }, [token, appId]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const newFiles = Array.from(e.target.files);
            
            if (files.length + newFiles.length > MAX_FILES) {
                toast({ title: "Upload Limit", description: `You can only upload a maximum of ${MAX_FILES} photos.`, variant: "destructive" });
                return;
            }

            const validFiles = newFiles.filter(file => {
                if (file.size > MAX_FILE_SIZE_BYTES) {
                    toast({ title: "File Too Large", description: `${file.name} is larger than ${MAX_FILE_SIZE_MB}MB.`, variant: "destructive" });
                    return false;
                }
                return true;
            });

            setFiles(f => [...f, ...validFiles]);
            const newPreviews = validFiles.map(file => URL.createObjectURL(file));
            setPreviews(p => [...p, ...newPreviews]);
        }
    };
    
    const removeFile = (index: number) => {
        const newFiles = files.filter((_, i) => i !== index);
        const newPreviews = previews.filter((_, i) => i !== index);
        URL.revokeObjectURL(previews[index]);
        setFiles(newFiles);
        setPreviews(newPreviews);
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
        if (files.length === 0) {
            toast({ title: "No Photos", description: "Please select at least one photo to upload.", variant: "destructive" });
            return;
        }

        if (!token || !appId) {
            setError("This link is invalid or incomplete.");
            return;
        }

        setIsSubmitting(true);
        try {
            const photoDataUris = await Promise.all(files.map(fileToDataUri));
            const result = await submitTriagePhotosAction({ token, appId, photoDataUris });
            
            if (result.error) {
                setError(result.error);
                toast({ title: "Submission Failed", description: result.error, variant: "destructive" });
            } else {
                setSuccess(true);
            }
        } catch (err) {
            setError("An unexpected error occurred while processing photos.");
            toast({ title: "Error", description: "Could not process photos. Please try again.", variant: "destructive" });
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-muted gap-4">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                <p className="text-muted-foreground">Loading information...</p>
            </div>
        );
    }
    
    return (
        <main className="min-h-screen bg-muted flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-2xl">
                <div className="flex items-center gap-2 mb-4">
                    <Logo />
                </div>

                <Card className="shadow-2xl">
                    <CardHeader>
                        <CardTitle className="font-headline">Photo Upload for Service Request</CardTitle>
                        <CardDescription>
                            Hello, {customerName}! Please upload photos of the issue for your service: "{jobTitle}".
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {error && (
                             <Alert variant="destructive">
                                <AlertTriangle className="h-4 w-4" />
                                <AlertTitle>Error</AlertTitle>
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        )}
                        {success && (
                             <Alert variant="default" className="border-green-600/50 bg-green-50/50">
                                <CheckCircle className="h-4 w-4 text-green-600" />
                                <AlertTitle className="font-semibold text-green-800">Thank You!</AlertTitle>
                                <AlertDescription className="text-green-700">
                                    Your photos have been submitted successfully. Our team will review them shortly. You can now close this window.
                                </AlertDescription>
                            </Alert>
                        )}
                        {!error && !success && (
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div>
                                    <Label htmlFor="photo-upload" className="sr-only">Upload Photos</Label>
                                    <div
                                        onClick={() => fileInputRef.current?.click()}
                                        className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed rounded-md border-input transition-colors hover:border-primary cursor-pointer"
                                    >
                                        <div className="space-y-1 text-center">
                                            <ImageIcon className="mx-auto h-12 w-12 text-muted-foreground" />
                                            <div className="flex text-sm text-muted-foreground">
                                                <p className="relative rounded-md font-medium text-primary">
                                                    <span>Click to upload photos</span>
                                                </p>
                                            </div>
                                            <p className="text-xs text-muted-foreground">Up to {MAX_FILES} images, max {MAX_FILE_SIZE_MB}MB each.</p>
                                        </div>
                                    </div>
                                    <input
                                        ref={fileInputRef}
                                        id="photo-upload"
                                        name="photo-upload"
                                        type="file"
                                        multiple
                                        accept="image/*"
                                        onChange={handleFileChange}
                                        className="hidden"
                                    />
                                </div>

                                {previews.length > 0 && (
                                    <div>
                                        <p className="text-sm font-medium mb-2">Selected photos ({previews.length}/{MAX_FILES}):</p>
                                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
                                            {previews.map((src, index) => (
                                                <div key={index} className="relative aspect-square">
                                                    <Image src={src} alt={`Preview ${index}`} layout="fill" objectFit="cover" className="rounded-md border"/>
                                                    <Button
                                                        type="button"
                                                        variant="destructive"
                                                        size="icon"
                                                        onClick={() => removeFile(index)}
                                                        className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
                                                        disabled={isSubmitting}
                                                    >
                                                        <X className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                
                                <Button type="submit" className="w-full" disabled={isSubmitting || files.length === 0}>
                                    {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <FileUp className="mr-2 h-4 w-4"/>}
                                    Submit Photos
                                </Button>
                            </form>
                        )}
                    </CardContent>
                </Card>
            </div>
        </main>
    );
}
