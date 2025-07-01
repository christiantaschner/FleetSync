
"use client";

import React, { useState } from 'react';
import type { Company } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Sparkles } from 'lucide-react';
import PricingCard from './PricingCard';
import StripePortal from './StripePortal';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { differenceInDays } from 'date-fns';
import { useRouter } from 'next/navigation';

interface SubscriptionManagementProps {
  company: Company;
}

const allInclusivePlan = {
    title: "All-Inclusive Plan",
    price: 4900, // in cents
    features: [
        "Unlimited Technicians",
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
    envVar: 'NEXT_PUBLIC_STRIPE_PAYMENT_LINK',
};

const SubscriptionManagement: React.FC<SubscriptionManagementProps> = ({ company }) => {
    const { toast } = useToast();
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    
    const handleCtaClick = () => {
        setIsLoading(true);
        const paymentLink = process.env[allInclusivePlan.envVar];

        if (!paymentLink) {
             toast({
                title: 'Configuration Error',
                description: `The payment link for the plan is not set up. Please contact support.`,
                variant: 'destructive',
            });
            setIsLoading(false);
            return;
        }
        router.push(paymentLink);
    }
    
    const isSubscribed = company.subscriptionStatus === 'active';
    const isTrialing = company.subscriptionStatus === 'trialing';
    let trialDaysLeft = 0;
    if (isTrialing && company.trialEndsAt) {
      trialDaysLeft = differenceInDays(new Date(company.trialEndsAt), new Date());
    }
    
    if (isSubscribed) {
        return <StripePortal company={company} />;
    }
    
    return (
        <div className="space-y-6">
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
                        onCtaClick={handleCtaClick}
                        isLoading={isLoading}
                        isPopular={true}
                    />
                </div>
            </div>
        </div>
    );
};

export default SubscriptionManagement;

