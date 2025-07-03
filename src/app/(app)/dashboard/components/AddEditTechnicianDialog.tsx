
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from "@/hooks/use-toast";
import { db } from '@/lib/firebase';
import { collection, addDoc, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import type { Technician } from '@/types';
import { Loader2, Save, User, Mail, Phone, ListChecks, MapPin, Package, Trash2 } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import AddressAutocompleteInput from './AddressAutocompleteInput';
import { useAuth } from '@/contexts/auth-context';
import { removeUserFromCompanyAction } from '@/actions/user-actions';

interface AddEditTechnicianDialogProps {
  isOpen: boolean;
  onClose: () => void;
  technician?: Technician | null;
  allSkills: string[];
  ownerId?: string;
  onTechnicianAddedOrUpdated?: (technician: Technician) => void;
}

const AddEditTechnicianDialog: React.FC<AddEditTechnicianDialogProps> = ({ isOpen, onClose, technician, allSkills, ownerId, onTechnicianAddedOrUpdated }) => {
  const { userProfile } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [locationAddress, setLocationAddress] = useState('');
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [isAvailable, setIsAvailable] = useState(true);

  const resetForm = useCallback(() => {
    setName(technician?.name || '');
    setEmail(technician?.email || '');
    setPhone(technician?.phone || '');
    setSelectedSkills(technician?.skills || []);
    setLocationAddress(technician?.location.address || '');
    setLatitude(technician?.location.latitude || null);
    setLongitude(technician?.location.longitude || null);
    setIsAvailable(technician ? technician.isAvailable : true);
  }, [technician]);

  useEffect(() => {
    if (isOpen) {
      resetForm();
    }
  }, [technician, isOpen, resetForm]);

  const handleSkillChange = (skill: string) => {
    setSelectedSkills(prevSkills => 
      prevSkills.includes(skill) 
        ? prevSkills.filter(s => s !== skill) 
        : [...prevSkills, skill]
    );
  };
  
  const handleLocationSelect = (location: { address: string; lat: number; lng: number }) => {
    setLocationAddress(location.address);
    setLatitude(location.lat);
    setLongitude(location.lng);
  };

  const handleDeleteTechnician = async () => {
    if (!technician) return;
    setIsDeleting(true);
    const result = await removeUserFromCompanyAction(technician.id);
    if (result.error) {
        toast({ title: "Error", description: `Failed to remove technician: ${result.error}`, variant: "destructive" });
    } else {
        toast({ title: "Success", description: `Technician "${technician.name}" has been removed from the company.` });
        onClose();
    }
    setIsDeleting(false);
  };

  const handleSubmit = async () => {
    if (!name.trim() || !locationAddress.trim()) {
      toast({ title: "Missing Information", description: "Please fill in Name and Location Address.", variant: "destructive" });
      return;
    }
    if (latitude === null || longitude === null) {
      toast({ title: "Invalid Address", description: "Please select a valid address from the dropdown suggestions to set the location.", variant: "destructive" });
      return;
    }
    if (!userProfile?.companyId) {
      toast({ title: "Authentication Error", description: "Company ID not found.", variant: "destructive" });
      return;
    }
    
    setIsLoading(true);

    const technicianData: Omit<Technician, 'id' | 'currentJobId'> & { companyId: string, updatedAt?: any, createdAt?: any } = {
      companyId: userProfile.companyId,
      name,
      email: email || "", 
      phone: phone || "",
      skills: selectedSkills,
      partsInventory: [], // Temporarily disabled
      avatarUrl: 'https://placehold.co/100x100.png',
      location: {
        latitude: latitude ?? 0, 
        longitude: longitude ?? 0,
        address: locationAddress,
      },
      isAvailable,
    };


    try {
      let finalTechnician: Technician;
      if (technician) { 
        const techDocRef = doc(db, "technicians", technician.id);
        const updatePayload = { ...technicianData, updatedAt: serverTimestamp() };
        await updateDoc(techDocRef, updatePayload);
        finalTechnician = { ...technician, ...updatePayload, updatedAt: new Date().toISOString() };
        toast({ title: "Technician Updated", description: `Technician "${finalTechnician.name}" has been updated.` });
      } else { 
        const newTechnicianPayload = {
          ...technicianData,
          currentJobId: null,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        };
        const docRef = await addDoc(collection(db, "technicians"), newTechnicianPayload);
        finalTechnician = {
            ...newTechnicianPayload,
            id: docRef.id,
            createdAt: new Date().toISOString(), 
            updatedAt: new Date().toISOString()  
        };
        toast({ title: "Technician Added", description: `New technician "${finalTechnician.name}" created.` });
      }
      onTechnicianAddedOrUpdated?.(finalTechnician);
      onClose();
    } catch (error) {
      console.error("Error saving technician to Firestore: ", error);
      toast({ title: "Firestore Error", description: "Could not save technician. Check console.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg flex flex-col max-h-[90dvh] p-0">
        <DialogHeader className="px-6 pt-6 flex-shrink-0">
          <DialogTitle className="font-headline">{technician ? 'Edit Technician Details' : 'Add New Technician'}</DialogTitle>
          <DialogDescription>
            {technician ? 'Update the details for this technician.' : 'Fill in the details for the new technician.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={(e) => { e.preventDefault(); handleSubmit();}} id="add-edit-tech-form" className="flex-1 flex flex-col overflow-y-hidden">
         <ScrollArea className="flex-1 px-6">
          <div className="space-y-3 py-4">
            <div>
              <Label htmlFor="techName"><User className="inline h-3.5 w-3.5 mr-1" />Name *</Label>
              <Input id="techName" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., John Doe" required />
            </div>
            <div>
              <Label htmlFor="techEmail"><Mail className="inline h-3.5 w-3.5 mr-1" />Email</Label>
              <Input id="techEmail" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="e.g., john.doe@example.com" />
            </div>
            <div>
              <Label htmlFor="techPhone"><Phone className="inline h-3.5 w-3.5 mr-1" />Phone</Label>
              <Input id="techPhone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="e.g., 555-123-4567" />
            </div>
            
            <div className="grid grid-cols-1 gap-4">
                <div>
                  <Label><ListChecks className="inline h-3.5 w-3.5 mr-1" />Skills</Label>
                  <ScrollArea className="h-40 rounded-md border p-3 mt-1">
                    <div className="space-y-2">
                      {allSkills.map(skill => (
                        <div key={skill} className="flex items-center space-x-2">
                          <Checkbox
                            id={`skill-${skill.replace(/\s+/g, '-')}`}
                            checked={selectedSkills.includes(skill)}
                            onCheckedChange={() => handleSkillChange(skill)}
                          />
                          <Label htmlFor={`skill-${skill.replace(/\s+/g, '-')}`} className="font-normal cursor-pointer">
                            {skill}
                          </Label>
                        </div>
                      ))}
                      {allSkills.length === 0 && (
                        <p className="text-sm text-muted-foreground text-center py-4">No skills defined.</p>
                      )}
                    </div>
                  </ScrollArea>
                </div>
            </div>

            <div>
              <Label htmlFor="techLocationAddress"><MapPin className="inline h-3.5 w-3.5 mr-1" />Location (Address) *</Label>
              <AddressAutocompleteInput 
                  value={locationAddress}
                  onValueChange={setLocationAddress}
                  onLocationSelect={handleLocationSelect}
                  placeholder="Start typing technician base address..."
                  required
              />
            </div>
            <div className="flex items-center space-x-2 pt-1">
              <Switch id="techIsAvailable" checked={isAvailable} onCheckedChange={setIsAvailable} />
              <Label htmlFor="techIsAvailable">Is Available</Label>
            </div>
          </div>
          </ScrollArea>
        </form>
        <DialogFooter className="flex-col sm:flex-row sm:justify-between items-center pt-4 border-t gap-2 px-6 pb-6 flex-shrink-0">
            <div>
                {technician && technician.id !== ownerId && (
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button type="button" variant="destructive" disabled={isDeleting}>
                                {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
                                Delete Technician
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                This action cannot be undone. This will permanently remove the technician "{technician.name}" from your company and revoke their access.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={handleDeleteTechnician} className="bg-destructive hover:bg-destructive/90">Continue</AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                )}
            </div>
            <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
                <Button type="submit" form="add-edit-tech-form" disabled={isLoading}>
                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    {technician ? 'Save Changes' : 'Add Technician'}
                </Button>
            </div>
          </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddEditTechnicianDialog;
