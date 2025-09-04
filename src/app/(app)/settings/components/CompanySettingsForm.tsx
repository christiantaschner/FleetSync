
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
import { Loader2, Save, Building, MapPin, Clock, Leaf, ListChecks, HelpCircle, Bot, Zap, Star } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { SKILLS_BY_SPECIALTY } from '@/lib/skills';
import { Switch } from '@/components/ui/switch';
import { useAuth } from '@/contexts/auth-context';

const FormSchema = z.object({
  name: z.string().min(2, 'Company name must be at least 2 characters.'),
  settings: CompanySettingsSchema,
});

type CompanyFormValues = z.infer<typeof FormSchema>;

interface CompanySettingsFormProps {
  company: Company;
}

const specialties = [...Object.keys(SKILLS_BY_SPECIALTY), "Other"];

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
  const { isMockMode, setIsMockMode } = useAuth();
  
  const defaultBusinessHours = [
      { dayOfWeek: "Monday", isOpen: true, startTime: "08:00", endTime: "17:00" },
      { dayOfWeek: "Tuesday", isOpen: true, startTime: "08:00", endTime: "17:00" },
      { dayOfWeek: "Wednesday", isOpen: true, startTime: "08:00", endTime: "17:00" },
      { dayOfWeek: "Thursday", isOpen: true, startTime: "08:00", endTime: "17:00" },
      { dayOfWeek: "Friday", isOpen: true, startTime: "08:00", endTime: "17:00" },
      { dayOfWeek: "Saturday", isOpen: false, startTime: "09:00", endTime: "12:00" },
      { dayOfWeek: "Sunday", isOpen: false, startTime: "09:00", endTime: "12:00" },
  ] as const;

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
        companySpecialties: company.settings?.companySpecialties || [],
        otherSpecialty: company.settings?.otherSpecialty || '',
        hideHelpButton: company.settings?.hideHelpButton || false,
        featureFlags: {
          profitScoringEnabled: company.settings?.featureFlags?.profitScoringEnabled ?? true,
          autoDispatchEnabled: company.settings?.featureFlags?.autoDispatchEnabled ?? true,
          rescheduleCustomerJobsEnabled: company.settings?.featureFlags?.rescheduleCustomerJobsEnabled ?? true,
          ...company.settings?.featureFlags,
        },
      },
    },
  });

  const { fields } = useFieldArray({
    control,
    name: "settings.businessHours",
  });
  
  const watchedSpecialties = useWatch({
    control,
    name: "settings.companySpecialties",
    defaultValue: company.settings?.companySpecialties || []
  });

  const isOtherSelected = watchedSpecialties.includes('Other');

  const emissionPresets = [
    { label: 'Average Diesel Van', value: '0.298' },
    { label: 'Average Gasoline Van', value: '0.266' },
    { label: 'Average Hybrid Van', value: '0.150' },
    { label: 'Electric Vehicle', value: '0' },
  ];

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
        <h3 className="text-lg font-semibold flex items-center gap-2"><Zap/> AI &amp; Automation Settings</h3>
        <div className="flex items-center space-x-2 rounded-md border p-4">
          <Controller
            name="settings.featureFlags.profitScoringEnabled"
            control={control}
            render={({ field }) => (
              <Switch
                id="profitScoringEnabled"
                checked={field.value}
                onCheckedChange={field.onChange}
              />
            )}
          />
          <div>
              <Label htmlFor="profitScoringEnabled" className="flex items-center gap-2"><Star className="text-amber-500 h-4 w-4"/>Profit-Aware Dispatching</Label>
              <p className="text-sm text-muted-foreground">When enabled, the AI prioritizes job assignments based on maximizing profitability.</p>
          </div>
        </div>
        <div className="flex items-center space-x-2 rounded-md border p-4">
          <Controller
            name="settings.featureFlags.autoDispatchEnabled"
            control={control}
            render={({ field }) => (
              <Switch
                id="autoDispatchEnabled"
                checked={field.value}
                onCheckedChange={field.onChange}
              />
            )}
          />
          <div>
              <Label htmlFor="autoDispatchEnabled" className="flex items-center gap-2">Proactive High-Priority Dispatch</Label>
              <p className="text-sm text-muted-foreground">When a new high-priority job is created, the AI will automatically suggest an assignment.</p>
          </div>
        </div>
        <div className="flex items-center space-x-2 rounded-md border p-4">
          <Controller
            name="settings.featureFlags.rescheduleCustomerJobsEnabled"
            control={control}
            render={({ field }) => (
              <Switch
                id="rescheduleCustomerJobsEnabled"
                checked={field.value}
                onCheckedChange={field.onChange}
              />
            )}
          />
          <div>
              <Label htmlFor="rescheduleCustomerJobsEnabled" className="flex items-center gap-2">Proactive Schedule Risk Alerts</Label>
              <p className="text-sm text-muted-foreground">The AI will actively monitor schedules and alert you to potential delays.</p>
          </div>
        </div>
      </div>
      
      <Separator />

      <div className="space-y-4">
        <h3 className="text-lg font-semibold flex items-center gap-2"><HelpCircle/> UI &amp; Data Settings</h3>
        <div className="flex items-center space-x-2 rounded-md border p-4">
          <Controller
            name="settings.hideHelpButton"
            control={control}
            render={({ field }) => (
              <Switch
                id="hideHelpButton"
                checked={field.value}
                onCheckedChange={field.onChange}
              />
            )}
          />
          <div>
              <Label htmlFor="hideHelpButton">Hide Floating Help Button</Label>
              <p className="text-sm text-muted-foreground">The AI Assistant will still be accessible from the main menu.</p>
          </div>
        </div>
         <div className="flex items-center space-x-2 rounded-md border p-4">
          <Switch
            id="mockDataMode"
            checked={isMockMode}
            onCheckedChange={setIsMockMode}
          />
          <div>
              <Label htmlFor="mockDataMode" className="flex items-center gap-2"><Bot/> Mock Data Mode</Label>
              <p className="text-sm text-muted-foreground">Display sample data throughout the app for demonstration or testing. No real data will be saved.</p>
          </div>
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
                                    id={`settings-${item}`}
                                    checked={field.value?.includes(item)}
                                    onCheckedChange={(checked) => {
                                        return checked
                                            ? field.onChange([...(field.value || []), item])
                                            : field.onChange(field.value?.filter((value) => value !== item));
                                    }}
                                />
                                <Label htmlFor={`settings-${item}`} className="font-normal">{item}</Label>
                            </div>
                        );
                    }}
                />
            ))}
        </div>
        {isOtherSelected && (
            <div className="space-y-2 pl-1 pt-2">
                <Label htmlFor="settings-otherSpecialty">Please specify your specialty</Label>
                <Input
                    id="settings-otherSpecialty"
                    placeholder="e.g., Marine HVAC"
                    {...register('settings.otherSpecialty')}
                />
                {errors.settings?.otherSpecialty && (
                    <p className="text-sm text-destructive">{errors.settings.otherSpecialty.message}</p>
                )}
            </div>
        )}
        {errors.settings?.companySpecialties && !isOtherSelected && <p className="text-sm text-destructive mt-1">{errors.settings.companySpecialties.message}</p>}
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
            <div key={field.id} className="grid grid-cols-[1fr_auto_auto] sm:grid-cols-[100px_1fr_1fr_auto] items-center gap-3 p-3 border rounded-lg bg-secondary/50">
              <Label className="font-semibold col-span-4 sm:col-span-1">{field.dayOfWeek}</Label>
              <div className="col-span-4 sm:col-span-3 grid grid-cols-[auto_1fr_1fr] items-center gap-3">
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
                <div className="space-y-1">
                  <Label htmlFor={`start-time-${index}`} className="text-xs text-muted-foreground">Start Time</Label>
                  <Input type="time" id={`start-time-${index}`} {...register(`settings.businessHours.${index}.startTime`)} />
                </div>
                <div className="space-y-1">
                  <Label htmlFor={`end-time-${index}`} className="text-xs text-muted-foreground">End Time</Label>
                  <Input type="time" id={`end-time-${index}`} {...register(`settings.businessHours.${index}.endTime`)} />
                </div>
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
