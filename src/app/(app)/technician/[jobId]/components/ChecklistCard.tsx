"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { useToast } from "@/hooks/use-toast";
import type { Job, ChecklistResult } from '@/types';
import { Loader2, ListChecks, CheckCircle } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

const PRE_WORK_SAFETY_CHECKLIST: string[] = [
    "Confirmed site access and verified customer contact.",
    "Assessed work area for immediate hazards (e.g., trip hazards, overhead obstructions).",
    "Verified proper Personal Protective Equipment (PPE) is worn (e.g., gloves, safety glasses).",
    "Identified and located main power and water shut-offs for the work area.",
    "Ensured tools and equipment are in good working order."
];

interface ChecklistCardProps {
    job: Job;
    onSubmit: (results: ChecklistResult[]) => Promise<void>;
    isUpdating: boolean;
}

const ChecklistCard: React.FC<ChecklistCardProps> = ({ job, onSubmit, isUpdating }) => {
    const { toast } = useToast();
    const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});

    const isChecklistComplete = job.checklistResults && job.checklistResults.length > 0;
    const allItemsChecked = PRE_WORK_SAFETY_CHECKLIST.every(item => checkedItems[item]);

    const handleCheckChange = (item: string, checked: boolean) => {
        setCheckedItems(prev => ({ ...prev, [item]: checked }));
    };

    const handleSubmit = () => {
        if (!allItemsChecked) {
            toast({
                title: "Incomplete Checklist",
                description: "Please confirm all safety checks before proceeding.",
                variant: "destructive"
            });
            return;
        }

        const results: ChecklistResult[] = PRE_WORK_SAFETY_CHECKLIST.map(item => ({
            item,
            checked: !!checkedItems[item],
        }));
        
        onSubmit(results);
    };

    if (job.status !== 'Assigned' && job.status !== 'En Route') {
        return null;
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="font-headline flex items-center gap-2">
                    <ListChecks /> Pre-Work Safety Checklist
                </CardTitle>
                <CardDescription>
                    {isChecklistComplete 
                        ? "Checklist completed. You are cleared to start the job upon arrival." 
                        : "Please complete this safety checklist before starting work."}
                </CardDescription>
            </CardHeader>
            <CardContent>
                {isChecklistComplete ? (
                     <div className="space-y-2 text-sm text-muted-foreground">
                        {job.checklistResults?.map(result => (
                           <div key={result.item} className="flex items-center gap-2">
                                <CheckCircle className="h-4 w-4 text-green-600" />
                                <span>{result.item}</span>
                           </div>
                        ))}
                    </div>
                ) : (
                    <div className="space-y-4">
                        <ScrollArea className="h-48 rounded-md border p-4">
                            <div className="space-y-3">
                                {PRE_WORK_SAFETY_CHECKLIST.map((item, index) => (
                                    <div key={index} className="flex items-start space-x-2">
                                        <Checkbox
                                            id={`checklist-${index}`}
                                            checked={!!checkedItems[item]}
                                            onCheckedChange={(checked) => handleCheckChange(item, !!checked)}
                                            aria-label={item}
                                        />
                                        <Label htmlFor={`checklist-${index}`} className="font-normal leading-snug">
                                            {item}
                                        </Label>
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>
                        <Button onClick={handleSubmit} disabled={isUpdating || !allItemsChecked}>
                            {isUpdating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle className="mr-2 h-4 w-4" />}
                            Confirm & Save Checklist
                        </Button>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

export default ChecklistCard;
