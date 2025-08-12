
"use client";

import React, { useState, useEffect } from 'react';
import type { Job, ChecklistResult } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Loader2, ShieldCheck } from 'lucide-react';

const PRE_WORK_CHECKLIST_ITEMS = [
    "Confirmed job location and scope with dispatch.",
    "Verified all required parts and tools are in the vehicle.",
    "Personal Protective Equipment (PPE) is on and in good condition.",
    "Work area is clear of hazards and safe to enter.",
    "Informed customer of my arrival.",
];

interface ChecklistCardProps {
    job: Job;
    onSubmit: (results: ChecklistResult[]) => void;
    isUpdating: boolean;
}

const ChecklistCard: React.FC<ChecklistCardProps> = ({ job, onSubmit, isUpdating }) => {
    const [checklist, setChecklist] = useState<ChecklistResult[]>([]);
    
    const isChecklistComplete = job.checklistResults && job.checklistResults.every(item => item.checked);

    useEffect(() => {
        const initialChecklist = PRE_WORK_CHECKLIST_ITEMS.map(item => {
            const existingResult = job.checklistResults?.find(r => r.item === item);
            return existingResult || { item, checked: false };
        });
        setChecklist(initialChecklist);
    }, [job.checklistResults]);


    const handleCheckChange = (item: string, checked: boolean) => {
        setChecklist(prev =>
            prev.map(check => (check.item === item ? { ...check, checked } : check))
        );
    };

    const allChecked = checklist.every(item => item.checked);

    if (isChecklistComplete) {
        return (
            <Card className="bg-green-50 border-green-200">
                <CardHeader>
                    <CardTitle className="font-headline flex items-center gap-2 text-green-800">
                        <ShieldCheck /> Pre-Work Safety Checklist
                    </CardTitle>
                    <CardDescription className="text-green-700">This checklist was completed before starting the job.</CardDescription>
                </CardHeader>
            </Card>
        );
    }
    
    if (job.status !== 'Assigned' && job.status !== 'En Route') {
        return null; // Only show for these statuses if not complete
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="font-headline flex items-center gap-2">
                    <ShieldCheck /> Pre-Work Safety Checklist
                </CardTitle>
                <CardDescription>
                    Confirm these items before changing status to "In Progress".
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-3">
                    {checklist.map(({ item, checked }) => (
                        <div key={item} className="flex items-center space-x-2">
                            <Checkbox
                                id={item}
                                checked={checked}
                                onCheckedChange={(isChecked) => handleCheckChange(item, !!isChecked)}
                            />
                            <Label htmlFor={item} className="font-normal">{item}</Label>
                        </div>
                    ))}
                    <Button onClick={() => onSubmit(checklist)} disabled={!allChecked || isUpdating} className="mt-4">
                        {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Confirm Checklist
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
};

export default ChecklistCard;

    