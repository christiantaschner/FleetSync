
"use client";

import React, { useState, useRef, useEffect } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Paperclip, UploadCloud, Image as ImageIcon, Trash2, RotateCcw, FileSignature, Smile, Star } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { cn } from '@/lib/utils';

interface WorkDocumentationFormProps {
  onSubmit: (notes: string, photos: File[], signatureDataUrl: string | null, satisfactionScore: number) => void;
  isSubmitting: boolean;
  initialSatisfactionScore?: number;
}

const WorkDocumentationForm: React.FC<WorkDocumentationFormProps> = ({ onSubmit, isSubmitting, initialSatisfactionScore = 0 }) => {
  const [notes, setNotes] = useState('');
  const [photos, setPhotos] = useState<File[]>([]);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
  const [satisfactionScore, setSatisfactionScore] = useState(initialSatisfactionScore);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const sigCanvasRef = useRef<SignatureCanvas>(null);
  const { toast } = useToast();

  useEffect(() => {
    setSatisfactionScore(initialSatisfactionScore);
  }, [initialSatisfactionScore]);

  const handlePhotoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const newFiles = Array.from(event.target.files);
      if (photos.length + newFiles.length > 5) {
        toast({
            title: "Upload Limit Exceeded",
            description: "You can upload a maximum of 5 photos.",
            variant: "destructive"
        });
        return;
      }
      setPhotos(prevPhotos => [...prevPhotos, ...newFiles]);
      
      const newPreviews = newFiles.map(file => URL.createObjectURL(file));
      setPhotoPreviews(prevPreviews => [...prevPreviews, ...newPreviews]);
    }
  };

  const removePhoto = (index: number) => {
    setPhotos(prevPhotos => prevPhotos.filter((_, i) => i !== index));
    setPhotoPreviews(prevPreviews => {
      const newPreviews = prevPreviews.filter((_, i) => i !== index);
      URL.revokeObjectURL(prevPreviews[index]);
      return newPreviews;
    });
  };

  const clearSignature = () => {
    sigCanvasRef.current?.clear();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const isSignatureEmpty = sigCanvasRef.current?.isEmpty() ?? true;

    if (!notes.trim() && photos.length === 0 && isSignatureEmpty && satisfactionScore === 0) {
      toast({
        title: "Nothing to Submit",
        description: "Please add notes, photos, a signature, or a rating.",
        variant: "destructive"
      });
      return;
    }
    
    const signatureDataUrl = isSignatureEmpty ? null : sigCanvasRef.current.toDataURL('image/png');
    onSubmit(notes, photos, signatureDataUrl, satisfactionScore);
    
    // Clear form after submission attempt
    setNotes('');
    setPhotos([]);
    photoPreviews.forEach(url => URL.revokeObjectURL(url));
    setPhotoPreviews([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    clearSignature();
    setSatisfactionScore(0);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <Label htmlFor="jobNotes">Notes</Label>
        <Textarea
          id="jobNotes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Add any notes about the job completion, issues, or follow-up actions..."
          rows={4}
          disabled={isSubmitting}
        />
      </div>
      
      <div>
        <Label htmlFor="jobPhotos">Upload Photos (Max 5)</Label>
        <div className={cn("mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed rounded-md border-input transition-colors", !isSubmitting && "hover:border-primary")}>
          <div className="space-y-1 text-center">
            <UploadCloud className="mx-auto h-12 w-12 text-muted-foreground" />
            <div className="flex text-sm text-muted-foreground">
              <Label
                htmlFor="jobPhotosInput"
                className={cn("relative rounded-md font-medium text-primary focus-within:outline-none focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2", !isSubmitting && "cursor-pointer hover:text-primary/80" )}
              >
                <span>Upload files</span>
                <Input 
                  id="jobPhotosInput" 
                  ref={fileInputRef}
                  name="jobPhotosInput" 
                  type="file" 
                  className="sr-only" 
                  multiple 
                  accept="image/*"
                  onChange={handlePhotoChange}
                  disabled={isSubmitting}
                />
              </Label>
              <p className="pl-1">or drag and drop</p>
            </div>
            <p className="text-xs text-muted-foreground">PNG, JPG, GIF up to 10MB each</p>
          </div>
        </div>
      </div>

      {photoPreviews.length > 0 && (
        <div>
          <p className="text-sm font-medium text-foreground mb-2">Selected Photos:</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {photoPreviews.map((previewUrl, index) => (
              <div key={index} className="relative group aspect-square">
                <img src={previewUrl} alt={`Preview ${index + 1}`} className="h-full w-full object-cover rounded-md border" />
                <Button 
                  type="button"
                  variant="destructive" 
                  size="icon"
                  className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => removePhoto(index)}
                  aria-label="Remove photo"
                  disabled={isSubmitting}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <Label htmlFor="satisfaction" className="flex items-center gap-2 mb-2"><Smile/>Customer Satisfaction</Label>
        <div className="flex items-center gap-2 rounded-md border bg-muted/50 p-3">
            {[1, 2, 3, 4, 5].map((star) => (
            <button
                key={star}
                type="button"
                onClick={() => setSatisfactionScore(star)}
                disabled={isSubmitting || initialSatisfactionScore > 0}
                className="disabled:cursor-not-allowed"
            >
                <Star
                    className={cn(
                        "h-8 w-8 text-gray-300 transition-colors",
                        satisfactionScore >= star && "text-yellow-400",
                        initialSatisfactionScore === 0 && !isSubmitting && "hover:text-yellow-300"
                    )}
                    fill={satisfactionScore >= star ? 'currentColor' : 'none'}
                />
            </button>
            ))}
            {initialSatisfactionScore > 0 && (
            <p className="text-sm text-muted-foreground ml-auto">Rating already submitted.</p>
            )}
        </div>
      </div>

      <div>
        <Label htmlFor="signature" className="flex items-center gap-2 mb-2"><FileSignature/>Customer Signature</Label>
        <div className="relative w-full aspect-[2/1] bg-muted/50 rounded-md border">
          <SignatureCanvas 
            ref={sigCanvasRef}
            penColor='black'
            canvasProps={{className: 'w-full h-full'}} 
            onBegin={() => isSubmitting && sigCanvasRef.current?.clear()} // Prevent drawing while submitting
          />
        </div>
        <Button type="button" variant="ghost" onClick={clearSignature} className="mt-2" disabled={isSubmitting}>
          <RotateCcw className="mr-2 h-4 w-4" /> Clear Signature
        </Button>
      </div>

      <Button type="submit" className="w-full sm:w-auto" disabled={isSubmitting}>
        <Paperclip className="mr-2 h-4 w-4" />
        {isSubmitting ? 'Submitting...' : 'Save Documentation'}
      </Button>
    </form>
  );
};

export default WorkDocumentationForm;
