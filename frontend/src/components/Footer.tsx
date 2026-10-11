import React from 'react';
import { ShieldAlert, BookOpen, ExternalLink, Calendar } from 'lucide-react';
import type { Language } from '../types/api';

interface FooterProps {
  language: Language;
  onOpenCoverage: () => void;
}

export const Footer: React.FC<FooterProps> = ({ language, onOpenCoverage }) => {
  return (
    <footer className="bg-slate-900 text-slate-400 text-xs mt-16 border-t border-slate-800">
      <div className="w-full px-4 sm:px-6 lg:px-10 py-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pb-8 border-b border-slate-800">
          {/* Col 1: About */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-white font-bold text-sm">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-500"></span>
              <span>{language === 'hi' ? 'भूमि विकास सहायक' : 'Bhumi Vikas Sahayak'}</span>
            </div>
            <p className="text-slate-400 text-xs leading-relaxed">
              {language === 'hi'
                ? 'भोपाल नगर निगम भवन अनुमति काउंटर के लिए निर्णय समर्थन प्रणाली। 108 पृष्ठों के म.प्र. भूमि विकास नियम, 2012 के सत्यापित पाठ एवं तालिकाओं पर आधारित।'
                : 'Decision support tool for the Bhopal Municipal Corporation building-permission counter. Grounds every regulatory answer in the 108-page MP Bhumi Vikas Rules, 2012.'}
            </p>
            <div className="flex items-center gap-2 text-[11px] text-indigo-400">
              <Calendar className="w-3.5 h-3.5" />
              <span>Consolidated Dataset Cutoff: 06 March 2025</span>
            </div>
          </div>

          {/* Col 2: Legal Disclaimer */}
          <div className="space-y-3">
            <div className="flex items-center gap-1.5 text-amber-400 font-bold text-xs uppercase tracking-wider">
              <ShieldAlert className="w-4 h-4 text-amber-500" />
              <span>{language === 'hi' ? 'सूचनात्मक अस्वीकरण' : 'Informational Use Notice'}</span>
            </div>
            <p className="text-slate-400 text-xs leading-relaxed">
              {language === 'hi'
                ? 'यह उपकरण केवल सूचनात्मक एवं मार्गदर्शन हेतु है। यह आधिकारिक भवन स्वीकृति अथवा कानूनी परामर्श नहीं है। अंतिम निर्णय सक्षम प्राधिकारी (भोपाल नगर निगम / नगर एवं ग्राम निवेश) द्वारा ही लिया जाएगा।'
                : 'Answers are based on the source documents currently available in this system. This tool is an informational assistant, not official building approval or legal advice. The clerk and competent authority make all final determinations.'}
            </p>
            <button
              type="button"
              onClick={onOpenCoverage}
              className="text-indigo-400 hover:text-indigo-300 underline text-xs inline-flex items-center gap-1 transition-colors"
            >
              <span>{language === 'hi' ? 'संशोधन सीमाएं एवं 28 अगस्त 2026 सूचना देखें' : 'Inspect 28 Aug 2026 amendment details'}</span>
              <ExternalLink className="w-3 h-3" />
            </button>
          </div>

          {/* Col 3: Event & Open Source info */}
          <div className="space-y-3">
            <div className="flex items-center gap-1.5 text-white font-bold text-xs uppercase tracking-wider">
              <BookOpen className="w-4 h-4 text-indigo-400" />
              <span>Initiative & Collaboration</span>
            </div>
            <p className="text-slate-400 text-xs leading-relaxed">
              Track 1: Bhumi Vikas Sahayak · Claude Impact Lab × Cerebras Café Compute, Bhopal. Built for the Government of Madhya Pradesh & MPSeDC.
            </p>
            <p className="text-[11px] text-slate-500">
              Open source for public benefit under MIT License.
            </p>
          </div>
        </div>

        {/* Bottom copyright line */}
        <div className="pt-6 flex flex-wrap items-center justify-between gap-4 text-[11px] text-slate-500">
          <p>© 2026 Bhopal Impact Lab · SSR Global Skills Park, Bhopal, Madhya Pradesh</p>
          <div className="flex items-center gap-4">
            <span>Rulebook: MP Bhumi Vikas Rules 2012</span>
            <span>Language: English & हिन्दी</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
