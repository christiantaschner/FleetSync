
"use client";

import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PricingCardProps {
  title: string;
  description: string;
  price: number | null;
  currency: string;
  interval: string | null;
  features: string[];
  cta: string;
  onCtaClick: () => void;
  isLoading?: boolean;
  isPopular?: boolean;
  className?: string;
}

const PricingCard: React.FC<PricingCardProps> = ({
  title,
  description,
  price,
  currency,
  interval,
  features,
  cta,
  onCtaClick,
  isLoading,
  isPopular,
  className,
}) => {

  const formattedPrice = price === null 
    ? "Custom" 
    : (price / 100).toLocaleString('en-US', {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 2,
    });

  const frequencyText = interval ? `/ technician / ${interval}` : '';

  return (
    <Card className={cn("flex flex-col", isPopular && "border-primary ring-2 ring-primary", className)}>
      <CardHeader>
        <CardTitle className="font-headline">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="flex-grow space-y-6">
        <div className="flex items-baseline gap-2">
            <span className="text-4xl font-bold">{formattedPrice}</span>
            {price !== null && <span className="text-sm text-muted-foreground">{frequencyText}</span>}
        </div>
        <ul className="space-y-2">
          {features.map((feature, index) => (
            <li key={index} className="flex items-start gap-2 text-sm">
              <Check className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
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

    