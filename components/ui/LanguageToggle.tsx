
import React from 'react';
import { useSettings } from '../../hooks/useSettings';

export const LanguageToggle: React.FC = () => {
  const { settings, updateSettings } = useSettings();

  const toggleLanguage = () => {
    const nextLang = settings.lang === 'ar' ? 'en' : 'ar';
    updateSettings({ lang: nextLang });
  };

  return (
    <button
      onClick={toggleLanguage}
      className={`fixed bottom-24 ${settings.lang === 'ar' ? 'left-6' : 'right-6'} z-[60] px-4 py-2 bg-brand text-white font-black rounded-full shadow-lg hover:scale-105 active:scale-95 transition-all text-sm`}
    >
      {settings.lang === 'ar' ? 'EN' : 'عربي'}
    </button>
  );
};
