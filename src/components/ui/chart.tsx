
"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

export type ChartConfig = { [k: string]: { label?: React.ReactNode; icon?: React.ComponentType } };

const ChartContainer = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> & {
    config: ChartConfig
    children: React.ReactNode
  }
>(({ className, children, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex aspect-video justify-center text-xs items-center border rounded-lg bg-muted/50 p-4", className)}
    {...props}
  >
      {children}
  </div>
));
ChartContainer.displayName = "ChartContainer"

// These are now placeholders and do nothing.
const ChartTooltip = ({ children }: { children: React.ReactNode }) => <>{children}</>
const ChartTooltipContent = ({...props}: any) => null;
const ChartLegend = ({ children }: { children: React.ReactNode }) => <>{children}</>;
const ChartLegendContent = ({...props}: any) => null;

export {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
}
