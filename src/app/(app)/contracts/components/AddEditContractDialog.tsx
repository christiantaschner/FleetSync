
"use client";

import React, { useState, useEffect } from 'react';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { useToast } from "@/hooks/use-toast";
import { db } from '@/lib/firebase';
import { collection, addDoc, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { Contract, ContractSchema, JobPriority } from '@/types';
import { Loader2, Save, Calendar as CalendarIcon, Repeat, User, Briefcase } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/auth-context';
import { Switch } from '@/components/ui/switch';

interface AddEditContractDialogProps {
    isOpen: boolean;
    onClose: () => void;
    contract?: Contract | null;
    onContractUpdated: () => void;
}

const AddEditContractDialog: React.FC<AddEditContractDialogProps> = ({ isOpen, onClose, contract, onContractUpdated }) => {
    const { userProfile } = useAuth();
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const defaultValues = contract || {
            companyId: userProfile?.companyId || '',
            customerName: '',
            customerPhone: '',
            customerAddress: '',
            frequency: 'Monthly',
            startDate: new Date().toISOString(),
            isActive: true,
            jobTemplate: {
                title: '',
                description: '',
                priority: 'Medium',
                estimatedDurationMinutes: 60,
                requiredSkills: [],
            }
        };

    const { register, handleSubmit, control, reset, formState: { errors } } = useForm<Contract>({
        resolver: zodResolver(ContractSchema),
        defaultValues
    });

    useEffect(() => {
        if (isOpen) {
             const newDefaultValues = contract || {
                companyId: userProfile?.companyId || '',
                customerName: '',
                customerPhone: '',
                customerAddress: '',
                frequency: 'Monthly',
                startDate: new Date().toISOString(),
                isActive: true,
                jobTemplate: {
                    title: '',
                    description: '',
                    priority: 'Medium',
                    estimatedDurationMinutes: 60,
                    requiredSkills: [],
                }
            };
            reset(newDefaultValues);
        }
    }, [isOpen, contract, reset, userProfile]);
    
    const frequencies: Contract['frequency'][] = ['Weekly', 'Bi-Weekly', 'Monthly', 'Quarterly', 'Semi-Annually', 'Annually'];
    const priorities: JobPriority[] = ['Low', 'Medium', 'High'];

    const onSubmitForm = async (data: Contract) => {
        setIsSubmitting(true);
        try {
            if (contract) {
                const contractRef = doc(db, "contracts", contract.id!);
                await updateDoc(contractRef, { ...data, updatedAt: serverTimestamp() });
                toast({ title: "Success", description: "Contract updated successfully." });
            } else {
                 if (!userProfile?.companyId) {
                    throw new Error("User not associated with a company.");
                }
                await addDoc(collection(db, "contracts"), { ...data, companyId: userProfile.companyId, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
                toast({ title: "Success", description: "Contract created successfully." });
            }
            onContractUpdated();
            onClose();
        } catch (error) {
            console.error("Error saving contract:", error);
            const errorMessage = error instanceof Error ? error.message : "Could not save the contract.";
            toast({ title: "Error", description: errorMessage, variant: "destructive" });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-2xl flex flex-col max-h-[90dvh] p-0">
                <DialogHeader className="px-6 pt-6 flex-shrink-0">
                    <DialogTitle className="font-headline">{contract ? 'Edit Contract' : 'Create New Contract'}</DialogTitle>
                    <DialogDescription>
                        {contract ? 'Update the details for this recurring service contract.' : 'Create a new contract template. This will be used to generate recurring jobs later.'}
                    </DialogDescription>
                </DialogHeader>
                <div className="flex-1 overflow-y-auto px-6">
                    <form id="contract-form" onSubmit={handleSubmit(onSubmitForm)} className="py-4 space-y-4">
                        <h3 className="text-lg font-semibold flex items-center gap-2"><User/>Customer Info</h3>
                        <div>
                            <Label htmlFor="customerName">Customer Name *</Label>
                            <Input id="customerName" {...register('customerName')} />
                            {errors.customerName && <p className="text-destructive text-sm mt-1">{errors.customerName.message}</p>}
                        </div>
                        <div>
                            <Label htmlFor="customerPhone">Customer Phone</Label>
                            <Input id="customerPhone" {...register('customerPhone')} />
                        </div>
                        <div>
                            <Label htmlFor="customerAddress">Customer Address *</Label>
                            <Input id="customerAddress" {...register('customerAddress')} />
                            {errors.customerAddress && <p className="text-destructive text-sm mt-1">{errors.customerAddress.message}</p>}
                        </div>

                        <h3 className="text-lg font-semibold flex items-center gap-2 pt-2"><Repeat/>Recurrence</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="frequency">Frequency *</Label>
                                <Controller
                                    name="frequency"
                                    control={control}
                                    render={({ field }) => (
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <SelectTrigger><SelectValue placeholder="Select frequency" /></SelectTrigger>
                                            <SelectContent>
                                                {frequencies.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    )}
                                />
                                {errors.frequency && <p className="text-destructive text-sm mt-1">{errors.frequency.message}</p>}
                            </div>
                            <div>
                                <Label>Start Date *</Label>
                                <Controller
                                    name="startDate"
                                    control={control}
                                    render={({ field }) => (
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !field.value && "text-muted-foreground")}>
                                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                                    {field.value ? format(new Date(field.value), "PPP") : <span>Pick a date</span>}
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={field.value ? new Date(field.value) : undefined} onSelect={(date) => field.onChange(date?.toISOString())} initialFocus /></PopoverContent>
                                        </Popover>
                                    )}
                                />
                                {errors.startDate && <p className="text-destructive text-sm mt-1">{errors.startDate.message}</p>}
                            </div>
                        </div>

                        <h3 className="text-lg font-semibold flex items-center gap-2 pt-2"><Briefcase/>Job Template</h3>
                        <div>
                            <Label htmlFor="jobTemplate.title">Job Title *</Label>
                            <Input id="jobTemplate.title" {...register('jobTemplate.title')} />
                            {errors.jobTemplate?.title && <p className="text-destructive text-sm mt-1">{errors.jobTemplate.title.message}</p>}
                        </div>
                        <div>
                            <Label htmlFor="jobTemplate.description">Job Description *</Label>
                            <Textarea id="jobTemplate.description" {...register('jobTemplate.description')} rows={3} />
                            {errors.jobTemplate?.description && <p className="text-destructive text-sm mt-1">{errors.jobTemplate.description.message}</p>}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <Label>Priority *</Label>
                                <Controller
                                    name="jobTemplate.priority"
                                    control={control}
                                    render={({ field }) => (
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <SelectTrigger><SelectValue placeholder="Select priority" /></SelectTrigger>
                                            <SelectContent>
                                                {priorities.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    )}
                                />
                            </div>
                            <div>
                                <Label htmlFor="jobTemplate.estimatedDurationMinutes">Estimated Duration (mins)</Label>
                                <Input id="jobTemplate.estimatedDurationMinutes" type="number" {...register('jobTemplate.estimatedDurationMinutes', { valueAsNumber: true })} />
                            </div>
                        </div>
                        <div className="flex items-center space-x-2 pt-2">
                            <Controller
                                name="isActive"
                                control={control}
                                render={({ field }) => (
                                    <Switch
                                        id="isActive"
                                        checked={field.value}
                                        onCheckedChange={field.onChange}
                                    />
                                )}
                            />
                            <Label htmlFor="isActive">Contract is Active</Label>
                        </div>
                    </form>
                </div>
                <DialogFooter className="px-6 py-4 border-t flex-shrink-0">
                    <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
                    <Button type="submit" form="contract-form" disabled={isSubmitting}>
                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {contract ? 'Save Changes' : 'Create Contract'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default AddEditContractDialog;
