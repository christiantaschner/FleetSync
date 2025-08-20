
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger, PopoverAnchor } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { useToast } from "@/hooks/use-toast";
import { db } from '@/lib/firebase';
import { collection, addDoc, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { Contract, ContractSchema, JobPriority, Customer } from '@/types';
import { Loader2, Save, Calendar as CalendarIcon, Repeat, User, Briefcase, Info } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/auth-context';
import { Switch } from '@/components/ui/switch';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface AddEditContractDialogProps {
    isOpen: boolean;
    onClose: () => void;
    contract?: Contract | null;
    customers: Customer[];
    onContractUpdated: () => void;
}

const AddEditContractDialog: React.FC<AddEditContractDialogProps> = ({ isOpen, onClose, contract, customers, onContractUpdated }) => {
    const { userProfile } = useAuth();
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const appId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

    const [customerSuggestions, setCustomerSuggestions] = useState<Customer[]>([]);
    const [isCustomerPopoverOpen, setIsCustomerPopoverOpen] = useState(false);

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
                estimatedDuration: 1,
                durationUnit: 'hours',
                requiredSkills: [],
            }
        };

    const { register, handleSubmit, control, reset, setValue, watch, formState: { errors } } = useForm<Contract>({
        resolver: zodResolver(ContractSchema),
        defaultValues
    });
    
    const customerNameValue = watch('customerName');

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
                    estimatedDuration: 1,
                    durationUnit: 'hours',
                    requiredSkills: [],
                }
            };
            reset(newDefaultValues);
        } else {
            setIsCustomerPopoverOpen(false);
            setCustomerSuggestions([]);
        }
    }, [isOpen, contract, reset, userProfile]);

    const handleCustomerNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setValue('customerName', value, { shouldValidate: true });
        
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
      setValue('customerName', customer.name);
      setValue('customerPhone', customer.phone || '');
      setValue('customerAddress', customer.address || '');
      setIsCustomerPopoverOpen(false);
    };
    
    const frequencies: Contract['frequency'][] = ['Weekly', 'Bi-Weekly', 'Monthly', 'Quarterly', 'Semi-Annually', 'Annually'];
    const priorities: JobPriority[] = ['Low', 'Medium', 'High'];

    const onSubmitForm = async (data: Contract) => {
        setIsSubmitting(true);
        if (!appId) {
            toast({ title: "Error", description: "Application ID is not configured.", variant: "destructive" });
            setIsSubmitting(false);
            return;
        }

        try {
            const contractsCollectionPath = `artifacts/${appId}/public/data/contracts`;
            if (contract) {
                const contractRef = doc(db, contractsCollectionPath, contract.id!);
                await updateDoc(contractRef, { ...data, updatedAt: serverTimestamp() });
                toast({ title: "Success", description: "Contract updated successfully." });
            } else {
                 if (!userProfile?.companyId) {
                    throw new Error("User not associated with a company.");
                }
                const contractsCollectionRef = collection(db, contractsCollectionPath);
                await addDoc(contractsCollectionRef, { ...data, companyId: userProfile.companyId, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
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
        <Dialog open={isOpen} onOpenChange={(open) => {
            if (!open) onClose();
        }}>
            <DialogContent className="sm:max-w-2xl flex flex-col max-h-[90dvh] p-0">
                <DialogHeader className="px-6 pt-6 flex-shrink-0">
                    <DialogTitle className="font-headline">{contract ? 'Edit Contract' : 'Create New Contract'}</DialogTitle>
                </DialogHeader>
                <div className="flex-1 overflow-y-auto px-6">
                    <form id="contract-form" onSubmit={handleSubmit(onSubmitForm)} className="py-4 space-y-4">
                        <h3 className="text-lg font-semibold flex items-center gap-2"><User/>Customer Info</h3>
                        <div>
                            <Label htmlFor="customerName">Customer Name *</Label>
                             <Popover open={isCustomerPopoverOpen} onOpenChange={setIsCustomerPopoverOpen}>
                                <PopoverAnchor>
                                    <Input 
                                      id="customerName"
                                      value={customerNameValue}
                                      onChange={handleCustomerNameChange}
                                      autoComplete="off" 
                                    />
                                </PopoverAnchor>
                                <PopoverContent 
                                  className="w-[--radix-popover-trigger-width] p-0"
                                  onOpenAutoFocus={(e) => e.preventDefault()}
                                >
                                    {customerSuggestions.map(customer => (
                                        <div key={customer.id} className="p-2 cursor-pointer hover:bg-accent" onClick={() => handleSelectCustomer(customer)}>
                                            <p className="font-medium">{customer.name}</p>
                                            <p className="text-sm text-muted-foreground">{customer.address}</p>
                                        </div>
                                    ))}
                                </PopoverContent>
                            </Popover>
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

                        <h3 className="text-lg font-semibold flex items-center gap-2 pt-2"><Repeat/>Recurrence Details</h3>
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
                                                <Button variant="outline" className={cn("w-full justify-start text-left font-normal bg-card", !field.value && "text-muted-foreground")}>
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
                                <div className="flex items-center gap-1.5 mb-1">
                                    <Label>Priority *</Label>
                                    <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger type="button" asChild>
                                                <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                <p className="max-w-xs">
                                                    <b>High:</b> Emergencies (e.g., leaks, power loss).<br/>
                                                    <b>Medium:</b> Standard service calls and repairs.<br/>
                                                    <b>Low:</b> Routine maintenance or inspections.
                                                </p>
                                            </TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                </div>
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
                                <Label htmlFor="jobTemplate.estimatedDuration">Estimated Duration *</Label>
                                <div className="flex items-center gap-2">
                                <Input id="jobTemplate.estimatedDuration" type="number" {...register('jobTemplate.estimatedDuration', { valueAsNumber: true })} />
                                <Controller
                                    name="jobTemplate.durationUnit"
                                    control={control}
                                    render={({ field }) => (
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <SelectTrigger className="w-[120px]"><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="hours">Hours</SelectItem>
                                                <SelectItem value="days">Days</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    )}
                                />
                                </div>
                                {errors.jobTemplate?.estimatedDuration && <p className="text-destructive text-sm mt-1">{errors.jobTemplate.estimatedDuration.message}</p>}
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
