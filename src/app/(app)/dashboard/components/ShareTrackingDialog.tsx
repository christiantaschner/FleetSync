

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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from "@/hooks/use-toast";
import type { Job, Technician } from '@/types';
import { notifyCustomerAction } from '@/actions/ai-actions';
import { Loader2, Copy, Link as LinkIcon, RefreshCw, Check, MessageSquare } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { Textarea } from '@/components/ui/textarea';

interface ShareTrackingDialogProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  job: Job | null;
  technicians: Technician[];
}

const ShareTrackingDialog: React.FC<ShareTrackingDialogProps> = ({ isOpen, setIsOpen, job, technicians }) => {
  const { userProfile, company } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [isCopied, setIsCopied] = useState(false);
  
  const generateLinkAndMessage = async (currentJob: Job) => {
    if (!userProfile?.companyId) {
        toast({ title: "Error", description: "Company information not available.", variant: "destructive"});
        return;
    }
    const assignedTechnician = technicians.find(t => t.id === currentJob.assignedTechnicianId);

    setIsLoading(true);
    setMessage('');
    setIsCopied(false);

    const result = await notifyCustomerAction({
        jobId: currentJob.id,
        customerName: currentJob.customerName,
        technicianName: assignedTechnician?.name || 'Your Technician',
        companyName: company?.name,
        appointmentTime: currentJob.scheduledTime,
        estimatedDurationMinutes: currentJob.estimatedDurationMinutes,
        jobTitle: currentJob.title,
    });
    
    setIsLoading(false);

    if (result.error) {
      toast({ title: "Error", description: result.error, variant: "destructive" });
    } else if (result.data?.message) {
      setMessage(result.data.message);
    }
  };

  useEffect(() => {
    if (isOpen && job) {
      generateLinkAndMessage(job);
    } else {
       setIsCopied(false);
       setMessage('');
    }
  }, [isOpen, job]);
  
  const handleCopyToClipboard = () => {
    if (message) {
      navigator.clipboard.writeText(message);
      setIsCopied(true);
      toast({ title: "Copied!", description: "Message copied to clipboard." });
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-headline flex items-center gap-2">
            <MessageSquare /> Share Appointment Details
          </DialogTitle>
          <DialogDescription>
            Copy the AI-generated message below and send it to your customer. It includes a live tracking link.
          </DialogDescription>
        </DialogHeader>
        
        {isLoading && (
            <div className="flex items-center justify-center p-10 space-x-2">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                <span className="text-muted-foreground">Generating message...</span>
            </div>
        )}

        {message && (
          <div className="space-y-2 py-2">
            <Label htmlFor="tracking-message">Customer Message</Label>
            <Textarea id="tracking-message" readOnly value={message} rows={5} className="bg-secondary/50" />
            <Button size="sm" onClick={handleCopyToClipboard} aria-label="Copy message" className="w-full">
              {isCopied ? <Check className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}
              Copy Message
            </Button>
          </div>
        )}

        <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                Close
            </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ShareTrackingDialog;
