
"use client";

import React, { useState, useEffect, useCallback } from 'react';
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
import { useToast } from "@/hooks/use-toast";
import { Loader2, PlusCircle, Trash2, X, Sparkles, Settings } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { PREDEFINED_SKILLS } from '@/lib/skills';
import { useAuth } from '@/contexts/auth-context';
import { getSkillsAction, addSkillAction, deleteSkillAction, type Skill } from '@/actions/skill-actions';
import { writeBatch, collection, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface ManageSkillsDialogProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  onSkillsUpdated: () => void;
}

const ManageSkillsDialog: React.FC<ManageSkillsDialogProps> = ({ isOpen, setIsOpen, onSkillsUpdated }) => {
  const { userProfile } = useAuth();
  const { toast } = useToast();
  const [skills, setSkills] = useState<Skill[]>([]);
  const [newSkillName, setNewSkillName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const appId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

  const fetchSkills = useCallback(async () => {
    if (!userProfile?.companyId || !appId) return;

    setIsLoading(true);
    const result = await getSkillsAction({ companyId: userProfile.companyId });
    if(result.error) {
        console.error("Could not fetch skills library:", result.error);
        setSkills([]);
    } else {
        setSkills(result.data || []);
    }
    setIsLoading(false);
  }, [userProfile, appId]);

  useEffect(() => {
    if (isOpen) {
      fetchSkills();
    }
  }, [isOpen, fetchSkills]);

  const handleAddSkill = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSkillName.trim() || !userProfile?.companyId || !appId) return;

    setIsSubmitting(true);
    const result = await addSkillAction({ name: newSkillName.trim(), companyId: userProfile.companyId, appId });

    if (result.error) {
        toast({ title: "Error Adding Skill", description: result.error, variant: "destructive" });
    } else {
        setNewSkillName('');
        toast({ title: "Success", description: `Skill "${newSkillName.trim()}" added.`});
        setSkills(prev => [...prev, {id: result.data!.id, name: newSkillName.trim() }].sort((a,b) => a.name.localeCompare(b.name)));
        onSkillsUpdated(); 
    }
    setIsSubmitting(false);
  };

  const handleDeleteSkill = async (skill: Skill) => {
    if (!userProfile?.companyId || !appId) return;

    const originalSkills = [...skills];
    setSkills(prev => prev.filter(s => s.id !== skill.id));

    const result = await deleteSkillAction({
      skillId: skill.id,
      skillName: skill.name,
      companyId: userProfile.companyId,
      appId,
    });

    if (result.error) {
      toast({
        title: "Deletion Failed",
        description: result.error,
        variant: "destructive",
      });
      setSkills(originalSkills);
    } else {
      toast({
        title: "Skill Deleted",
        description: `"${skill.name}" was removed from the library and all technicians.`,
      });
      onSkillsUpdated();
    }
  };


  const handleSeedSkills = async () => {
    if (!db || !userProfile?.companyId || !appId) return;

    setIsSubmitting(true);
    try {
        const batch = writeBatch(db);
        const skillsCollectionRef = collection(db, `artifacts/${appId}/public/data/skills`);
        
        PREDEFINED_SKILLS.forEach(skillName => {
            const docRef = doc(skillsCollectionRef);
            batch.set(docRef, { name: skillName, companyId: userProfile.companyId });
        });

        await batch.commit();
        toast({ title: "Success", description: `Seeded ${PREDEFINED_SKILLS.length} common skills.` });
        await fetchSkills();
        onSkillsUpdated();
    } catch(error) {
        console.error("Error seeding skills:", error);
        toast({ title: "Error", description: "Could not seed skills library.", variant: "destructive" });
    } finally {
        setIsSubmitting(false);
    }
  }

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
            <form onSubmit={handleAddSkill} className="flex items-center gap-2 py-2 flex-shrink-0">
                <Label htmlFor="new-skill-name" className="sr-only">New Skill Name</Label>
                <Input 
                    id="new-skill-name"
                    value={newSkillName}
                    onChange={(e) => setNewSkillName(e.target.value)}
                    placeholder="e.g., HVAC Certification"
                    disabled={isSubmitting}
                />
                <Button type="submit" size="icon" disabled={isSubmitting || !newSkillName.trim()}>
                    {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <PlusCircle className="h-4 w-4" />}
                    <span className="sr-only">Add Skill</span>
                </Button>
            </form>

            <h3 className="text-sm font-medium text-muted-foreground pt-2 flex-shrink-0">Existing Skills</h3>
            <div className="flex-1 overflow-y-auto -mx-6 mt-2">
                <ScrollArea className="h-full px-6">
                    <div className="p-2">
                        {isLoading ? (
                            <div className="flex items-center justify-center p-4">
                                <Loader2 className="h-5 w-5 animate-spin" />
                            </div>
                        ) : skills.length > 0 ? (
                            skills.map(skill => (
                                <div key={skill.id} className="flex items-center justify-between p-2 rounded-md hover:bg-secondary">
                                    <span className="text-sm">{skill.name}</span>
                                    <Button 
                                        variant="ghost" 
                                        size="icon"
                                        className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                        onClick={() => handleDeleteSkill(skill)}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                        <span className="sr-only">Delete {skill.name}</span>
                                    </Button>
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

        <DialogFooter className="px-6 pb-6 pt-4 border-t flex-shrink-0">
          <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
            <X className="mr-2 h-4 w-4" /> Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ManageSkillsDialog;
