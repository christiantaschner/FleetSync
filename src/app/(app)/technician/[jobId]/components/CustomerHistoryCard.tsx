
"use client";

import React from 'react';
import type { Job } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { History, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';

interface CustomerHistoryCardProps {
    jobs: Job[];
}

const CustomerHistoryCard: React.FC<CustomerHistoryCardProps> = ({ jobs }) => {
    if (jobs.length === 0) {
        return null; // Don't render if there's no history
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="font-headline flex items-center gap-2">
                    <History /> Customer Service History
                </CardTitle>
                <CardDescription>
                    A brief history of past services for this customer.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Accordion type="single" collapsible className="w-full">
                    {jobs.map(job => (
                        <AccordionItem value={job.id} key={job.id}>
                            <AccordionTrigger>
                                <div className="flex justify-between w-full pr-4 items-center">
                                    <span className="font-semibold text-left">{job.title}</span>
                                    <span className="text-sm text-muted-foreground flex items-center gap-1">
                                        <CheckCircle className="h-3.5 w-3.5 text-green-600" />
                                        {job.completedAt ? format(new Date(job.completedAt), 'PP') : 'N/A'}
                                    </span>
                                </div>
                            </AccordionTrigger>
                            <AccordionContent className="space-y-2 p-3 bg-secondary/50 rounded-b-md">
                                <div>
                                    <h4 className="text-xs font-semibold">Description:</h4>
                                    <p className="text-sm text-muted-foreground">{job.description}</p>
                                </div>
                                {job.notes && (
                                     <div>
                                        <h4 className="text-xs font-semibold mt-2">Final Notes:</h4>
                                        <p className="text-sm text-muted-foreground whitespace-pre-wrap italic">"{job.notes}"</p>
                                    </div>
                                )}
                            </AccordionContent>
                        </AccordionItem>
                    ))}
                </Accordion>
            </CardContent>
        </Card>
    );
};

export default CustomerHistoryCard;
