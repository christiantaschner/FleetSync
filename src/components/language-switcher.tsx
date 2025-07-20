
"use client";

import React from 'react';
import { useTranslation } from '@/hooks/use-language';
import { DropdownMenuItem, DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger } from '@/components/ui/dropdown-menu';
import { Check } from 'lucide-react';
import { DropdownMenuPortal } from '@radix-ui/react-dropdown-menu';

export const LanguageSwitcher = () => {
  const { language, setLanguage } = useTranslation();

  return (
    <DropdownMenuSub>
      <DropdownMenuSubTrigger>
        <span className="flex items-center gap-2">
          <span className="w-5 text-center font-semibold">{language.toUpperCase()}</span>
          <span>Language</span>
        </span>
      </DropdownMenuSubTrigger>
      <DropdownMenuPortal>
        <DropdownMenuSubContent>
          <DropdownMenuItem onClick={() => setLanguage('en')}>
            <span className="flex items-center">
              {language === 'en' && <Check className="mr-2 h-4 w-4" />}
              English
            </span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setLanguage('de')}>
            <span className="flex items-center">
              {language === 'de' && <Check className="mr-2 h-4 w-4" />}
              Deutsch
            </span>
          </DropdownMenuItem>
        </DropdownMenuSubContent>
      </DropdownMenuPortal>
    </DropdownMenuSub>
  );
};
