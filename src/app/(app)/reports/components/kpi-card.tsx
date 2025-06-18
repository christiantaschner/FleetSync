
"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react'; // Assuming TrendIcon is not available

interface KpiCardProps {
  title: string;
  value: string;
  icon: React.ElementType;
  description?: string;
  trend?: 'up' | 'down' | 'neutral'; // Optional trend indicator
  trendValue?: string; // Optional trend value, e.g., "+5%"
  positiveIsGood?: boolean; // If true, 'up' is green, 'down' is red. Reversed if false.
}

const KpiCard: React.FC<KpiCardProps> = ({ title, value, icon: Icon, description, trend, trendValue, positiveIsGood = true }) => {
  
  const getTrendColor = () => {
    if (!trend || trend === 'neutral' || !trendValue) return 'text-muted-foreground';
    if (trend === 'up') return positiveIsGood ? 'text-green-600' : 'text-red-600';
    if (trend === 'down') return positiveIsGood ? 'text-red-600' : 'text-green-600';
    return 'text-muted-foreground';
  };
  
  const TrendIcon = trend === 'up' ? ArrowUpRight : trend === 'down' ? ArrowDownRight : null;

  // Special handling for positiveIsGood when value itself might be a trend
  // e.g. Fuel Efficiency: -5% (value is the trendValue, trend might be 'down' because it's negative)
  let displayValue = value;
  let displayTrendValue = trendValue;
  let displayTrendIcon = TrendIcon;
  let displayTrendColor = getTrendColor();

  if (value.includes('%') && !trendValue) { // If value itself is a percentage change
      displayTrendValue = value;
      if (value.startsWith('-')) {
          displayTrendIcon = ArrowDownRight;
          displayTrendColor = positiveIsGood ? 'text-red-600' : 'text-green-600';
      } else if (value.startsWith('+') || (parseFloat(value) > 0)) {
          displayTrendIcon = ArrowUpRight;
          displayTrendColor = positiveIsGood ? 'text-green-600' : 'text-red-600';
      } else {
          displayTrendIcon = null; // Or some neutral icon
          displayTrendColor = 'text-muted-foreground';
      }
      // The main value could be something else or just this trend
      // For now, if value is a trend, we show it as trend and main value could be more abstract or not shown.
      // Let's assume 'value' is still primary display and trendValue is secondary.
      // If 'value' is the trend, like "-5%", it's already handled by positiveIsGood.
      // If 'value' is a KPI and 'trendValue' is its change.
  }


  return (
    <Card className="hover:shadow-md transition-shadow duration-200">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-5 w-5 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold">{displayValue}</div>
        {description && <p className="text-xs text-muted-foreground pt-1">{description}</p>}
        {displayTrendValue && displayTrendIcon && (
          <p className={`text-xs pt-1 flex items-center ${displayTrendColor}`}>
            <displayTrendIcon className="h-3 w-3 mr-1" />
            {displayTrendValue}
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default KpiCard;
