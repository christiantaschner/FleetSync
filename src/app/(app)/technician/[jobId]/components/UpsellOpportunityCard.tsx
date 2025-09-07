
"use client";

import React, { useState } from 'react';
import type { Job } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Lightbulb, DollarSign, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { logUpsellOutcomeAction } from '@/actions/job-actions';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/auth-context';

interface UpsellOpportunityCardProps {
    job: Job;
    onUpdate: (updatedJob: Partial<Job>) => void;
}

const UpsellOpportunityCard: React.FC<UpsellOpportunityCardProps> = ({ job, onUpdate }) => {
    const { userProfile } = useAuth();
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [soldValue, setSoldValue] = useState<number | undefined>(undefined);
    const [isSoldMode, setIsSoldMode] = useState(false);

    const appId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

    if (!job.upsellReasoning || typeof job.upsellScore !== 'number') {
        return null;
    }

    const getScoreLabel = (score: number) => {
        if (score >= 0.7) return "High";
        if (score >= 0.4) return "Medium";
        return "Low";
    };

    const getBadgeVariant = (score: number) => {
        if (score >= 0.7) return "destructive";
        if (score >= 0.4) return "default";
        return "secondary";
    };

    const handleOutcome = async (outcome: 'sold' | 'declined') => {
        if (!appId || !userProfile?.companyId) return;

        if (outcome === 'sold' && (soldValue === undefined || soldValue <= 0)) {
            toast({ title: "Invalid Value", description: "Please enter a positive value for the upsell.", variant: "destructive" });
            return;
        }

        setIsSubmitting(true);
        const result = await logUpsellOutcomeAction({
            jobId: job.id,
            appId,
            companyId: userProfile.companyId,
            outcome,
            upsellValue: outcome === 'sold' ? soldValue : undefined,
        });

        if (result.error) {
            toast({ title: "Error", description: result.error, variant: "destructive" });
        } else {
            toast({ title: "Success", description: "Upsell outcome has been logged." });
            onUpdate({ upsellOutcome: outcome, upsellValue: outcome === 'sold' ? soldValue : undefined });
            setIsSoldMode(false);
        }
        setIsSubmitting(false);
    };

    const renderContent = () => {
        if (job.upsellOutcome === 'sold') {
            return <p className="text-sm font-semibold text-green-700">Outcome: Sold for ${job.upsellValue?.toFixed(2)}</p>;
        }
        if (job.upsellOutcome === 'declined') {
            return <p className="text-sm font-semibold text-red-700">Outcome: Customer was not interested.</p>;
        }
        if (isSoldMode) {
             return (
                <div className="space-y-2">
                    <Label htmlFor="upsellValue">Value of Upsell ($)</Label>
                    <Input 
                        id="upsellValue" 
                        type="number" 
                        placeholder="e.g., 500"
                        value={soldValue ?? ''}
                        onChange={(e) => setSoldValue(parseFloat(e.target.value))}
                    />
                    <div className="flex gap-2">
                        <Button size="sm" onClick={() => handleOutcome('sold')} disabled={isSubmitting}>
                           {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : null} Confirm Sale
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setIsSoldMode(false)}>Cancel</Button>
                    </div>
                </div>
            )
        }
        return (
            <div className="flex gap-2">
                <Button size="sm" onClick={() => setIsSoldMode(true)} disabled={isSubmitting}>
                    Sold
                </Button>
                <Button size="sm" variant="secondary" onClick={() => handleOutcome('declined')} disabled={isSubmitting}>
                     {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : null} Not Interested
                </Button>
            </div>
        )
    }

    return (
        <Card className="bg-amber-50 border-amber-400">
            <CardHeader>
                <CardTitle className="font-headline flex items-center gap-2 text-amber-900">
                    <Lightbulb /> AI Sales Assistant
                </CardTitle>
                <CardDescription className="text-amber-800">
                   The AI has identified a potential upsell opportunity for this job.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
                 <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm">Potential:</span>
                    <Badge variant={getBadgeVariant(job.upsellScore)}>{getScoreLabel(job.upsellScore)}</Badge>
                </div>
                <div>
                    <h4 className="font-semibold text-sm mb-1 flex items-center gap-1.5"><DollarSign className="h-4 w-4"/>Suggested Talking Point:</h4>
                    <p className="text-sm text-amber-900 bg-amber-100 p-3 rounded-md border border-amber-200">
                        <em>"{job.upsellReasoning}"</em>
                    </p>
                </div>
                <div>
                    <h4 className="font-semibold text-sm mb-2">Log Outcome:</h4>
                    {renderContent()}
                </div>
            </CardContent>
        </Card>
    );
};

export default UpsellOpportunityCard;
