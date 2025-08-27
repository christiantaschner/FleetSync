

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
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, PlusCircle, Trash2, X, Sparkles, Settings, Save } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/contexts/auth-context';
import { addSkillAction, deleteSkillAction, type Skill } from '@/actions/skill-actions';
import { PREDEFINED_SKILLS } from '@/lib/skills';
import { db } from '@/lib/firebase';
import { writeBatch, collection, doc } from 'firebase/firestore';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import isEqual from 'lodash.isequal';


interface ManageSkillsDialogProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  onSkillsUpdated: (newSkills: Skill[]) => void;
  initialSkills: Skill[];
}

const ManageSkillsDialog: React.FC<ManageSkillsDialogProps> = ({ isOpen, setIsOpen, onSkillsUpdated, initialSkills }) => {
  const { userProfile } = useAuth();
  const { toast } = useToast();
  
  const [localSkills, setLocalSkills] = useState<Skill[]>([]);
  const [newSkillName, setNewSkillName] = useState('');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const appId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

  useEffect(() => {
    if (isOpen) {
      setLocalSkills(JSON.parse(JSON.stringify(initialSkills)));
      setNewSkillName('');
    }
  }, [isOpen, initialSkills]);

  const handleAddLocalSkill = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = newSkillName.trim();
    if (!trimmedName) return;

    if (localSkills.some(s => s.name.toLowerCase() === trimmedName.toLowerCase())) {
        toast({ title: "Duplicate Skill", description: "This skill already exists in the list.", variant: "destructive" });
        return;
    }
    
    setLocalSkills(prev => [...prev, { id: `new_${Date.now()}`, name: trimmedName }].sort((a,b) => a.name.localeCompare(b.name)));
    setNewSkillName('');
  };
  
  const handleDeleteLocalSkill = (skillId: string) => {
     setLocalSkills(prev => prev.filter(s => s.id !== skillId));
  };

  const handleSeedSkills = () => {
    const existingNames = new Set(localSkills.map(s => s.name.toLowerCase()));
    const skillsToSeed = PREDEFINED_SKILLS
        .filter(name => !existingNames.has(name.toLowerCase()))
        .map(name => ({ id: `new_seed_${name}_${Date.now()}`, name }));

    if (skillsToSeed.length === 0) {
        toast({ title: "No New Skills to Seed", description: "Your library already contains all predefined common skills.", variant: "default" });
        return;
    }

    setLocalSkills(prev => [...prev, ...skillsToSeed].sort((a,b) => a.name.localeCompare(b.name)));
  };
  
  const handleSaveAndClose = async () => {
    if (isEqual(initialSkills.map(s => s.name).sort(), localSkills.map(s => s.name).sort())) {
        setIsOpen(false);
        return;
    }

    if (process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true') {
        onSkillsUpdated(localSkills);
        toast({ title: "Success", description: "Skills library updated in mock mode." });
        setIsOpen(false);
        return;
    }

    if (!userProfile?.companyId || !appId) return;

    setIsSubmitting(true);

    const initialSkillNames = new Set(initialSkills.map(s => s.name));
    const localSkillNames = new Set(localSkills.map(s => s.name));
    
    const skillsToDelete = initialSkills.filter(s => !localSkillNames.has(s.name));
    const skillsToAdd = localSkills.filter(s => !initialSkillNames.has(s.name));

    let hasError = false;

    // Process deletions
    for (const skill of skillsToDelete) {
        if(hasError) break;
        const result = await deleteSkillAction({
            skillId: skill.id,
            skillName: skill.name,
            companyId: userProfile.companyId,
            appId
        });
        if (result.error) {
            toast({ title: "Error Deleting Skill", description: result.error, variant: "destructive" });
            hasError = true;
        }
    }

    // Process additions
    for (const skill of skillsToAdd) {
        if(hasError) break;
        const result = await addSkillAction({ name: skill.name, companyId: userProfile.companyId, appId });
         if (result.error) {
            toast({ title: "Error Adding Skill", description: result.error, variant: "destructive" });
            hasError = true;
        }
    }

    if (!hasError) {
        toast({ title: "Success", description: "Skills library has been updated." });
        onSkillsUpdated(localSkills);
        setIsOpen(false);
    }

    setIsSubmitting(false);
  };
  
  const handleDiscard = () => {
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-md flex flex-col max-h-[90dvh] p-0">
        <DialogHeader className="px-6 pt-6 flex-shrink-0">
          <DialogTitle className="font-headline flex items-center gap-2"><Settings className="h-5 w-5" /> Manage Skills Library</DialogTitle>
          <DialogDescription>
            Add or remove skills available for assignment to technicians.
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex-1 flex flex-col overflow-hidden px-6">
            <form onSubmit={handleAddLocalSkill} className="flex items-center gap-2 py-2 flex-shrink-0">
                <Label htmlFor="new-skill-name" className="sr-only">New Skill Name</Label>
                <Input 
                    id="new-skill-name"
                    value={newSkillName}
                    onChange={(e) => setNewSkillName(e.target.value)}
                    placeholder="e.g., HVAC Certification"
                    disabled={isSubmitting}
                />
                <Button type="submit" size="icon" disabled={isSubmitting || !newSkillName.trim()}>
                    <PlusCircle className="h-4 w-4" />
                    <span className="sr-only">Add Skill</span>
                </Button>
            </form>

            <h3 className="text-sm font-medium text-muted-foreground pt-2 flex-shrink-0">Existing Skills</h3>
            <div className="flex-1 overflow-y-auto -mx-6 mt-2">
                <ScrollArea className="h-full px-6">
                    <div className="p-2">
                        {localSkills.length > 0 ? (
                            localSkills.map(skill => (
                                <div key={skill.id} className="flex items-center justify-between p-2 rounded-md hover:bg-secondary">
                                    <span className="text-sm">{skill.name}</span>
                                     <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button 
                                                variant="ghost" 
                                                size="icon"
                                                className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                                <span className="sr-only">Delete {skill.name}</span>
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    Deleting "{skill.name}" will remove it from the central library and from all technicians who have it. This action will be saved when you click "Save & Close".
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                <AlertDialogAction onClick={() => handleDeleteLocalSkill(skill.id)}>Continue</AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </div>
                            ))
                        ) : (
                            <div className="text-center p-4">
                                <p className="text-sm text-muted-foreground">Your skills library is empty.</p>
                                <Button variant="accent" size="sm" className="mt-3" onClick={handleSeedSkills} disabled={isSubmitting}>
                                {isSubmitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin"/> : <Sparkles className="h-4 w-4 mr-2" />}
                                Seed with Common Skills
                                </Button>
                            </div>
                        )}
                    </div>
                </ScrollArea>
            </div>
        </div>

        <DialogFooter className="px-6 pb-6 pt-4 border-t flex-shrink-0 sm:justify-between items-center gap-2">
            <Button type="button" variant="outline" onClick={handleDiscard} disabled={isSubmitting}>
                Discard Changes
            </Button>
           <Button type="button" onClick={handleSaveAndClose} disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Save className="mr-2 h-4 w-4" />}
            Save & Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ManageSkillsDialog;
