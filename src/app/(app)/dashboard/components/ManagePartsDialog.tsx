
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
import { collection, addDoc, deleteDoc, getDocs, query, orderBy, doc, writeBatch } from 'firebase/firestore';
import { Loader2, PlusCircle, Trash2, X, Sparkles, Package } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { PREDEFINED_PARTS } from '@/lib/parts';

interface Part {
  id: string;
  name: string;
}

interface ManagePartsDialogProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  onPartsUpdated: () => void;
}

const ManagePartsDialog: React.FC<ManagePartsDialogProps> = ({ isOpen, setIsOpen, onPartsUpdated }) => {
  const { toast } = useToast();
  const [parts, setParts] = useState<Part[]>([]);
  const [newPartName, setNewPartName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLibraryEmpty, setIsLibraryEmpty] = useState(false);

  const fetchParts = async () => {
    if (!db) return;
    setIsLoading(true);
    try {
      const partsQuery = query(collection(db, "parts"), orderBy("name"));
      const querySnapshot = await getDocs(partsQuery);
      const partsData = querySnapshot.docs.map(doc => ({ id: doc.id, name: doc.data().name as string }));
      setParts(partsData);
      setIsLibraryEmpty(partsData.length === 0);
    } catch (error) {
      console.error("Error fetching parts: ", error);
      toast({ title: "Error", description: "Could not fetch parts library.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchParts();
    }
  }, [isOpen]);

  const handleAddPart = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPartName.trim() || !db) return;
    
    if (parts.some(part => part.name.toLowerCase() === newPartName.trim().toLowerCase())) {
        toast({ title: "Duplicate Part", description: "This part already exists.", variant: "destructive"});
        return;
    }

    setIsSubmitting(true);
    try {
      await addDoc(collection(db, "parts"), { name: newPartName.trim() });
      setNewPartName('');
      toast({ title: "Success", description: `Part "${newPartName.trim()}" added.`});
      await fetchParts(); 
      onPartsUpdated(); 
    } catch (error) {
      console.error("Error adding part: ", error);
      toast({ title: "Error", description: "Could not add part.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeletePart = async (partId: string) => {
    if (!db) return;
    setIsLoading(true); 
    try {
      await deleteDoc(doc(db, "parts", partId));
      toast({ title: "Success", description: "Part deleted."});
      await fetchParts(); 
      onPartsUpdated(); 
    } catch (error) {
      console.error("Error deleting part: ", error);
      toast({ title: "Error", description: "Could not delete part. It might be in use.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSeedParts = async () => {
    if (!db) return;
    setIsSubmitting(true);
    try {
        const batch = writeBatch(db);
        const partsCollectionRef = collection(db, "parts");
        
        PREDEFINED_PARTS.forEach(partName => {
            const docRef = doc(partsCollectionRef);
            batch.set(docRef, { name: partName });
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
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-headline flex items-center gap-2"><Package /> Manage Parts Library</DialogTitle>
          <DialogDescription>
            Add or remove parts available in your inventory. This is a central library.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleAddPart} className="flex items-center gap-2 py-2">
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

        <h3 className="text-sm font-medium text-muted-foreground pt-2">Existing Parts</h3>
        <ScrollArea className="h-60 rounded-md border">
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
                ) : isLibraryEmpty ? (
                    <div className="text-center p-4">
                        <p className="text-sm text-muted-foreground">Your parts library is empty.</p>
                        <Button variant="accent" size="sm" className="mt-3" onClick={handleSeedParts} disabled={isSubmitting}>
                           {isSubmitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin"/> : <Sparkles className="h-4 w-4 mr-2" />}
                           Seed with Common Parts
                        </Button>
                    </div>
                ) : (
                    <p className="text-sm text-muted-foreground text-center p-4">No parts in the library. Add one above.</p>
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

export default ManagePartsDialog;

    