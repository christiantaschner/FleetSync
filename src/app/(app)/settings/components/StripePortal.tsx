
"use client";

import React, { useState, useEffect } from 'react';
import { createPortalSessionAction } from '@/actions/stripe-actions';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import type { Company } from '@/types';

interface StripePortalProps {
    company: Company;
}

const StripePortal: React.FC<StripePortalProps> = ({ company }) => {
    const [portalUrl, setPortalUrl] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { toast } = useToast();

    useEffect(() => {
        const getPortalUrl = async () => {
            setIsLoading(true);
            setError(null);
            const result = await createPortalSessionAction({ companyId: company.id });

            if ('error' in result) {
                setError(result.error);
                toast({ title: 'Error', description: `Could not load billing portal: ${result.error}`, variant: 'destructive' });
            } else {
                setPortalUrl(result.url);
            }
            setIsLoading(false);
        };

        if (company.stripeCustomerId) {
            getPortalUrl();
        } else {
            // This case should be handled by the parent component, but as a fallback:
            setError("No billing information found for this company. Please choose a plan to start.");
            setIsLoading(false);
        }
    }, [company.id, company.stripeCustomerId, toast]);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-96">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-2">Loading billing portal...</span>
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center text-destructive p-4 border border-destructive/50 rounded-md">
                <p>{error}</p>
            </div>
        );
    }
    
    if (!portalUrl) {
         return (
            <div className="text-center text-muted-foreground p-4 border rounded-md">
                <p>Could not load the billing portal.</p>
            </div>
        );
    }

    return (
        <iframe
            src={portalUrl}
            className="w-full h-[80vh] border-0 rounded-md"
            title="Stripe Billing Portal"
        />
    );
};

export default StripePortal;
