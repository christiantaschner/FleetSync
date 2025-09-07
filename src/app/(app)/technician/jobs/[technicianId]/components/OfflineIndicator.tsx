
"use client";

import React, { useState, useEffect } from 'react';
import { WifiOff } from 'lucide-react';
import { cn } from '@/lib/utils';

export const OfflineIndicator = () => {
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    // Set initial status
    if (typeof window.navigator.onLine !== 'undefined') {
        setIsOffline(!window.navigator.onLine);
    }

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!isOffline) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 animate-in fade-in-50">
      <div className="flex items-center gap-2 rounded-full border bg-destructive px-3 py-2 text-xs font-semibold text-destructive-foreground shadow-lg">
        <WifiOff className="h-4 w-4" />
        <span>Offline Mode</span>
      </div>
    </div>
  );
};
