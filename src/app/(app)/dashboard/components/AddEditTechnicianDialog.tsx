
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from "@/hooks/use-toast";
import { db } from '@/lib/firebase';
import { collection, addDoc, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import type { Technician, Location } from '@/types';
import { Loader2, Save, User, Mail, Phone, ListChecks, ImageIcon, MapPin } from 'lucide-react';

interface AddEditTechnicianDialogProps {
  children: React.ReactNode;
  technician?: Technician;
  onTechnicianAddedOrUpdated?: (technician: Technician) => void;
}

const AddEditTechnicianDialog: React.FC<AddEditTechnicianDialogProps> = ({ children, technician, onTechnicianAddedOrUpdated }) => {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [skillsString, setSkillsString] = useState(''); // Comma-separated skills
  const [avatarUrl, setAvatarUrl] = useState('');
  const [locationAddress, setLocationAddress] = useState('');
  const [isAvailable, setIsAvailable] = useState(true);

  const resetForm = useCallback(() => {
    setName(technician?.name || '');
    setEmail(technician?.email || '');
    setPhone(technician?.phone || '');
    setSkillsString(technician?.skills.join(', ') || '');
    setAvatarUrl(technician?.avatarUrl || 'https://placehold.co/100x100.png');
    setLocationAddress(technician?.location.address || '');
    setIsAvailable(technician ? technician.isAvailable : true);
  }, [technician]);

  useEffect(() => {
    if (isOpen) {
      resetForm();
    }
  }, [technician, isOpen, resetForm]);

  const handleSubmit = async () => {
    if (!name.trim() || !locationAddress.trim()) {
      toast({ title: "Missing Information", description: "Please fill in Name and Location Address.", variant: "destructive" });
      return;
    }
    
    setIsLoading(true);

    const skillsArray = skillsString.split(',').map(skill => skill.trim()).filter(skill => skill.length > 0);

    const technicianData: Omit<Technician, 'id' | 'currentJobId'> & { updatedAt?: any, createdAt?: any } = {
      name,
      email: email || "", // Default to empty string if not provided
      phone: phone || "",
      skills: skillsArray,
      avatarUrl: avatarUrl || 'https://placehold.co/100x100.png',
      location: {
        latitude: technician?.location.latitude ?? 0, // Preserve if editing, or default
        longitude: technician?.location.longitude ?? 0,
        address: locationAddress,
      },
      isAvailable,
    };


    try {
      let finalTechnician: Technician;
      if (technician) { // Editing existing technician
        const techDocRef = doc(db, "technicians", technician.id);
        const updatePayload = { ...technicianData, updatedAt: serverTimestamp() };
        await updateDoc(techDocRef, updatePayload);
        finalTechnician = { ...technician, ...updatePayload, updatedAt: new Date().toISOString() };
        toast({ title: "Technician Updated", description: `Technician "${finalTechnician.name}" has been updated.` });
      } else { // Adding new technician
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
            createdAt: new Date().toISOString(), // Approximate for local state
            updatedAt: new Date().toISOString()  // Approximate for local state
        };
        toast({ title: "Technician Added", description: `New technician "${finalTechnician.name}" created.` });
      }
      onTechnicianAddedOrUpdated?.(finalTechnician);
      setIsOpen(false);
    } catch (error) {
      console.error("Error saving technician to Firestore: ", error);
      toast({ title: "Firestore Error", description: "Could not save technician. Check console.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-headline">{technician ? 'Edit Technician Details' : 'Add New Technician'}</DialogTitle>
          <DialogDescription>
            {technician ? 'Update the details for this technician.' : 'Fill in the details for the new technician.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={(e) => { e.preventDefault(); handleSubmit();}} className="space-y-3 py-2 max-h-[70vh] overflow-y-auto pr-2">
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
          <div>
            <Label htmlFor="techSkills"><ListChecks className="inline h-3.5 w-3.5 mr-1" />Skills (comma-separated)</Label>
            <Textarea id="techSkills" value={skillsString} onChange={(e) => setSkillsString(e.target.value)} placeholder="e.g., Plumbing, HVAC, Electrical" rows={2}/>
          </div>
          <div>
            <Label htmlFor="techAvatarUrl"><ImageIcon className="inline h-3.5 w-3.5 mr-1" />Avatar URL</Label>
            <Input id="techAvatarUrl" value={avatarUrl} onChange={(e) => setAvatarUrl(e.target.value)} placeholder="e.g., https://placehold.co/100x100.png" />
          </div>
           <div>
            <Label htmlFor="techLocationAddress"><MapPin className="inline h-3.5 w-3.5 mr-1" />Location (Address) *</Label>
            <Input 
                id="techLocationAddress"
                value={locationAddress}
                onChange={(e) => setLocationAddress(e.target.value)}
                placeholder="Enter technician base address"
                required
            />
          </div>
          <div className="flex items-center space-x-2 pt-1">
            <Switch id="techIsAvailable" checked={isAvailable} onCheckedChange={setIsAvailable} />
            <Label htmlFor="techIsAvailable">Is Available</Label>
          </div>
          
          <DialogFooter className="sm:justify-start gap-2 mt-4 pt-4 border-t">
            <Button type="submit" disabled={isLoading} className="flex-1">
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              {technician ? 'Save Changes' : 'Add Technician'}
            </Button>
            <Button type="button" variant="ghost" onClick={() => setIsOpen(false)} className="sm:ml-auto">
              Close
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddEditTechnicianDialog;
