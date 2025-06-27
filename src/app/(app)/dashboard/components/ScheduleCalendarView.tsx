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

const ScheduleCalendarView: React.FC<ScheduleCalendarViewProps> = ({ jobs, technicians, onScheduleChange }) => {
    const [rescheduleData, setRescheduleData] = React.useState<EventDropArg | null>(null);

    const events = React.useMemo(() => {
        return jobs
          .filter(job => job.status !== 'Pending' && job.status !== 'Cancelled')
          .map((job): EventInput => {
            const tech = technicians.find(t => t.id === job.assignedTechnicianId);
            const title = `${tech ? `[${tech.name.split(' ')[0]}] ` : '[Unassigned] '}${job.title}`;
            const durationMinutes = job.estimatedDurationMinutes || 60;
            const startDate = job.scheduledTime ? new Date(job.scheduledTime) : new Date(job.createdAt);
            const endDate = new Date(startDate.getTime() + durationMinutes * 60000);
            
            let eventClassNames: string[] = [];
            switch (job.priority) {
                case 'High':
                    eventClassNames.push('fc-event-destructive');
                    break;
                case 'Medium':
                    eventClassNames.push('fc-event-primary');
                    break;
                case 'Low':
                default:
                    eventClassNames.push('fc-event-secondary');
                    break;
            }

            return {
                id: job.id,
                title: title,
                start: startDate,
                end: endDate,
                classNames: eventClassNames,
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
                        <div className="p-1.5 overflow-hidden">
                            <b className="font-semibold">{eventInfo.timeText}</b>
                            <p className="text-xs">{eventInfo.event.title}</p>
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
