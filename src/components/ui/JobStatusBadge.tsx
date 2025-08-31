
"use client";

import React from 'react';
import { Badge } from '@/components/ui/badge';
import type { JobStatus } from '@/types';
import { cn } from '@/lib/utils';
import {
  AlertTriangle,
  CheckCircle,
  Truck,
  Wrench,
  FilePenLine,
  XCircle,
  UserCheck,
  Briefcase,
  DollarSign
} from 'lucide-react';

interface JobStatusBadgeProps {
  status: JobStatus;
  className?: string;
}

const statusConfig: Record<JobStatus, { variant: 'default' | 'destructive' | 'secondary' | 'outline', icon: React.ElementType, className: string }> = {
  Draft: { variant: 'outline', icon: FilePenLine, className: 'bg-gray-100 text-gray-700 border-gray-300' },
  Unassigned: { variant: 'default', icon: AlertTriangle, className: 'bg-amber-100 text-amber-800 border-amber-300' },
  Assigned: { variant: 'default', icon: UserCheck, className: 'bg-sky-100 text-sky-800 border-sky-300' },
  'En Route': { variant: 'default', icon: Truck, className: 'bg-indigo-100 text-indigo-800 border-indigo-300' },
  'In Progress': { variant: 'default', icon: Wrench, className: 'bg-blue-100 text-blue-800 border-blue-300' },
  Completed: { variant: 'secondary', icon: CheckCircle, className: 'bg-green-100 text-green-800 border-green-300' },
  'Pending Invoice': { variant: 'secondary', icon: DollarSign, className: 'bg-purple-100 text-purple-800 border-purple-300' },
  Finished: { variant: 'secondary', icon: CheckCircle, className: 'bg-green-100 text-green-800 border-green-300' },
  Cancelled: { variant: 'destructive', icon: XCircle, className: 'bg-red-100 text-red-800 border-red-300' },
};

export const JobStatusBadge: React.FC<JobStatusBadgeProps> = ({ status, className }) => {
  const config = statusConfig[status] || { variant: 'outline', icon: Briefcase, className: 'bg-gray-100 text-gray-700 border-gray-300' };
  const Icon = config.icon;

  return (
    <Badge variant={config.variant} className={cn("gap-1.5 capitalize", config.className, className)}>
      <Icon className="h-3 w-3" />
      {status}
    </Badge>
  );
};
