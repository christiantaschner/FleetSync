
"use client";

import React from 'react';
import type { JobStatus } from '@/types';
import { Button } from '@/components/ui/button';
import { Truck, Play, CheckCircle, XCircle, Undo2 } from 'lucide-react';

interface StatusUpdateActionsProps {
    currentStatus: JobStatus;
    onUpdateStatus: (newStatus: JobStatus) => void;
}

const StatusUpdateActions: React.FC<StatusUpdateActionsProps> = ({ currentStatus, onUpdateStatus }) => {
    const renderButtons = () => {
        switch (currentStatus) {
            case 'Assigned':
                return (
                    <Button onClick={() => onUpdateStatus('En Route')} className="w-full">
                        <Truck className="mr-2 h-4 w-4" /> Start Travel (En Route)
                    </Button>
                );
            case 'En Route':
                return (
                    <div className="flex w-full gap-2">
                        <Button onClick={() => onUpdateStatus('In Progress')} className="flex-1">
                            <Play className="mr-2 h-4 w-4" /> Arrived & Start Work
                        </Button>
                        <Button variant="outline" onClick={() => onUpdateStatus('Assigned')} title="Reset Status">
                            <Undo2 className="h-4 w-4" />
                        </Button>
                    </div>
                );
            case 'In Progress':
                return (
                    <div className="flex w-full gap-2">
                        <Button onClick={() => onUpdateStatus('Completed')} className="flex-1 bg-green-600 hover:bg-green-700">
                            <CheckCircle className="mr-2 h-4 w-4" /> Mark as Completed
                        </Button>
                         <Button variant="outline" onClick={() => onUpdateStatus('En Route')} title="Reset Status">
                            <Undo2 className="h-4 w-4" />
                        </Button>
                        <Button variant="destructive" onClick={() => onUpdateStatus('Cancelled')}>
                            <XCircle className="mr-2 h-4 w-4" /> Cancel Job
                        </Button>
                    </div>
                );
            default:
                return null;
        }
    };
    
    return <div className="w-full">{renderButtons()}</div>;
};

export default StatusUpdateActions;

