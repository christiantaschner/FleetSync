
"use client";

import React from 'react';
import { Map, AdvancedMarker } from '@vis.gl/react-google-maps'; // Removed Pin as it's not used
import type { Job, Technician } from '@/types';
import { User, Briefcase } from 'lucide-react'; // Removed MapPin as it's not used
import { cn } from '@/lib/utils';

interface MapViewProps {
  jobs: Job[];
  technicians: Technician[];
  defaultCenter: { lat: number; lng: number };
  defaultZoom: number;
}

const MapView: React.FC<MapViewProps> = ({ jobs, technicians, defaultCenter, defaultZoom }) => {
  const activeJobs = jobs.filter(job => job.status !== 'Completed' && job.status !== 'Cancelled');

  return (
    <div style={{ height: '450px', width: '100%' }} className="rounded-md overflow-hidden border">
      <Map 
          defaultCenter={defaultCenter} 
          defaultZoom={defaultZoom} 
          mapId="fleetsync_ai_map"
          gestureHandling={'greedy'}
          disableDefaultUI={true}
      >
        {technicians.map(tech => (
          <AdvancedMarker 
            key={`tech-${tech.id}`} 
            position={{ lat: tech.location.latitude, lng: tech.location.longitude }} 
            title={`${tech.name} (${tech.isAvailable ? 'Available' : 'Unavailable'})`}
          >
            <div className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center border-2 border-white shadow-md",
              tech.isAvailable ? 'bg-green-500' : 'bg-red-500'
            )}>
              <User className="h-4 w-4 text-white" />
            </div>
          </AdvancedMarker>
        ))}

        {activeJobs.map(job => (
           <AdvancedMarker 
              key={`job-${job.id}`} 
              position={{ lat: job.location.latitude, lng: job.location.longitude }} 
              title={`${job.title} (${job.priority} Priority)`}
           >
             <div className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center border-2 border-white shadow-md",
                  job.priority === 'High' ? 'bg-destructive' : job.priority === 'Medium' ? 'bg-primary' : 'bg-yellow-500'
              )}>
              <Briefcase className="h-4 w-4 text-white" />
            </div>
          </AdvancedMarker>
        ))}
      </Map>
    </div>
  );
};

export default MapView;
