
"use client";

import React from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/auth-context';
import { Bot } from 'lucide-react';

export const MockModeBanner = () => {
  const { isMockMode, setIsMockMode } = useAuth();

  if (!isMockMode) {
    return null;
  }

  return (
    <div className="sticky top-0 z-50">
       <Alert className="border-l-4 border-amber-500 bg-amber-50 rounded-none text-amber-900 [&>svg]:text-amber-600">
        <Bot className="h-4 w-4" />
        <div className="flex items-center justify-between w-full">
            <div>
                 <AlertTitle className="font-semibold">Mock Mode is Active</AlertTitle>
                 <AlertDescription>
                    You are currently viewing sample data. No changes will be saved.
                 </AlertDescription>
            </div>
             <div className="flex items-center space-x-2">
                <Switch
                    id="mock-mode-toggle"
                    checked={!isMockMode}
                    onCheckedChange={(checked) => setIsMockMode(!checked)}
                    aria-label="Toggle mock mode"
                />
                <Label htmlFor="mock-mode-toggle" className="text-sm font-medium">Live Data</Label>
            </div>
        </div>
      </Alert>
    </div>
  );
};
