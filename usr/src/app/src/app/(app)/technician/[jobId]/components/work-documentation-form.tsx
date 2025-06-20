
"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Paperclip } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";

interface WorkDocumentationFormProps {
  onSubmit: (notes: string) => void;
}

const WorkDocumentationForm: React.FC<WorkDocumentationFormProps> = ({ onSubmit }) => {
  const [notes, setNotes] = useState('');
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!notes.trim()) {
      toast({
        title: "Nothing to Submit",
        description: "Please add notes about the job.",
        variant: "destructive"
      });
      return;
    }
    onSubmit(notes);
    setNotes('');
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="jobNotes">Job Completion Notes</Label>
        <Textarea
          id="jobNotes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Add any notes about the job completion, issues, or follow-up actions..."
          rows={4}
        />
      </div>
      
      <Button type="submit" className="w-full sm:w-auto">
        <Paperclip className="mr-2 h-4 w-4" />
        Save Notes
      </Button>
    </form>
  );
};

export default WorkDocumentationForm;
