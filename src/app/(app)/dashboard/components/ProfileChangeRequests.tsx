
"use client";

import React, { useState } from 'react';
import type { ProfileChangeRequest } from '@/types';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Check, X, Loader2, UserCog, History, ListChecks } from 'lucide-react';
import { approveProfileChangeRequestAction, rejectProfileChangeRequestAction } from '@/actions/fleet-actions';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';

interface ProfileChangeRequestsProps {
  requests: ProfileChangeRequest[];
  onAction: () => void;
}

const ProfileChangeRequests: React.FC<ProfileChangeRequestsProps> = ({ requests, onAction }) => {
  const { toast } = useToast();
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [reviewNotes, setReviewNotes] = useState<Record<string, string>>({});

  const handleNotesChange = (requestId: string, value: string) => {
     setReviewNotes(prev => ({
      ...prev,
      [requestId]: value,
    }));
  };

  const handleApprove = async (request: ProfileChangeRequest) => {
    setProcessingId(request.id);
    
    const result = await approveProfileChangeRequestAction({
      requestId: request.id,
      technicianId: request.technicianId,
      // Pass the original requested changes for approval
      approvedChanges: request.requestedChanges,
      reviewNotes: reviewNotes[request.id] || '',
    });
    
    if (result.error) {
      toast({ title: 'Error', description: result.error, variant: 'destructive' });
    } else {
      toast({ title: 'Success', description: `Request for ${request.technicianName} approved.` });
      onAction(); // This will trigger a re-fetch in the parent component
    }
    setProcessingId(null);
  };

  const handleReject = async (requestId: string) => {
    setProcessingId(requestId);

    const result = await rejectProfileChangeRequestAction({ 
        requestId, 
        reviewNotes: reviewNotes[requestId] || '' 
    });

    if (result.error) {
      toast({ title: 'Error', description: result.error, variant: 'destructive' });
    } else {
      toast({ title: 'Request Rejected', description: 'The change request has been rejected.' });
      onAction();
    }
    setProcessingId(null);
  };

  if (requests.length === 0) {
    return null; // Don't render anything if there are no pending requests
  }

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="font-headline flex items-center gap-2">
            <UserCog className="h-5 w-5 text-primary"/>
            Pending Profile Change Requests
            <Badge variant="default">{requests.length}</Badge>
        </CardTitle>
        <CardDescription>
          Review and approve or reject change requests submitted by technicians.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Accordion type="multiple" className="w-full">
          {requests.map((request) => (
            <AccordionItem value={request.id} key={request.id}>
              <AccordionTrigger>
                <div className="flex justify-between w-full pr-4">
                  <span className="font-semibold">{request.technicianName}</span>
                  <span className="text-sm text-muted-foreground">
                    <History className="inline h-3.5 w-3.5 mr-1" />
                    Requested: {new Date(request.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-4 p-2 bg-secondary/50 rounded-md">
                    {Object.keys(request.requestedChanges).length > 0 && (
                        <div>
                            <h4 className="text-sm font-semibold mb-2">Requested Changes:</h4>
                            <div className="space-y-3">
                                {Object.entries(request.requestedChanges).map(([key, value]) => (
                                    <div key={key} className="grid grid-cols-3 items-start gap-2">
                                        <Label className="capitalize text-right pt-2">
                                            {key}
                                        </Label>
                                        <div className="col-span-2 bg-background p-2 rounded-md border text-sm font-medium">
                                          {key === 'skills' && Array.isArray(value) ? (
                                              <div className="flex flex-wrap gap-1">
                                                  {value.length > 0 ? value.map(skill => <Badge key={skill} variant="secondary">{skill}</Badge>) : <span className="text-muted-foreground italic">No skills selected</span>}
                                              </div>
                                          ) : (
                                              <span>{String(value)}</span>
                                          )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                  {request.notes && (
                    <div>
                      <h4 className="text-sm font-semibold">Technician's Notes:</h4>
                      <p className="text-sm text-muted-foreground italic bg-background p-2 rounded-md">"{request.notes}"</p>
                    </div>
                  )}
                  <div>
                    <Label htmlFor={`${request.id}-reviewNotes`}>Review Notes (Optional)</Label>
                    <Textarea 
                      id={`${request.id}-reviewNotes`}
                      value={reviewNotes[request.id] || ''}
                      onChange={(e) => handleNotesChange(request.id, e.target.value)}
                      placeholder="Add notes for the technician..."
                      disabled={!!processingId}
                      rows={2}
                    />
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Button
                      size="sm"
                      onClick={() => handleApprove(request)}
                      disabled={!!processingId}
                    >
                      {processingId === request.id ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Check className="mr-2 h-4 w-4" />
                      )}
                      Approve Changes
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleReject(request.id)}
                      disabled={!!processingId}
                    >
                      {processingId === request.id ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <X className="mr-2 h-4 w-4" />
                      )}
                      Reject
                    </Button>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </CardContent>
    </Card>
  );
};

export default ProfileChangeRequests;
