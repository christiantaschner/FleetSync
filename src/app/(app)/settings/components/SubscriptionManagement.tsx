
"use client";

import React, { useState } from 'react';
import type { Company } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Sparkles } from 'lucide-react';
import PricingCard from './PricingCard';
import StripePortal from './StripePortal';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { differenceInDays } from 'date-fns';

const starterPlanUrl = process.env.NEXT_PUBLIC_STRIPE_STARTER_PLAN_URL || '';
const proPlanUrl = process.env.NEXT_PUBLIC_STRIPE_PRO_PLAN_URL || '';
const enterprisePlanUrl = process.env.NEXT_PUBLIC_STRIPE_ENTERPRISE_PLAN_URL || '';

const pricingTiers = [
    {
        title: 'Starter',
        price: 'Custom',
        frequency: '/ technician / month',
        description: 'For small teams needing essential dispatching and scheduling.',
        features: ['Up to 5 Technicians', 'Core Dispatching & Scheduling', 'Live Map View', 'Technician Mobile App', 'Basic Reporting'],
        cta: 'Choose Plan',
        url: starterPlanUrl
    },
    {
        title: 'Professional',
        price: 'Custom',
        frequency: '/ technician / month',
        description: 'Includes core AI features to boost efficiency.',
        features: ['Everything in Starter, plus:', 'AI-Powered Job Allocation', 'AI Route Optimization', 'Recurring Service Contracts', 'Customer Tracking Links'],
        cta: 'Choose Plan',
        url: proPlanUrl,
        className: "border-primary ring-2 ring-primary"
    },
    {
        title: 'Enterprise',
        price: 'Custom',
        frequency: '',
        description: 'For large operations needing advanced analytics and automation.',
        features: ['Everything in Professional, plus:', 'Unlimited Technicians', 'Advanced Analytics & KPIs', 'Proactive Schedule Risk Alerts', 'CO2 Emission Tracking'],
        cta: 'Contact Sales',
        url: enterprisePlanUrl
    }
];


interface SubscriptionManagementProps {
  company: Company;
}

const SubscriptionManagement: React.FC<SubscriptionManagementProps> = ({ company }) => {
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    
    const handleRedirect = (url: string) => {
        if (!url || url.includes('YOUR_')) {
            toast({
                title: "Configuration Needed",
                description: "This payment link has not been configured in the .env.local file.",
                variant: "destructive"
            });
            return;
        }
        setIsLoading(true);
        window.location.href = url;
    };

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
                        You have <strong>{trialDaysLeft} days left</strong>. Choose a plan below to keep your service active.
                    </AlertDescription>
                </Alert>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {pricingTiers.map((tier) => (
                    <PricingCard
                        key={tier.title}
                        title={tier.title}
                        description={tier.description}
                        price={tier.price}
                        frequency={tier.frequency}
                        features={tier.features}
                        cta={tier.cta}
                        onCtaClick={() => handleRedirect(tier.url)}
                        isLoading={isLoading}
                        className={tier.className}
                    />
                ))}
            </div>
            <p className="text-xs text-muted-foreground text-center">
                Note: Pricing on these cards is for display. The actual price is determined by the Stripe Payment Link.
            </p>
        </div>
    );
};

export default SubscriptionManagement;
