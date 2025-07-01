
"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '@/contexts/auth-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { completeOnboardingAction } from '@/actions/onboarding-actions';
import { CompleteOnboardingInputSchema, type CompleteOnboardingInput } from '@/types';
import { Loader2, Building, Sparkles, Users } from 'lucide-react';
import { Logo } from '@/components/common/logo';
import { loadStripe } from '@stripe/stripe-js';

type OnboardingFormValues = Omit<CompleteOnboardingInput, 'uid'>;

const stripePromise = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY 
    ? loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
    : null;

export default function OnboardingPage() {
  const router = useRouter();
  const { user, userProfile, loading } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // If user profile is loaded and onboarding is complete, redirect to dashboard
    if (!loading && userProfile && userProfile.onboardingStatus === 'completed') {
      router.replace('/app/dashboard');
    }
  }, [userProfile, loading, router]);
  
  const { register, handleSubmit, formState: { errors } } = useForm<OnboardingFormValues>({
    resolver: zodResolver(CompleteOnboardingInputSchema.omit({ uid: true })),
    defaultValues: {
        numberOfTechnicians: 1,
    }
  });
  
  const onSubmit = async (data: OnboardingFormValues) => {
    setIsSubmitting(true);
    
    if (!user) {
        toast({
            title: "Onboarding Failed",
            description: "You must be logged in to complete onboarding.",
            variant: "destructive"
        });
        setIsSubmitting(false);
        return;
    }
    
    const result = await completeOnboardingAction({
        ...data,
        uid: user.uid
    });

    if (result.error || !result.sessionId) {
      toast({
        title: "Onboarding Failed",
        description: result.error || "Could not create a checkout session.",
        variant: "destructive"
      });
      setIsSubmitting(false);
    } else {
      toast({
        title: "Company Setup Complete!",
        description: "Redirecting you to checkout to start your trial...",
      });
      
      if (!stripePromise) {
        toast({ title: 'Stripe Error', description: 'Stripe is not configured correctly.', variant: 'destructive' });
        setIsSubmitting(false);
        return;
      }
      
      const stripe = await stripePromise;
      const { error: stripeError } = await stripe.redirectToCheckout({ sessionId: result.sessionId });

      if (stripeError) {
        toast({ title: 'Redirect Failed', description: stripeError.message, variant: 'destructive' });
        setIsSubmitting(false);
      }
    }
  };

  if (loading || !userProfile || userProfile.onboardingStatus === 'completed') {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-muted/40 p-4">
      <div className="absolute top-8 left-8">
        <Logo />
      </div>
      <Card className="w-full max-w-lg shadow-2xl">
        <CardHeader className="text-center">
          <Sparkles className="mx-auto h-12 w-12 text-primary mb-4" />
          <CardTitle className="text-2xl font-headline">Welcome to FleetSync AI!</CardTitle>
          <CardDescription>
            Let's get your company set up. This will only take a moment.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="companyName" className="flex items-center gap-2 text-md">
                <Building className="h-4 w-4" /> Company Name
              </Label>
              <Input
                id="companyName"
                placeholder="e.g., Acme Plumbing & HVAC"
                {...register('companyName')}
                disabled={isSubmitting}
              />
              {errors.companyName && (
                <p className="text-sm text-destructive">{errors.companyName.message}</p>
              )}
            </div>
            <div className="space-y-2">
                <Label htmlFor="numberOfTechnicians" className="flex items-center gap-2 text-md">
                    <Users className="h-4 w-4" /> Number of Technicians
                </Label>
                <p className="text-sm text-muted-foreground">
                    How many technicians will you be managing? You can change this later.
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
              {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4"/>}
              Complete Setup & Start Free Trial
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
