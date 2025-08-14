
"use client";

import React, { useEffect, useState } from 'react';
import { Map, AdvancedMarker, useMap, Pin } from '@vis.gl/react-google-maps';
import type { Location } from '@/types';
import { Home, User } from 'lucide-react';

interface TrackingMapProps {
  technicianLocation: Location;
  jobLocation: Location;
}

const TrackingMap: React.FC<TrackingMapProps> = ({ technicianLocation, jobLocation }) => {
  const [center, setCenter] = useState(technicianLocation);
  const map = useMap();

  useEffect(() => {
    setCenter(technicianLocation);
    // Optional: Adjust map bounds to fit both markers
    if (map) {
      const bounds = new window.google.maps.LatLngBounds();
      if(technicianLocation.latitude && technicianLocation.longitude) {
         bounds.extend(new window.google.maps.LatLng(technicianLocation.latitude, technicianLocation.longitude));
      }
      if(jobLocation.latitude && jobLocation.longitude) {
        bounds.extend(new window.google.maps.LatLng(jobLocation.latitude, jobLocation.longitude));
      }
      if(!bounds.isEmpty()){
         map.fitBounds(bounds, 100); // 100px padding
      }
    }
  }, [technicianLocation, jobLocation, map]);


  return (
      <Map
        defaultZoom={12}
        center={{ lat: center.latitude, lng: center.longitude }}
        mapId="customer_tracking_map"
        disableDefaultUI={true}
        gestureHandling={'greedy'}
      >
        <AdvancedMarker 
            position={{ lat: technicianLocation.latitude, lng: technicianLocation.longitude }}
            title="Technician"
        >
            <Pin background={'#4f46e5'} borderColor={'#4338ca'} glyphColor={'#fff'}>
                <User />
            </Pin>
        </AdvancedMarker>
        
        <AdvancedMarker
            position={{ lat: jobLocation.latitude, lng: jobLocation.longitude }}
            title="Your Location"
        >
             <Pin background={'#16a34a'} borderColor={'#15803d'} glyphColor={'#fff'}>
                <Home />
            </Pin>
        </AdvancedMarker>
      </Map>
  );
};

export default TrackingMap;
