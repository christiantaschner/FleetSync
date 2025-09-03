
"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import type { Job, JobStatus } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { updateJobStatusAction } from '@/actions/job-actions';

const GEOFENCE_RADIUS_METERS = 500; // 500 meters to trigger "En Route"
const ARRIVAL_RADIUS_METERS = 50;  // 50 meters to trigger "In Progress"

// Haversine formula to calculate distance between two lat/lng points
const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371e3; // metres
    const φ1 = lat1 * Math.PI/180;
    const φ2 = lat2 * Math.PI/180;
    const Δφ = (lat2-lat1) * Math.PI/180;
    const Δλ = (lon2-lon1) * Math.PI/180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c; // in metres
};


interface GeoFenceWatcherProps {
    appId: string;
    job: Job | null;
    onStatusChange: (jobId: string, newStatus: JobStatus) => void;
}

const GeoFenceWatcher: React.FC<GeoFenceWatcherProps> = ({ appId, job, onStatusChange }) => {
    const { toast } = useToast();
    const watchIdRef = useRef<number | null>(null);

    const handlePositionUpdate = useCallback((position: GeolocationPosition) => {
        if (!job || !job.location.latitude || !job.location.longitude) {
            return;
        }

        const { latitude: techLat, longitude: techLon } = position.coords;
        const { latitude: jobLat, longitude: jobLon } = job.location;
        
        const distance = getDistance(techLat, techLon, jobLat, jobLon);

        if (job.status === 'Assigned' && distance > GEOFENCE_RADIUS_METERS) {
            // This logic can be expanded, e.g., if the user starts moving away from their start point towards the job
            // For now, we'll keep it simple. A more robust implementation might be needed.
        }
        
        if (job.status === 'Assigned' && distance <= GEOFENCE_RADIUS_METERS) {
            console.log(`Geofence triggered for En Route: Job ${job.id}`);
            onStatusChange(job.id, 'En Route');
        } else if (job.status === 'En Route' && distance <= ARRIVAL_RADIUS_METERS) {
            console.log(`Geofence triggered for Arrived: Job ${job.id}`);
            onStatusChange(job.id, 'In Progress');
        }

    }, [job, onStatusChange]);


    useEffect(() => {
        // Only start watching if there's an active, assigned job that isn't already started
        if (job && (job.status === 'Assigned' || job.status === 'En Route')) {
             if (!navigator.geolocation) {
                toast({ title: "Geolocation not supported", description: "Your browser does not support location tracking.", variant: "destructive"});
                return;
            }

            // Clear any existing watcher
            if (watchIdRef.current) {
                navigator.geolocation.clearWatch(watchIdRef.current);
            }

            const watchOptions: PositionOptions = {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0,
            };

            watchIdRef.current = navigator.geolocation.watchPosition(
                handlePositionUpdate,
                (error) => {
                    console.error("Geolocation Error:", error);
                    toast({ title: "Location Error", description: `Could not get location: ${error.message}`, variant: "destructive" });
                },
                watchOptions
            );

        } else {
            // Stop watching if there's no active job or the job is already in progress/completed
            if (watchIdRef.current) {
                navigator.geolocation.clearWatch(watchIdRef.current);
                watchIdRef.current = null;
            }
        }

        // Cleanup function to clear watcher when component unmounts or job changes
        return () => {
            if (watchIdRef.current) {
                navigator.geolocation.clearWatch(watchIdRef.current);
            }
        };

    }, [job, handlePositionUpdate, toast]);

    return null; // This is a headless component
};

export default GeoFenceWatcher;

