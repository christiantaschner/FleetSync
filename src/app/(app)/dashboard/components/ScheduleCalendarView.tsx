
"use client";

import React from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import type { EventInput, EventDropArg } from '@fullcalendar/core';
import type { Job, Technician, JobPriority } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import RescheduleDialog from './RescheduleDialog';

interface ScheduleCalendarViewProps {
  jobs: Job[];
  technicians: Technician[];
  onScheduleChange: () => void;
}

const getPriorityColor = (priority: JobPriority): string => {
    switch (priority) {
        case 'High':
            return 'hsl(var(--destructive))';
        case 'Medium':
            return 'hsl(var(--primary))';
        case 'Low':
            return 'hsl(var(--chart-2))';
        default:
            return 'hsl(var(--secondary-foreground))';
    }
}

const ScheduleCalendarView: React.FC<ScheduleCalendarViewProps> = ({ jobs, technicians, onScheduleChange }) => {
    const [rescheduleData, setRescheduleData] = React.useState<EventDropArg | null>(null);

    const events = React.useMemo(() => {
        return jobs
          .filter(job => job.status !== 'Pending' && job.status !== 'Cancelled') // Only show scheduled jobs
          .map((job): EventInput => {
            const tech = technicians.find(t => t.id === job.assignedTechnicianId);
            const title = `${tech ? `[${tech.name.split(' ')[0]}] ` : '[Unassigned] '}${job.title}`;

            // Set default duration if not specified
            const durationMinutes = job.estimatedDurationMinutes || 60;
            const startDate = job.scheduledTime ? new Date(job.scheduledTime) : new Date(job.createdAt);
            const endDate = new Date(startDate.getTime() + durationMinutes * 60000);
            
            return {
                id: job.id,
                title: title,
                start: startDate,
                end: endDate,
                backgroundColor: getPriorityColor(job.priority),
                borderColor: getPriorityColor(job.priority),
                extendedProps: {
                    technicianId: tech?.id,
                    jobStatus: job.status,
                    jobDescription: job.description
                },
                editable: job.status === 'Assigned' || job.status === 'En Route',
            };
        });
    }, [jobs, technicians]);

  const handleEventDrop = (dropInfo: EventDropArg) => {
    // We don't revert immediately; we open a dialog to confirm the change.
    setRescheduleData(dropInfo);
  };

  const handleDialogClose = (reverted: boolean) => {
    if (reverted && rescheduleData) {
        rescheduleData.revert();
    }
    setRescheduleData(null);
  };

  return (
    <>
    <Card>
        <CardHeader>
            <CardTitle className="font-headline">Schedule Calendar</CardTitle>
            <CardDescription>
                Visual overview of all jobs. Drag and drop a job to reschedule and re-optimize the technician's route.
            </CardDescription>
        </CardHeader>
        <CardContent>
            <div className="fc-theme">
                <FullCalendar
                    plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                    initialView="timeGridWeek"
                    headerToolbar={{
                        left: 'prev,next today',
                        center: 'title',
                        right: 'dayGridMonth,timeGridWeek,timeGridDay'
                    }}
                    events={events}
                    editable={true} 
                    selectable={true}
                    selectMirror={true}
                    dayMaxEvents={true}
                    weekends={true}
                    height="70vh"
                    eventDrop={handleEventDrop}
                    eventContent={(eventInfo) => (
                        <div className="p-1">
                            <b>{eventInfo.timeText}</b>
                            <p className="whitespace-normal text-xs">{eventInfo.event.title}</p>
                        </div>
                    )}
                />
            </div>
        </CardContent>
    </Card>
    {rescheduleData && (
        <RescheduleDialog
            isOpen={!!rescheduleData}
            onClose={handleDialogClose}
            dropInfo={rescheduleData}
            jobs={jobs}
            technicians={technicians}
            onRescheduleConfirmed={onScheduleChange}
        />
    )}
    </>
  );
};

export default ScheduleCalendarView;
