"use client";

import React from 'react';
import type { Job } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { History, FileText, Camera, Construction, Eye } from 'lucide-react';
import { format } from 'date-fns';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

interface CustomerHistoryCardProps {
  jobs: Job[];
}

const CustomerHistoryCard: React.FC<CustomerHistoryCardProps> = ({ jobs }) => {
  if (jobs.length === 0) {
    return null; // Don't render anything if there's no history
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline flex items-center gap-2">
          <History /> Customer Service History
        </CardTitle>
        <CardDescription>
          Review of the last {jobs.length} completed job(s) for this customer.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Accordion type="single" collapsible className="w-full">
          {jobs.map(job => (
            <AccordionItem value={job.id} key={job.id}>
              <AccordionTrigger>
                <div className="flex justify-between items-center w-full pr-4">
                    <span className="font-semibold">{job.title}</span>
                    <span className="text-sm text-muted-foreground">{job.completedAt ? format(new Date(job.completedAt), 'PP') : 'N/A'}</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="space-y-4 pt-2">
                 <div>
                    <h4 className="font-semibold text-sm flex items-center gap-2"><FileText className="h-4 w-4"/>Original Description</h4>
                    <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">{job.description}</p>
                 </div>
                 {job.notes && (
                    <div>
                        <h4 className="font-semibold text-sm flex items-center gap-2"><Construction className="h-4 w-4"/>Technician's Notes</h4>
                        <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">{job.notes}</p>
                    </div>
                 )}
                 {job.photos && job.photos.length > 0 && (
                    <div>
                        <h4 className="font-semibold text-sm flex items-center gap-2 mb-2"><Camera className="h-4 w-4"/>Photos</h4>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                            {job.photos.map((photoUrl, index) => (
                                <a href={photoUrl} key={index} target="_blank" rel="noopener noreferrer">
                                    <div className="relative aspect-square rounded-md overflow-hidden border">
                                       <Image src={photoUrl} alt={`Job photo ${index + 1}`} layout="fill" objectFit="cover" />
                                    </div>
                                </a>
                            ))}
                        </div>
                    </div>
                 )}
                 <div className="pt-2">
                    <Link href={`/job/${job.id}`}>
                        <Button variant="outline" size="sm"><Eye className="mr-2 h-4 w-4"/>View Job Details</Button>
                    </Link>
                 </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </CardContent>
    </Card>
  );
};

export default CustomerHistoryCard;
