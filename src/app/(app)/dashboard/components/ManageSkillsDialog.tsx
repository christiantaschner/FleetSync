
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
import { useToast } from "@/hooks/use-toast";
import { db } from '@/lib/firebase';
import { collection, addDoc, deleteDoc, getDocs, query, orderBy, doc, writeBatch, where } from 'firebase/firestore';
import { Loader2, PlusCircle, Trash2, X, Sparkles } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { PREDEFINED_SKILLS } from '@/lib/skills';
import { useAuth } from '@/contexts/auth-context';

interface Skill {
  id: string;
  name: string;
}

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
  const [isLibraryEmpty, setIsLibraryEmpty] = useState(false);

  const fetchSkills = async () => {
    if (!db || !userProfile?.companyId) return;
    setIsLoading(true);
    try {
      const skillsQuery = query(collection(db, "skills"), where("companyId", "==", userProfile.companyId), orderBy("name"));
      const querySnapshot = await getDocs(skillsQuery);
      const skillsData = querySnapshot.docs.map(doc => ({ id: doc.id, name: doc.data().name as string }));
      setSkills(skillsData);
      setIsLibraryEmpty(skillsData.length === 0);
    } catch (error) {
      console.error("Error fetching skills: ", error);
      toast({ title: "Error", description: "Could not fetch skills library.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchSkills();
    }
  }, [isOpen, userProfile]);

  const handleAddSkill = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSkillName.trim() || !db || !userProfile?.companyId) return;
    
    if (skills.some(skill => skill.name.toLowerCase() === newSkillName.trim().toLowerCase())) {
        toast({ title: "Duplicate Skill", description: "This skill already exists.", variant: "destructive"});
        return;
    }

    setIsSubmitting(true);
    try {
      await addDoc(collection(db, "skills"), { name: newSkillName.trim(), companyId: userProfile.companyId });
      setNewSkillName('');
      toast({ title: "Success", description: `Skill "${newSkillName.trim()}" added.`});
      await fetchSkills(); 
      onSkillsUpdated(); 
    } catch (error) {
      console.error("Error adding skill: ", error);
      toast({ title: "Error", description: "Could not add skill.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteSkill = async (skillId: string) => {
    if (!db) return;
    setIsLoading(true); 
    try {
      await deleteDoc(doc(db, "skills", skillId));
      toast({ title: "Success", description: "Skill deleted."});
      await fetchSkills(); 
      onSkillsUpdated(); 
    } catch (error) {
      console.error("Error deleting skill: ", error);
      toast({ title: "Error", description: "Could not delete skill. It might be in use.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSeedSkills = async () => {
    if (!db || !userProfile?.companyId) return;
    setIsSubmitting(true);
    try {
        const batch = writeBatch(db);
        const skillsCollectionRef = collection(db, "skills");
        
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
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-headline">Manage Skills Library</DialogTitle>
          <DialogDescription>
            Add or remove skills available for assignment to technicians.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleAddSkill} className="flex items-center gap-2 py-2">
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

        <h3 className="text-sm font-medium text-muted-foreground pt-2">Existing Skills</h3>
        <ScrollArea className="h-60 rounded-md border">
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
                                onClick={() => handleDeleteSkill(skill.id)}
                            >
                                <Trash2 className="h-4 w-4" />
                                <span className="sr-only">Delete {skill.name}</span>
                            </Button>
                        </div>
                    ))
                ) : isLibraryEmpty ? (
                    <div className="text-center p-4">
                        <p className="text-sm text-muted-foreground">Your skills library is empty.</p>
                        <Button variant="accent" size="sm" className="mt-3" onClick={handleSeedSkills} disabled={isSubmitting}>
                           {isSubmitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin"/> : <Sparkles className="h-4 w-4 mr-2" />}
                           Seed with Common Skills
                        </Button>
                    </div>
                ) : (
                    <p className="text-sm text-muted-foreground text-center p-4">No skills in the library. Add one above.</p>
                )}
            </div>
        </ScrollArea>

        <DialogFooter className="sm:justify-start mt-4">
          <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
            <X className="mr-2 h-4 w-4" /> Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ManageSkillsDialog;
