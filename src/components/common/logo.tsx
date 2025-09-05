
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
      <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
          <TrendingUp className="h-5 w-5" />
      </div>
      <span className="text-xl font-bold font-logo">
        {appName}
      </span>
    </div>
  );
}
