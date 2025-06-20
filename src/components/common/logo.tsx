
import { cn } from "@/lib/utils";
import { Wrench } from "lucide-react";

interface LogoProps {
  className?: string;
}

export function Logo({ className }: LogoProps) {
  return (
    <div className={cn("flex items-center gap-2", className)}> {/* Wrapper div, color inherited from parent */}
      <Wrench className="h-6 w-6" />
      <span className="text-xl font-bold font-logo">
        FleetSync AI
      </span>
    </div>
  );
}
