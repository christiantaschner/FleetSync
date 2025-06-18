import { ShipWheel } from 'lucide-react'; // Using ShipWheel as a thematic icon

interface LogoProps {
  className?: string;
  iconSize?: number;
}

export function Logo({ className, iconSize = 28 }: LogoProps) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <ShipWheel size={iconSize} className="text-primary" />
      <span className="text-xl font-bold text-primary font-headline">
        FleetSync <span className="text-accent">AI</span>
      </span>
    </div>
  );
}
