
"use client";

import React from 'react';
import { APIProvider, Map, AdvancedMarker, Pin } from '@vis.gl/react-google-maps';
import type { Job, Technician } from '@/types';
import { User, Briefcase, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MapViewProps {
  jobs: Job[];
  technicians: Technician[];
  apiKey: string | undefined; // API key can be undefined if not set
  defaultCenter: { lat: number; lng: number };
  defaultZoom: number;
}

const MapView: React.FC<MapViewProps> = ({ jobs, technicians, apiKey, defaultCenter, defaultZoom }) => {
  if (!apiKey) {
    return (
      <div className="aspect-[16/9] bg-muted rounded-md flex flex-col items-center justify-center relative p-4 text-center">
        <MapPin className="h-16 w-16 text-primary opacity-50 mb-4" />
        <p className="font-semibold">Google Maps API Key Missing</p>
        <p className="text-sm text-muted-foreground">
          Please add your <code className="bg-secondary px-1 py-0.5 rounded">NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code> to the <code className="bg-secondary px-1 py-0.5 rounded">.env</code> file in your project root.
        </p>
         <p className="text-xs text-muted-foreground mt-2">
          You can obtain a key from the Google Cloud Console and ensure the "Maps JavaScript API" is enabled.
        </p>
      </div>
    );
  }

  const activeJobs = jobs.filter(job => job.status !== 'Completed' && job.status !== 'Cancelled');

  return (
    <APIProvider apiKey={apiKey} libraries={['places']}>
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
    </APIProvider>
  );
};

export default MapView;

