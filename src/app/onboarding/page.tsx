
"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, Controller, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/contexts/auth-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { completeOnboardingAction } from '@/actions/onboarding-actions';
import { type CompleteOnboardingInput } from '@/types';
import { Loader2, Building, Users, ListChecks, Globe } from 'lucide-react';
import { loadStripe } from '@stripe/stripe-js';
import { SKILLS_BY_SPECIALTY } from '@/lib/skills';
import { Logo } from '@/components/common/logo';
import { useTranslation } from '@/hooks/use-language';
import Link from 'next/link';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type OnboardingFormValues = Omit<CompleteOnboardingInput, 'uid'>;

const stripePromise = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY 
    ? loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
    : null;

const specialties = [...Object.keys(SKILLS_BY_SPECIALTY), "Other"];

const OnboardingFormSchema = z.object({
  companyName: z.string().min(2, 'Company name must be at least 2 characters.'),
  companySpecialties: z.array(z.string()).min(1, 'Please select at least one company specialty.'),
  otherSpecialty: z.string().optional(),
  numberOfTechnicians: z.number().min(1, 'You must have at least one technician.'),
}).refine(data => {
    if (data.companySpecialties.includes('Other')) {
        return data.otherSpecialty && data.otherSpecialty.trim().length > 0;
    }
    return true;
}, {
    message: "Please specify your specialty.",
    path: ["otherSpecialty"],
});


