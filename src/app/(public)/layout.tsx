
"use client";

import * as React from "react";
import { APIProvider as GoogleMapsAPIProvider } from '@vis.gl/react-google-maps';
import { Toaster } from "@/components/ui/toaster";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  const googleMapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  if (!googleMapsApiKey) {
    return (
        <div className="flex h-screen w-screen items-center justify-center bg-background text-destructive">
            <p>Google Maps API Key is not configured. This page cannot be displayed.</p>
        </div>
    );
  }

  return (
    <GoogleMapsAPIProvider apiKey={googleMapsApiKey} libraries={['maps']}>
        {children}
        <Toaster />
    </GoogleMapsAPIProvider>
  );
}
