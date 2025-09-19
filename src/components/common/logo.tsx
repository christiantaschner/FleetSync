
import { cn } from "@/lib/utils";
import { TrendingUp } from "lucide-react";
import { useTranslation } from "@/hooks/use-language";

interface LogoProps {
  className?: string;
}

export function Logo({ className }: LogoProps) {
  const { language } = useTranslation();
  const appName = "MarginMax";

  return (
    <div className={cn("flex items-center gap-2 text-inherit", className)}>
      <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
          <TrendingUp className="h-5 w-5" />
      </div>
      <div className="flex flex-col">
        <span className="text-xl font-bold font-logo leading-none">
          {appName}
        </span>
        <span className="text-xs text-muted-foreground whitespace-nowrap">
          Profit-First Dispatching
        </span>
      </div>
    </div>
  );
}
