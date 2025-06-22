
"use client";

import React from 'react';
import type { Contract } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Repeat, User, MapPin, Calendar, Edit, Circle, CheckCircle, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface ContractListItemProps {
    contract: Contract;
    onEdit: (contract: Contract) => void;
}

const ContractListItem: React.FC<ContractListItemProps> = ({ contract, onEdit }) => {
    return (
        <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-4">
                <div className="flex justify-between items-start">
                    <div>
                        <CardTitle className="font-headline text-lg flex items-center gap-2">
                           <User className="h-4 w-4 text-muted-foreground" /> {contract.customerName}
                        </CardTitle>
                        <CardDescription className="flex items-center gap-2 mt-1">
                           <MapPin className="h-4 w-4" /> {contract.customerAddress}
                        </CardDescription>
                    </div>
                    <Badge variant={contract.isActive ? "secondary" : "destructive"}>
                        <Circle className={cn("mr-1.5 h-2.5 w-2.5 fill-current", contract.isActive ? "text-green-500" : "text-red-500")} />
                        {contract.isActive ? "Active" : "Inactive"}
                    </Badge>
                </div>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                    <h4 className="font-semibold text-xs text-muted-foreground mb-1">Job Title</h4>
                    <p>{contract.jobTemplate.title}</p>
                </div>
                 <div>
                    <h4 className="font-semibold text-xs text-muted-foreground mb-1">Frequency</h4>
                    <p className="flex items-center gap-1"><Repeat className="h-3.5 w-3.5"/>{contract.frequency}</p>
                </div>
                 <div>
                    <h4 className="font-semibold text-xs text-muted-foreground mb-1">Next Job Approx.</h4>
                     <p className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5"/>{contract.lastGeneratedUntil ? format(new Date(contract.lastGeneratedUntil), 'PPP') : format(new Date(contract.startDate), 'PPP')}</p>
                </div>
            </CardContent>
            <CardContent className="pt-2">
                <Button variant="outline" size="sm" onClick={() => onEdit(contract)}>
                    <Edit className="mr-2 h-4 w-4" /> Edit Contract
                </Button>
            </CardContent>
        </Card>
    );
};

export default ContractListItem;
