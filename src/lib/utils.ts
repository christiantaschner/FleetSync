import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { addWeeks, addMonths, addDays, type Contract } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const getNextDueDate = (contract: Contract): Date => {
    const baseDate = new Date(contract.lastGeneratedUntil || contract.startDate);
    switch (contract.frequency) {
        case 'Weekly': return addWeeks(baseDate, 1);
        case 'Bi-Weekly': return addWeeks(baseDate, 2);
        case 'Monthly': return addMonths(baseDate, 1);
        case 'Quarterly': return addMonths(baseDate, 3);
        case 'Semi-Annually': return addMonths(baseDate, 6);
        case 'Annually': return addMonths(baseDate, 12);
        default: return baseDate;
    }
};
