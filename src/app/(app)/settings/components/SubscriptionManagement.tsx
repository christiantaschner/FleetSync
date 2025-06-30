
"use client";

import React, { useState } from 'react';
import { useAuth } from '@/contexts/auth-context';
import type { Company } from '@/types';
import { Button } from '@/components/ui/button';
import { createCheckoutSessionAction, createPortalSessionAction } from '@/actions/stripe-actions';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ExternalLink, CheckCircle } from 'lucide-react';
import { loadStripe } from '@stripe/stripe-js';
import PricingCard from './PricingCard';
import { differenceInDays, format } from 'date-fns';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Sparkles } from 'lucide-react';

interface SubscriptionManagementProps {
  company: Company;
}

const plans = [
    {
        title: "Pro",
        priceId: "price_1PgTrkRxS9KZ94c7r9sS7D7G", // Replace with your actual Price ID from Stripe
        price: "$49",
        frequency: "/ per technician / month",
        description: "For growing teams that need powerful scheduling and AI optimization.",
        features: ["AI Job Allocation", "Route Optimization", "Live Technician Tracking", "Basic Reporting"],
        cta: "Choose Pro",
    },
    {
        title: "Enterprise",
        priceId: "price_1PgTrkRxS9KZ94c7QY5z5g3g", // Replace with your actual Price ID from Stripe
        price: "Custom",
        frequency: "",
        description: "For large organizations with advanced security and support needs.",
        features: ["All Pro features", "Custom Integrations", "Dedicated Support", "Advanced Security & Compliance"],
        cta: "Contact Sales",
    },
];

const SubscriptionManagement: React.FC<SubscriptionManagementProps> = ({ company }) => {
    const { user } = useAuth();
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState<string | null>(null);

    const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

    const handleSubscribe = async (priceId: string) => {
        if (!user || !user.email) {
            toast({ title: 'Error', description: 'You must be logged in to subscribe.', variant: 'destructive' });
            return;
        }

        setIsLoading(priceId);

        const result = await createCheckoutSessionAction({
            companyId: company.id,
            uid: user.uid,
            email: user.email,
            priceId,
        });

        if ('error' in result) {
            toast({ title: 'Error', description: result.error, variant: 'destructive' });
            setIsLoading(null);
            return;
        }

        const stripe = await stripePromise;
        if (!stripe) {
            toast({ title: 'Error', description: 'Stripe.js has not loaded yet.', variant: 'destructive' });
            setIsLoading(null);
            return;
        }
        
        await stripe.redirectToCheckout({ sessionId: result.sessionId });
        setIsLoading(null);
    };

    const handleManageSubscription = async () => {
        setIsLoading('portal');
        const result = await createPortalSessionAction({ companyId: company.id });

        if ('error' in result) {
            toast({ title: 'Error', description: result.error, variant: 'destructive' });
        } else {
            window.location.href = result.url;
        }
        setIsLoading(null);
    };
    
    const isSubscribed = company.subscriptionStatus === 'active';
    const isTrialing = company.subscriptionStatus === 'trialing';
    let trialDaysLeft = 0;
    if (isTrialing && company.trialEndsAt) {
      trialDaysLeft = differenceInDays(new Date(company.trialEndsAt), new Date());
    }

    if (isSubscribed) {
        return (
            <div className="space-y-4">
                 <Alert variant="default" className="border-green-600/50 bg-green-50/50">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <AlertTitle className="text-green-800 font-semibold">You are subscribed!</AlertTitle>
                    <AlertDescription className="text-green-700">
                        Thank you for being a customer. You can manage your subscription, view invoices, and update payment details in the Stripe customer portal.
                    </AlertDescription>
                </Alert>
                <Button onClick={handleManageSubscription} disabled={!!isLoading}>
                    {isLoading === 'portal' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Manage Subscription & Billing <ExternalLink className="ml-2 h-4 w-4"/>
                </Button>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {isTrialing && trialDaysLeft >= 0 && (
                 <Alert variant="default" className="border-primary/50 bg-primary/5">
                    <Sparkles className="h-4 w-4 text-primary" />
                    <AlertTitle className="text-primary font-semibold">You are on a free trial!</AlertTitle>
                    <AlertDescription className="text-primary/90">
                        You have <strong>{trialDaysLeft} days left</strong>. Choose a plan below to keep your service active.
                    </AlertDescription>
                </Alert>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {plans.map((plan) => (
                    <PricingCard
                        key={plan.title}
                        title={plan.title}
                        description={plan.description}
                        price={plan.price}
                        frequency={plan.frequency}
                        features={plan.features}
                        cta={plan.cta}
                        onCtaClick={() => handleSubscribe(plan.priceId)}
                        isLoading={isLoading === plan.priceId}
                    />
                ))}
            </div>
        </div>
    );
};

export default SubscriptionManagement;

