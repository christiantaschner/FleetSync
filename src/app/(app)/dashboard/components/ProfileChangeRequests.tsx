
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Check, X, Loader2, UserCog, History } from 'lucide-react';
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

  const handleApprove = async (request: ProfileChangeRequest) => {
    setProcessingId(request.id);
    const result = await approveProfileChangeRequestAction({
      requestId: request.id,
      technicianId: request.technicianId,
      requestedChanges: request.requestedChanges,
    });
    if (result.error) {
      toast({ title: 'Error', description: result.error, variant: 'destructive' });
    } else {
      toast({ title: 'Success', description: `Request for ${request.technicianName} approved.` });
      onAction();
    }
    setProcessingId(null);
  };

  const handleReject = async (requestId: string) => {
    setProcessingId(requestId);
    const result = await rejectProfileChangeRequestAction({ requestId });
    if (result.error) {
      toast({ title: 'Error', description: result.error, variant: 'destructive' });
    } else {
      toast({ title: 'Request Rejected', description: 'The change request has been rejected.' });
      onAction();
    }
    setProcessingId(null);
  };

  const pendingRequests = requests.filter(r => r.status === 'pending');

  if (pendingRequests.length === 0) {
    return null; // Don't render anything if there are no pending requests
  }

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="font-headline flex items-center gap-2">
            <UserCog className="h-5 w-5 text-primary"/>
            Pending Profile Change Requests
            <Badge variant="default">{pendingRequests.length}</Badge>
        </CardTitle>
        <CardDescription>
          Review and approve or reject change requests submitted by technicians.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Accordion type="multiple" className="w-full">
          {pendingRequests.map((request) => (
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
                <div className="space-y-3 p-2 bg-secondary/50 rounded-md">
                    {Object.keys(request.requestedChanges).length > 0 && (
                        <div>
                            <h4 className="text-sm font-semibold">Requested Changes:</h4>
                            <ul className="list-disc pl-5 text-sm text-muted-foreground">
                            {Object.entries(request.requestedChanges).map(([key, value]) => (
                                <li key={key}>
                                <strong>{key.charAt(0).toUpperCase() + key.slice(1)}:</strong> {String(value)}
                                </li>
                            ))}
                            </ul>
                        </div>
                    )}
                  {request.notes && (
                    <div>
                      <h4 className="text-sm font-semibold">Technician's Notes:</h4>
                      <p className="text-sm text-muted-foreground italic">"{request.notes}"</p>
                    </div>
                  )}
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
                      Approve
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
