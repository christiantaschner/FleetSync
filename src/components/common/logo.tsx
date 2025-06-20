
import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
}

export function Logo({ className }: LogoProps) {
  return (
    <div 
      className={cn(
        "inline-flex items-center bg-primary text-primary-foreground px-3 py-1.5 rounded-md", 
        className
      )}
    >
      <span className="text-xl font-bold font-headline">
        FleetSync AI
      </span>
    </div>
  );
}
