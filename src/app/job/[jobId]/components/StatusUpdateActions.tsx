
"use client";

import React from 'react';
import type { JobStatus } from '@/types';
import { Button } from '@/components/ui/button';
import { Truck, Play, CheckCircle, XCircle } from 'lucide-react';

interface StatusUpdateActionsProps {
    currentStatus: JobStatus;
    onUpdateStatus: (newStatus: JobStatus) => void;
}

const StatusUpdateActions: React.FC<StatusUpdateActionsProps> = ({ currentStatus, onUpdateStatus }) => {
    
    if (currentStatus === 'Assigned') {
        return (
            <Button onClick={() => onUpdateStatus('En Route')}>
                <Truck className="mr-2 h-4 w-4" /> Start Travel (En Route)
            </Button>
        );
    }

    if (currentStatus === 'En Route') {
        return (
            <Button onClick={() => onUpdateStatus('In Progress')}>
                <Play className="mr-2 h-4 w-4" /> Arrived & Start Work
            </Button>
        );
    }
    
    if (currentStatus === 'In Progress') {
        return (
            <>
                <Button onClick={() => onUpdateStatus('Completed')} className="bg-green-600 hover:bg-green-700">
                    <CheckCircle className="mr-2 h-4 w-4" /> Mark as Completed
                </Button>
                <Button variant="destructive" onClick={() => onUpdateStatus('Cancelled')}>
                    <XCircle className="mr-2 h-4 w-4" /> Cancel Job
                </Button>
            </>
        );
    }
    
    return null;
};

export default StatusUpdateActions;
