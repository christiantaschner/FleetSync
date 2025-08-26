
import { cn } from "@/lib/utils";
import { Waypoints } from "lucide-react";

interface LogoProps {
  className?: string;
}

export function Logo({ className }: LogoProps) {
  return (
    <div className={cn("flex items-center gap-2", className)}> {/* Wrapper div, color inherited from parent */}
      <Waypoints className="h-6 w-6" />
      <span className="text-xl font-bold font-logo">
        MarginMax
      </span>
    </div>
  );
}
