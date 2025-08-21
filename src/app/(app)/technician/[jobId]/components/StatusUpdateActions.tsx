
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
                    <Button onClick={() => onUpdateStatus('En Route')} className="w-full" disabled={isUpdating}>
                        <Truck className="mr-2 h-4 w-4" /> Start Travel (En Route)
                    </Button>
                );
            case 'En Route':
                return (
                     <div className="grid grid-cols-2 gap-2 w-full">
                        <Button onClick={() => onUpdateStatus('In Progress')} className="w-full" disabled={isUpdating}>
                            <Play className="mr-2 h-4 w-4" /> Arrived & Start Work
                        </Button>
                         <Button variant="secondary" onClick={() => onUpdateStatus('Assigned')} disabled={isUpdating} title="Reset Status">
                            <Undo2 className="h-4 w-4 mr-2" /> Reset to Assigned
                        </Button>
                    </div>
                );
            case 'In Progress':
                 return (
                    <div className="w-full flex items-center justify-end gap-2">
                        <Button onClick={() => onUpdateStatus('Completed')} className="bg-green-600 hover:bg-green-700">
                            <CheckCircle className="mr-2 h-4 w-4" /> Mark as Completed
                        </Button>
                        <Button variant="secondary" onClick={() => onUpdateStatus('En Route')} disabled={isUpdating} title="Reset to En Route">
                            <Undo2 className="h-4 w-4 mr-2" /> Reset Status
                        </Button>
                        <Button variant="secondary" className="bg-destructive/20 text-destructive-foreground hover:bg-destructive/30" onClick={() => onUpdateStatus('Cancelled')}>
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
