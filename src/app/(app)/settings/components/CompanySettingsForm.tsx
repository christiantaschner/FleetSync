
"use client";

import React, { useState } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from "@/hooks/use-toast";
import { updateCompanyAction } from '@/actions/company-actions';
import type { Company } from '@/types';
import { CompanySettingsSchema } from '@/types';
import { Loader2, Save, Building, MapPin, Clock } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

const FormSchema = z.object({
  name: z.string().min(2, 'Company name must be at least 2 characters.'),
  settings: CompanySettingsSchema,
});

type CompanyFormValues = z.infer<typeof FormSchema>;

interface CompanySettingsFormProps {
  company: Company;
}

const curatedTimezones = [
  // North America
  { value: 'America/New_York', label: 'New York (Eastern Time)' },
  { value: 'America/Chicago', label: 'Chicago (Central Time)' },
  { value: 'America/Denver', label: 'Denver (Mountain Time)' },
  { value: 'America/Phoenix', label: 'Phoenix (Mountain Time, no DST)' },
  { value: 'America/Los_Angeles', label: 'Los Angeles (Pacific Time)' },
  { value: 'America/Anchorage', label: 'Anchorage (Alaska Time)' },
  { value: 'America/Halifax', label: 'Halifax (Atlantic Time)' },
  { value: 'America/Toronto', label: 'Toronto (Eastern Time)' },
  { value: 'America/Vancouver', label: 'Vancouver (Pacific Time)' },
  { value: 'America/Winnipeg', label: 'Winnipeg (Central Time)' },
  { value: 'America/Regina', label: 'Regina (Central Time, no DST)' },
  { value: 'America/Mexico_City', label: 'Mexico City (Central Time)' },
  // Europe & UK
  { value: 'Europe/London', label: 'London (GMT/BST)' },
  { value: 'Europe/Dublin', label: 'Dublin (GMT/IST)' },
  { value: 'Europe/Paris', label: 'Paris (CET/CEST)' },
  { value: 'Europe/Berlin', label: 'Berlin (CET/CEST)' },
  { value: 'Europe/Rome', label: 'Rome (CET/CEST)' },
  { value: 'Europe/Madrid', label: 'Madrid (CET/CEST)' },
  { value: 'Europe/Amsterdam', label: 'Amsterdam (CET/CEST)' },
  { value: 'Europe/Zurich', label: 'Zurich (CET/CEST)' },
  { value: 'Europe/Vienna', label: 'Vienna (CET/CEST)' },
  { value: 'Europe/Stockholm', label: 'Stockholm (CET/CEST)' },
  { value: 'Europe/Oslo', label: 'Oslo (CET/CEST)' },
  { value: 'Europe/Copenhagen', label: 'Copenhagen (CET/CEST)' },
  { value: 'Europe/Helsinki', label: 'Helsinki (EET/EEST)' },
  { value: 'Europe/Athens', label: 'Athens (EET/EEST)' },
  { value: 'Europe/Moscow', label: 'Moscow (MSK)' },
  { value: 'Europe/Prague', label: 'Prague (CET/CEST)' },
].sort((a, b) => a.label.localeCompare(b.label));

const CompanySettingsForm: React.FC<CompanySettingsFormProps> = ({ company }) => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const defaultBusinessHours = [
      { dayOfWeek: "Monday", isOpen: true, startTime: "08:00", endTime: "17:00" },
      { dayOfWeek: "Tuesday", isOpen: true, startTime: "08:00", endTime: "17:00" },
      { dayOfWeek: "Wednesday", isOpen: true, startTime: "08:00", endTime: "17:00" },
      { dayOfWeek: "Thursday", isOpen: true, startTime: "08:00", endTime: "17:00" },
      { dayOfWeek: "Friday", isOpen: true, startTime: "08:00", endTime: "17:00" },
      { dayOfWeek: "Saturday", isOpen: false, startTime: "09:00", endTime: "12:00" },
      { dayOfWeek: "Sunday", isOpen: false, startTime: "09:00", endTime: "12:00" },
  ] as const;

  const { control, register, handleSubmit, formState: { errors } } = useForm<CompanyFormValues>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      name: company.name || '',
      settings: {
        address: company.settings?.address || '',
        timezone: company.settings?.timezone || 'UTC',
        businessHours: company.settings?.businessHours && company.settings.businessHours.length === 7 
            ? company.settings.businessHours 
            : defaultBusinessHours,
      },
    },
  });

  const { fields } = useFieldArray({
    control,
    name: "settings.businessHours",
  });

  const onSubmit = async (data: CompanyFormValues) => {
    setIsSubmitting(true);
    const result = await updateCompanyAction({ companyId: company.id, ...data });
    if (result.error) {
      toast({ title: 'Error', description: result.error, variant: 'destructive' });
    } else {
      toast({ title: 'Success', description: 'Company settings updated successfully.' });
    }
    setIsSubmitting(false);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2"><Building/> General Information</h3>
            <div className="space-y-2">
                <Label htmlFor="name">Company Name</Label>
                <Input id="name" {...register('name')} />
                {errors.name && <p className="text-sm text-destructive mt-1">{errors.name.message}</p>}
            </div>
             <div className="space-y-2">
                <Label htmlFor="address"><MapPin className="inline h-4 w-4 mr-1"/>Company Address</Label>
                <Input id="address" {...register('settings.address')} placeholder="e.g., 123 Main St, Anytown, USA" />
            </div>
             <div className="space-y-2">
                <Label htmlFor="timezone"><Clock className="inline h-4 w-4 mr-1"/>Timezone</Label>
                <Controller
                    name="settings.timezone"
                    control={control}
                    render={({ field }) => (
                         <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <SelectTrigger id="timezone"><SelectValue placeholder="Select timezone" /></SelectTrigger>
                            <SelectContent>
                                {curatedTimezones.map(tz => <SelectItem key={tz.value} value={tz.value}>{tz.label}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    )}
                />
            </div>
        </div>

      <Separator />

      <div className="space-y-4">
        <h3 className="text-lg font-semibold flex items-center gap-2"><Clock /> Business Hours</h3>
        <div className="space-y-3">
          {fields.map((field, index) => (
            <div key={field.id} className="grid grid-cols-[1fr_auto_auto] sm:grid-cols-[100px_1fr_1fr_1fr] items-center gap-3 p-3 border rounded-lg bg-secondary/50">
              <Label className="font-semibold col-span-4 sm:col-span-1">{field.dayOfWeek}</Label>
              <div className="flex items-center space-x-2">
                 <Controller
                    name={`settings.businessHours.${index}.isOpen`}
                    control={control}
                    render={({ field: checkboxField }) => (
                        <Checkbox
                            checked={checkboxField.value}
                            onCheckedChange={checkboxField.onChange}
                            id={`open-${index}`}
                        />
                     )}
                />
                <Label htmlFor={`open-${index}`}>Open</Label>
              </div>
              <div>
                <Label htmlFor={`start-time-${index}`} className="text-xs text-muted-foreground">Start Time</Label>
                <Input type="time" id={`start-time-${index}`} {...register(`settings.businessHours.${index}.startTime`)} />
              </div>
              <div>
                <Label htmlFor={`end-time-${index}`} className="text-xs text-muted-foreground">End Time</Label>
                <Input type="time" id={`end-time-${index}`} {...register(`settings.businessHours.${index}.endTime`)} />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-end pt-4 border-t">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          Save Settings
        </Button>
      </div>
    </form>
  );
};

export default CompanySettingsForm;
