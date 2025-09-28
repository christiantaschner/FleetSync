
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
import { Loader2, PlusCircle, Trash2, X, Sparkles, Package, Save, Undo2 } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { PREDEFINED_PARTS } from '@/lib/parts';
import { useAuth } from '@/contexts/auth-context';
import { addPartAction, deletePartAction, getPartsAction, type Part } from '@/actions/part-actions';
import { cn } from '@/lib/utils';
import isEqual from 'lodash.isequal';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";


interface ManagePartsDialogProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  onPartsUpdated: () => void;
  initialParts: Part[];
}

type LocalPart = Part & { status: 'existing' | 'new' | 'deleted' };

const ManagePartsDialog: React.FC<ManagePartsDialogProps> = ({ isOpen, setIsOpen, onPartsUpdated, initialParts }) => {
  const { userProfile } = useAuth();
  const { toast } = useToast();
  
  const [localParts, setLocalParts] = useState<LocalPart[]>([]);
  const [newPartName, setNewPartName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const appId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

  useEffect(() => {
    if (isOpen) {
      setLocalParts(initialParts.map(p => ({ ...p, status: 'existing' })));
      setNewPartName('');
    }
  }, [isOpen, initialParts]);

  const handleAddLocalPart = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = newPartName.trim();
    if (!trimmedName) return;

    if (localParts.some(p => p.name.toLowerCase() === trimmedName.toLowerCase() && p.status !== 'deleted')) {
        toast({ title: "Duplicate Part", description: "This part already exists in the list.", variant: "destructive" });
        return;
    }
    
    // If re-adding a deleted part, just update its status
    const existingDeletedIndex = localParts.findIndex(p => p.name.toLowerCase() === trimmedName.toLowerCase() && p.status === 'deleted');
    if (existingDeletedIndex !== -1) {
        const updatedParts = [...localParts];
        updatedParts[existingDeletedIndex].status = 'existing';
        setLocalParts(updatedParts);
    } else {
        setLocalParts(prev => [...prev, { id: `new_${Date.now()}`, name: trimmedName, status: 'new' }].sort((a,b) => a.name.localeCompare(b.name)));
    }
    setNewPartName('');
  };
  
  const handleToggleDelete = (partId: string) => {
    setLocalParts(prev => prev.map(p => {
        if (p.id === partId) {
            if (p.status === 'new') {
                return null; // A new item that is deleted is just removed from the list
            }
            return { ...p, status: p.status === 'deleted' ? 'existing' : 'deleted' };
        }
        return p;
    }).filter(Boolean) as LocalPart[]);
  };
  
  const handleSeedParts = () => {
    const existingNames = new Set(localParts.filter(p => p.status !== 'deleted').map(p => p.name.toLowerCase()));
    const partsToSeed: LocalPart[] = PREDEFINED_PARTS
        .filter(name => !existingNames.has(name.toLowerCase()))
        .map(name => ({ id: `new_seed_${name}_${Date.now()}`, name, status: 'new' }));

    if (partsToSeed.length === 0) {
        toast({ title: "No New Parts to Seed", description: "Your library already contains all predefined common parts.", variant: "default" });
        return;
    }

    setLocalParts(prev => [...prev, ...partsToSeed].sort((a,b) => a.name.localeCompare(b.name)));
  };
  
  const handleSaveAndClose = async () => {
    const originalNames = new Set(initialParts.map(s => s.name));
    const finalNames = new Set(localParts.filter(s => s.status !== 'deleted').map(s => s.name));

    if (isEqual(originalNames, finalNames)) {
        setIsOpen(false);
        return;
    }

    if (process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true') {
        onPartsUpdated();
        toast({ title: "Success", description: "Parts library updated in mock mode." });
        setIsOpen(false);
        return;
    }

    if (!userProfile?.companyId || !appId) return;

    setIsSubmitting(true);

    const partsToDelete = localParts.filter(s => s.status === 'deleted' && s.id.startsWith('new_') === false);
    const partsToAdd = localParts.filter(s => s.status === 'new');

    let hasError = false;

    // Process deletions
    for (const part of partsToDelete) {
        if(hasError) break;
        const result = await deletePartAction({ partId: part.id, companyId: userProfile.companyId, appId });
        if (result.error) {
            toast({ title: `Error Deleting ${part.name}`, description: result.error, variant: "destructive" });
            hasError = true;
        }
    }

    // Process additions
    for (const part of partsToAdd) {
        if(hasError) break;
        const result = await addPartAction({ name: part.name, companyId: userProfile.companyId, appId });
         if (result.error) {
            toast({ title: `Error Adding ${part.name}`, description: result.error, variant: "destructive" });
            hasError = true;
        }
    }

    if (!hasError) {
        toast({ title: "Success", description: "Parts library has been updated." });
        onPartsUpdated();
        setIsOpen(false);
    }

    setIsSubmitting(false);
  };

  const hasChanges = !isEqual(
    initialParts.map(s => s.name).sort(),
    localParts.filter(s => s.status !== 'deleted').map(s => s.name).sort()
  );

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if(!open) setIsOpen(false) }}>
      <DialogContent className="sm:max-w-md flex flex-col max-h-[90dvh] p-0">
        <DialogHeader className="px-6 pt-6 flex-shrink-0">
          <DialogTitle className="font-headline flex items-center gap-2"><Package /> Manage Parts Library</DialogTitle>
          <DialogDescription>
            Add or remove parts available in your inventory. This is a central library.
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex-1 flex flex-col overflow-hidden px-6">
          <form onSubmit={handleAddLocalPart} className="flex items-center gap-2 py-2 flex-shrink-0">
              <Label htmlFor="new-part-name" className="sr-only">New Part Name</Label>
              <Input 
                  id="new-part-name"
                  value={newPartName}
                  onChange={(e) => setNewPartName(e.target.value)}
                  placeholder="e.g., Compressor"
                  disabled={isSubmitting}
              />
              <Button type="submit" size="icon" disabled={isSubmitting || !newPartName.trim()}>
                  <PlusCircle className="h-4 w-4" />
                  <span className="sr-only">Add Part</span>
              </Button>
          </form>

          <h3 className="text-sm font-medium text-muted-foreground pt-2 flex-shrink-0">Existing Parts</h3>
          <div className="flex-1 overflow-y-auto -mx-6 mt-2">
            <ScrollArea className="h-full px-6">
              <div className="p-2">
                  {localParts.length > 0 ? (
                      localParts.map(part => (
                          <div key={part.id} className="flex items-center justify-between p-2 rounded-md hover:bg-secondary">
                              <span className={cn("text-sm", 
                                  part.status === 'new' && 'text-green-600 font-medium',
                                  part.status === 'deleted' && 'text-red-600 line-through'
                              )}>{part.name}</span>
                              <Button 
                                  variant="ghost" 
                                  size="icon"
                                  className={cn("h-7 w-7 text-muted-foreground",
                                    part.status === 'deleted' ? 'hover:text-amber-600 hover:bg-amber-100' : 'hover:text-destructive hover:bg-destructive/10'
                                  )}
                                  onClick={() => handleToggleDelete(part.id)}
                              >
                                {part.status === 'deleted' ? <Undo2 className="h-4 w-4" /> : <Trash2 className="h-4 w-4" />}
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

        <DialogFooter className="px-6 pb-6 pt-4 border-t flex-shrink-0 sm:justify-between items-center gap-2">
            <AlertDialog>
                <AlertDialogTrigger asChild>
                    <Button type="button" variant="outline" disabled={isSubmitting || !hasChanges}>
                        Discard Changes
                    </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            You have unsaved changes. Are you sure you want to discard them?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => setIsOpen(false)}>Discard</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
           <Button type="button" onClick={handleSaveAndClose} disabled={isSubmitting || !hasChanges}>
            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Save className="mr-2 h-4 w-4" />}
            Save & Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ManagePartsDialog;
