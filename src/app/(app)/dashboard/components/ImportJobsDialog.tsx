

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
import { useToast } from "@/hooks/use-toast";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, Upload, FileSpreadsheet, Download, CheckCircle, AlertTriangle } from 'lucide-react';
import Papa from 'papaparse';
import { importJobsAction, type ImportJobsActionInput } from '@/actions/fleet-actions';
import type { JobPriority } from '@/types';
import { useAuth } from '@/contexts/auth-context';

interface ImportJobsDialogProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  onJobsImported: () => void;
}

type ParsedJob = {
  data: ImportJobsActionInput['jobs'][number];
  rowIndex: number;
};

type ParseError = {
  message: string;
  rowIndex: number;
};

const REQUIRED_HEADERS = [
    'title', 'description', 'priority', 'address', 
    'customerName', 'customerPhone', 'scheduledDate', 'scheduledTime', 
    'estimatedDurationMinutes', 'requiredSkills'
];

const ImportJobsDialog: React.FC<ImportJobsDialogProps> = ({ isOpen, setIsOpen, onJobsImported }) => {
  const { userProfile } = useAuth();
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [parsedJobs, setParsedJobs] = useState<ParsedJob[]>([]);
  const [errors, setErrors] = useState<ParseError[]>([]);
  const [isParsing, setIsParsing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetState = () => {
    setFile(null);
    setParsedJobs([]);
    setErrors([]);
    setIsParsing(false);
    setIsSubmitting(false);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    resetState();
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.type !== 'text/csv') {
        toast({
          title: "Invalid File Type",
          description: "Please upload a CSV file.",
          variant: "destructive",
        });
        return;
      }
      setFile(selectedFile);
      handleParse(selectedFile);
    }
  };

  const handleParse = (fileToParse: File) => {
    setIsParsing(true);
    Papa.parse(fileToParse, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const { data, errors: parsingErrors, meta } = results;

        if (!meta.fields || !REQUIRED_HEADERS.every(h => meta.fields!.includes(h))) {
            setErrors([{
                rowIndex: 0,
                message: `CSV headers are missing or incorrect. Required headers: ${REQUIRED_HEADERS.join(', ')}`,
            }]);
            setIsParsing(false);
            return;
        }

        const validJobs: ParsedJob[] = [];
        const newErrors: ParseError[] = [];

        data.forEach((row: any, index) => {
          const rowIndex = index + 2; // 1 for header, 1 for 0-index
          
          if (!row.title || !row.priority || !row.address || !row.estimatedDurationMinutes) {
            newErrors.push({ rowIndex, message: "Missing required fields: title, priority, address, estimatedDurationMinutes." });
            return;
          }

          let scheduledTimeISO: string | undefined = undefined;
          if(row.scheduledDate && row.scheduledTime) {
            const date = new Date(`${row.scheduledDate}T${row.scheduledTime}`);
            if(!isNaN(date.getTime())) {
                scheduledTimeISO = date.toISOString();
            } else {
                newErrors.push({ rowIndex, message: "Invalid scheduledDate or scheduledTime format." });
            }
          }
          
          const duration = row.estimatedDurationMinutes ? parseInt(row.estimatedDurationMinutes, 10) : 0;
          if (isNaN(duration) || duration <= 0) {
            newErrors.push({ rowIndex, message: "estimatedDurationMinutes must be a number greater than 0." });
            return;
          }

          const job: ImportJobsActionInput['jobs'][number] = {
            title: row.title,
            description: row.description || undefined,
            priority: row.priority as JobPriority,
            customerName: row.customerName || undefined,
            customerPhone: row.customerPhone || undefined,
            address: row.address,
            scheduledTime: scheduledTimeISO,
            estimatedDurationMinutes: duration,
            requiredSkills: row.requiredSkills ? row.requiredSkills.split(',').map((s: string) => s.trim()) : [],
          };
          validJobs.push({ data: job, rowIndex });
        });

        parsingErrors.forEach((e: any) => {
            newErrors.push({ rowIndex: e.row + 2, message: e.message });
        });

        setParsedJobs(validJobs);
        setErrors(newErrors);
        setIsParsing(false);
      },
      error: (error) => {
        setErrors([{ rowIndex: 0, message: `Parsing error: ${error.message}` }]);
        setIsParsing(false);
      }
    });
  };

  const handleSubmit = async () => {
    if (parsedJobs.length === 0) {
      toast({ title: "No Valid Jobs", description: "There are no valid jobs to import.", variant: "destructive" });
      return;
    }
     if (!userProfile?.companyId) {
      toast({ title: "Authentication Error", description: "You must be logged in to import jobs.", variant: "destructive" });
      return;
    }
    const appId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
    if (!appId) {
      toast({ title: "Configuration Error", description: "Firebase Project ID not found.", variant: "destructive"});
      return;
    }

    setIsSubmitting(true);
    
    const result = await importJobsAction({
        companyId: userProfile.companyId,
        appId: appId,
        jobs: parsedJobs.map(p => p.data),
    });
    
    setIsSubmitting(false);

    if (result.error) {
      toast({ title: "Import Failed", description: result.error, variant: "destructive" });
    } else {
      toast({ title: "Import Successful", description: `${result.data?.successCount} jobs have been imported.` });
      onJobsImported();
      setIsOpen(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
        setIsOpen(open);
        if(!open) resetState();
    }}>
      <DialogContent className="sm:max-w-4xl flex flex-col max-h-[90dvh] p-0">
        <DialogHeader className="px-6 pt-6 flex-shrink-0">
          <DialogTitle className="font-headline flex items-center gap-2"><FileSpreadsheet /> Import Jobs from CSV</DialogTitle>
          <DialogDescription>
            Upload a CSV file to batch-create unassigned jobs. Download the template for the required format.
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto px-6">
          <div className="py-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <label htmlFor="csv-upload" className="block text-sm font-medium text-gray-700">
                        Upload CSV File
                    </label>
                    <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed rounded-md border-input">
                        <div className="space-y-1 text-center">
                            <Upload className="mx-auto h-12 w-12 text-muted-foreground" />
                            <div className="flex text-sm text-muted-foreground">
                            <label
                                htmlFor="csv-upload"
                                className="relative cursor-pointer rounded-md font-medium text-primary hover:text-primary/80"
                            >
                                <span>{file ? 'Replace file' : 'Upload a file'}</span>
                                <input id="csv-upload" name="csv-upload" type="file" className="sr-only" accept=".csv" onChange={handleFileChange} />
                            </label>
                            </div>
                            <p className="text-xs text-muted-foreground">{file ? file.name : 'CSV files up to 5MB'}</p>
                        </div>
                    </div>
                </div>
                <div className="space-y-2">
                    <p className="block text-sm font-medium text-gray-700">Instructions</p>
                    <div className="p-4 border rounded-md bg-secondary/50 h-full flex flex-col justify-center">
                        <p className="text-sm text-muted-foreground mb-3">
                            Ensure your CSV file matches the template's headers and format.
                            Required fields are: <strong>title, priority, address, estimatedDurationMinutes</strong>.
                        </p>
                        <a href="/jobs_template.csv" download>
                            <Button variant="outline" className="w-full">
                                <Download className="mr-2 h-4 w-4" /> Download CSV Template
                            </Button>
                        </a>
                    </div>
                </div>
            </div>

            {isParsing && (
                <div className="flex items-center justify-center p-4"><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Parsing file...</div>
            )}

            {errors.length > 0 && (
                <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Import Errors</AlertTitle>
                    <AlertDescription>
                        <ScrollArea className="h-24">
                            <ul className="list-disc pl-5">
                                {errors.map((err, i) => (
                                    <li key={i}>Row {err.rowIndex}: {err.message}</li>
                                ))}
                            </ul>
                        </ScrollArea>
                    </AlertDescription>
                </Alert>
            )}
            
            {parsedJobs.length > 0 && (
            <div>
                <h3 className="text-sm font-medium mb-2">Preview of Valid Jobs ({parsedJobs.length})</h3>
                <ScrollArea className="h-64 border rounded-md">
                <Table>
                    <TableHeader>
                    <TableRow>
                        <TableHead>Title</TableHead>
                        <TableHead>Priority</TableHead>
                        <TableHead>Address</TableHead>
                    </TableRow>
                    </TableHeader>
                    <TableBody>
                    {parsedJobs.map(({ data, rowIndex }) => (
                        <TableRow key={rowIndex}>
                        <TableCell>{data.title}</TableCell>
                        <TableCell>{data.priority}</TableCell>
                        <TableCell>{data.address}</TableCell>
                        </TableRow>
                    ))}
                    </TableBody>
                </Table>
                </ScrollArea>
            </div>
            )}
          </div>
        </div>

        <DialogFooter className="flex-shrink-0 sm:justify-between items-center pt-4 border-t px-6 pb-6">
            <p className="text-sm text-muted-foreground">Ready to import: {parsedJobs.length} jobs.</p>
            <div>
              <Button type="button" variant="outline" onClick={() => setIsOpen(false)} className="mr-2">Cancel</Button>
              <Button onClick={handleSubmit} disabled={isSubmitting || isParsing || parsedJobs.length === 0}>
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle className="mr-2 h-4 w-4" />}
                Confirm and Import {parsedJobs.length} Jobs
              </Button>
            </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ImportJobsDialog;
