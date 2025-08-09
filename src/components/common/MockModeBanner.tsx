
"use client";

import React from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/auth-context';
import { Bot, Users, ChevronDown, User, Check } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export const MockModeBanner = () => {
  const { isMockMode, setIsMockMode, impersonatedUserId, setImpersonatedUser, mockTechnicians } = useAuth();

  if (!isMockMode) {
    return null;
  }

  const handleRoleChange = (userId: string) => {
    if (userId === 'admin') {
      setImpersonatedUser(null);
    } else {
      setImpersonatedUser(userId);
    }
  };

  return (
    <div className="sticky top-0 z-50">
       <Alert className="border-l-4 border-amber-500 bg-amber-50 rounded-none text-amber-900 [&>svg]:text-amber-600">
        <Bot className="h-4 w-4" />
        <div className="flex flex-col sm:flex-row items-center justify-between w-full flex-wrap gap-4">
            <div className="flex-1 min-w-[200px] text-center sm:text-left">
                 <AlertTitle className="font-semibold">Mock Mode is Active</AlertTitle>
                 <AlertDescription>
                    You are viewing sample data. No changes will be saved.
                 </AlertDescription>
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
                <div className="flex items-center space-x-2 w-full sm:w-auto">
                    <Label htmlFor="role-switcher" className="text-sm font-medium flex-shrink-0">Viewing as:</Label>
                     <Select value={impersonatedUserId || 'admin'} onValueChange={handleRoleChange}>
                        <SelectTrigger className="w-full sm:w-[180px] h-8 bg-white/70">
                            <SelectValue placeholder="Select a role" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="admin"><div className="flex items-center gap-2"><User className="h-4 w-4"/>Admin View</div></SelectItem>
                            {mockTechnicians.map(tech => (
                                <SelectItem key={tech.id} value={tech.id}><div className="flex items-center gap-2"><User className="h-4 w-4"/>{tech.name}</div></SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                 <div className="flex items-center space-x-2 w-full sm:w-auto justify-center">
                    <Switch
                        id="mock-mode-toggle"
                        checked={!isMockMode}
                        onCheckedChange={(checked) => setIsMockMode(!checked)}
                        aria-label="Toggle mock mode"
                    />
                    <Label htmlFor="mock-mode-toggle" className="text-sm font-medium">Live Data</Label>
                </div>
            </div>
        </div>
      </Alert>
    </div>
  );
};
