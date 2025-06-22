
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
import { suggestNextAppointmentAction } from '@/actions/fleet-actions';
import type { SuggestNextAppointmentOutput, Contract } from '@/types';
import { Loader2, Sparkles, Copy, X } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface SuggestAppointmentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  contract: Contract | null;
}

const SuggestAppointmentDialog: React.FC<SuggestAppointmentDialogProps> = ({ isOpen, onClose, contract }) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [suggestion, setSuggestion] = useState<SuggestNextAppointmentOutput | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const getSuggestion = async () => {
        if (isOpen && contract) {
            setIsLoading(true);
            setError(null);
            setSuggestion(null);

            const result = await suggestNextAppointmentAction({
                customerName: contract.customerName,
                jobTitle: contract.jobTemplate.title,
                frequency: contract.frequency,
                lastAppointmentDate: contract.lastGeneratedUntil || contract.startDate,
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
  }, [isOpen, contract, toast]);

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
            AI has drafted a message to schedule the next service for {contract?.customerName}.
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
