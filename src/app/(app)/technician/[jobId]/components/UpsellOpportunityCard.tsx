
"use client";

import React from 'react';
import type { Job } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Lightbulb, DollarSign } from 'lucide-react';

interface UpsellOpportunityCardProps {
    job: Job;
}

const UpsellOpportunityCard: React.FC<UpsellOpportunityCardProps> = ({ job }) => {
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

    return (
        <Card className="bg-amber-50 border-amber-400">
            <CardHeader>
                <CardTitle className="font-headline flex items-center gap-2 text-amber-900">
                    <Lightbulb /> AI Sales Assistant
                </CardTitle>
                <CardDescription className="text-amber-800">
                   Fleety has identified a potential upsell opportunity for this job.
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
            </CardContent>
        </Card>
    );
};

export default UpsellOpportunityCard;
