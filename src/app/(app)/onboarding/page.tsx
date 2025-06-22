
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
import { completeOnboardingAction, CompleteOnboardingInputSchema, type CompleteOnboardingInput } from '@/actions/onboarding-actions';
import { Loader2, Building, Sparkles } from 'lucide-react';
import { Logo } from '@/components/common/logo';

export default function OnboardingPage() {
  const router = useRouter();
  const { user, userProfile, loading } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // If user profile is loaded and onboarding is complete, redirect to dashboard
    if (!loading && userProfile && userProfile.onboardingStatus === 'completed') {
      router.replace('/dashboard');
    }
  }, [userProfile, loading, router]);
  
  const { register, handleSubmit, formState: { errors } } = useForm<CompleteOnboardingInput>({
    resolver: zodResolver(CompleteOnboardingInputSchema),
  });
  
  const onSubmit = async (data: CompleteOnboardingInput) => {
    setIsSubmitting(true);
    const result = await completeOnboardingAction(data);

    if (result.error) {
      toast({
        title: "Onboarding Failed",
        description: result.error,
        variant: "destructive"
      });
      setIsSubmitting(false);
    } else {
      toast({
        title: "Welcome to FleetSync AI!",
        description: "Your company has been set up. Redirecting you to the dashboard...",
      });
      // The auth context listener will handle the redirect automatically
      // once the user profile is updated.
      // We can also force a redirect as a fallback.
      setTimeout(() => router.push('/dashboard'), 1000);
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
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="companyName" className="flex items-center gap-2 text-md">
                <Building className="h-4 w-4" /> Company Name
              </Label>
              <p className="text-sm text-muted-foreground">
                This will be the name of your workspace. You can't change this later.
              </p>
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
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Complete Setup & Go to Dashboard
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
