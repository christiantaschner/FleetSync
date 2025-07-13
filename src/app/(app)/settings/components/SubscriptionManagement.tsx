
"use client";

import React, { useState } from 'react';
import type { Company } from '@/types';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/hooks/use-toast';
import { Sparkles, Loader2, CreditCard, AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { differenceInDays } from 'date-fns';
import { useRouter } from 'next/navigation';
import { createPortalSessionAction } from '@/actions/stripe-actions';
import { Button } from '@/components/ui/button';
import { loadStripe } from '@stripe/stripe-js';
import PricingCard from './PricingCard';
import QuantityDialog from './QuantityDialog';
import { createCheckoutSessionAction } from '@/actions/stripe-actions';

interface SubscriptionManagementProps {
  company: Company;
}

const allInclusivePlan = {
    title: "All-Inclusive Plan",
    price: 4900, // in cents
    features: [
        "Unlimited Technicians (billed per seat)",
        "AI-Powered Job Allocation",
        "AI Route Optimization",
        "Proactive Schedule Risk Alerts",
        "Recurring Service Contracts",
        "Customer Tracking Links",
        "In-App Chat & Photo Sharing",
        "Advanced Analytics & KPIs",
        "CSV Data Import",
        "CO2 Emission Tracking",
    ],
    priceIdEnvVar: 'NEXT_PUBLIC_STRIPE_PRICE_ID',
};

const stripePromise = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY 
    ? loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
    : null;

const SubscriptionManagement: React.FC<SubscriptionManagementProps> = ({ company }) => {
    const { toast } = useToast();
    const router = useRouter();
    const { user } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    const [isQuantityDialogOpen, setIsQuantityDialogOpen] = useState(false);
    
    const isSubscribed = company.subscriptionStatus === 'active';
    const isTrialing = company.subscriptionStatus === 'trialing';
    const isPastDue = company.subscriptionStatus === 'past_due' || company.subscriptionStatus === 'unpaid';
    const isCancelled = company.subscriptionStatus === 'canceled';

    let trialDaysLeft = 0;
    if (isTrialing && company.trialEndsAt) {
      trialDaysLeft = differenceInDays(new Date(company.trialEndsAt), new Date());
    }

    const handleOpenPortal = async () => {
        setIsLoading(true);
        const result = await createPortalSessionAction({ companyId: company.id });
        if ('url' in result) {
            window.location.href = result.url;
        } else {
            toast({ title: "Error", description: result.error, variant: "destructive" });
            setIsLoading(false);
        }
    };

     const handleNewSubscription = async (quantity: number) => {
        setIsLoading(true);

        const priceId = process.env.NEXT_PUBLIC_STRIPE_PRICE_ID;
        if (!priceId || !user || !user.email) {
            toast({ title: 'Error', description: `Configuration or user error.`, variant: 'destructive'});
            setIsLoading(false);
            return;
        }

        const result = await createCheckoutSessionAction({
            companyId: company.id,
            uid: user.uid,
            email: user.email,
            priceId: priceId,
            quantity: quantity,
        });

        if ('error' in result) {
            toast({ title: 'Checkout Error', description: result.error, variant: 'destructive'});
            setIsLoading(false);
        } else if ('sessionId' in result && result.sessionId.startsWith('http')) {
             // This is a special case from our action if the user already has a subscription
            window.location.href = result.sessionId;
        } else if ('sessionId' in result && stripePromise) {
            const stripe = await stripePromise;
            await stripe?.redirectToCheckout({ sessionId: result.sessionId });
            // This will redirect, so no need to set loading to false unless it fails
        }
         setIsLoading(false);
    };
    
    if (isSubscribed) {
        return (
             <div className="space-y-6">
                 <Alert variant="default" className="border-green-600/50 bg-green-50/50 text-green-800">
                    <Sparkles className="h-4 w-4 text-green-600" />
                    <AlertTitle className="text-green-700 font-semibold">You have an active subscription!</AlertTitle>
                    <AlertDescription className="text-green-700/90">
                        The number of technicians is automatically synced with your billing. To manage your payment method or cancel your subscription, use the portal.
                    </AlertDescription>
                </Alert>
                <Button onClick={handleOpenPortal} disabled={isLoading} className="w-full sm:w-auto">
                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <CreditCard className="mr-2 h-4 w-4"/>}
                    Manage Billing & Subscription
                </Button>
             </div>
        );
    }
    
    return (
        <div className="space-y-6">
            <QuantityDialog
                isOpen={isQuantityDialogOpen}
                setIsOpen={setIsQuantityDialogOpen}
                onConfirm={handleNewSubscription}
                isLoading={isLoading}
            />

            {isTrialing && trialDaysLeft >= 0 && (
                 <Alert variant="default" className="border-primary/50 bg-primary/5">
                    <Sparkles className="h-4 w-4 text-primary" />
                    <AlertTitle className="text-primary font-semibold">You are on a free trial!</AlertTitle>
                    <AlertDescription className="text-primary/90">
                        You have <strong>{trialDaysLeft} days left</strong>. Choose the plan below to keep your service active.
                    </AlertDescription>
                </Alert>
            )}

            {isPastDue && (
                 <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Payment Required</AlertTitle>
                    <AlertDescription>
                        Your last payment failed. Please update your payment information to restore service.
                    </AlertDescription>
                     <div className="mt-4">
                        <Button onClick={handleOpenPortal} variant="destructive">
                            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <CreditCard className="mr-2 h-4 w-4"/>}
                            Update Payment Info
                        </Button>
                    </div>
                </Alert>
            )}
            
             {isCancelled && (
                 <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Subscription Cancelled</AlertTitle>
                    <AlertDescription>
                        Your subscription is cancelled. You can choose a plan below to reactivate your account.
                    </AlertDescription>
                </Alert>
            )}
            
            <div className="flex justify-center">
                <div className="w-full max-w-sm">
                    <PricingCard
                        key={allInclusivePlan.title}
                        title={allInclusivePlan.title}
                        description="One plan with all features. Billed per technician."
                        price={allInclusivePlan.price}
                        currency="EUR"
                        interval="month"
                        features={allInclusivePlan.features}
                        cta={isPastDue ? "Reactivate Subscription" : "Choose Plan"}
                        onCtaClick={() => setIsQuantityDialogOpen(true)}
                        isLoading={isLoading}
                        isPopular={true}
                    />
                </div>
            </div>
        </div>
    );
};

export default SubscriptionManagement;
