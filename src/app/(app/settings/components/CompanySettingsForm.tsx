
"use client";

import React, { useState } from 'react';
import { useForm, useFieldArray, Controller, useWatch } from 'react-hook-form';
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
import { Loader2, Save, Building, MapPin, Clock, Leaf, ListChecks } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { SKILLS_BY_SPECIALTY } from '@/lib/skills';

// Extend the base schema for local form validation
const FormSchema = z.object({
  name: z.string().min(2, 'Company name must be at least 2 characters.'),
  settings: CompanySettingsSchema.extend({
      // Add otherSpecialty to the settings part of the form schema for local validation
      otherSpecialty: z.string().optional(),
  }).refine(data => {
      // If 'Other' is checked, otherSpecialty must not be empty
      if (data.companySpecialties?.includes('Other')) {
          return data.otherSpecialty && data.otherSpecialty.trim().length > 0;
      }
      return true;
  }, {
      message: "Please specify your 'Other' specialty.",
      path: ["settings", "otherSpecialty"], // Correct path for the error message
  })
});


type CompanyFormValues = z.infer<typeof FormSchema>;

interface CompanySettingsFormProps {
  company: Company;
}

const CompanySettingsForm: React.FC<CompanySettingsFormProps> = ({ company }) => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const specialties = [...Object.keys(SKILLS_BY_SPECIALTY), "Other"];
  
  const defaultBusinessHours = [
      { dayOfWeek: "Monday", isOpen: true, startTime: "08:00", endTime: "17:00" },
      { dayOfWeek: "Tuesday", isOpen: true, startTime: "08:00", endTime: "17:00" },
      { dayOfWeek: "Wednesday", isOpen: true, startTime: "08:00", endTime: "17:00" },
      { dayOfWeek: "Thursday", isOpen: true, startTime: "08:00", endTime: "17:00" },
      { dayOfWeek: "Friday", isOpen: true, startTime: "08:00", endTime: "17:00" },
      { dayOfWeek: "Saturday", isOpen: false, startTime: "09:00", endTime: "12:00" },
      { dayOfWeek: "Sunday", isOpen: false, startTime: "09:00", endTime: "12:00" },
  ] as const;

  // Logic to extract initial values for specialties
  const standardSpecialties = Object.keys(SKILLS_BY_SPECIALTY);
  const initialOtherSpecialty = company.settings?.companySpecialties?.find(s => !standardSpecialties.includes(s)) || '';
  const initialCompanySpecialties = company.settings?.companySpecialties?.map(s => standardSpecialties.includes(s) ? s : 'Other').filter((value, index, self) => self.indexOf(value) === index) || [];
  
  const { control, register, handleSubmit, formState: { errors }, setValue } = useForm<CompanyFormValues>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      name: company.name || '',
      settings: {
        address: company.settings?.address || '',
        timezone: company.settings?.timezone || 'UTC',
        businessHours: company.settings?.businessHours && company.settings.businessHours.length === 7 
            ? company.settings.businessHours 
            : defaultBusinessHours,
        co2EmissionFactorKgPerKm: company.settings?.co2EmissionFactorKgPerKm ?? 0.266,
        companySpecialties: initialCompanySpecialties,
        otherSpecialty: initialOtherSpecialty,
      },
    },
  });
  
  const watchedSpecialties = useWatch({
    control,
    name: "settings.companySpecialties",
    defaultValue: initialCompanySpecialties,
  });

  const isOtherSelected = watchedSpecialties?.includes('Other');

  const { fields } = useFieldArray({
    control,
    name: "settings.businessHours",
  });

  const emissionPresets = [
    { label: 'Average Diesel Van', value: '0.298' },
    { label: 'Average Gasoline Van', value: '0.266' },
    { label: 'Average Hybrid Van', value: '0.150' },
    { label: 'Electric Vehicle', value: '0' },
  ];

  const onSubmit = async (data: CompanyFormValues) => {
    setIsSubmitting(true);
    
    const { companySpecialties, otherSpecialty, ...restOfSettings } = data.settings;

    // Transform data to match the backend schema before sending
    const finalSpecialties = companySpecialties?.includes("Other") && otherSpecialty 
        ? [...companySpecialties.filter(s => s !== "Other"), otherSpecialty] 
        : companySpecialties;

    const result = await updateCompanyAction({ 
        companyId: company.id, 
        name: data.name,
        settings: {
            ...restOfSettings,
            companySpecialties: finalSpecialties || [],
        }
    });

    if (result.error) {
      toast({ title: 'Error', description: result.error, variant: 'destructive' });
    } else {
      toast({ title: 'Success', description: 'Company settings updated successfully.' });
    }
    setIsSubmitting(false);
  };
  
  const curatedTimezones = [
    { value: 'America/New_York', label: 'New York (Eastern Time)' },
    { value: 'America/Chicago', label: 'Chicago (Central Time)' },
    { value: 'America/Denver', label: 'Denver (Mountain Time)' },
    { value: 'America/Phoenix', label: 'Phoenix (Mountain Time, no DST)' },
    { value: 'America/Los_Angeles', label: 'Los Angeles (Pacific Time)' },
    { value: 'Europe/London', label: 'London (GMT/BST)' },
    { value: 'Europe/Berlin', label: 'Berlin (CET/CEST)' },
  ].sort((a, b) => a.label.localeCompare(b.label));

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
        <h3 className="text-lg font-semibold flex items-center gap-2"><ListChecks/> Company Specialties</h3>
        <p className="text-sm text-muted-foreground">Select all that apply. This will customize features like the "Seed Skills" function.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 rounded-md border p-4">
            {specialties.map((item) => (
                <Controller
                    key={item}
                    name="settings.companySpecialties"
                    control={control}
                    render={({ field }) => {
                        return (
                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id={`specialty-${item}`}
                                    checked={field.value?.includes(item)}
                                    onCheckedChange={(checked) => {
                                        return checked
                                            ? field.onChange([...(field.value || []), item])
                                            : field.onChange(field.value?.filter((value) => value !== item));
                                    }}
                                />
                                <Label htmlFor={`specialty-${item}`} className="font-normal">{item}</Label>
                            </div>
                        );
                    }}
                />
            ))}
        </div>
        {isOtherSelected && (
            <div className="space-y-2 pl-1 pt-2">
                <Label htmlFor="otherSpecialty">Please specify your 'Other' specialty</Label>
                <Input
                    id="otherSpecialty"
                    placeholder="e.g., Marine HVAC"
                    {...register('settings.otherSpecialty')}
                />
                {errors.settings?.otherSpecialty && (
                    <p className="text-sm text-destructive">{errors.settings.otherSpecialty.message}</p>
                )}
            </div>
        )}
        {errors.settings?.companySpecialties && (
            <p className="text-sm text-destructive mt-1">{errors.settings.companySpecialties.message}</p>
        )}
      </div>

      <Separator />

      <div className="space-y-4">
        <h3 className="text-lg font-semibold flex items-center gap-2"><Leaf/> Environmental Settings</h3>
        <div className="space-y-2">
          <Label htmlFor="co2EmissionFactorKgPerKm">CO₂ Emission Factor (kg/km)</Label>
          <Select onValueChange={(value) => setValue('settings.co2EmissionFactorKgPerKm', parseFloat(value), { shouldValidate: true })}>
            <SelectTrigger id="emission-presets">
              <SelectValue placeholder="Select a vehicle type for suggestions..." />
            </SelectTrigger>
            <SelectContent>
              {emissionPresets.map(preset => (
                <SelectItem key={preset.label} value={preset.value}>{preset.label} ({preset.value} kg/km)</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            id="co2EmissionFactorKgPerKm"
            type="number"
            step="0.001"
            className="mt-2"
            placeholder="Or enter a custom value..."
            {...register('settings.co2EmissionFactorKgPerKm', { valueAsNumber: true })}
          />
          <p className="text-sm text-muted-foreground">
            Select a preset or enter your fleet's average CO₂ emission factor. For electric vehicles, use 0.
          </p>
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

    