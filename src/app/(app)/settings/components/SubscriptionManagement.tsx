
"use client";

import React, { useState, useEffect } from 'react';
import type { Company } from '@/types';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Sparkles } from 'lucide-react';
import PricingCard from './PricingCard';
import StripePortal from './StripePortal';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { differenceInDays } from 'date-fns';
import { createCheckoutSessionAction, getStripeProductsAction } from '@/actions/stripe-actions';
import { loadStripe } from '@stripe/stripe-js';
import type { StripeProduct } from '@/types';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

interface SubscriptionManagementProps {
  company: Company;
}

const SubscriptionManagement: React.FC<SubscriptionManagementProps> = ({ company }) => {
    const { user } = useAuth();
    const { toast } = useToast();
    const [loadingPriceId, setLoadingPriceId] = useState<string | null>(null);
    const [products, setProducts] = useState<StripeProduct[]>([]);
    const [isLoadingProducts, setIsLoadingProducts] = useState(true);

     useEffect(() => {
        const fetchProducts = async () => {
            setIsLoadingProducts(true);
            const result = await getStripeProductsAction();
            if (result.error) {
                toast({ title: 'Error', description: `Could not load pricing plans: ${result.error}`, variant: 'destructive' });
            } else if (result.data) {
                setProducts(result.data);
            }
            setIsLoadingProducts(false);
        };

        fetchProducts();
    }, [toast]);
    
    const handleSubscribe = async (priceId: string) => {
        if (!user || !company) {
            toast({ title: "Error", description: "User or company information is missing.", variant: "destructive" });
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
            toast({ title: 'Checkout Error', description: error.message ?? "An unknown error occurred", variant: 'destructive' });
            setLoadingPriceId(null);
        }
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

    if (isLoadingProducts) {
        return (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
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
            
            {products.length === 0 && !isLoadingProducts ? (
                <Alert variant="destructive">
                    <AlertTitle>No Pricing Plans Found</AlertTitle>
                    <AlertDescription>
                        Could not find any active products in your Stripe account. Please ensure you have at least one active Product with a default Price configured.
                    </AlertDescription>
                </Alert>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {products.map((product) => (
                        <PricingCard
                            key={product.id}
                            title={product.name}
                            description={product.description || ''}
                            price={product.price.amount}
                            currency={product.price.currency}
                            interval={product.price.interval}
                            features={product.features || []}
                            cta="Choose Plan"
                            onCtaClick={() => handleSubscribe(product.price.id)}
                            isLoading={loadingPriceId === product.price.id}
                            isPopular={product.name.toLowerCase().includes('professional')}
                        />
                    ))}
                </div>
            )}
             
        </div>
    );
};

export default SubscriptionManagement;

    