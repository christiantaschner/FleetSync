
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
import type { Technician } from '@/types';
import { Loader2, Save, User, Mail, Phone, ListChecks, MapPin, Trash2 } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import AddressAutocompleteInput from './AddressAutocompleteInput';
import { useAuth } from '@/contexts/auth-context';
import { removeUserFromCompanyAction } from '@/actions/user-actions';
import { updateTechnicianAction } from '@/actions/technician-actions';


interface AddEditTechnicianDialogProps {
  isOpen: boolean;
  onClose: () => void;
  technician?: Technician | null;
  allSkills: string[];
  appId: string;
  onTechnicianAddedOrUpdated?: (technician: Technician) => void;
}

const AddEditTechnicianDialog: React.FC<AddEditTechnicianDialogProps> = ({ isOpen, onClose, technician, allSkills, appId, onTechnicianAddedOrUpdated }) => {
  const { userProfile, company } = useAuth();
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
    if (!technician || !appId || !userProfile?.companyId) return;
    setIsDeleting(true);
    const result = await removeUserFromCompanyAction({ userId: technician.id, companyId: userProfile.companyId, appId });
    if (result.error) {
        toast({ title: "Error", description: `Failed to remove technician: ${result.error}`, variant: "destructive" });
    } else {
        toast({ title: "Success", description: `Technician "${technician.name}" has been removed from the company.` });
        onClose();
    }
    setIsDeleting(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!technician) {
      toast({ title: "Cannot Save", description: "No technician selected to update.", variant: "destructive" });
      return;
    }
    if (!name.trim() || !locationAddress.trim()) {
      toast({ title: "Missing Information", description: "Please fill in Name and Location Address.", variant: "destructive" });
      return;
    }
    if (latitude === null || longitude === null) {
      toast({ title: "Invalid Address", description: "Please select a valid address from the dropdown suggestions to set the location.", variant: "destructive" });
      return;
    }
    if (!userProfile?.companyId || !appId) {
      toast({ title: "Authentication Error", description: "Company ID or App ID not found.", variant: "destructive" });
      return;
    }
    
    setIsLoading(true);

    const technicianData = {
      id: technician.id,
      companyId: userProfile.companyId,
      name,
      email: email || "", 
      phone: phone || "",
      skills: selectedSkills,
      location: {
        latitude: latitude ?? 0, 
        longitude: longitude ?? 0,
        address: locationAddress,
      },
      isAvailable,
    };

    try {
        const result = await updateTechnicianAction(technicianData, appId);
        if(result.error) throw new Error(result.error);
        toast({ title: "Technician Updated", description: `Technician "${technician.name}" has been updated.` });
        onClose();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Could not save technician.";
      toast({ title: "Firestore Error", description: errorMessage, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg flex flex-col max-h-[90dvh] p-0">
        <DialogHeader className="px-6 pt-6 flex-shrink-0">
          <DialogTitle className="font-headline">Edit Technician Details</DialogTitle>
          <DialogDescription>
            Update the details for this technician. New technicians should be added via the User Management settings.
          </DialogDescription>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto px-6">
            <form id="edit-tech-form" onSubmit={handleSubmit} className="py-4 space-y-3">
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
            </form>
        </div>
        <DialogFooter className="px-6 pb-6 pt-4 border-t flex-shrink-0 flex-col sm:flex-row sm:justify-between items-center gap-2">
            <div>
                {technician && technician.id !== company?.ownerId && (
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
                <Button type="submit" form="edit-tech-form" disabled={isLoading}>
                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    Save Changes
                </Button>
            </div>
          </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddEditTechnicianDialog;
