
"use client";

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from "@/hooks/use-toast";
import type { Technician } from '@/types';
import { Loader2, Send } from 'lucide-react';
import { requestProfileChangeAction } from '@/actions/fleet-actions';

interface SuggestChangeDialogProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  technician: Technician;
}

const SuggestChangeDialog: React.FC<SuggestChangeDialogProps> = ({ isOpen, setIsOpen, technician }) => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [name, setName] = useState(technician.name);
  const [email, setEmail] = useState(technician.email);
  const [phone, setPhone] = useState(technician.phone);
  const [notes, setNotes] = useState('');

  const handleSubmit = async () => {
    const requestedChanges: any = {};
    if (name !== technician.name) requestedChanges.name = name;
    if (email !== technician.email) requestedChanges.email = email;
    if (phone !== technician.phone) requestedChanges.phone = phone;

    if (Object.keys(requestedChanges).length === 0 && !notes.trim()) {
        toast({ title: "No Changes Detected", description: "Please make a change or add a note before submitting.", variant: 'destructive' });
        return;
    }

    setIsSubmitting(true);
    const result = await requestProfileChangeAction({
        technicianId: technician.id,
        technicianName: technician.name,
        requestedChanges,
        notes: notes.trim(),
    });
    setIsSubmitting(false);

    if (result.error) {
        toast({ title: "Submission Failed", description: result.error, variant: 'destructive' });
    } else {
        toast({ title: "Request Submitted", description: "Your change request has been sent to the dispatcher for review." });
        setIsOpen(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-headline">Suggest Profile Changes</DialogTitle>
          <DialogDescription>
            Update your information below. Your changes will be sent to a dispatcher for approval.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
            <div>
                <Label htmlFor="change-name">Name</Label>
                <Input id="change-name" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
             <div>
                <Label htmlFor="change-email">Email</Label>
                <Input id="change-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
             <div>
                <Label htmlFor="change-phone">Phone</Label>
                <Input id="change-phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
            <div>
                <Label htmlFor="change-notes">Notes for Dispatcher (Optional)</Label>
                <Textarea 
                    id="change-notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Use this area to request skill updates or other changes not listed above."
                />
            </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
            Submit for Review
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SuggestChangeDialog;
