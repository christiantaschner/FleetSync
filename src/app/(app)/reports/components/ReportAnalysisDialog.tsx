
"use client";

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CheckCircle, Lightbulb, TrendingUp, Sparkles, Bot, X } from 'lucide-react';
import type { RunReportAnalysisOutput } from '@/types';

interface ReportAnalysisDialogProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  analysisResult: RunReportAnalysisOutput | null;
}

const ReportAnalysisDialog: React.FC<ReportAnalysisDialogProps> = ({
  isOpen,
  setIsOpen,
  analysisResult,
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="font-headline flex items-center gap-2">
            <Bot className="text-primary h-5 w-5" /> AI Performance Analysis
          </DialogTitle>
          <DialogDescription>
            Here is a personalized analysis of your fleet's performance based on the selected data, along with actionable suggestions.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh] pr-4">
          <div className="space-y-6 py-2">
            {analysisResult ? (
              <>
                <div>
                  <h3 className="font-semibold text-lg flex items-center gap-2 mb-2">
                    <Lightbulb className="text-amber-500"/>
                    Key Insights
                  </h3>
                  <p className="text-muted-foreground whitespace-pre-wrap">{analysisResult.insights}</p>
                </div>
                 <div>
                  <h3 className="font-semibold text-lg flex items-center gap-2 mb-2">
                    <TrendingUp className="text-blue-500"/>
                    Actionable Suggestions
                  </h3>
                  <ul className="list-disc pl-5 space-y-2 text-muted-foreground">
                    {analysisResult.suggestions.map((suggestion, index) => (
                      <li key={index}>{suggestion}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold text-lg flex items-center gap-2 mb-2">
                    <CheckCircle className="text-green-500"/>
                    Quick Wins
                  </h3>
                  <ul className="list-disc pl-5 space-y-2 text-muted-foreground">
                    {analysisResult.quickWins.map((win, index) => (
                      <li key={index}>{win}</li>
                    ))}
                  </ul>
                </div>
              </>
            ) : (
                <p className="text-muted-foreground text-center py-8">No analysis results to display.</p>
            )}
          </div>
        </ScrollArea>
        <DialogFooter className="sm:justify-end mt-4">
          <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
            <X className="mr-2 h-4 w-4"/>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ReportAnalysisDialog;
