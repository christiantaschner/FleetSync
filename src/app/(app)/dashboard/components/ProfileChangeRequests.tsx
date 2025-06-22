
"use client";

import React, { useState, useEffect } from 'react';
import type { ProfileChangeRequest } from '@/types';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Check, X, Loader2, UserCog, History } from 'lucide-react';
import { approveProfileChangeRequestAction, rejectProfileChangeRequestAction } from '@/actions/fleet-actions';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';

interface ProfileChangeRequestsProps {
  requests: ProfileChangeRequest[];
  onAction: () => void;
}

type EditableRequest = {
  approvedChanges: Record<string, any>;
  reviewNotes: string;
};

const ProfileChangeRequests: React.FC<ProfileChangeRequestsProps> = ({ requests, onAction }) => {
  const { toast } = useToast();
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [editableRequests, setEditableRequests] = useState<Record<string, EditableRequest>>({});

  useEffect(() => {
    // Initialize or update the editable state when requests prop changes
    const initialState: Record<string, EditableRequest> = {};
    for (const request of requests) {
      initialState[request.id] = {
        approvedChanges: { ...request.requestedChanges }, // Start with the requested values
        reviewNotes: '',
      };
    }
    setEditableRequests(initialState);
  }, [requests]);

  const handleFieldChange = (requestId: string, field: string, value: string) => {
    setEditableRequests(prev => ({
      ...prev,
      [requestId]: {
        ...prev[requestId],
        approvedChanges: {
          ...prev[requestId].approvedChanges,
          [field]: value,
        },
      },
    }));
  };

  const handleNotesChange = (requestId: string, value: string) => {
     setEditableRequests(prev => ({
      ...prev,
      [requestId]: {
        ...prev[requestId],
        reviewNotes: value,
      },
    }));
  };

  const handleApprove = async (request: ProfileChangeRequest) => {
    setProcessingId(request.id);
    const { approvedChanges, reviewNotes } = editableRequests[request.id];
    
    const result = await approveProfileChangeRequestAction({
      requestId: request.id,
      technicianId: request.technicianId,
      approvedChanges,
      reviewNotes,
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
    const { reviewNotes } = editableRequests[requestId];

    const result = await rejectProfileChangeRequestAction({ requestId, reviewNotes });
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
          Review, edit, and approve or reject change requests submitted by technicians.
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
                            <h4 className="text-sm font-semibold mb-2">Requested Changes (Editable):</h4>
                            <div className="space-y-3">
                                {Object.entries(request.requestedChanges).map(([key, value]) => (
                                    <div key={key} className="grid grid-cols-3 items-center gap-2">
                                        <Label htmlFor={`${request.id}-${key}`} className="capitalize text-right">
                                            {key}
                                        </Label>
                                        <Input
                                            id={`${request.id}-${key}`}
                                            value={editableRequests[request.id]?.approvedChanges[key] || ''}
                                            onChange={(e) => handleFieldChange(request.id, key, e.target.value)}
                                            className="col-span-2"
                                            disabled={!!processingId}
                                        />
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
                      value={editableRequests[request.id]?.reviewNotes || ''}
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
