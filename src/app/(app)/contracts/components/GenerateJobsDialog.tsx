
"use client";

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { useToast } from "@/hooks/use-toast";
import { generateRecurringJobsAction } from '@/actions/fleet-actions';
import { Loader2, CalendarPlus, Calendar as CalendarIcon } from 'lucide-react';
import { format, addMonths } from 'date-fns';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/auth-context';

interface GenerateJobsDialogProps {
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;
}

const GenerateJobsDialog: React.FC<GenerateJobsDialogProps> = ({ isOpen, setIsOpen }) => {
    const { user } = useAuth();
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [untilDate, setUntilDate] = useState<Date | undefined>(addMonths(new Date(), 3));

    const handleSubmit = async () => {
        if (!untilDate) {
            toast({ title: "Date Required", description: "Please select a date to generate jobs until.", variant: "destructive" });
            return;
        }

        if (!user) {
            toast({ title: "Authentication Error", description: "You must be logged in to perform this action.", variant: "destructive" });
            return;
        }

        setIsSubmitting(true);
        const result = await generateRecurringJobsAction({ 
            companyId: user.uid, 
            untilDate: untilDate.toISOString() 
        });
        setIsSubmitting(false);

        if (result.error) {
            toast({ title: "Error", description: result.error, variant: "destructive" });
        } else {
            toast({
                title: "Success!",
                description: `${result.data?.jobsCreated} recurring jobs have been created and are now in the 'Pending' queue.`,
            });
            setIsOpen(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle className="font-headline flex items-center gap-2"><CalendarPlus/>Generate Recurring Jobs</DialogTitle>
                    <DialogDescription>
                        Select a date. The system will create all pending jobs from active contracts that are due up to and including this date.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-2">
                    <div>
                        <Label htmlFor="untilDate">Generate Jobs Until</Label>
                         <Popover>
                            <PopoverTrigger asChild>
                            <Button
                                id="untilDate"
                                variant={"outline"}
                                className={cn(
                                "w-full justify-start text-left font-normal",
                                !untilDate && "text-muted-foreground"
                                )}
                            >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {untilDate ? format(untilDate, "PPP") : <span>Pick a date</span>}
                            </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                            <Calendar
                                mode="single"
                                selected={untilDate}
                                onSelect={setUntilDate}
                                initialFocus
                            />
                            </PopoverContent>
                        </Popover>
                    </div>
                </div>
                <DialogFooter className="pt-4">
                    <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
                    <Button onClick={handleSubmit} disabled={isSubmitting || !untilDate}>
                        {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CalendarPlus className="mr-2 h-4 w-4" />}
                        Generate Jobs
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default GenerateJobsDialog;
