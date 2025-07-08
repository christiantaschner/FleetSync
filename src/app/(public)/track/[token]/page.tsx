
"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { getTrackingInfoAction } from '@/actions/customer-actions';
import type { PublicTrackingInfo } from '@/types';
import { Loader2, AlertTriangle, User, MapPin, Navigation, Waypoints } from 'lucide-react';
import TrackingMap from './components/TrackingMap';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Logo } from '@/components/common/logo';
import { format } from 'date-fns';

export default function TrackingPage() {
    const params = useParams();
    const searchParams = useSearchParams();
    const token = params.token as string;
    const appId = searchParams.get('appId');
    
    const [trackingInfo, setTrackingInfo] = useState<PublicTrackingInfo | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    
    const fetchTrackingInfo = async (showLoading: boolean = false) => {
        if (showLoading) setIsLoading(true);
        if (!token) {
            setError("No tracking token provided.");
            setIsLoading(false);
            return;
        }
        if (!appId) {
            setError("Tracking link is invalid (missing App ID).");
            setIsLoading(false);
            return;
        }

        const result = await getTrackingInfoAction({ token, appId });
        if (result.error) {
            setError(result.error);
        } else {
            setTrackingInfo(result.data);
            setError(null);
        }
        if(showLoading) setIsLoading(false);
    };

    useEffect(() => {
        fetchTrackingInfo(true); // Initial fetch with loading indicator

        const interval = setInterval(() => {
            fetchTrackingInfo(false); // Subsequent polls without loading indicator
        }, 30000); // Poll every 30 seconds

        return () => clearInterval(interval);
    }, [token, appId]);


    return (
        <main className="min-h-screen bg-muted flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-2xl">
                <div className="flex items-center gap-2 mb-4">
                    <Logo />
                </div>

                <Card className="shadow-2xl">
                    <CardHeader>
                        <CardTitle className="font-headline">Live Service Tracking</CardTitle>
                        <CardDescription>
                            Hello, {trackingInfo?.customerName || 'Valued Customer'}! Here is the live status of your service appointment.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {isLoading && (
                             <div className="flex flex-col items-center justify-center h-96 gap-4">
                                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                                <p className="text-muted-foreground">Loading tracking information...</p>
                            </div>
                        )}
                        {error && !isLoading && (
                            <div className="flex flex-col items-center justify-center h-96 gap-4 text-center">
                                <AlertTriangle className="h-10 w-10 text-destructive" />
                                <p className="font-semibold text-lg text-destructive">Tracking Unavailable</p>
                                <p className="text-muted-foreground">{error}</p>
                            </div>
                        )}
                        {trackingInfo && !error && trackingInfo.currentTechnicianLocation && (
                           <div className="space-y-4">
                               <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                                   <div className="flex items-center gap-2 p-3 bg-background rounded-md border">
                                        <User className="h-5 w-5 text-primary"/>
                                        <div>
                                            <p className="text-muted-foreground text-xs">Technician</p>
                                            <p className="font-semibold">{trackingInfo.technicianName}</p>
                                        </div>
                                   </div>
                                    <div className="flex items-center gap-2 p-3 bg-background rounded-md border">
                                        <Navigation className="h-5 w-5 text-primary"/>
                                        <div>
                                            <p className="text-muted-foreground text-xs">Job Status</p>
                                            <p className="font-semibold">{trackingInfo.jobStatus}</p>
                                        </div>
                                   </div>
                               </div>
                               {trackingInfo.scheduledStartTime && (
                                    <div className="text-center text-sm text-muted-foreground">
                                        Scheduled Appointment Time: <strong>{format(new Date(trackingInfo.scheduledStartTime), 'PPp')}</strong>
                                    </div>
                                )}
                                <div className="h-80 w-full rounded-md overflow-hidden border">
                                    <TrackingMap 
                                        technicianLocation={trackingInfo.currentTechnicianLocation}
                                        jobLocation={trackingInfo.jobLocation}
                                    />
                                </div>
                           </div>
                        )}
                    </CardContent>
                </Card>
                 <footer className="text-center mt-6 text-xs text-muted-foreground">
                    <p>This tracking link is valid for a limited time. Location updates periodically.</p>
                </footer>
            </div>
        </main>
    );
}

    