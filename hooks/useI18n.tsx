
import React, { createContext, useState, useContext, ReactNode, useCallback } from 'react';
import { TRANSLATIONS, LANGUAGES } from '../constants';

type LanguageCode = 'en' | 'de' | 'zh' | 'es' | 'ja';

interface I18nContextType {
  language: LanguageCode;
  setLanguage: (lang: LanguageCode) => void;
  t: (key: string) => string;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export const I18nProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<LanguageCode>('en');

  const t = useCallback((key: string): string => {
    return TRANSLATIONS[language]?.[key] || TRANSLATIONS['en']?.[key] || key;
  }, [language]);

  const handleSetLanguage = (lang: LanguageCode) => {
    if (LANGUAGES.some(l => l.code === lang)) {
      setLanguage(lang);
    }
  };

  return (
    <I18nContext.Provider value={{ language, setLanguage: handleSetLanguage, t }}>
      {children}
    </I18nContext.Provider>
  );
};

export const useI18n = () => {
  const context = useContext(I18nContext);
  if (context === undefined) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
};
