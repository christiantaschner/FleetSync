
"use client";

import * as React from "react";
import { Check, ChevronsUpDown } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";

export interface MultiSelectOption {
  value: string;
  label: string;
}

interface MultiSelectFilterProps {
  options: MultiSelectOption[];
  selected: string[];
  onChange: (selected: string[]) => void;
  placeholder: string;
  className?: string;
}

export function MultiSelectFilter({
  options,
  selected,
  onChange,
  placeholder,
  className,
}: MultiSelectFilterProps) {
  const [open, setOpen] = React.useState(false);

  const handleSelectAll = (checked: boolean | 'indeterminate') => {
    onChange(checked === true ? options.map((option) => option.value) : []);
  };
  
  const allSelected = selected.length === options.length;
  const someSelected = selected.length > 0 && selected.length < options.length;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between", className)}
        >
          <span className="truncate">
            {selected.length === 0
              ? placeholder
              : selected.length === 1
              ? options.find((o) => o.value === selected[0])?.label
              : `${selected.length} selected`}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
        <Command>
          <CommandInput placeholder="Search options..." />
          <CommandList>
            <CommandEmpty>No options found.</CommandEmpty>
            <CommandGroup>
                <CommandItem onSelect={() => {}}>
                    <div
                        className="flex w-full items-center space-x-2"
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleSelectAll(!allSelected);
                        }}
                    >
                         <Checkbox 
                            checked={allSelected ? true : someSelected ? 'indeterminate' : false}
                         />
                         <label
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                            Select All
                        </label>
                    </div>
                </CommandItem>
              {options.map((option) => (
                <CommandItem
                  key={option.value}
                  onSelect={() => {}} // Prevent closing on select
                >
                  <div
                    className="flex w-full items-center space-x-2"
                     onClick={(e) => {
                       e.preventDefault();
                       e.stopPropagation();
                       const newSelected = selected.includes(option.value)
                         ? selected.filter((s) => s !== option.value)
                         : [...selected, option.value];
                       onChange(newSelected);
                     }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        selected.includes(option.value) ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <span>{option.label}</span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
