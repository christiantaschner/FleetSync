"use client";

import React, { useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import SignatureCanvas from 'react-signature-canvas';
import { FileSignature } from 'lucide-react';

interface SignatureCardProps {
    signaturePadRef: React.RefObject<SignatureCanvas>;
}

const SignatureCard: React.FC<SignatureCardProps> = ({ signaturePadRef }) => {
    
    const clearSignature = () => {
        signaturePadRef.current?.clear();
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="font-headline flex items-center gap-2"><FileSignature /> Customer Signature</CardTitle>
                <CardDescription>Get a signature from the customer to confirm job completion.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex justify-between items-center mb-1">
                    <Label>Signature Pad</Label>
                    <Button type="button" variant="ghost" size="sm" onClick={clearSignature}>Clear</Button>
                </div>
                <div className="border rounded-md bg-white">
                    <SignatureCanvas
                        ref={signaturePadRef}
                        penColor="black"
                        canvasProps={{ className: 'w-full h-32' }}
                    />
                </div>
            </CardContent>
        </Card>
    );
};

export default SignatureCard;
