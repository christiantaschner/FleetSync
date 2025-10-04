
"use client";

import { AuthProvider } from "@/contexts/auth-context";
import { LanguageProvider } from "@/hooks/use-language";
import { APIProvider as GoogleMapsAPIProvider } from '@vis.gl/react-google-maps';
import { Toaster } from "@/components/ui/toaster";

export function AppProviders({ children }: { children: React.ReactNode }) {
  const googleMapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!;
  
  return (
    <GoogleMapsAPIProvider apiKey={googleMapsApiKey} libraries={['places', 'geocoding', 'maps']}>
      <LanguageProvider>
        <AuthProvider>
          {children}
          <Toaster />
        </AuthProvider>
      </LanguageProvider>
    </GoogleMapsAPIProvider>
  );
}