export default function OnboardingPage() {
  const router = useRouter();
  const { user, userProfile, loading } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { t, setLanguage, language } = useTranslation();

  useEffect(() => {
    if (!loading && userProfile && userProfile.onboardingStatus === 'completed') {
      router.replace('/dashboard');
    }
  }, [userProfile, loading, router]);
  
  const { control, register, handleSubmit, formState: { errors } } = useForm<OnboardingFormValues>({
    resolver: zodResolver(OnboardingFormSchema),
    defaultValues: {
        numberOfTechnicians: 1,
        companySpecialties: [],
        otherSpecialty: '',
    }
  });
  
  const watchedSpecialties = useWatch({
    control,
    name: "companySpecialties",
    defaultValue: []
  });

  const isOtherSelected = watchedSpecialties.includes('Other');

  const specialtyTranslations: { [key: string]: string } = {
    "Plumbing": "Plumbing",
    "Electrical": "Electrical",
    "HVAC": "HVAC",
    "Pipefitting": "Pipefitting",
    "Landscaping": "Landscaping",
    "Pest Control": "Pest Control",
    "Other": t('specialty_other'),
  };

  const onSubmit = async (data: OnboardingFormValues) => {
    setIsSubmitting(true);

    if (process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true') {
        toast({
          title: "Onboarding Complete!",
          description: "Redirecting you to the dashboard.",
        });
        sessionStorage.setItem('mock_onboarding_complete', 'true');
        // Reload the page so the auth context can re-evaluate and redirect to the dashboard
        window.location.href = '/dashboard';
        return;
    }
    
    if (!user) {
        toast({
            title: "Onboarding Failed",
            description: "You must be logged in to complete onboarding.",
            variant: "destructive"
        });
        setIsSubmitting(false);
        return;
    }

    const appId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
    if (!appId) {
        toast({ title: "Configuration Error", description: "App ID is not configured.", variant: "destructive" });
        setIsSubmitting(false);
        return;
    }
    
    const result = await completeOnboardingAction({
        ...data,
        uid: user.uid
    }, appId);

    if (result.error || !result.sessionId) {
      console.error("Server action failed with error:", result.error);
      toast({
        title: "Onboarding Failed",
        description: result.error || "Could not create a checkout session.",
        variant: "destructive"
      });
      setIsSubmitting(false);
    } else {
      console.log("Server action successful. Redirecting to Stripe with session ID:", result.sessionId);
      toast({
        title: "Company Setup Complete!",
        description: "Redirecting you to checkout to start your trial...",
      });
      
      if (!stripePromise) {
        console.error("Stripe.js has not loaded. Cannot redirect to checkout.");
        toast({ title: 'Stripe Error', description: 'Stripe is not configured correctly.', variant: 'destructive' });
        setIsSubmitting(false);
        return;
      }
      
      const stripe = await stripePromise;
      const { error: stripeError } = await stripe.redirectToCheckout({ sessionId: result.sessionId });

      if (stripeError) {
        console.error("Stripe redirection failed:", stripeError.message);
        toast({ title: 'Redirect Failed', description: stripeError.message, variant: 'destructive' });
        setIsSubmitting(false);
      }
    }
  };

  if (loading || (!userProfile && process.env.NEXT_PUBLIC_USE_MOCK_DATA !== 'true') || (userProfile && userProfile.onboardingStatus === 'completed')) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-muted/40">
        <header className="w-full bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
            <div className="container flex h-14 items-center justify-between">
                <Link href="/" className="flex items-center">
                    <Logo />
                </Link>
                <div className="flex items-center justify-end">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="text-foreground/80 hover:bg-muted/50 h-9 w-9">
                          <Globe className="h-4 w-4" />
                          <span className="sr-only">Change Language</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setLanguage('en')}>English</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setLanguage('de')}>Deutsch</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setLanguage('fr')}>Français</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
        </header>
        <main className="flex flex-1 items-center justify-center p-4">
            <Card className="w-full max-w-lg shadow-2xl">
                <CardHeader className="text-center">
                <CardTitle className="text-2xl font-headline">{t('onboarding_title')}</CardTitle>
                <CardDescription>
                    {t('onboarding_desc')}
                </CardDescription>
                </CardHeader>
                <form onSubmit={handleSubmit(onSubmit)}>
                <CardContent className="space-y-6">
                    <div className="space-y-2">
                    <Label htmlFor="companyName" className="flex items-center gap-2 text-md">
                        <Building className="h-4 w-4" /> {t('company_name')}
                    </Label>
                    <Input
                        id="companyName"
                        placeholder={t('onboarding_placeholder')}
                        {...register('companyName')}
                        disabled={isSubmitting}
                    />
                    {errors.companyName && (
                        <p className="text-sm text-destructive">{errors.companyName.message}</p>
                    )}
                    </div>

                    <div className="space-y-2">
                    <Label className="flex items-center gap-2 text-md">
                        <ListChecks className="h-4 w-4" /> {t('company_specialties')}
                    </Label>
                    <p className="text-sm text-muted-foreground">
                        {t('specialties_desc')}
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 rounded-md border p-4">
                        {specialties.map((item) => (
                            <Controller
                                key={item}
                                name="companySpecialties"
                                control={control}
                                render={({ field }) => {
                                    return (
                                        <div className="flex items-center space-x-2">
                                            <Checkbox
                                                id={item}
                                                checked={field.value?.includes(item)}
                                                onCheckedChange={(checked) => {
                                                    return checked
                                                        ? field.onChange([...(field.value || []), item])
                                                        : field.onChange(field.value?.filter((value) => value !== item));
                                                }}
                                                disabled={isSubmitting}
                                            />
                                            <Label htmlFor={item} className="font-normal">{specialtyTranslations[item] || item}</Label>
                                        </div>
                                    );
                                }}
                            />
                        ))}
                    </div>
                    {isOtherSelected && (
                        <div className="space-y-2 pl-1 pt-2">
                            <Label htmlFor="otherSpecialty">{t('specify_specialty')}</Label>
                            <Input
                                id="otherSpecialty"
                                placeholder={t('specify_specialty_placeholder')}
                                {...register('otherSpecialty')}
                                disabled={isSubmitting}
                            />
                            {errors.otherSpecialty && (
                                <p className="text-sm text-destructive">{errors.otherSpecialty.message}</p>
                            )}
                        </div>
                    )}
                    {errors.companySpecialties && !isOtherSelected && (
                        <p className="text-sm text-destructive">{errors.companySpecialties.message}</p>
                    )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="numberOfTechnicians" className="flex items-center gap-2 text-md">
                            <Users className="h-4 w-4" /> {t('number_of_technicians')}
                        </Label>
                        <p className="text-sm text-muted-foreground">
                            {t('technicians_desc')}
                        </p>
                        <Input
                            id="numberOfTechnicians"
                            type="number"
                            min="1"
                            {...register('numberOfTechnicians', { valueAsNumber: true })}
                            disabled={isSubmitting}
                        />
                        {errors.numberOfTechnicians && (
                            <p className="text-sm text-destructive">{errors.numberOfTechnicians.message}</p>
                        )}
                    </div>
                </CardContent>
                <CardFooter>
                    <Button type="submit" className="w-full" disabled={isSubmitting}>
                    {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    {t('complete_setup_button')}
                    </Button>
                </CardFooter>
                </form>
            </Card>
        </main>
    </div>
  );
}
