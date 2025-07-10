
"use client";

import React, { useEffect } from 'react';
import { Map, AdvancedMarker, useMap, useMapsLibrary, Pin } from '@vis.gl/react-google-maps';
import type { Job, Technician, Location } from '@/types';
import { User, Briefcase, Search } from 'lucide-react';
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

const FitBoundsControl = ({ technicians, jobs }: { technicians: Technician[], jobs: Job[] }) => {
  const map = useMap();

  useEffect(() => {
    if (!map || (technicians.length === 0 && jobs.length === 0)) {
      return;
    }

    const bounds = new window.google.maps.LatLngBounds();

    technicians.forEach(tech => {
      if (tech.location.latitude && tech.location.longitude) {
        bounds.extend({ lat: tech.location.latitude, lng: tech.location.longitude });
      }
    });

    jobs.forEach(job => {
      if (job.location.latitude && job.location.longitude) {
        bounds.extend({ lat: job.location.latitude, lng: job.location.longitude });
      }
    });

    if (bounds.isEmpty()) return;

    if (technicians.length + jobs.length > 1) {
      map.fitBounds(bounds, 100);
    } else {
      map.setCenter(bounds.getCenter());
      map.setZoom(12);
    }

  }, [map, technicians, jobs]);

  return null;
};


interface MapViewProps {
  jobs: Job[];
  technicians: Technician[];
  defaultCenter: { lat: number; lng: number };
  defaultZoom: number;
  searchedLocation?: Location | null;
  onJobClick: (job: Job) => void;
  onTechnicianClick: (technician: Technician) => void;
}

const MapView: React.FC<MapViewProps> = ({ 
  jobs, 
  technicians, 
  defaultCenter, 
  defaultZoom, 
  searchedLocation,
  onJobClick,
  onTechnicianClick
}) => {
  const map = useMap();
  const activeJobs = jobs.filter(job => job.status !== 'Completed' && job.status !== 'Cancelled');
  
  useEffect(() => {
    if (map && searchedLocation) {
        map.panTo({ lat: searchedLocation.latitude, lng: searchedLocation.longitude });
        map.setZoom(15);
    }
  }, [map, searchedLocation]);

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
            onClick={() => onTechnicianClick(tech)}
          >
            <div className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center border-2 border-white shadow-md cursor-pointer",
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
              onClick={() => onJobClick(job)}
           >
             <div className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center border-2 border-white shadow-md cursor-pointer",
                  job.priority === 'High' ? 'bg-destructive' : job.priority === 'Medium' ? 'bg-primary' : 'bg-yellow-500'
              )}>
              <Briefcase className="h-4 w-4 text-white" />
            </div>
          </AdvancedMarker>
        ))}

        {searchedLocation && (
           <AdvancedMarker 
              key="searched-location"
              position={{ lat: searchedLocation.latitude, lng: searchedLocation.longitude }}
              title={searchedLocation.address}
           >
             <Pin background={'#fbbf24'} borderColor={'#f59e0b'} glyphColor={'#fff'}>
                <Search />
             </Pin>
          </AdvancedMarker>
        )}

        <TrafficControl />
        {!searchedLocation && <FitBoundsControl technicians={technicians} jobs={activeJobs} />}
      </Map>
    </div>
  );
};

export default MapView;
