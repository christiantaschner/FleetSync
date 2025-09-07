
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
import type { Job, JobStatus } from '@/types';
import { Loader2, Rocket } from 'lucide-react';

interface QuickAddJobDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onJobAdded: (job: Job) => void;
}

const QuickAddJobSchema = z.object({
  customerName: z.string().min(1, 'Customer Name is required.'),
  title: z.string().min(1, 'Job Title is required.'),
  description: z.string().optional(),
});

type QuickAddJobFormValues = z.infer<typeof QuickAddJobSchema>;

const QuickAddJobDialog: React.FC<QuickAddJobDialogProps> = ({ isOpen, onClose, onJobAdded }) => {
  const { userProfile, company } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const appId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

  const { register, handleSubmit, reset, formState: { errors } } = useForm<QuickAddJobFormValues>({
    resolver: zodResolver(QuickAddJobSchema),
  });

  useEffect(() => {
    if (!isOpen) {
      reset();
    }
  }, [isOpen, reset]);

  const onSubmit = async (data: QuickAddJobFormValues) => {
    if (!userProfile?.companyId || !appId) {
      toast({ title: 'Error', description: 'User or app configuration is missing.', variant: 'destructive' });
      return;
    }
    setIsSubmitting(true);

    try {
      const customerResult = await upsertCustomerAction({
        companyId: userProfile.companyId,
        appId,
        name: data.customerName,
      });

      if (!customerResult.data?.id) {
        throw new Error(customerResult.error || 'Failed to create or find customer.');
      }
      const customerIdToUse = customerResult.data.id;
      
      const newJobRef = doc(collection(db, `artifacts/${appId}/public/data/jobs`));
      
      const newJobPayload = {
        id: newJobRef.id,
        companyId: userProfile.companyId,
        customerId: customerIdToUse,
        title: data.title,
        description: data.description || '',
        priority: 'Medium' as const,
        status: 'Draft' as JobStatus,
        customerName: data.customerName,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        location: { latitude: 0, longitude: 0, address: '' },
      };

      await addDoc(collection(db, `artifacts/${appId}/public/data/jobs`), newJobPayload);
      
      const finalJobDataForCallback: Job = {
        ...newJobPayload,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      toast({
        title: 'Draft Created',
        description: `Job "${data.title}" was saved as a draft. You can now add more details and schedule it.`
      });

      onJobAdded(finalJobDataForCallback);
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
            <Label htmlFor="customerName">Customer Name *</Label>
            <Input id="customerName" {...register('customerName')} placeholder="e.g., John Doe" />
            {errors.customerName && <p className="text-destructive text-sm mt-1">{errors.customerName.message}</p>}
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
