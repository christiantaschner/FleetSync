
"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import type { JobStatus } from '@/types';
import { Play, CheckCircle, XCircle, Truck, AlertOctagon } from 'lucide-react';

interface StatusUpdateActionsProps {
  currentStatus: JobStatus;
  onUpdateStatus: (newStatus: JobStatus) => void;
}

const StatusUpdateActions: React.FC<StatusUpdateActionsProps> = ({ currentStatus, onUpdateStatus }) => {
  const availableActions: { label: string; status: JobStatus; icon: React.ElementType, variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link" | null | undefined }[] = [];

  switch (currentStatus) {
    case 'Assigned':
      availableActions.push({ label: 'Start Travel (En Route)', status: 'En Route', icon: Truck, variant: "default" });
      break;
    case 'En Route':
      availableActions.push({ label: 'Arrived &amp; Start Job', status: 'In Progress', icon: Play, variant: "default" });
      break;
    case 'In Progress':
      availableActions.push({ label: 'Complete Job', status: 'Completed', icon: CheckCircle, variant: "default" });
      break;
    default:
      // No direct actions for Pending, Completed, Cancelled from this simplified interface
      break;
  }

  // Add a cancel option if not completed or already cancelled
  if (currentStatus !== 'Completed' && currentStatus !== 'Cancelled') {
     availableActions.push({ label: 'Cancel Job', status: 'Cancelled', icon: XCircle, variant: 'destructive' });
  }

  if (availableActions.length === 0) {
    return <p className="text-sm text-muted-foreground">No further actions available for status: {currentStatus}.</p>;
  }

  return (
    <div className="space-y-3 sm:space-y-0 sm:flex sm:flex-wrap sm:gap-3">
      {availableActions.map(action => (
        <Button
          key={action.status}
          onClick={() => onUpdateStatus(action.status)}
          variant={action.variant || "outline"}
          className="w-full sm:w-auto"
        >
          <action.icon className="mr-2 h-4 w-4" />
          {action.label}
        </Button>
      ))}
    </div>
  );
};

export default StatusUpdateActions;
