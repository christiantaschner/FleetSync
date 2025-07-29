
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

  const handleToggleOption = (value: string) => {
    const newSelected = selected.includes(value)
      ? selected.filter((s) => s !== value)
      : [...selected, value];
    onChange(newSelected);
  };

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
          <CommandList>
            <CommandEmpty>No options found.</CommandEmpty>
            <CommandGroup>
                <div
                    className="relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-secondary"
                    onClick={() => handleSelectAll(!allSelected)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                             e.preventDefault();
                            handleSelectAll(!allSelected);
                        }
                    }}
                    tabIndex={0}
                >
                    <Checkbox 
                        checked={allSelected ? true : someSelected ? 'indeterminate' : false}
                        className="mr-2"
                    />
                    <label className="text-sm font-medium leading-none cursor-pointer">
                        Select All
                    </label>
                </div>
              {options.map((option) => (
                <div
                  key={option.value}
                  className="relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-secondary"
                  onClick={() => handleToggleOption(option.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      handleToggleOption(option.value);
                    }
                  }}
                  tabIndex={0}
                >
                  <div
                    className="flex w-full items-center space-x-2"
                  >
                    <Check
                      className={cn(
                        "h-4 w-4",
                        selected.includes(option.value) ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <span className="cursor-pointer">{option.label}</span>
                  </div>
                </div>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
