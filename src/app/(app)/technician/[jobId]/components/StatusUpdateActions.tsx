
"use client";

import React from 'react';
import type { JobStatus } from '@/types';
import { Button } from '@/components/ui/button';
import { Truck, Play, CheckCircle, XCircle, Undo2 } from 'lucide-react';

interface StatusUpdateActionsProps {
    currentStatus: JobStatus;
    onUpdateStatus: (newStatus: JobStatus) => void;
    isUpdating: boolean;
}

const StatusUpdateActions: React.FC<StatusUpdateActionsProps> = ({ currentStatus, onUpdateStatus, isUpdating }) => {
    const renderButtons = () => {
        switch (currentStatus) {
            case 'Assigned':
                return (
                    <Button onClick={() => onUpdateStatus('En Route')} className="w-full sm:w-auto" disabled={isUpdating}>
                        <Truck className="mr-2 h-4 w-4" /> Start Travel (En Route)
                    </Button>
                );
            case 'En Route':
                return (
                     <div className="flex flex-wrap gap-2 w-full justify-end">
                        <Button variant="secondary" onClick={() => onUpdateStatus('Assigned')} disabled={isUpdating} title="Reset Status">
                            <Undo2 className="h-4 w-4 mr-2" /> Reset to Assigned
                        </Button>
                        <Button onClick={() => onUpdateStatus('In Progress')} className="flex-grow sm:flex-grow-0" disabled={isUpdating}>
                            <Play className="mr-2 h-4 w-4" /> Arrived & Start Work
                        </Button>
                    </div>
                );
            case 'In Progress':
                 return (
                    <div className="flex flex-wrap gap-2 w-full justify-end">
                        <Button variant="secondary" onClick={() => onUpdateStatus('En Route')} disabled={isUpdating} title="Reset to En Route">
                            <Undo2 className="h-4 w-4 mr-2" /> Reset Status
                        </Button>
                        <Button variant="destructive" className="bg-destructive/80" onClick={() => onUpdateStatus('Cancelled')}>
                            <XCircle className="mr-2 h-4 w-4" /> Cancel Job
                        </Button>
                    </div>
                );
            default:
                return null;
        }
    };
    
    return <div className="w-full flex justify-end">{renderButtons()}</div>;
};

export default StatusUpdateActions;
