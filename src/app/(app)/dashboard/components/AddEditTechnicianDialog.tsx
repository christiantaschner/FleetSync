
"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
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
import type { Technician, BusinessDay } from '@/types';
import { Loader2, Save, User, Mail, Phone, ListChecks, MapPin, Trash2, Clock, ShieldCheck, Camera } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import AddressAutocompleteInput from './AddressAutocompleteInput';
import { useAuth } from '@/contexts/auth-context';
import { removeUserFromCompanyAction } from '@/actions/user-actions';
import { updateTechnicianAction } from '@/actions/technician-actions';
import { uploadAvatarAction } from '@/actions/storage-actions';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Image from 'next/image';

interface AddEditTechnicianDialogProps {
  isOpen: boolean;
  onClose: () => void;
  technician?: Technician | null;
  allSkills: string[];
}

const defaultBusinessHours: BusinessDay[] = [
    { dayOfWeek: "Monday", isOpen: true, startTime: "08:00", endTime: "17:00" },
    { dayOfWeek: "Tuesday", isOpen: true, startTime: "08:00", endTime: "17:00" },
    { dayOfWeek: "Wednesday", isOpen: true, startTime: "08:00", endTime: "17:00" },
    { dayOfWeek: "Thursday", isOpen: true, startTime: "08:00", endTime: "17:00" },
    { dayOfWeek: "Friday", isOpen: true, startTime: "08:00", endTime: "17:00" },
    { dayOfWeek: "Saturday", isOpen: false, startTime: "09:00", endTime: "12:00" },
    { dayOfWeek: "Sunday", isOpen: false, startTime: "09:00", endTime: "12:00" },
];

