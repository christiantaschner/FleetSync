
"use client";

import React, { useMemo } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import type { EventInput } from '@fullcalendar/core';
import type { Job, Technician, JobPriority } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

interface ScheduleCalendarViewProps {
  jobs: Job[];
  technicians: Technician[];
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

const ScheduleCalendarView: React.FC<ScheduleCalendarViewProps> = ({ jobs, technicians }) => {
    const events = useMemo(() => {
        return jobs.map((job): EventInput => {
            const tech = technicians.find(t => t.id === job.assignedTechnicianId);
            const title = `${tech ? `[${tech.name.split(' ')[0]}] ` : ''}${job.title}`;

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
                    technicianName: tech?.name || 'Unassigned',
                    jobStatus: job.status,
                    jobDescription: job.description
                },
            };
        });
    }, [jobs, technicians]);

  return (
    <Card>
        <CardHeader>
            <CardTitle className="font-headline">Schedule Calendar</CardTitle>
            <CardDescription>
                Visual overview of all jobs. Click a job for details. (Drag & drop coming soon!)
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
                    editable={false} // Will be true when we implement drag-and-drop
                    selectable={true}
                    selectMirror={true}
                    dayMaxEvents={true}
                    weekends={true}
                    height="70vh"
                    eventContent={(eventInfo) => (
                        <div className="p-1">
                            <b>{eventInfo.timeText}</b>
                            <p className="whitespace-normal text-xs">{eventInfo.event.title}</p>
                        </div>
                    )}
                    // Add more configuration as needed
                />
            </div>
        </CardContent>
    </Card>
  );
};

export default ScheduleCalendarView;
