import React from 'react';
import { Languages } from 'lucide-react';
import type { Language } from '../types/api';

interface LanguageToggleProps {
  language: Language;
  onLanguageChange: (lang: Language) => void;
}

export const LanguageToggle: React.FC<LanguageToggleProps> = ({
  language,
  onLanguageChange,
}) => {
  return (
    <div className="inline-flex items-center p-1 bg-slate-100/90 border border-slate-200/90 rounded-xl shadow-inner text-xs font-medium">
      <div className="flex items-center px-2 py-1 text-slate-500 mr-1 hidden sm:flex">
        <Languages className="w-3.5 h-3.5 mr-1 text-slate-500" />
        <span>Language:</span>
      </div>
      <button
        type="button"
        id="lang-en-btn"
        onClick={() => onLanguageChange('en')}
        className={`px-3 py-1.5 rounded-lg transition-all duration-150 flex items-center gap-1.5 ${
          language === 'en'
            ? 'bg-white text-indigo-700 font-semibold shadow-xs border border-slate-200/80'
            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
        }`}
        aria-pressed={language === 'en'}
      >
        <span className="text-[11px] font-bold tracking-wide">EN</span>
        <span>English</span>
      </button>
      <button
        type="button"
        id="lang-hi-btn"
        onClick={() => onLanguageChange('hi')}
        className={`px-3 py-1.5 rounded-lg transition-all duration-150 flex items-center gap-1.5 ${
          language === 'hi'
            ? 'bg-white text-indigo-700 font-semibold shadow-xs border border-slate-200/80'
            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
        }`}
        aria-pressed={language === 'hi'}
      >
        <span className="text-[11px] font-bold tracking-wide">हि</span>
        <span>हिन्दी</span>
      </button>
    </div>
  );
};