const AddEditTechnicianDialog: React.FC<AddEditTechnicianDialogProps> = ({ isOpen, onClose, technician, allSkills }) => {
  const { userProfile, company } = useAuth();
  const { toast } = useToast();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const appId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

  const { control, register, handleSubmit, formState: { errors }, setValue, reset, watch } = useForm({
    defaultValues: {
      name: technician?.name || '',
      email: technician?.email || '',
      phone: technician?.phone || '',
      skills: technician?.skills || [],
      locationAddress: technician?.location.address || '',
      latitude: technician?.location.latitude || 0,
      longitude: technician?.location.longitude || 0,
      isAvailable: technician ? technician.isAvailable : true,
      isOnCall: technician?.isOnCall || false,
      workingHours: technician?.workingHours && technician.workingHours.length === 7 
            ? technician.workingHours 
            : defaultBusinessHours,
      avatarUrl: technician?.avatarUrl || null,
      isSubmitting: false,
    }
  });

  const { fields } = useFieldArray({
    control,
    name: "workingHours",
  });
  
  const avatarUrl = watch('avatarUrl');

  const resetForm = useCallback(() => {
    reset({
      name: technician?.name || '',
      email: technician?.email || '',
      phone: technician?.phone || '',
      skills: technician?.skills || [],
      locationAddress: technician?.location.address || company?.settings?.address || '',
      latitude: technician?.location.latitude || 0,
      longitude: technician?.location.longitude || 0,
      isAvailable: technician ? technician.isAvailable : true,
      isOnCall: technician?.isOnCall || false,
      workingHours: technician?.workingHours && technician.workingHours.length === 7 
            ? technician.workingHours 
            : company?.settings?.businessHours || defaultBusinessHours,
      avatarUrl: technician?.avatarUrl || null,
      isSubmitting: false,
    });
  }, [technician, company, reset]);

  useEffect(() => {
    if (isOpen) {
      resetForm();
    }
  }, [technician, isOpen, resetForm]);

  const handleLocationSelect = (location: { address: string; lat: number; lng: number }) => {
    setValue('locationAddress', location.address);
    setValue('latitude', location.lat);
    setValue('longitude', location.lng);
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
  
  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files?.[0] || !technician?.id || !appId) return;

    const file = event.target.files[0];
    if (file.size > 2 * 1024 * 1024) { // 2MB limit
        toast({ title: "File too large", description: "Avatar image must be less than 2MB.", variant: "destructive" });
        return;
    }
    
    setIsUploading(true);
    
    const result = await uploadAvatarAction({ technicianId: technician.id, file, appId });

    if (result.error) {
        toast({ title: "Upload Failed", description: result.error, variant: "destructive" });
    } else if (result.data) {
        setValue('avatarUrl', result.data.url, { shouldDirty: true });
        toast({ title: "Success", description: "Avatar uploaded. Save changes to apply." });
    }
    setIsUploading(false);
  };

  const onSubmit = async (data: any) => {
    if (!technician) {
      toast({ title: "Cannot Save", description: "No technician selected to update.", variant: "destructive" });
      return;
    }
    if (!data.name.trim() || !data.locationAddress.trim()) {
      toast({ title: "Missing Information", description: "Please fill in Name and Location Address.", variant: "destructive" });
      return;
    }
    if (data.latitude === null || data.longitude === null) {
      toast({ title: "Invalid Address", description: "Please select a valid address from the dropdown suggestions to set the location.", variant: "destructive" });
      return;
    }
    if (!userProfile?.companyId || !appId) {
      toast({ title: "Authentication Error", description: "Company ID or App ID not found.", variant: "destructive" });
      return;
    }
    
    setValue('isSubmitting', true);

    const technicianData = {
      id: technician.id,
      companyId: userProfile.companyId,
      name: data.name,
      email: data.email || "", 
      phone: data.phone || "",
      skills: data.skills,
      location: {
        latitude: data.latitude ?? 0, 
        longitude: data.longitude ?? 0,
        address: data.locationAddress,
      },
      isAvailable: data.isAvailable,
      isOnCall: data.isOnCall,
      workingHours: data.workingHours,
      avatarUrl: data.avatarUrl,
      appId: appId,
    };

    try {
        const result = await updateTechnicianAction(technicianData);
        if(result.error) throw new Error(result.error);
        toast({ title: "Technician Updated", description: `Technician "${technician.name}" has been updated.` });
        onClose();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Could not save technician.";
      toast({ title: "Firestore Error", description: errorMessage, variant: "destructive" });
    } finally {
      setValue('isSubmitting', false);
    }
  };
  
  const isSubmitting = watch('isSubmitting');

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl flex flex-col max-h-[90dvh] p-0">
        <DialogHeader className="px-6 pt-6 flex-shrink-0">
          <DialogTitle className="font-headline">Edit Technician Details</DialogTitle>
          <DialogDescription>
            Update the details for this technician. New technicians should be added via the User Management settings.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="flex-1 overflow-y-auto px-6">
            <form id="edit-tech-form" onSubmit={handleSubmit(onSubmit)} className="py-4 space-y-4">
                <div className="flex items-center gap-4">
                  <div className="relative group">
                    <Avatar className="h-20 w-20">
                      <AvatarImage src={avatarUrl ?? undefined} />
                      <AvatarFallback className="text-2xl">{technician?.name.split(' ').map(n=>n[0]).join('')}</AvatarFallback>
                    </Avatar>
                    <Button
                      type="button"
                      size="icon"
                      variant="secondary"
                      className="absolute bottom-0 right-0 h-7 w-7 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploading}
                    >
                      {isUploading ? <Loader2 className="h-4 w-4 animate-spin"/> : <Camera className="h-4 w-4"/>}
                    </Button>
                    <input
                      type="file"
                      ref={fileInputRef}
                      className="hidden"
                      accept="image/png, image/jpeg"
                      onChange={handleAvatarUpload}
                    />
                  </div>
                  <div className="flex-1 space-y-2">
                    <div>
                      <Label htmlFor="techName"><User className="inline h-3.5 w-3.5 mr-1" />Name *</Label>
                      <Input id="techName" {...register('name')} placeholder="e.g., John Doe" required />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="techEmail"><Mail className="inline h-3.5 w-3.5 mr-1" />Email</Label>
                    <Input id="techEmail" type="email" {...register('email')} placeholder="e.g., john.doe@example.com" />
                  </div>
                  <div>
                    <Label htmlFor="techPhone"><Phone className="inline h-3.5 w-3.5 mr-1" />Phone</Label>
                    <Input id="techPhone" type="tel" {...register('phone')} placeholder="e.g., 555-123-4567" />
                  </div>
                </div>
                
                 <div>
                    <Label><ListChecks className="inline h-3.5 w-3.5 mr-1" />Skills</Label>
                    <ScrollArea className="h-32 rounded-md border p-3 mt-1">
                      <div className="space-y-2">
                        {allSkills.map(skill => (
                          <Controller
                            key={skill}
                            name="skills"
                            control={control}
                            render={({ field }) => (
                               <div className="flex items-center space-x-2">
                                <Checkbox
                                    id={`skill-${skill}`}
                                    checked={field.value?.includes(skill)}
                                    onCheckedChange={(checked) => {
                                        return checked
                                            ? field.onChange([...(field.value || []), skill])
                                            : field.onChange((field.value || [])?.filter((value) => value !== skill));
                                    }}
                                />
                                <Label htmlFor={`skill-${skill}`} className="font-normal cursor-pointer">{skill}</Label>
                               </div>
                            )}
                          />
                        ))}
                        {allSkills.length === 0 && (
                          <p className="text-sm text-muted-foreground text-center py-4">No skills defined.</p>
                        )}
                      </div>
                    </ScrollArea>
                </div>
                
                <div>
                  <Label htmlFor="techLocationAddress"><MapPin className="inline h-3.5 w-3.5 mr-1" />Base Location *</Label>
                  <Controller
                    name="locationAddress"
                    control={control}
                    render={({ field }) => (
                       <AddressAutocompleteInput 
                          value={field.value || ''}
                          onValueChange={field.onChange}
                          onLocationSelect={handleLocationSelect}
                          placeholder="Start typing technician base address..."
                          required
                      />
                    )}
                  />
                </div>
                
                 <Separator />

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2"><Clock /> Working Hours</h3>
                  <div className="flex items-center space-x-2">
                    <Controller
                        name="isOnCall"
                        control={control}
                        render={({ field }) => ( <Switch id="techIsOnCall" checked={field.value} onCheckedChange={field.onChange} /> )}
                    />
                    <Label htmlFor="techIsOnCall" className="flex items-center gap-1.5"><ShieldCheck className="h-4 w-4 text-primary"/>Is On-Call for Emergencies</Label>
                  </div>
                  <div className="space-y-3">
                    {fields.map((field, index) => (
                      <div key={field.id} className="grid grid-cols-[1fr_auto_auto] sm:grid-cols-[100px_1fr_1fr_1fr] items-center gap-3 p-3 border rounded-lg bg-secondary/50">
                        <Label className="font-semibold col-span-4 sm:col-span-1">{field.dayOfWeek}</Label>
                        <div className="flex items-center space-x-2">
                           <Controller
                              name={`workingHours.${index}.isOpen`}
                              control={control}
                              render={({ field: checkboxField }) => (
                                  <Checkbox
                                      checked={checkboxField.value}
                                      onCheckedChange={checkboxField.onChange}
                                      id={`open-wh-${index}`}
                                  />
                               )}
                          />
                          <Label htmlFor={`open-wh-${index}`}>Open</Label>
                        </div>
                        <div>
                          <Label htmlFor={`start-time-wh-${index}`} className="text-xs text-muted-foreground">Start Time</Label>
                          <Input type="time" id={`start-time-wh-${index}`} {...register(`workingHours.${index}.startTime`)} />
                        </div>
                        <div>
                          <Label htmlFor={`end-time-wh-${index}`} className="text-xs text-muted-foreground">End Time</Label>
                          <Input type="time" id={`end-time-wh-${index}`} {...register(`workingHours.${index}.endTime`)} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
            </form>
        </ScrollArea>
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
                <Button type="submit" form="edit-tech-form" disabled={isSubmitting}>
                    {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    Save Changes
                </Button>
            </div>
          </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddEditTechnicianDialog;
