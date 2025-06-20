
// ShipWheel import removed, as the icon is no longer used.

interface LogoProps {
  className?: string;
  // iconSize prop removed as it's not relevant for a text-only logo
}

export function Logo({ className }: LogoProps) {
  return (
    <div className={`flex items-center ${className}`}> {/* gap-2 might be adjusted or removed if there's only text */}
      {/* ShipWheel JSX element removed */}
      <span className="text-xl font-bold text-primary font-headline">
        FleetSync <span className="text-accent">AI</span>
      </span>
    </div>
  );
}
