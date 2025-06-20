
import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
}

export function Logo({ className }: LogoProps) {
  return (
    <div className={cn(className)}> {/* Wrapper div, color inherited from parent */}
      <span className="text-xl font-bold font-headline">
        FleetSync AI
      </span>
    </div>
  );
}
