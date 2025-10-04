
"use client";

import React, { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
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
import { Textarea } from '@/components/ui/textarea';
import { useToast } from "@/hooks/use-toast";
import { addEquipmentAction } from '@/actions/customer-actions';
import { AddEquipmentInputSchema } from '@/types';
import type { AddEquipmentInput } from '@/types';
import { Loader2, PackagePlus } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface AddEquipmentDialogProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  customerId: string;
  customerName: string;
  companyId: string;
  onEquipmentAdded: () => void;
}

const maintenanceFrequencies: AddEquipmentInput['maintenanceFrequency'][] = ['None', 'Monthly', 'Quarterly', 'Semi-Annually', 'Annually'];

const AddEquipmentDialog: React.FC<AddEquipmentDialogProps> = ({ isOpen, setIsOpen, customerId, customerName, companyId, onEquipmentAdded }) => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const appId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!;

  const { register, handleSubmit, reset, control, formState: { errors } } = useForm<AddEquipmentInput>({
    resolver: zodResolver(AddEquipmentInputSchema),
    defaultValues: {
      customerId,
      customerName,
      companyId,
      appId,
      name: '',
      model: '',
      serialNumber: '',
      installDate: '',
      notes: '',
      maintenanceFrequency: 'None',
    },
  });

  const onSubmitForm = async (data: AddEquipmentInput) => {
    if (process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true') {
        toast({ title: 'Success', description: 'Mock Equipment added successfully.' });
        onEquipmentAdded();
        setIsOpen(false);
        reset();
        return;
    }

    if (!companyId) {
        toast({ title: "Authentication Error", description: "Company ID is missing.", variant: "destructive" });
        return;
    }
    if (!appId) {
        toast({ title: "Configuration Error", description: "App ID is missing.", variant: "destructive" });
        return;
    }
    setIsSubmitting(true);
    const result = await addEquipmentAction({ ...data, companyId, customerId, customerName, appId });
    if (result.error) {
      toast({ title: 'Error', description: result.error, variant: 'destructive' });
    } else {
      toast({ title: 'Success', description: 'Equipment added successfully.' });
      onEquipmentAdded();
      setIsOpen(false);
      reset();
    }
    setIsSubmitting(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
        if (!open) {
            reset({ customerId, customerName, companyId, appId, name: '', model: '', serialNumber: '', installDate: '', notes: '' });
        }
        setIsOpen(open);
    }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-headline">Add Equipment for {customerName}</DialogTitle>
          <DialogDescription>
            Log a new piece of equipment installed at the customer's location.
          </DialogDescription>
        </DialogHeader>
        <form id="add-equipment-form" onSubmit={handleSubmit(onSubmitForm)} className="space-y-4 py-4">
          <div>
            <Label htmlFor="name">Equipment Name *</Label>
            <Input id="name" {...register('name')} placeholder="e.g., HVAC Unit, Water Heater" />
            {errors.name && <p className="text-destructive text-sm mt-1">{errors.name.message}</p>}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="model">Model Number</Label>
              <Input id="model" {...register('model')} />
            </div>
            <div>
              <Label htmlFor="serialNumber">Serial Number</Label>
              <Input id="serialNumber" {...register('serialNumber')} />
            </div>
          </div>
          <div>
            <Label htmlFor="installDate">Installation Date</Label>
            <Input id="installDate" type="date" {...register('installDate')} />
          </div>
           <div>
            <Label htmlFor="maintenanceFrequency">Maintenance Schedule</Label>
             <Controller
                name="maintenanceFrequency"
                control={control}
                render={({ field }) => (
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <SelectTrigger id="maintenanceFrequency">
                            <SelectValue placeholder="Select frequency" />
                        </SelectTrigger>
                        <SelectContent>
                            {maintenanceFrequencies.map(f => (
                                <SelectItem key={f} value={f!}>{f}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                )}
            />
          </div>
          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" {...register('notes')} placeholder="e.g., Location, warranty info" />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
            <Button type="submit" form="add-equipment-form" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <PackagePlus className="mr-2 h-4 w-4" /> Add Equipment
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddEquipmentDialog;
