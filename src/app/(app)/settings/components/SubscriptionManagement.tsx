
"use client";

import React, { useState } from 'react';
import type { Company } from '@/types';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/hooks/use-toast';
import { Sparkles } from 'lucide-react';
import PricingCard from './PricingCard';
import StripePortal from './StripePortal';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { differenceInDays } from 'date-fns';
import { useRouter } from 'next/navigation';
import QuantityDialog from './QuantityDialog';
import { createCheckoutSessionAction } from '@/actions/stripe-actions';
import { loadStripe } from '@stripe/stripe-js';

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
    const [isCheckoutLoading, setIsCheckoutLoading] = useState(false);
    const [isQuantityDialogOpen, setIsQuantityDialogOpen] = useState(false);
    
    const isSubscribed = company.subscriptionStatus === 'active';
    const isTrialing = company.subscriptionStatus === 'trialing';
    let trialDaysLeft = 0;
    if (isTrialing && company.trialEndsAt) {
      trialDaysLeft = differenceInDays(new Date(company.trialEndsAt), new Date());
    }

    const handleCheckout = async (quantity: number) => {
        setIsCheckoutLoading(true);

        const priceId = process.env.NEXT_PUBLIC_STRIPE_PRICE_ID;
        if (!priceId) {
            toast({ title: 'Configuration Error', description: `Stripe Price ID is not set. Please contact support.`, variant: 'destructive'});
            setIsCheckoutLoading(false);
            return;
        }

        if (!user) {
             toast({ title: 'Authentication Error', description: `You must be logged in.`, variant: 'destructive'});
             setIsCheckoutLoading(false);
             return;
        }

        const result = await createCheckoutSessionAction({
            companyId: company.id,
            uid: user.uid,
            email: user.email!,
            priceId: priceId,
            quantity: quantity,
        });

        if ('error' in result) {
            toast({ title: 'Checkout Error', description: result.error, variant: 'destructive'});
            setIsCheckoutLoading(false);
        } else if (stripePromise) {
            const stripe = await stripePromise;
            await stripe?.redirectToCheckout({ sessionId: result.sessionId });
            // If redirectToCheckout fails, it will throw an error. The user will stay on this page.
             setIsCheckoutLoading(false); // Only runs if redirect fails
        }
    };
    
    if (isSubscribed) {
        return <StripePortal company={company} />;
    }
    
    return (
        <div className="space-y-6">
            <QuantityDialog
                isOpen={isQuantityDialogOpen}
                setIsOpen={setIsQuantityDialogOpen}
                onConfirm={handleCheckout}
                isLoading={isCheckoutLoading}
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
                        cta={"Choose Plan"}
                        onCtaClick={() => setIsQuantityDialogOpen(true)}
                        isLoading={isCheckoutLoading}
                        isPopular={true}
                    />
                </div>
            </div>
        </div>
    );
};

export default SubscriptionManagement;
