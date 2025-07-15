
"use client";

import React, { useState, useEffect } from 'react';
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
import { Loader2, Send, ListChecks } from 'lucide-react';
import { requestProfileChangeAction } from '@/actions/fleet-actions';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import isEqual from 'lodash.isequal';
import { useAuth } from '@/contexts/auth-context';

interface SuggestChangeDialogProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  technician: Technician;
  allSkills: string[];
}

const SuggestChangeDialog: React.FC<SuggestChangeDialogProps> = ({ isOpen, setIsOpen, technician, allSkills }) => {
  const { user, userProfile } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [name, setName] = useState(technician.name);
  const [email, setEmail] = useState(technician.email);
  const [phone, setPhone] = useState(technician.phone);
  const [notes, setNotes] = useState('');
  const [selectedSkills, setSelectedSkills] = useState<string[]>(technician.skills || []);
  
  useEffect(() => {
    if (isOpen) {
        setName(technician.name);
        setEmail(technician.email);
        setPhone(technician.phone);
        setSelectedSkills(technician.skills || []);
        setNotes('');
    }
  }, [isOpen, technician]);

  const handleSkillChange = (skill: string) => {
    setSelectedSkills(prevSkills => 
      prevSkills.includes(skill) 
        ? prevSkills.filter(s => s !== skill) 
        : [...prevSkills, skill]
    );
  };


  const handleSubmit = async () => {
    if (!user || !userProfile?.companyId) {
        toast({ title: "Not Authenticated", description: "You must be logged in and part of a company to submit a change.", variant: "destructive" });
        return;
    }
    const appId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
    if (!appId) {
        toast({ title: "Configuration Error", description: "App ID is missing.", variant: "destructive" });
        return;
    }

    const requestedChanges: any = {};
    if (name !== technician.name) requestedChanges.name = name;
    if (email !== technician.email) requestedChanges.email = email;
    if (phone !== technician.phone) requestedChanges.phone = phone;

    // Compare skill arrays, accounting for order
    const initialSkills = technician.skills || [];
    if (!isEqual(initialSkills.sort(), selectedSkills.sort())) {
        requestedChanges.skills = selectedSkills;
    }

    if (Object.keys(requestedChanges).length === 0 && !notes.trim()) {
        toast({ title: "No Changes Detected", description: "Please make a change or add a note before submitting.", variant: 'destructive' });
        return;
    }

    setIsSubmitting(true);
    const result = await requestProfileChangeAction({
        companyId: userProfile.companyId,
        technicianId: technician.id,
        technicianName: technician.name,
        requestedChanges,
        notes: notes.trim(),
        appId,
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
      <DialogContent className="sm:max-w-lg flex flex-col max-h-[90dvh] p-0">
        <DialogHeader className="px-6 pt-6 flex-shrink-0">
          <DialogTitle className="font-headline">Suggest Profile Changes</DialogTitle>
          <DialogDescription>
            Update your information below. Your changes will be sent to a dispatcher for approval.
          </DialogDescription>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto px-6">
            <div className="space-y-4 py-4">
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
                    <Label className="flex items-center gap-2"><ListChecks /> Skills</Label>
                    <ScrollArea className="h-40 rounded-md border p-3 mt-1">
                    <div className="space-y-2">
                        {allSkills.length === 0 && <p className="text-sm text-muted-foreground">No skills defined in library.</p>}
                        {allSkills.map(skill => (
                        <div key={skill} className="flex items-center space-x-2">
                            <Checkbox
                            id={`skill-req-${skill.replace(/\s+/g, '-')}`}
                            checked={selectedSkills.includes(skill)}
                            onCheckedChange={() => handleSkillChange(skill)}
                            />
                            <Label htmlFor={`skill-req-${skill.replace(/\s+/g, '-')}`} className="font-normal cursor-pointer">
                            {skill}
                            </Label>
                        </div>
                        ))}
                    </div>
                    </ScrollArea>
                </div>
                <div>
                    <Label htmlFor="change-notes">Notes for Dispatcher (Optional)</Label>
                    <Textarea 
                        id="change-notes"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Use this area to request other changes not listed above."
                    />
                </div>
            </div>
        </div>
        <DialogFooter className="px-6 pb-6 pt-4 border-t flex-shrink-0">
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
