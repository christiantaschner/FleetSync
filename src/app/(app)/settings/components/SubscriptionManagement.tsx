
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

const pricingPlans = [
    {
        title: "Starter",
        price: 2900, // in cents
        features: [
            "Up to 5 Technicians",
            "Core Dispatching & Scheduling",
            "Live Map View",
            "Technician Mobile App",
            "Basic Reporting"
        ],
        envVar: 'NEXT_PUBLIC_STRIPE_STARTER_PLAN_LINK',
    },
    {
        title: "Professional",
        isPopular: true,
        price: 4900,
        features: [
            "Everything in Starter, plus:",
            "AI-Powered Job Allocation",
            "AI Route Optimization",
            "Recurring Service Contracts",
            "In-App Chat & Photo Sharing",
            "Customer Tracking Links"
        ],
        envVar: 'NEXT_PUBLIC_STRIPE_PROFESSIONAL_PLAN_LINK',
    },
    {
        title: "Enterprise",
        price: null,
        features: [
            "Everything in Professional, plus:",
            "Unlimited Technicians",
            "Advanced Analytics & KPIs",
            "CSV Data Import",
            "Proactive Schedule Risk Alerts",
            "CO2 Emission Tracking"
        ],
        envVar: 'NEXT_PUBLIC_STRIPE_ENTERPRISE_PLAN_LINK',
    }
]

const SubscriptionManagement: React.FC<SubscriptionManagementProps> = ({ company }) => {
    const { toast } = useToast();
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    
    const handleCtaClick = (plan: typeof pricingPlans[number]) => {
        setIsLoading(true);
        const paymentLink = process.env[plan.envVar];

        if (!paymentLink) {
             toast({
                title: 'Configuration Error',
                description: `The payment link for the ${plan.title} plan is not set up. Please contact support.`,
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
                        You have <strong>{trialDaysLeft} days left</strong>. Choose a plan below to keep your service active.
                    </AlertDescription>
                </Alert>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {pricingPlans.map((plan) => (
                    <PricingCard
                        key={plan.title}
                        title={plan.title}
                        description="" // Description can be derived or left empty
                        price={plan.price}
                        currency="EUR"
                        interval="month"
                        features={plan.features}
                        cta={plan.price === null ? "Contact Us" : "Choose Plan"}
                        onCtaClick={() => handleCtaClick(plan)}
                        isLoading={isLoading}
                        isPopular={plan.isPopular}
                    />
                ))}
            </div>
        </div>
    );
};

export default SubscriptionManagement;
