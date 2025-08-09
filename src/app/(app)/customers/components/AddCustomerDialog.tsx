
"use client";

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
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
import { addCustomerAction } from '@/actions/customer-actions';
import { AddCustomerInputSchema, type AddCustomerInput } from '@/types';
import { useAuth } from '@/contexts/auth-context';
import { Loader2, UserPlus } from 'lucide-react';

interface AddCustomerDialogProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  onCustomerAdded: () => void;
}

// Omitting companyId and appId from the form values, as they come from context
const FormSchema = AddCustomerInputSchema.omit({ companyId: true, appId: true });
type AddCustomerFormValues = z.infer<typeof FormSchema>;


const AddCustomerDialog: React.FC<AddCustomerDialogProps> = ({ isOpen, setIsOpen, onCustomerAdded }) => {
  const { userProfile } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const appId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!;
  
  const { register, handleSubmit, reset, formState: { errors } } = useForm<AddCustomerFormValues>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      name: '',
      phone: '',
      email: '',
      address: '',
    },
  });

  const onSubmitForm = async (data: AddCustomerFormValues) => {
    if (process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true') {
        toast({ title: 'Success', description: 'Mock Customer added successfully.' });
        onCustomerAdded();
        setIsOpen(false);
        reset();
        return;
    }

    if (!userProfile?.companyId) {
        toast({ title: "Authentication Error", description: "Company ID is missing.", variant: "destructive" });
        return;
    }
    if (!appId) {
        toast({ title: "Configuration Error", description: "App ID is missing.", variant: "destructive" });
        return;
    }
    setIsSubmitting(true);
    const result = await addCustomerAction({ ...data, companyId: userProfile.companyId, appId });
    if (result.error) {
      toast({ title: 'Error', description: result.error, variant: 'destructive' });
    } else {
      toast({ title: 'Success', description: 'Customer added successfully.' });
      onCustomerAdded();
      setIsOpen(false);
      reset();
    }
    setIsSubmitting(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
        if (!open) reset();
        setIsOpen(open);
    }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-headline">Add New Customer</DialogTitle>
          <DialogDescription>
            Create a new customer profile. You can add jobs and equipment for them later.
          </DialogDescription>
        </DialogHeader>
        <form id="add-customer-form" onSubmit={handleSubmit(onSubmitForm)} className="space-y-4 py-4">
          <div>
            <Label htmlFor="name">Customer Name *</Label>
            <Input id="name" {...register('name')} placeholder="e.g., Jane Smith" />
            {errors.name && <p className="text-destructive text-sm mt-1">{errors.name.message}</p>}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" {...register('email')} placeholder="e.g., jane@example.com" />
                {errors.email && <p className="text-destructive text-sm mt-1">{errors.email.message}</p>}
              </div>
              <div>
                <Label htmlFor="phone">Phone Number</Label>
                <Input id="phone" {...register('phone')} placeholder="e.g., 555-123-4567" />
                 {errors.phone && <p className="text-destructive text-sm mt-1">{errors.phone.message}</p>}
              </div>
          </div>
            <div>
              <Label htmlFor="address">Address</Label>
              <Input id="address" {...register('address')} placeholder="e.g., 456 Oak Avenue, Anytown, USA" />
               {errors.address && <p className="text-destructive text-sm mt-1">{errors.address.message}</p>}
            </div>
        </form>
         <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
            <Button type="submit" form="add-customer-form" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <UserPlus className="mr-2 h-4 w-4" /> Add Customer
            </Button>
          </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddCustomerDialog;
