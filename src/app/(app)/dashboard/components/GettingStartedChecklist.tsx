
"use client";

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, UserPlus, PlusCircle, CalendarDays, Rocket, Star, X, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';

interface GettingStartedChecklistProps {
  onOpenAddJobDialog: () => void;
  onSeedData: () => void;
  onSwitchToScheduleTab: () => void;
  onDismiss: () => void;
  isLoading: boolean;
}

const GettingStartedChecklist: React.FC<GettingStartedChecklistProps> = ({
  onOpenAddJobDialog,
  onSeedData,
  onSwitchToScheduleTab,
  onDismiss,
  isLoading
}) => {
  const router = useRouter();

  const checklistItems = [
    {
      label: 'Add your first Technician',
      onClick: () => router.push('/settings?tab=users'),
      icon: UserPlus,
    },
    {
      label: 'Create your first Job',
      onClick: onOpenAddJobDialog,
      icon: PlusCircle,
    },
    {
      label: 'Explore the Schedule',
      onClick: onSwitchToScheduleTab,
      icon: CalendarDays,
    },
  ];

  return (
    <Card className="mb-6 border-primary/20 bg-primary/5 shadow-lg animate-in fade-in-50">
      <CardHeader>
        <div className="flex justify-between items-start">
            <div>
                <CardTitle className="font-headline text-primary flex items-center gap-2">
                    <Rocket /> Welcome to FleetSync AI!
                </CardTitle>
                <CardDescription className="text-primary/80">
                    Let's get you started. Here are a few steps to get your fleet up and running.
                </CardDescription>
            </div>
            <Button variant="ghost" size="icon" className="h-7 w-7 text-primary/70 hover:bg-primary/10" onClick={onDismiss}>
                <X className="h-4 w-4" />
                <span className="sr-only">Dismiss</span>
            </Button>
        </div>
      </CardHeader>
      <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-3">
          {checklistItems.map((item, index) => (
            <Button
              key={index}
              variant="outline"
              className="w-full justify-start gap-3 h-12 text-base"
              onClick={item.onClick}
            >
              <item.icon className="h-5 w-5 text-primary" />
              <span>{item.label}</span>
            </Button>
          ))}
        </div>
        <div className="flex flex-col items-center justify-center p-4 bg-secondary/50 rounded-lg border border-dashed">
            <h4 className="font-semibold flex items-center gap-2"><Star className="h-5 w-5 text-amber-500" /> Want to see it in action?</h4>
            <p className="text-sm text-muted-foreground mt-1 mb-3 text-center">Generate sample jobs and technicians to explore all features immediately.</p>
            <Button variant="accent" onClick={onSeedData} disabled={isLoading}>
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Check className="mr-2 h-4 w-4" />}
              Generate Sample Data
            </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default GettingStartedChecklist;
