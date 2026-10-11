import React, { useEffect, useState } from 'react';
import { BookOpen, Search, Scale, FileCheck2 } from 'lucide-react';
import type { Language } from '../types/api';

interface LoadingStateProps {
  language: Language;
}

export const LoadingState: React.FC<LoadingStateProps> = ({ language }) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  const stepsEn = [
    { label: 'Parsing building terminology and query intent...', icon: Search },
    { label: 'Retrieving relevant provisions from MP Bhumi Vikas Rules (105 Rules)...', icon: BookOpen },
    { label: 'Cross-verifying tables, setbacks & March 2025 cutoff...', icon: Scale },
    { label: 'Formulating grounded answer with verifiable citations...', icon: FileCheck2 },
  ];

  const stepsHi = [
    { label: 'भवन निर्माण शब्दावली और प्रश्न के संदर्भ का विश्लेषण...', icon: Search },
    { label: 'म.प्र. भूमि विकास नियम 2012 (105 नियम) में संबंधित धाराओं की खोज...', icon: BookOpen },
    { label: 'तालिकाओं, सेटबैक एवं 6 मार्च 2025 की कट-ऑफ का सत्यापन...', icon: Scale },
    { label: 'सटीक नियम एवं पृष्ठ संख्या सहित प्रमाणित उत्तर तैयार किया जा रहा है...', icon: FileCheck2 },
  ];

  const steps = language === 'hi' ? stepsHi : stepsEn;

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStepIndex((prev) => (prev < steps.length - 1 ? prev + 1 : prev));
    }, 450);
    return () => clearInterval(interval);
  }, [steps.length]);

  return (
    <div className="w-full bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-8 shadow-card text-center my-6 animate-fadeIn">
      <div className="inline-flex items-center justify-center p-3.5 bg-indigo-50 text-indigo-600 rounded-2xl mb-4 ring-8 ring-indigo-50/60 animate-pulse">
        <BookOpen className="w-7 h-7" />
      </div>

      <h3 className="text-lg font-bold text-slate-800 mb-1">
        {language === 'hi' ? 'आधिकारिक नियमों की जांच की जा रही है...' : 'Consulting Official Building Regulations...'}
      </h3>
      <p className="text-xs text-slate-500 mb-6 max-w-md mx-auto">
        {language === 'hi'
          ? 'मध्य प्रदेश भूमि विकास नियम, 2012 (108 पृष्ठ) के साक्ष्यों से मिलान जारी है।'
          : 'Searching 108 pages & 105 numbered rules of MP Bhumi Vikas Rules, 2012.'}
      </p>

      {/* Progress steps */}
      <div className="max-w-md mx-auto space-y-2.5 text-left">
        {steps.map((step, idx) => {
          const Icon = step.icon;
          const isDone = idx < currentStepIndex;
          const isCurrent = idx === currentStepIndex;

          return (
            <div
              key={idx}
              className={`flex items-center gap-3 p-2.5 rounded-xl border text-xs transition-all duration-300 ${
                isCurrent
                  ? 'bg-indigo-50/80 border-indigo-300 text-indigo-950 font-semibold shadow-xs scale-[1.01]'
                  : isDone
                  ? 'bg-slate-50/80 border-slate-200/60 text-slate-600'
                  : 'opacity-40 border-transparent text-slate-400'
              }`}
            >
              <div
                className={`w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 text-xs transition-colors ${
                  isCurrent
                    ? 'bg-indigo-600 text-white animate-bounce'
                    : isDone
                    ? 'bg-indigo-100 text-indigo-700 font-bold'
                    : 'bg-slate-100 text-slate-400'
                }`}
              >
                {isDone ? '✓' : <Icon className="w-3.5 h-3.5" />}
              </div>
              <span className="flex-1 truncate">{step.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
