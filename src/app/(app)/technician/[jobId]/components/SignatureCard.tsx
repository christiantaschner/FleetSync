
"use client";

import React, { useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import SignatureCanvas from 'react-signature-canvas';
import { FileSignature, Smile, ThumbsDown, Star, ThumbsUp, Loader2, Save } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SignatureCardProps {
    onSubmit: (signatureDataUrl: string | null, satisfactionScore: number) => void;
    isSubmitting: boolean;
    isDisabled: boolean;
}

const SignatureCard: React.FC<SignatureCardProps> = ({ onSubmit, isSubmitting, isDisabled }) => {
    const [satisfactionScore, setSatisfactionScore] = React.useState<number>(0);
    const signaturePadRef = useRef<SignatureCanvas>(null);

    const clearSignature = () => {
        signaturePadRef.current?.clear();
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const signatureDataUrl = signaturePadRef.current?.isEmpty()
            ? null
            : signaturePadRef.current?.getTrimmedCanvas().toDataURL('image/png');
        onSubmit(signatureDataUrl, satisfactionScore);
    };

    const satisfactionIcons = [
        { icon: ThumbsDown, color: 'text-red-500', label: 'Poor' },
        { icon: Star, color: 'text-orange-400', label: 'Fair' },
        { icon: Star, color: 'text-yellow-400', label: 'Good' },
        { icon: Star, color: 'text-lime-500', label: 'Very Good' },
        { icon: ThumbsUp, color: 'text-green-500', label: 'Excellent' }
    ];

    return (
        <fieldset disabled={isDisabled} className="disabled:opacity-50 disabled:cursor-not-allowed">
            <Card>
                <CardHeader>
                    <CardTitle className="font-headline flex items-center gap-2"><FileSignature /> Customer Sign-off</CardTitle>
                    <CardDescription>Capture signature and satisfaction to confirm completion.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <Label>Customer Satisfaction ({satisfactionScore > 0 ? `${satisfactionScore}/5 - ${satisfactionIcons[satisfactionScore - 1].label}` : 'Not Rated'})</Label>
                            <div className="flex items-center gap-2 mt-2">
                                <Slider
                                    defaultValue={[satisfactionScore]}
                                    value={[satisfactionScore]}
                                    max={5}
                                    step={1}
                                    onValueChange={(value) => setSatisfactionScore(value[0])}
                                    disabled={isDisabled || isSubmitting}
                                />
                                {satisfactionScore > 0 ? (
                                    React.createElement(satisfactionIcons[satisfactionScore - 1].icon, {
                                        className: cn("h-6 w-6", satisfactionIcons[satisfactionScore - 1].color)
                                    })
                                ) : <Smile className="h-6 w-6 text-muted-foreground" />}
                            </div>
                        </div>
                        <div>
                            <div className="flex justify-between items-center mb-1">
                                <Label>Customer Signature</Label>
                                <Button type="button" variant="ghost" size="sm" onClick={clearSignature} disabled={isDisabled || isSubmitting}>Clear</Button>
                            </div>
                            <div className="border rounded-md bg-white">
                                <SignatureCanvas
                                    ref={signaturePadRef}
                                    penColor="black"
                                    canvasProps={{ className: 'w-full h-32' }}
                                />
                            </div>
                        </div>
                         <Button type="submit" disabled={isSubmitting || isDisabled} className="w-full">
                            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                            Save Sign-off
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </fieldset>
    );
};

export default SignatureCard;
