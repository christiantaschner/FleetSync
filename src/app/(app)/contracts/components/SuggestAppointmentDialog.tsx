
"use client";

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from "@/hooks/use-toast";
import { suggestNextAppointmentAction } from '@/actions/ai-actions';
import type { SuggestNextAppointmentOutput, Contract } from '@/types';
import { Loader2, Sparkles, Copy, X, ArrowRight } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import Link from 'next/link';
import { useAuth } from '@/contexts/auth-context';

interface SuggestAppointmentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  contract: Contract | null;
}

const SuggestAppointmentDialog: React.FC<SuggestAppointmentDialogProps> = ({ isOpen, onClose, contract }) => {
  const { toast } = useToast();
  const { userProfile } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [suggestion, setSuggestion] = useState<SuggestNextAppointmentOutput | null>(null);
  const [error, setError] = useState<string | null>(null);

  const appId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

  useEffect(() => {
    const getSuggestion = async () => {
        if (isOpen && contract && userProfile?.companyId && appId) {
            setIsLoading(true);
            setError(null);
            setSuggestion(null);

            const result = await suggestNextAppointmentAction({
                companyId: userProfile.companyId,
                appId,
                contract,
            });

            if (result.error) {
                setError(result.error);
                toast({ title: "Error", description: result.error, variant: "destructive" });
            } else {
                setSuggestion(result.data);
            }
            setIsLoading(false);
        }
    };
    
    getSuggestion();
  }, [isOpen, contract, toast, userProfile, appId]);

  const handleCopyToClipboard = () => {
    if (suggestion?.message) {
      navigator.clipboard.writeText(suggestion.message);
      toast({ title: "Copied!", description: "Message copied to clipboard." });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-headline flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" /> AI Appointment Suggestion
          </DialogTitle>
          <DialogDescription>
            AI has drafted a message and created a draft job for {contract?.customerName}.
          </DialogDescription>
        </DialogHeader>
        
        {isLoading && (
            <div className="flex items-center justify-center p-10 space-x-2">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                <span className="text-muted-foreground">Generating suggestion...</span>
            </div>
        )}

        {error && (
            <Alert variant="destructive">
                <AlertTitle>Suggestion Failed</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
            </Alert>
        )}

        {suggestion && (
            <div className="space-y-4 py-2">
                <div>
                    <Label htmlFor="suggested-message">Drafted Message</Label>
                    <Textarea 
                        id="suggested-message"
                        readOnly 
                        value={suggestion.message} 
                        rows={6}
                        className="bg-secondary/50"
                    />
                </div>
                 <Alert>
                    <AlertTitle className="font-semibold">Next Suggested Date</AlertTitle>
                    <AlertDescription>{suggestion.suggestedDate}</AlertDescription>
                </Alert>
                <Alert variant="default" className="bg-primary/5 border-primary/20">
                    <AlertTitle className="font-semibold text-primary">Draft Job Created</AlertTitle>
                    <AlertDescription>
                        A draft job has been created. Click below to review and assign it.
                    </AlertDescription>
                     <div className="mt-3">
                        <Link href={`/dashboard?jobFilter=${suggestion.createdJobId}`}>
                            <Button variant="outline" size="sm" onClick={onClose}>
                                View Draft Job <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                        </Link>
                    </div>
                </Alert>
            </div>
        )}

        <DialogFooter className="pt-4 flex-col sm:flex-row gap-2">
          <Button type="button" variant="outline" onClick={onClose}>
            <X className="mr-2 h-4 w-4" /> Close
          </Button>
          <Button onClick={handleCopyToClipboard} disabled={isLoading || !suggestion}>
            <Copy className="mr-2 h-4 w-4" /> Copy Message
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SuggestAppointmentDialog;
