
import { cn } from "@/lib/utils";
import { Waypoints } from "lucide-react";
import { useTranslation } from "@/hooks/use-language";

interface LogoProps {
  className?: string;
}

export function Logo({ className }: LogoProps) {
  const { language } = useTranslation();
  const appName = "MarginMax";

  return (
    <div className={cn("flex items-center gap-2 text-inherit", className)}>
      <Waypoints className="h-6 w-6" />
      <span className="text-xl font-bold font-logo">
        {appName}
      </span>
    </div>
  );
}
