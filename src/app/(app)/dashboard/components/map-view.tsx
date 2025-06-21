
"use client";

import React, { useEffect } from 'react';
import { Map, AdvancedMarker, useMap, useMapsLibrary } from '@vis.gl/react-google-maps';
import type { Job, Technician } from '@/types';
import { User, Briefcase } from 'lucide-react';
import { cn } from '@/lib/utils';

// A separate component to hook into the map context
const TrafficControl = () => {
  const map = useMap();
  const maps = useMapsLibrary('maps');

  useEffect(() => {
    if (!map || !maps) return;

    const trafficLayer = new maps.TrafficLayer();
    trafficLayer.setMap(map);

    // Cleanup function to remove the layer when the component unmounts
    return () => {
      trafficLayer.setMap(null);
    };
  }, [map, maps]);

  return null; // This component doesn't render anything itself
};


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
        <TrafficControl />
      </Map>
    </div>
  );
};

export default MapView;
