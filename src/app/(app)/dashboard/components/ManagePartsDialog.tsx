

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
import { Loader2, PlusCircle, Trash2, X, Sparkles, Package } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { PREDEFINED_PARTS } from '@/lib/parts';
import { useAuth } from '@/contexts/auth-context';
import { getPartsAction, addPartAction, deletePartAction, type Part } from '@/actions/part-actions';
import { writeBatch, collection, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface ManagePartsDialogProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  onPartsUpdated: () => void;
}

const ManagePartsDialog: React.FC<ManagePartsDialogProps> = ({ isOpen, setIsOpen, onPartsUpdated }) => {
  const { userProfile } = useAuth();
  const { toast } = useToast();
  const [parts, setParts] = useState<Part[]>([]);
  const [newPartName, setNewPartName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const appId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

  const fetchParts = useCallback(async () => {
    if (!userProfile?.companyId || !appId) return;
    setIsLoading(true);
    const result = await getPartsAction({ companyId: userProfile.companyId, appId });
    if (result.error) {
        console.error("Could not fetch parts library:", result.error);
        setParts([]);
    } else {
        setParts(result.data || []);
    }
    setIsLoading(false);
  }, [userProfile, appId]);

  useEffect(() => {
    if (isOpen) {
      fetchParts();
    }
  }, [isOpen, fetchParts]);

  const handleAddPart = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPartName.trim() || !userProfile?.companyId || !appId) return;
    
    setIsSubmitting(true);
    const result = await addPartAction({ name: newPartName, companyId: userProfile.companyId, appId });
    if (result.error) {
        toast({ title: "Error adding part", description: result.error, variant: "destructive" });
    } else {
        setNewPartName('');
        toast({ title: "Success", description: `Part "${newPartName.trim()}" added.`});
        if (result.data) {
          setParts(prev => [...prev, { id: result.data!.id, name: newPartName.trim() }].sort((a,b) => a.name.localeCompare(b.name)));
        }
        onPartsUpdated();
    }
    setIsSubmitting(false);
  };

  const handleDeletePart = async (partId: string) => {
    if (!userProfile?.companyId || !appId) return;

    setParts(prevParts => prevParts.filter(part => part.id !== partId));
    
    const result = await deletePartAction({ partId, companyId: userProfile.companyId, appId });

    if (result.error) {
      toast({ title: "Error", description: result.error, variant: "destructive" });
      fetchParts(); // Re-fetch to restore state on error
    } else {
      toast({ title: "Success", description: "Part deleted."});
      onPartsUpdated();
    }
  };

  const handleSeedParts = async () => {
    if (!userProfile?.companyId || !appId) return;
    setIsSubmitting(true);

    if (process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true') {
        const newParts = PREDEFINED_PARTS.map(name => ({ id: `mock_part_${name}`, name }));
        setParts(prev => [...prev, ...newParts].sort((a, b) => a.name.localeCompare(b.name)));
        toast({ title: "Success", description: `Seeded ${PREDEFINED_PARTS.length} common parts.` });
        onPartsUpdated();
        setIsSubmitting(false);
        return;
    }

    if (!db) {
        toast({ title: "Error", description: "Database not available.", variant: "destructive" });
        setIsSubmitting(false);
        return;
    }

    try {
        const batch = writeBatch(db);
        const partsCollectionRef = collection(db, `artifacts/${appId}/public/data/parts`);
        
        PREDEFINED_PARTS.forEach(partName => {
            const docRef = doc(partsCollectionRef);
            batch.set(docRef, { name: partName, companyId: userProfile.companyId });
        });

        await batch.commit();
        toast({ title: "Success", description: `Seeded ${PREDEFINED_PARTS.length} common parts.` });
        await fetchParts();
        onPartsUpdated();
    } catch(error) {
        console.error("Error seeding parts:", error);
        toast({ title: "Error", description: "Could not seed parts library.", variant: "destructive" });
    } finally {
        setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-md flex flex-col max-h-[90dvh] p-0">
        <DialogHeader className="px-6 pt-6 flex-shrink-0">
          <DialogTitle className="font-headline flex items-center gap-2"><Package /> Manage Parts Library</DialogTitle>
          <DialogDescription>
            Add or remove parts available in your inventory. This is a central library.
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex-1 flex flex-col overflow-hidden px-6">
          <form onSubmit={handleAddPart} className="flex items-center gap-2 py-2 flex-shrink-0">
              <Label htmlFor="new-part-name" className="sr-only">New Part Name</Label>
              <Input 
                  id="new-part-name"
                  value={newPartName}
                  onChange={(e) => setNewPartName(e.target.value)}
                  placeholder="e.g., Compressor"
                  disabled={isSubmitting}
              />
              <Button type="submit" size="icon" disabled={isSubmitting || !newPartName.trim()}>
                  {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <PlusCircle className="h-4 w-4" />}
                  <span className="sr-only">Add Part</span>
              </Button>
          </form>

          <h3 className="text-sm font-medium text-muted-foreground pt-2 flex-shrink-0">Existing Parts</h3>
          <div className="flex-1 overflow-y-auto -mx-6 mt-2">
            <ScrollArea className="h-full px-6">
              <div className="p-2">
                  {isLoading ? (
                      <div className="flex items-center justify-center p-4">
                          <Loader2 className="h-5 w-5 animate-spin" />
                      </div>
                  ) : parts.length > 0 ? (
                      parts.map(part => (
                          <div key={part.id} className="flex items-center justify-between p-2 rounded-md hover:bg-secondary">
                              <span className="text-sm">{part.name}</span>
                              <Button 
                                  variant="ghost" 
                                  size="icon"
                                  className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                  onClick={() => handleDeletePart(part.id)}
                              >
                                  <Trash2 className="h-4 w-4" />
                                  <span className="sr-only">Delete {part.name}</span>
                              </Button>
                          </div>
                      ))
                  ) : (
                      <div className="text-center p-4">
                          <p className="text-sm text-muted-foreground">Your parts library is empty.</p>
                          <Button variant="accent" size="sm" className="mt-3" onClick={handleSeedParts} disabled={isSubmitting}>
                            {isSubmitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin"/> : <Sparkles className="h-4 w-4 mr-2" />}
                            Seed with Common Parts
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

export default ManagePartsDialog;
