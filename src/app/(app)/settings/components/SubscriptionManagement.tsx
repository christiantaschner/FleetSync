
"use client";

import React, { useState } from 'react';
import type { Company, UserProfile } from '@/types';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Sparkles } from 'lucide-react';
import PricingCard from './PricingCard';
import StripePortal from './StripePortal';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { differenceInDays } from 'date-fns';
import { createCheckoutSessionAction } from '@/actions/stripe-actions';
import { loadStripe } from '@stripe/stripe-js';

const starterPriceId = process.env.NEXT_PUBLIC_STRIPE_STARTER_PRICE_ID || '';
const proPriceId = process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID || '';
// Enterprise might have a "Contact Us" link instead of a price ID
const enterpriseContactUrl = process.env.NEXT_PUBLIC_STRIPE_ENTERPRISE_CONTACT_URL || '#';


const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

interface SubscriptionManagementProps {
  company: Company;
}

const SubscriptionManagement: React.FC<SubscriptionManagementProps> = ({ company }) => {
    const { user } = useAuth();
    const { toast } = useToast();
    const [loadingPriceId, setLoadingPriceId] = useState<string | null>(null);
    
    const handleSubscribe = async (priceId: string) => {
        if (!user || !company) {
            toast({ title: "Error", description: "User or company information is missing.", variant: "destructive" });
            return;
        }
        if (!priceId || priceId.includes('YOUR_')) {
             toast({ title: "Configuration Needed", description: "This plan's Price ID has not been configured in the .env.local file.", variant: "destructive"});
            return;
        }

        setLoadingPriceId(priceId);

        const result = await createCheckoutSessionAction({
            companyId: company.id,
            uid: user.uid,
            email: user.email!,
            priceId: priceId,
        });
        
        if ('error' in result) {
            toast({ title: 'Error', description: result.error, variant: 'destructive' });
            setLoadingPriceId(null);
            return;
        }

        const stripe = await stripePromise;
        if (!stripe) {
            toast({ title: 'Stripe Error', description: "Stripe.js has not loaded yet.", variant: 'destructive' });
            setLoadingPriceId(null);
            return;
        }

        const { error } = await stripe.redirectToCheckout({ sessionId: result.sessionId });
        if (error) {
            toast({ title: 'Checkout Error', description: error.message, variant: 'destructive' });
            setLoadingPriceId(null);
        }
    };
    
    const pricingTiers = [
        {
            title: 'Starter',
            price: 'Custom',
            frequency: '/ technician / month',
            description: 'For small teams needing essential dispatching and scheduling.',
            features: ['Up to 5 Technicians', 'Core Dispatching & Scheduling', 'Live Map View', 'Technician Mobile App', 'Basic Reporting'],
            cta: 'Choose Plan',
            priceId: starterPriceId,
        },
        {
            title: 'Professional',
            price: 'Custom',
            frequency: '/ technician / month',
            description: 'Includes core AI features to boost efficiency.',
            features: ['Everything in Starter, plus:', 'AI-Powered Job Allocation', 'AI Route Optimization', 'Recurring Service Contracts', 'Customer Tracking Links'],
            cta: 'Choose Plan',
            priceId: proPriceId,
            className: "border-primary ring-2 ring-primary"
        },
        {
            title: 'Enterprise',
            price: 'Custom',
            frequency: '',
            description: 'For large operations needing advanced analytics and automation.',
            features: ['Everything in Professional, plus:', 'Unlimited Technicians', 'Advanced Analytics & KPIs', 'Proactive Schedule Risk Alerts', 'CO2 Emission Tracking'],
            cta: 'Contact Sales',
            priceId: enterpriseContactUrl, // This is a URL
        }
    ];

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
                        onCtaClick={() => {
                            if (tier.title === 'Enterprise') {
                                window.location.href = tier.priceId;
                            } else {
                                handleSubscribe(tier.priceId);
                            }
                        }}
                        isLoading={loadingPriceId === tier.priceId}
                        className={tier.className}
                    />
                ))}
            </div>
             <p className="text-xs text-muted-foreground text-center">
                Note: The price displayed is a placeholder. The actual price is determined by your Stripe product configuration.
            </p>
        </div>
    );
};

export default SubscriptionManagement;
