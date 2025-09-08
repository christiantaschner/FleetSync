
"use client";

import React, { useState, useEffect } from 'react';
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
import { Textarea } from '@/components/ui/textarea';
import { useToast } from "@/hooks/use-toast";
import { useAuth } from '@/contexts/auth-context';
import { upsertCustomerAction } from '@/actions/customer-actions';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Job, JobStatus, Customer } from '@/types';
import { Loader2, Rocket, MapPin, User as UserIcon } from 'lucide-react';
import AddressAutocompleteInput from './AddressAutocompleteInput';
import { Popover, PopoverContent, PopoverAnchor } from '@/components/ui/popover';


interface QuickAddJobDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onJobAdded: (job: Job) => void;
  customers: Customer[];
}

const QuickAddJobSchema = z.object({
  customerName: z.string().min(1, 'Customer Name is required.'),
  title: z.string().min(1, 'Job Title is required.'),
  description: z.string().optional(),
  address: z.string().min(1, "Address is required"),
});

type QuickAddJobFormValues = z.infer<typeof QuickAddJobSchema>;

const QuickAddJobDialog: React.FC<QuickAddJobDialogProps> = ({ isOpen, onClose, onJobAdded, customers }) => {
  const { userProfile } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const appId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  
  const [customerSuggestions, setCustomerSuggestions] = useState<Customer[]>([]);
  const [isCustomerPopoverOpen, setIsCustomerPopoverOpen] = useState(false);


  const { register, handleSubmit, reset, formState: { errors }, setValue, watch } = useForm<QuickAddJobFormValues>({
    resolver: zodResolver(QuickAddJobSchema),
  });
  
  const customerNameValue = watch("customerName");

  useEffect(() => {
    if (!isOpen) {
      reset({ customerName: '', title: '', description: '', address: ''});
      setLatitude(null);
      setLongitude(null);
      setCustomerSuggestions([]);
      setIsCustomerPopoverOpen(false);
    }
  }, [isOpen, reset]);

  const handleLocationSelect = (location: { address: string; lat: number; lng: number }) => {
    setValue("address", location.address);
    setLatitude(location.lat);
    setLongitude(location.lng);
  };
  
  const handleCustomerNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setValue("customerName", value);
    if (value.length > 1) {
        const filtered = customers.filter(c => c.name.toLowerCase().includes(value.toLowerCase()));
        setCustomerSuggestions(filtered);
        setIsCustomerPopoverOpen(filtered.length > 0);
    } else {
        setCustomerSuggestions([]);
        setIsCustomerPopoverOpen(false);
    }
  };

  const handleSelectCustomer = (customer: Customer) => {
      setValue("customerName", customer.name);
      setValue("address", customer.address || "");
      setIsCustomerPopoverOpen(false);
  };

  const onSubmit = async (data: QuickAddJobFormValues) => {
    if (!userProfile?.companyId || !appId) {
      toast({ title: 'Error', description: 'User or app configuration is missing.', variant: 'destructive' });
      return;
    }
    if (!latitude || !longitude) {
      toast({ title: 'Invalid Address', description: 'Please select a valid address from the suggestions.', variant: 'destructive' });
      return;
    }
    setIsSubmitting(true);

    try {
      const customerResult = await upsertCustomerAction({
        companyId: userProfile.companyId,
        appId,
        name: data.customerName,
        address: data.address,
      });

      if (!customerResult.data?.id) {
        throw new Error(customerResult.error || 'Failed to create or find customer.');
      }
      const customerIdToUse = customerResult.data.id;
      
      const newJobRef = doc(collection(db, `artifacts/${appId}/public/data/jobs`));
      
      const newJobPayload: Omit<Job, 'id'> & { id: string } = {
        id: newJobRef.id,
        companyId: userProfile.companyId,
        customerId: customerIdToUse,
        title: data.title,
        description: data.description || '',
        priority: 'Medium' as const,
        status: 'Draft' as JobStatus,
        customerName: data.customerName,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        location: { latitude: latitude, longitude: longitude, address: data.address },
      };

      await addDoc(collection(db, `artifacts/${appId}/public/data/jobs`), {
        ...newJobPayload,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      onJobAdded(newJobPayload as Job);

      toast({
        title: 'Draft Created',
        description: `Job "${data.title}" was saved as a draft. You can now add more details and schedule it.`
      });

      onClose();

    } catch (error: any) {
      console.error("Error creating quick job:", error);
      toast({ title: 'Error', description: error.message || 'Failed to create job draft.', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-headline flex items-center gap-2">
            <Rocket className="h-5 w-5" />
            Quick Add Job
          </DialogTitle>
          <DialogDescription>
            Quickly create a job draft. You can add more details and schedule it later.
          </DialogDescription>
        </DialogHeader>
        <form id="quick-add-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">
          <div>
            <Label htmlFor="customerName" className="flex items-center gap-1.5 mb-1"><UserIcon className="h-4 w-4"/>Customer Name *</Label>
            <Popover open={isCustomerPopoverOpen} onOpenChange={setIsCustomerPopoverOpen}>
              <PopoverAnchor>
                <Input
                  id="customerName"
                  {...register('customerName')}
                  placeholder="e.g., John Doe"
                  onChange={handleCustomerNameChange}
                  autoComplete="off"
                />
              </PopoverAnchor>
              <PopoverContent
                className="w-[--radix-popover-trigger-width] p-0"
                onOpenAutoFocus={(e) => e.preventDefault()}
              >
                <div className="max-h-60 overflow-y-auto">
                  {customerSuggestions.map((customer) => (
                    <div
                      key={customer.id}
                      className="p-3 text-sm cursor-pointer hover:bg-accent"
                      onClick={() => handleSelectCustomer(customer)}
                    >
                      <p className="font-semibold">{customer.name}</p>
                      <p className="text-xs text-muted-foreground">{customer.address}</p>
                    </div>
                  ))}
                </div>
              </PopoverContent>
            </Popover>
            {errors.customerName && <p className="text-destructive text-sm mt-1">{errors.customerName.message}</p>}
          </div>
           <div>
            <Label htmlFor="address" className="flex items-center gap-1.5 mb-1"><MapPin className="h-4 w-4"/>Address *</Label>
            <AddressAutocompleteInput
              value={watch('address')}
              onValueChange={(value) => setValue('address', value)}
              onLocationSelect={handleLocationSelect}
              placeholder="Start typing job address..."
              required
            />
            {errors.address && <p className="text-destructive text-sm mt-1">{errors.address.message}</p>}
          </div>
          <div>
            <Label htmlFor="title">Job Title *</Label>
            <Input id="title" {...register('title')} placeholder="e.g., Leaky faucet in kitchen" />
            {errors.title && <p className="text-destructive text-sm mt-1">{errors.title.message}</p>}
          </div>
          <div>
            <Label htmlFor="description">Initial Description</Label>
            <Textarea id="description" {...register('description')} placeholder="Add any initial notes or details..." />
          </div>
        </form>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" form="quick-add-form" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save as Draft
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default QuickAddJobDialog;
