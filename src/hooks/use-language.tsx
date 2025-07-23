
"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import de from '@/lib/locales/de.json';
import en from '@/lib/locales/en.json';
import fr from '@/lib/locales/fr.json';

type Language = 'de' | 'en' | 'fr';

const translations = { de, en, fr };

interface LanguageContextType {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguage] = useState<Language>('en');

  useEffect(() => {
    const storedLang = localStorage.getItem('fleetsync_lang') as Language | null;
    if (storedLang && ['en', 'de', 'fr'].includes(storedLang)) {
      setLanguage(storedLang);
    } else if (typeof navigator !== 'undefined') {
      // If no language is stored, detect from browser
      const browserLang = navigator.language.split('-')[0];
      if (browserLang === 'de') {
        setLanguage('de');
      } else if (browserLang === 'fr') {
        setLanguage('fr');
      } else {
        setLanguage('en');
      }
    }
  }, []);

  const handleSetLanguage = (lang: Language) => {
    setLanguage(lang);
    localStorage.setItem('fleetsync_lang', lang);
  };
  
  const t = useCallback((key: string): string => {
    return translations[language][key as keyof typeof translations[Language]] || key;
  }, [language]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage: handleSetLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useTranslation = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useTranslation must be used within a LanguageProvider');
  }
  return context;
};
