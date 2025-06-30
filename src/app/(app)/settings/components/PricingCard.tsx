
"use client";

import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PricingCardProps {
  title: string;
  price: string;
  frequency: string;
  description: string;
  features: string[];
  cta: string;
  onCtaClick: () => void;
  isLoading?: boolean;
  className?: string;
}

const PricingCard: React.FC<PricingCardProps> = ({
  title,
  price,
  frequency,
  description,
  features,
  cta,
  onCtaClick,
  isLoading,
  className,
}) => {
  const isCustomPrice = price.toLowerCase() === 'custom';

  return (
    <Card className={cn("flex flex-col", className)}>
      <CardHeader>
        <CardTitle className="font-headline">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="flex-grow space-y-6">
        <div className="flex items-baseline gap-2">
            <span className="text-4xl font-bold">{price}</span>
            {!isCustomPrice && <span className="text-sm text-muted-foreground">{frequency}</span>}
        </div>
        <ul className="space-y-2">
          {features.map((feature, index) => (
            <li key={index} className="flex items-center gap-2 text-sm">
              <Check className="h-4 w-4 text-green-500" />
              <span>{feature}</span>
            </li>
          ))}
        </ul>
      </CardContent>
      <CardFooter>
        <Button className="w-full" onClick={onCtaClick} disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {cta}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default PricingCard;
