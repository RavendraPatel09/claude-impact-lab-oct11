import React, { useState } from 'react';
import type { Citation, Language } from '../types/api';
import { ChevronDown, ChevronUp, FileText, ExternalLink, Bookmark } from 'lucide-react';

interface SourceViewerProps {
  citations: Citation[];
  language: Language;
  onOpenRuleDetail?: (ruleNum: string) => void;
}

export const SourceViewer: React.FC<SourceViewerProps> = ({
  citations,
  language,
  onOpenRuleDetail,
}) => {
  const [expandedIndices, setExpandedIndices] = useState<Record<number, boolean>>({
    0: true,
  });

  if (!citations || citations.length === 0) {
    return null;
  }

  const toggleExpand = (index: number) => {
    setExpandedIndices((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  return (
    <div className="w-full mt-6">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Bookmark className="w-4 h-4 text-indigo-600" />
          <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
            {language === 'hi' ? 'प्रमाणित कानूनी स्रोत एवं उद्धरण' : 'Verified Legal Sources & Citations'}
          </h4>
        </div>
        <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 font-mono">
          {citations.length} {citations.length === 1 ? 'Rule Cited' : 'Rules Cited'}
        </span>
      </div>

      <div className="space-y-3">
        {citations.map((cite, idx) => {
          const isExpanded = !!expandedIndices[idx];

          return (
            <div
              key={idx}
              className="bg-white rounded-xl border border-slate-200/90 shadow-card overflow-hidden transition-all duration-200 hover:border-slate-300"
            >
              {/* Header / Clickable row */}
              <button
                type="button"
                onClick={() => toggleExpand(idx)}
                className="w-full px-4 py-3 bg-slate-50/70 hover:bg-slate-100/70 text-left flex items-center justify-between gap-3 transition-colors"
                aria-expanded={isExpanded}
              >
                <div className="flex items-center gap-2.5 flex-wrap flex-1">
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-900 text-white font-mono text-xs font-bold tracking-tight shadow-xs">
                    Rule {cite.rule}
                  </span>

                  {cite.title && (
                    <span className="text-xs sm:text-sm font-semibold text-slate-800 line-clamp-1">
                      {cite.title}
                    </span>
                  )}

                  {(cite.page_start || cite.page_end) && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-600 bg-white px-2 py-0.5 rounded border border-slate-200/80">
                      <FileText className="w-3 h-3 text-slate-400" />
                      <span>
                        PDF Page {cite.page_start}
                        {cite.page_end && cite.page_end !== cite.page_start
                          ? ` - ${cite.page_end}`
                          : ''}
                      </span>
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1 text-slate-400">
                  <span className="text-[11px] text-slate-500 hidden sm:inline">
                    {isExpanded ? (language === 'hi' ? 'संक्षिप्त करें' : 'Collapse') : (language === 'hi' ? 'उद्धरण देखें' : 'Inspect Excerpt')}
                  </span>
                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4 text-slate-600" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-600" />
                  )}
                </div>
              </button>

              {/* Collapsible Content */}
              {isExpanded && (
                <div className="p-4 bg-white border-t border-slate-100 space-y-3 animate-fadeIn">
                  <div>
                    <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                      <span>{language === 'hi' ? 'आधिकारिक मूल उद्धरण (यथावत पाठ):' : 'Official Verbatim Source Excerpt:'}</span>
                      <span className="text-[10px] text-slate-400 font-normal">Source: MP Bhumi Vikas Rules 2012</span>
                    </div>

                    <div className="p-3.5 rounded-lg bg-slate-50 border-l-4 border-indigo-600 text-slate-800 text-xs sm:text-sm leading-relaxed font-mono whitespace-pre-wrap selection:bg-indigo-100">
                      {cite.excerpt}
                    </div>
                  </div>

                  {/* Actions for this citation */}
                  <div className="flex items-center justify-between pt-1 text-xs">
                    <div className="text-[11px] text-slate-500">
                      {cite.page_start ? (
                        <span>Verified from official Town & Country Planning rulebook</span>
                      ) : (
                        <span>Rule identified from consolidated gazette</span>
                      )}
                    </div>

                    {onOpenRuleDetail && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenRuleDetail(cite.rule);
                        }}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 text-indigo-600 hover:text-indigo-900 hover:bg-indigo-50/80 rounded font-medium transition-all"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>{language === 'hi' ? 'सम्पूर्ण नियम पढ़ें' : `Read Full Rule ${cite.rule}`}</span>
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
