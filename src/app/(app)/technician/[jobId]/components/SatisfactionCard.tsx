
"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Star, ThumbsDown, ThumbsUp, Smile } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SatisfactionCardProps {
    satisfactionScore: number;
    setSatisfactionScore: (score: number) => void;
}

const SatisfactionCard: React.FC<SatisfactionCardProps> = ({ satisfactionScore, setSatisfactionScore }) => {
    
    const satisfactionIcons = [
        { icon: ThumbsDown, color: 'text-red-500', label: 'Poor' },
        { icon: Star, color: 'text-orange-400', label: 'Fair' },
        { icon: Star, color: 'text-yellow-400', label: 'Good' },
        { icon: Star, color: 'text-lime-500', label: 'Very Good' },
        { icon: ThumbsUp, color: 'text-green-500', label: 'Excellent' }
    ];
    
    return (
        <Card>
            <CardHeader>
                <CardTitle className="font-headline flex items-center gap-2"><Smile /> Customer Satisfaction</CardTitle>
                <CardDescription>Rate the customer's overall satisfaction with the service.</CardDescription>
            </CardHeader>
            <CardContent>
                <div>
                    <Label>Satisfaction Rating ({satisfactionScore > 0 ? `${satisfactionScore}/5 - ${satisfactionIcons[satisfactionScore - 1].label}` : 'Not Rated'})</Label>
                    <div className="flex items-center gap-4 mt-2">
                        <Slider 
                            defaultValue={[satisfactionScore]}
                            value={[satisfactionScore]}
                            max={5} 
                            step={1} 
                            onValueChange={(value) => setSatisfactionScore(value[0])}
                            className="flex-1"
                        />
                        {satisfactionScore > 0 ? (
                            React.createElement(satisfactionIcons[satisfactionScore - 1].icon, {
                                className: cn("h-8 w-8", satisfactionIcons[satisfactionScore - 1].color)
                            })
                        ) : (
                            <Smile className="h-8 w-8 text-muted-foreground" />
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

export default SatisfactionCard;
