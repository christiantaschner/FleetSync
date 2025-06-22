
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
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from "@/hooks/use-toast";
import { db } from '@/lib/firebase';
import { collection, addDoc, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import type { Technician } from '@/types';
import { Loader2, Save, User, Mail, Phone, ListChecks, ImageIcon, MapPin, Package } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import AddressAutocompleteInput from './AddressAutocompleteInput';

interface AddEditTechnicianDialogProps {
  children: React.ReactNode;
  technician?: Technician;
  allSkills: string[];
  allParts: string[];
  onTechnicianAddedOrUpdated?: (technician: Technician) => void;
}

const AddEditTechnicianDialog: React.FC<AddEditTechnicianDialogProps> = ({ children, technician, allSkills, allParts, onTechnicianAddedOrUpdated }) => {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [selectedParts, setSelectedParts] = useState<string[]>([]);
  const [avatarUrl, setAvatarUrl] = useState('');
  const [locationAddress, setLocationAddress] = useState('');
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [isAvailable, setIsAvailable] = useState(true);

  const resetForm = useCallback(() => {
    setName(technician?.name || '');
    setEmail(technician?.email || '');
    setPhone(technician?.phone || '');
    setSelectedSkills(technician?.skills || []);
    setSelectedParts(technician?.partsInventory || []);
    setAvatarUrl(technician?.avatarUrl || 'https://placehold.co/100x100.png');
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

  const handlePartChange = (part: string) => {
    setSelectedParts(prevParts =>
      prevParts.includes(part)
        ? prevParts.filter(p => p !== part)
        : [...prevParts, part]
    );
  };
  
  const handleLocationSelect = (location: { address: string; lat: number; lng: number }) => {
    setLocationAddress(location.address);
    setLatitude(location.lat);
    setLongitude(location.lng);
  };

  const handleSubmit = async () => {
    if (!name.trim() || !locationAddress.trim()) {
      toast({ title: "Missing Information", description: "Please fill in Name and Location Address.", variant: "destructive" });
      return;
    }
    
    setIsLoading(true);

    const technicianData: Omit<Technician, 'id' | 'currentJobId'> & { updatedAt?: any, createdAt?: any } = {
      name,
      email: email || "", 
      phone: phone || "",
      skills: selectedSkills,
      partsInventory: selectedParts,
      avatarUrl: avatarUrl || 'https://placehold.co/100x100.png',
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
        <form onSubmit={(e) => { e.preventDefault(); handleSubmit();}} className="space-y-3 py-2">
         <ScrollArea className="max-h-[calc(70vh-50px)] pr-3">
          <div className="space-y-3">
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
            
            <div className="grid grid-cols-2 gap-4">
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
                <div>
                  <Label><Package className="inline h-3.5 w-3.5 mr-1" />Parts Inventory</Label>
                  <ScrollArea className="h-40 rounded-md border p-3 mt-1">
                    <div className="space-y-2">
                      {allParts.map(part => (
                        <div key={part} className="flex items-center space-x-2">
                          <Checkbox
                            id={`part-inv-${part.replace(/\s+/g, '-')}`}
                            checked={selectedParts.includes(part)}
                            onCheckedChange={() => handlePartChange(part)}
                          />
                          <Label htmlFor={`part-inv-${part.replace(/\s+/g, '-')}`} className="font-normal cursor-pointer">
                            {part}
                          </Label>
                        </div>
                      ))}
                       {allParts.length === 0 && (
                        <p className="text-sm text-muted-foreground text-center py-4">No parts defined.</p>
                      )}
                    </div>
                  </ScrollArea>
                </div>
            </div>

            <div>
              <Label htmlFor="techAvatarUrl"><ImageIcon className="inline h-3.5 w-3.5 mr-1" />Avatar URL</Label>
              <Input id="techAvatarUrl" value={avatarUrl} onChange={(e) => setAvatarUrl(e.target.value)} placeholder="e.g., https://placehold.co/100x100.png" />
            </div>
            <div>
              <Label htmlFor="techLocationAddress"><MapPin className="inline h-3.5 w-3.5 mr-1" />Location (Address) *</Label>
              <AddressAutocompleteInput 
                  value={locationAddress}
                  onValueChange={setLocationAddress}
                  onLocationSelect={handleLocationSelect}
                  placeholder="Start typing technician address..."
                  required
              />
            </div>
            <div className="flex items-center space-x-2 pt-1">
              <Switch id="techIsAvailable" checked={isAvailable} onCheckedChange={setIsAvailable} />
              <Label htmlFor="techIsAvailable">Is Available</Label>
            </div>
          </div>
          </ScrollArea>
          
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

    