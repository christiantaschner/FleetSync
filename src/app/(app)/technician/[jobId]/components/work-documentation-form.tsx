
"use client";

import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Paperclip, UploadCloud, Image as ImageIcon, Trash2 } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";

interface WorkDocumentationFormProps {
  onSubmit: (notes: string, photos: File[]) => void;
}

const WorkDocumentationForm: React.FC<WorkDocumentationFormProps> = ({ onSubmit }) => {
  const [notes, setNotes] = useState('');
  const [photos, setPhotos] = useState<File[]>([]);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handlePhotoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const newFiles = Array.from(event.target.files);
      // Limit number of photos if needed, e.g., 5 total
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
      // Revoke object URL to free memory
      URL.revokeObjectURL(prevPreviews[index]);
      return newPreviews;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!notes.trim() && photos.length === 0) {
      toast({
        title: "Nothing to Submit",
        description: "Please add notes or upload photos.",
        variant: "destructive"
      });
      return;
    }
    onSubmit(notes, photos);
    setNotes('');
    setPhotos([]);
    // Revoke all object URLs after submission
    photoPreviews.forEach(url => URL.revokeObjectURL(url));
    setPhotoPreviews([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = ""; // Reset file input
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="jobNotes">Notes</Label>
        <Textarea
          id="jobNotes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Add any notes about the job completion, issues, or follow-up actions..."
          rows={4}
        />
      </div>
      
      <div>
        <Label htmlFor="jobPhotos">Upload Photos (Max 5)</Label>
        <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed rounded-md border-input hover:border-primary transition-colors">
          <div className="space-y-1 text-center">
            <UploadCloud className="mx-auto h-12 w-12 text-muted-foreground" />
            <div className="flex text-sm text-muted-foreground">
              <Label
                htmlFor="jobPhotosInput"
                className="relative cursor-pointer rounded-md font-medium text-primary hover:text-primary/80 focus-within:outline-none focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2"
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
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      <Button type="submit" className="w-full sm:w-auto">
        <Paperclip className="mr-2 h-4 w-4" />
        Save Documentation
      </Button>
    </form>
  );
};

export default WorkDocumentationForm;
