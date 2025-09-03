
"use client";

import React from 'react';
import type { Job } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, UserCircle, Briefcase, ListChecks, Calendar, Clock, Construction, Camera, Bot, FileSignature, Star, ThumbsUp, ThumbsDown, DollarSign, MessageSquare } from 'lucide-react';
import { format } from 'date-fns';
import Image from 'next/image';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';

interface JobDetailsDisplayProps {
    job: Job;
}

const JobDetailsDisplay: React.FC<JobDetailsDisplayProps> = ({ job }) => {
    
    const getStatusBadgeVariant = (status: Job['status']): "default" | "secondary" | "destructive" | "outline" => {
        switch(status) {
            case 'Completed': return 'secondary';
            case 'Cancelled': return 'destructive';
            case 'In Progress':
            case 'En Route': return 'default';
            default: return 'outline';
        }
    }
    
    const getPriorityBadgeVariant = (priority: Job['priority']): "default" | "secondary" | "destructive" | "outline" => {
        if (priority === 'High') return 'destructive';
        if (priority === 'Medium') return 'default';
        return 'secondary';
    }
    
    const satisfactionIcons = [
        { icon: ThumbsDown, color: 'text-red-500', label: 'Poor' },
        { icon: Star, color: 'text-orange-400', label: 'Fair' },
        { icon: Star, color: 'text-yellow-400', label: 'Good' },
        { icon: Star, color: 'text-lime-500', label: 'Very Good' },
        { icon: ThumbsUp, color: 'text-green-500', label: 'Excellent' }
    ];

    return (
        <Card className="shadow-lg">
            <CardHeader>
                <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-2">
                    <div>
                        <CardTitle className="text-2xl font-bold font-headline">{job.title}</CardTitle>
                        <CardDescription className="text-base flex items-center gap-2 mt-1">
                            <MapPin className="h-4 w-4" /> {job.location.address || `Lat: ${job.location.latitude}, Lon: ${job.location.longitude}`}
                        </CardDescription>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                        <Badge variant={getStatusBadgeVariant(job.status)} className="capitalize">{job.status}</Badge>
                        <Badge variant={getPriorityBadgeVariant(job.priority)}>{job.priority}</Badge>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                     <div className="flex items-center gap-3">
                        <UserCircle className="h-6 w-6 text-muted-foreground" />
                        <div>
                            <p className="text-muted-foreground text-xs">Customer</p>
                            <p className="font-medium">{job.customerName}</p>
                            <p className="text-xs">{job.customerPhone || 'No phone'}</p>
                        </div>
                    </div>
                    {job.scheduledTime && (
                         <div className="flex items-center gap-3">
                            <Calendar className="h-6 w-6 text-muted-foreground" />
                            <div>
                                <p className="text-muted-foreground text-xs">Scheduled Time</p>
                                <p className="font-medium">{format(new Date(job.scheduledTime), 'PPp')}</p>
                            </div>
                        </div>
                    )}
                </div>
                 <div>
                    <h3 className="text-sm font-semibold mb-1 flex items-center gap-1.5"><Briefcase className="h-4 w-4"/>Job Description</h3>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">{job.description}</p>
                </div>
                {job.requiredSkills && job.requiredSkills.length > 0 && (
                     <div>
                        <h3 className="text-sm font-semibold mb-2 flex items-center gap-1.5"><ListChecks className="h-4 w-4"/>Required Skills</h3>
                        <div className="flex flex-wrap gap-2">
                            {job.requiredSkills.map(skill => (
                                <Badge key={skill} variant="secondary">{skill}</Badge>
                            ))}
                        </div>
                    </div>
                )}
                
                {(job.quotedValue || job.expectedPartsCost || job.profitScore) && (
                     <>
                        <Separator />
                        <div>
                            <h3 className="text-sm font-semibold mb-2 flex items-center gap-1.5"><DollarSign className="h-4 w-4"/>Financials</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-center">
                                <div className="p-2 bg-secondary/50 rounded-md border">
                                    <p className="text-xs text-muted-foreground">Quoted Value</p>
                                    <p className="font-bold text-lg">${job.quotedValue?.toFixed(2) || '0.00'}</p>
                                </div>
                                <div className="p-2 bg-secondary/50 rounded-md border">
                                    <p className="text-xs text-muted-foreground">Parts Cost</p>
                                    <p className="font-bold text-lg">${job.expectedPartsCost?.toFixed(2) || '0.00'}</p>
                                </div>
                                <div className="p-2 bg-secondary/50 rounded-md border">
                                    <p className="text-xs text-muted-foreground">Est. Profit Score</p>
                                    <p className="font-bold text-lg text-green-600">${job.profitScore?.toFixed(2) || 'N/A'}</p>
                                </div>
                            </div>
                        </div>
                    </>
                )}
                
                {(job.aiIdentifiedModel || (job.aiSuggestedParts && job.aiSuggestedParts.length > 0) || job.aiRepairGuide || (job.triageImages && job.triageImages.length > 0)) && (
                    <>
                        <Separator />
                        <div>
                            <h3 className="text-sm font-semibold mb-2 flex items-center gap-1.5"><Bot className="h-4 w-4"/> AI Triage Analysis</h3>
                            {job.triageImages && job.triageImages.length > 0 && (
                                <div className="mb-3">
                                    <h4 className="text-xs font-semibold mb-1 text-muted-foreground">Customer Photos</h4>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                                        {job.triageImages.map((photoUrl, index) => (
                                            <a href={photoUrl} key={index} target="_blank" rel="noopener noreferrer">
                                                <div className="relative aspect-square rounded-md overflow-hidden border transition-transform hover:scale-105">
                                                    <Image src={photoUrl} alt={`Triage photo ${index + 1}`} layout="fill" objectFit="cover" />
                                                </div>
                                            </a>
                                        ))}
                                    </div>
                                </div>
                            )}
                            <div className="space-y-2 text-sm p-3 bg-secondary/50 rounded-md border">
                                <p><strong>Identified Model:</strong> {job.aiIdentifiedModel || 'Not identified'}</p>
                                <p><strong>Suggested Parts:</strong> {job.aiSuggestedParts?.join(', ') || 'None'}</p>
                                {job.aiRepairGuide && <div><p><strong>Repair Guide:</strong></p><p className="whitespace-pre-wrap text-muted-foreground text-xs italic">{job.aiRepairGuide}</p></div>}
                            </div>
                        </div>
                    </>
                )}

                {job.notes && (
                    <>
                        <Separator />
                        <div>
                            <h3 className="text-sm font-semibold mb-1 flex items-center gap-1.5"><Construction className="h-4 w-4"/>Technician's Notes</h3>
                            <p className="text-sm text-muted-foreground whitespace-pre-wrap p-3 bg-secondary/50 rounded-md border">{job.notes}</p>
                        </div>
                    </>
                )}

                {job.photos && job.photos.length > 0 && (
                     <>
                        <Separator />
                        <div>
                            <h3 className="text-sm font-semibold mb-2 flex items-center gap-1.5"><Camera className="h-4 w-4"/>Technician's Photos</h3>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                                {job.photos.map((photoUrl, index) => (
                                    <a href={photoUrl} key={index} target="_blank" rel="noopener noreferrer">
                                        <div className="relative aspect-square rounded-md overflow-hidden border transition-transform hover:scale-105">
                                            <Image src={photoUrl} alt={`Job photo ${index + 1}`} layout="fill" objectFit="cover" />
                                        </div>
                                    </a>
                                ))}
                            </div>
                        </div>
                    </>
                )}
                
                {(job.customerSignatureUrl || typeof job.customerSatisfactionScore === 'number') && (
                    <>
                        <Separator />
                        <div>
                           <h3 className="text-sm font-semibold mb-2 flex items-center gap-1.5"><FileSignature className="h-4 w-4"/>Completion Details</h3>
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {job.customerSignatureUrl && (
                                    <div>
                                        <h4 className="text-xs font-semibold mb-1 text-muted-foreground">Customer Signature</h4>
                                        <a href={job.customerSignatureUrl} target="_blank" rel="noopener noreferrer">
                                            <div className="border rounded-md bg-white p-2 flex justify-center items-center">
                                                <Image src={job.customerSignatureUrl} alt="Customer Signature" width={200} height={100} style={{ objectFit: 'contain' }} />
                                            </div>
                                        </a>
                                        {job.customerSignatureTimestamp && <p className="text-xs text-muted-foreground mt-1">Signed on: {format(new Date(job.customerSignatureTimestamp), 'PPp')}</p>}
                                    </div>
                                )}
                                {typeof job.customerSatisfactionScore === 'number' && job.customerSatisfactionScore > 0 && (
                                    <div>
                                        <h4 className="text-xs font-semibold mb-1 text-muted-foreground">Customer Satisfaction</h4>
                                        <div className="flex items-center gap-2 p-3 border rounded-md">
                                            {React.createElement(satisfactionIcons[job.customerSatisfactionScore - 1].icon, {
                                                className: `h-8 w-8 ${satisfactionIcons[job.customerSatisfactionScore - 1].color}`
                                            })}
                                            <span className="font-bold text-lg">{job.customerSatisfactionScore}/5</span>
                                            <span className="text-muted-foreground">({satisfactionIcons[job.customerSatisfactionScore - 1].label})</span>
                                        </div>
                                    </div>
                                )}
                           </div>
                        </div>
                    </>
                )}
                
                {typeof job.isFirstTimeFix === 'boolean' && (
                     <>
                        <Separator />
                        <div>
                           <h3 className="text-sm font-semibold mb-2 flex items-center gap-1.5"><ThumbsUp className="h-4 w-4"/>Follow-up Information</h3>
                            <div className="space-y-2 text-sm p-3 bg-secondary/50 rounded-md border">
                                <p><strong>First-Time Fix:</strong> {job.isFirstTimeFix ? 'Yes' : 'No'}</p>
                                {!job.isFirstTimeFix && job.reasonForFollowUp && (
                                    <p><strong>Reason for Follow-up:</strong> {job.reasonForFollowUp}</p>
                                )}
                            </div>
                        </div>
                    </>
                )}

                {job.status === 'Completed' && job.notes && (
                    <>
                       <Separator />
                        <div>
                           <h3 className="text-sm font-semibold mb-2 flex items-center gap-1.5"><Bot className="h-4 w-4"/> AI Customer Follow-up</h3>
                            <div className="space-y-2 text-sm p-3 bg-secondary/50 rounded-md border">
                                <p className="text-muted-foreground text-xs">Based on the technician's notes, generate a personalized thank you message for the customer, including any relevant maintenance tips.</p>
                                <Button size="sm" variant="accent">
                                    <MessageSquare className="mr-2 h-4 w-4"/>
                                    Generate Follow-up Message
                                </Button>
                            </div>
                        </div>
                    </>
                )}
            </CardContent>
        </Card>
    );
};

export default JobDetailsDisplay;
