import React from 'react';
import { AlertOctagon, RefreshCw, Zap } from 'lucide-react';
import type { Language } from '../types/api';

interface ErrorStateProps {
  message: string;
  onRetry: () => void;
  onSwitchToDemo: () => void;
  language: Language;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  message,
  onRetry,
  onSwitchToDemo,
  language,
}) => {
  return (
    <div className="w-full bg-white rounded-2xl border border-rose-200/90 p-6 sm:p-8 shadow-card text-center my-6">
      <div className="inline-flex items-center justify-center p-3.5 bg-rose-50 text-rose-600 rounded-2xl mb-4 ring-8 ring-rose-50/50">
        <AlertOctagon className="w-7 h-7" />
      </div>

      <h3 className="text-lg font-bold text-slate-800 mb-1">
        {language === 'hi' ? 'क्वेरी निष्पादन में समस्या आई' : 'Unable to Complete Rule Verification'}
      </h3>

      <p className="text-xs sm:text-sm text-slate-600 mb-6 max-w-md mx-auto">
        {message ||
          (language === 'hi'
            ? 'सर्वर से संपर्क करने में असमर्थ। कृपया बैकएंड की स्थिति की जाँच करें अथवा पुनः प्रयास करें।'
            : 'Could not connect to the backend server. You can retry the request or switch to standalone verification mode.')}
      </p>

      <div className="flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold text-white bg-slate-800 hover:bg-slate-900 shadow-sm transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>{language === 'hi' ? 'पुनः प्रयास करें' : 'Retry Request'}</span>
        </button>

        <button
          type="button"
          onClick={onSwitchToDemo}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold text-indigo-800 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 shadow-xs hover:-translate-y-0.5 active:translate-y-0 transition-all"
        >
          <Zap className="w-3.5 h-3.5 text-indigo-600" />
          <span>{language === 'hi' ? 'ऑफ़लाइन सत्यापन मोड चालू करें' : 'Use Standalone Demo Engine'}</span>
        </button>
      </div>
    </div>
  );
};
