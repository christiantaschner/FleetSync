
"use client";

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
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
import { addEquipmentAction, AddEquipmentInputSchema, type AddEquipmentInput } from '@/actions/customer-actions';
import { Loader2, PackagePlus } from 'lucide-react';

interface AddEquipmentDialogProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  customerId: string;
  customerName: string;
  onEquipmentAdded: () => void;
}

const AddEquipmentDialog: React.FC<AddEquipmentDialogProps> = ({ isOpen, setIsOpen, customerId, customerName, onEquipmentAdded }) => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<AddEquipmentInput>({
    resolver: zodResolver(AddEquipmentInputSchema),
    defaultValues: {
      customerId,
      customerName,
      name: '',
      model: '',
      serialNumber: '',
      installDate: '',
      notes: ''
    },
  });

  const onSubmitForm = async (data: AddEquipmentInput) => {
    setIsSubmitting(true);
    const result = await addEquipmentAction({ ...data, customerId, customerName });
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
            reset({ customerId, customerName, name: '', model: '', serialNumber: '', installDate: '', notes: '' });
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
        <form onSubmit={handleSubmit(onSubmitForm)} className="space-y-4">
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
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" {...register('notes')} placeholder="e.g., Location, warranty info" />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={isSubmitting}>
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
