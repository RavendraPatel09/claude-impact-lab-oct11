import React from 'react';
import { BookOpen, ExternalLink, X, FileText, CheckCircle2, AlertTriangle } from 'lucide-react';
import type { Language } from '../types/api';
import { sourceMetadata } from '../services/api';

interface SourceCoverageModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
}

export const SourceCoverageModal: React.FC<SourceCoverageModalProps> = ({
  isOpen,
  onClose,
  language,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-2xl max-w-2xl w-full border border-slate-200 shadow-elevated overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-100 text-indigo-700 rounded-xl shadow-2xs">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">
                {language === 'hi' ? 'डेटा स्रोत एवं विधिक कवरेज विवरण' : 'Source Document & Coverage Metadata'}
              </h3>
              <p className="text-xs text-slate-500">
                {language === 'hi' ? 'आधिकारिक स्रोत एवं संशोधन सीमाएं' : 'Data provenance, Gazettes & Limitations'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs sm:text-sm">
          {/* Active Baseline Document */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
            <div className="flex items-center gap-2 text-indigo-900 font-bold text-xs uppercase tracking-wider">
              <CheckCircle2 className="w-4 h-4 text-indigo-600" />
              <span>{language === 'hi' ? 'सक्रिय विधिक आधारशिला:' : 'Primary Ground Truth Rulebook:'}</span>
            </div>
            <p className="text-slate-800 font-semibold text-base">{sourceMetadata.title}</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 text-xs">
              <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                <span className="text-slate-400 block text-[10px]">Consolidated Through</span>
                <span className="font-bold text-slate-800">{sourceMetadata.consolidation_date}</span>
              </div>
              <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                <span className="text-slate-400 block text-[10px]">Total Rules</span>
                <span className="font-bold text-slate-800">{sourceMetadata.total_rules} Rules</span>
              </div>
              <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                <span className="text-slate-400 block text-[10px]">PDF Extent</span>
                <span className="font-bold text-slate-800">{sourceMetadata.total_pages} Pages</span>
              </div>
              <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                <span className="text-slate-400 block text-[10px]">Authority</span>
                <span className="font-bold text-slate-800">MP Town & Country Planning</span>
              </div>
            </div>
          </div>

          {/* CRITICAL AMENDMENT CUTOFF ALERT */}
          <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-950 space-y-2">
            <div className="flex items-center gap-2 text-amber-800 font-bold text-xs uppercase tracking-wider">
              <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
              <span>{language === 'hi' ? 'महत्वपूर्ण संशोधन सीमा (28 अगस्त 2026):' : 'Important Post-Cutoff Amendment (28 Aug 2026):'}</span>
            </div>
            <p className="text-xs leading-relaxed">
              The consolidated official English and Hindi rulebooks supplied for this hackathon are updated through <strong>6 March 2025</strong>. 
            </p>
            <p className="text-xs leading-relaxed">
              On <strong>28 August 2026</strong>, the Government of Madhya Pradesh published an amendment to <strong>Rule 2(5)(c)</strong> concerning separate development permission for residential plots up to 500 sq. m. in approved layouts. 
            </p>
            <p className="text-xs font-semibold text-amber-900 bg-amber-100/70 p-2.5 rounded-lg border border-amber-300">
              ⚠️ This amendment is <strong>not included</strong> in the supplied dataset. When answering questions regarding plots up to 500 sq m or post-cutoff regulations, Bhumi Vikas Sahayak clearly warns the counter clerk rather than fabricating or assuming unverified rules.
            </p>
          </div>

          {/* Official Download Links */}
          <div className="space-y-2">
            <h4 className="font-bold text-slate-700 text-xs uppercase tracking-wider">
              {language === 'hi' ? 'आधिकारिक मूल राजपत्र लिंक:' : 'Official Gazette Rulebook Downloads:'}
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <a
                href={sourceMetadata.pdf_links.en}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 transition-colors group"
              >
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-indigo-600" />
                  <span className="font-medium text-xs text-slate-800">English PDF (Consolidated to 06-03-2025)</span>
                </div>
                <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-600" />
              </a>

              <a
                href={sourceMetadata.pdf_links.hi}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 transition-colors group"
              >
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-indigo-600" />
                  <span className="font-medium text-xs text-slate-800">Hindi PDF (Consolidated to 06-03-2025)</span>
                </div>
                <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-600" />
              </a>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white font-medium text-xs rounded-xl shadow-xs"
          >
            {language === 'hi' ? 'बंद करें' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};
