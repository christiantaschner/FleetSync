
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
import type { Technician, TechnicianSkill } from '@/types';
import { Loader2, Send, ListChecks, Upload, Paperclip, X } from 'lucide-react';
import { requestProfileChangeAction } from '@/actions/fleet-actions';
import { uploadCertificateAction } from '@/actions/storage-actions';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import isEqual from 'lodash.isequal';
import { useAuth } from '@/contexts/auth-context';
import Link from 'next/link';

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
  const [isUploading, setIsUploading] = useState<string | null>(null);

  const [name, setName] = useState(technician.name);
  const [email, setEmail] = useState(technician.email);
  const [phone, setPhone] = useState(technician.phone);
  const [notes, setNotes] = useState('');
  const [selectedSkills, setSelectedSkills] = useState<TechnicianSkill[]>([]);
  
  const appId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

  useEffect(() => {
    if (isOpen) {
        setName(technician.name);
        setEmail(technician.email);
        setPhone(technician.phone);
        setSelectedSkills(technician.skills || []);
        setNotes('');
    }
  }, [isOpen, technician]);

  const handleSkillToggle = (skillName: string) => {
    setSelectedSkills(prevSkills => {
      const isSelected = prevSkills.some(s => s.name === skillName);
      if (isSelected) {
        return prevSkills.filter(s => s.name !== skillName);
      } else {
        return [...prevSkills, { name: skillName }];
      }
    });
  };

  const handleFileUpload = async (skillName: string, file: File) => {
    if (!user || !appId) return;
    setIsUploading(skillName);
    const result = await uploadCertificateAction({
      technicianId: user.uid,
      skillName,
      file,
      appId,
    });
    setIsUploading(null);

    if (result.error) {
      toast({ title: "Upload Failed", description: result.error, variant: "destructive" });
    } else if (result.data) {
      setSelectedSkills(prev => prev.map(skill => 
        skill.name === skillName 
          ? { ...skill, certificateUrl: result.data!.url, certificateFileName: result.data!.fileName }
          : skill
      ));
      toast({ title: "Upload Successful", description: `${result.data.fileName} is ready to be submitted for review.` });
    }
  };

  const handleRemoveCertificate = (skillName: string) => {
     setSelectedSkills(prev => prev.map(skill => 
        skill.name === skillName 
          ? { name: skillName } // Remove certificate fields
          : skill
      ));
  };


  const handleSubmit = async () => {
    if (!user || !userProfile?.companyId) {
        toast({ title: "Not Authenticated", description: "You must be logged in and part of a company to submit a change.", variant: "destructive" });
        return;
    }
    
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
    if (!isEqual(initialSkills.sort((a,b) => a.name.localeCompare(b.name)), selectedSkills.sort((a,b) => a.name.localeCompare(b.name)))) {
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
                    <Label className="flex items-center gap-2"><ListChecks /> Skills & Certifications</Label>
                    <ScrollArea className="h-40 rounded-md border p-3 mt-1">
                    <div className="space-y-3">
                        {allSkills.length === 0 && <p className="text-sm text-muted-foreground">No skills defined in library.</p>}
                        {allSkills.map(skillName => {
                            const currentSkill = selectedSkills.find(s => s.name === skillName);
                            return (
                                <div key={skillName} className="flex items-center justify-between">
                                    <div className="flex items-center space-x-2">
                                        <Checkbox
                                            id={`skill-req-${skillName.replace(/\s+/g, '-')}`}
                                            checked={!!currentSkill}
                                            onCheckedChange={() => handleSkillToggle(skillName)}
                                        />
                                        <Label htmlFor={`skill-req-${skillName.replace(/\s+/g, '-')}`} className="font-normal cursor-pointer">
                                            {skillName}
                                        </Label>
                                    </div>
                                    {currentSkill && (
                                      <div>
                                        {currentSkill.certificateUrl ? (
                                          <div className="flex items-center gap-1">
                                            <Link href={currentSkill.certificateUrl} target="_blank" className="text-xs font-medium text-primary hover:underline truncate max-w-[100px]">{currentSkill.certificateFileName}</Link>
                                            <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => handleRemoveCertificate(skillName)}><X className="h-3 w-3"/></Button>
                                          </div>
                                        ) : (
                                          <Button variant="outline" size="sm" className="h-7" onClick={() => document.getElementById(`file-upload-${skillName}`)?.click()} disabled={isUploading === skillName}>
                                              {isUploading === skillName ? <Loader2 className="h-4 w-4 animate-spin"/> : <Upload className="h-3 w-3 mr-1.5" />}
                                              Cert.
                                          </Button>
                                        )}
                                        <input 
                                          type="file" 
                                          id={`file-upload-${skillName}`} 
                                          className="hidden" 
                                          accept=".pdf"
                                          onChange={(e) => e.target.files?.[0] && handleFileUpload(skillName, e.target.files[0])}
                                        />
                                      </div>
                                    )}
                                </div>
                            )
                        })}
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
