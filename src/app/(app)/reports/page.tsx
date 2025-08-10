
"use client";

import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';
import { MockModeBanner } from '@/components/common/MockModeBanner';

const ReportClientView = dynamic(() => import('./components/ReportClientView'), {
  ssr: false,
  loading: () => (
    <div className="flex h-[50vh] w-full items-center justify-center">
      <Loader2 className="h-10 w-10 animate-spin text-primary" />
    </div>
  ),
});

export default function ReportsPage() {
  return <ReportClientView />;
}
