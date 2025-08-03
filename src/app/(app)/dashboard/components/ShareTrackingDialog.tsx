
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
import type { Job } from '@/types';
import { generateTrackingLinkAction } from '@/actions/fleet-actions';
import { Loader2, Copy, Link as LinkIcon, RefreshCw, Check } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';

interface ShareTrackingDialogProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  job: Job | null;
}

const ShareTrackingDialog: React.FC<ShareTrackingDialogProps> = ({ isOpen, setIsOpen, job }) => {
  const { userProfile } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [trackingUrl, setTrackingUrl] = useState('');
  const [isCopied, setIsCopied] = useState(false);
  
  const generateLink = async (currentJob: Job) => {
    if (!userProfile?.companyId) {
        toast({ title: "Error", description: "Company information not available.", variant: "destructive"});
        return;
    }
    const appId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
    if (!appId) {
        toast({ title: "Error", description: "Application ID not configured.", variant: "destructive"});
        return;
    }
    setIsLoading(true);
    setTrackingUrl('');
    setIsCopied(false);

    const result = await generateTrackingLinkAction({ jobId: currentJob.id, companyId: userProfile.companyId, appId });
    setIsLoading(false);

    if (result.error) {
      toast({ title: "Error", description: result.error, variant: "destructive" });
    } else if (result.data?.trackingUrl) {
      const fullUrl = `${window.location.origin}${result.data.trackingUrl}`;
      setTrackingUrl(fullUrl);
    }
  };

  useEffect(() => {
    if (isOpen && job) {
      generateLink(job);
    } else {
       setTrackingUrl('');
       setIsCopied(false);
    }
  }, [isOpen, job]);
  
  const handleCopyToClipboard = () => {
    if (trackingUrl) {
      navigator.clipboard.writeText(trackingUrl);
      setIsCopied(true);
      toast({ title: "Copied!", description: "Tracking link copied to clipboard." });
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-headline flex items-center gap-2">
            <LinkIcon /> Share Live Tracking Link
          </DialogTitle>
          <DialogDescription>
            Send this link to the customer. It is valid for 4 hours and will allow them to see the technician's location in real-time.
          </DialogDescription>
        </DialogHeader>
        
        {isLoading && (
            <div className="flex items-center justify-center p-10 space-x-2">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                <span className="text-muted-foreground">Generating secure link...</span>
            </div>
        )}

        {trackingUrl && (
          <div className="space-y-2 py-2">
            <Label htmlFor="tracking-link">Customer Tracking Link</Label>
            <div className="flex gap-2">
              <Input id="tracking-link" readOnly value={trackingUrl} />
              <Button size="icon" onClick={handleCopyToClipboard} aria-label="Copy link">
                {isCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        )}

        <DialogFooter className="pt-4 flex-col sm:flex-row sm:justify-between gap-2">
            <Button
                type="button"
                variant="ghost"
                onClick={() => job && generateLink(job)}
                disabled={isLoading}
            >
                <RefreshCw className="mr-2 h-4 w-4" /> Regenerate Link
            </Button>
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                Close
            </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ShareTrackingDialog;
