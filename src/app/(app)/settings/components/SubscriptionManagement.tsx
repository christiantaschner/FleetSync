
"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';
import type { Company, StripeProduct } from '@/types';
import { createCheckoutSessionAction, getProductsAndPricesAction } from '@/actions/stripe-actions';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Sparkles } from 'lucide-react';
import { loadStripe } from '@stripe/stripe-js';
import PricingCard from './PricingCard';
import StripePortal from './StripePortal';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { differenceInDays } from 'date-fns';

interface SubscriptionManagementProps {
  company: Company;
}

const SubscriptionManagement: React.FC<SubscriptionManagementProps> = ({ company }) => {
    const { user } = useAuth();
    const { toast } = useToast();
    const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
    const [products, setProducts] = useState<StripeProduct[]>([]);
    const [productsLoading, setProductsLoading] = useState(true);

    const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

    useEffect(() => {
        const fetchProducts = async () => {
            setProductsLoading(true);
            const result = await getProductsAndPricesAction();
            if (result.error) {
                toast({ title: 'Error fetching plans', description: result.error, variant: 'destructive' });
            } else if (result.data) {
                setProducts(result.data);
            }
            setProductsLoading(false);
        };

        if (company.subscriptionStatus !== 'active') {
            fetchProducts();
        } else {
            setProductsLoading(false);
        }
    }, [company.subscriptionStatus, toast]);

    const handleSubscribe = async (priceId: string) => {
        if (!user || !user.email) {
            toast({ title: 'Error', description: 'You must be logged in to subscribe.', variant: 'destructive' });
            return;
        }

        if (priceId === 'contact_sales') {
            // In a real app, this would open a contact form or mailto link.
            toast({ title: "Contact Sales", description: "Please get in touch with our sales team to discuss Enterprise options."});
            return;
        }

        setCheckoutLoading(priceId);

        const result = await createCheckoutSessionAction({
            companyId: company.id,
            uid: user.uid,
            email: user.email,
            priceId,
        });

        if ('error' in result) {
            toast({ title: 'Error', description: result.error, variant: 'destructive' });
            setCheckoutLoading(null);
            return;
        }

        const stripe = await stripePromise;
        if (!stripe) {
            toast({ title: 'Error', description: 'Stripe.js has not loaded yet.', variant: 'destructive' });
            setCheckoutLoading(null);
            return;
        }
        
        await stripe.redirectToCheckout({ sessionId: result.sessionId });
        setCheckoutLoading(null);
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
    
    const formatPrice = (price: StripeProduct['price']) => {
        if (price.amount === null || typeof price.amount === 'undefined') {
            return "Custom";
        }
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: price.currency,
        }).format(price.amount / 100);
    };

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
            
            {productsLoading ? (
                <div className="flex items-center justify-center p-10">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {products.map((product) => (
                        <PricingCard
                            key={product.id}
                            title={product.name}
                            description={product.description || ''}
                            price={formatPrice(product.price)}
                            frequency={product.price.interval ? `/ per ${product.price.interval}` : ''}
                            features={product.features || []}
                            cta={product.price.amount === null ? 'Contact Sales' : 'Choose Plan'}
                            onCtaClick={() => handleSubscribe(product.price.id || 'contact_sales')}
                            isLoading={checkoutLoading === product.price.id}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export default SubscriptionManagement;
