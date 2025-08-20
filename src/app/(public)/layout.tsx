
"use client";

import * as React from "react";
import { Toaster } from "@/components/ui/toaster";
import { AppProviders } from "@/contexts/AppProviders";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppProviders>
      {children}
    </AppProviders>
  );
}
