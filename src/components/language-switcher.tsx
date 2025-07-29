
"use client";

import React from 'react';
import { useTranslation } from '@/hooks/use-language';
import { DropdownMenuItem, DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger } from '@/components/ui/dropdown-menu';
import { Check, Globe } from 'lucide-react';
import { DropdownMenuPortal } from '@radix-ui/react-dropdown-menu';

export const LanguageSwitcher = () => {
  const { language, setLanguage } = useTranslation();

  return (
    <DropdownMenuSub>
      <DropdownMenuSubTrigger>
        <span className="flex items-center gap-2">
           <Globe className="h-4 w-4" />
          <span>Language</span>
        </span>
      </DropdownMenuSubTrigger>
      <DropdownMenuPortal>
        <DropdownMenuSubContent>
          <DropdownMenuItem onClick={() => setLanguage('en')}>
            <span className="flex items-center w-full">
              {language === 'en' && <Check className="mr-2 h-4 w-4" />}
              English
            </span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setLanguage('de')}>
            <span className="flex items-center w-full">
              {language === 'de' && <Check className="mr-2 h-4 w-4" />}
              Deutsch
            </span>
          </DropdownMenuItem>
           <DropdownMenuItem onClick={() => setLanguage('fr')}>
            <span className="flex items-center w-full">
              {language === 'fr' && <Check className="mr-2 h-4 w-4" />}
              Français
            </span>
          </DropdownMenuItem>
        </DropdownMenuSubContent>
      </DropdownMenuPortal>
    </DropdownMenuSub>
  );
};
