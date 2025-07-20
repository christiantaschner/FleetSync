
"use client";

import * as React from "react";
import { Toaster } from "@/components/ui/toaster";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <Toaster />
    </>
  );
}
