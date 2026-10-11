import React, { useState } from 'react';
import { BookOpen, Search, X, FileText, ChevronRight, Bookmark } from 'lucide-react';
import type { Rule, Language } from '../types/api';
import { rulesDatabase } from '../services/mockData';

interface RuleDirectoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedRuleNumber?: string | null;
  language: Language;
}

export const RuleDirectoryModal: React.FC<RuleDirectoryModalProps> = ({
  isOpen,
  onClose,
  selectedRuleNumber,
  language,
}) => {
  const [searchQuery, setSearchQuery] = useState(selectedRuleNumber || '');
  const [activeRule, setActiveRule] = useState<Rule | null>(() => {
    if (selectedRuleNumber) {
      return (
        rulesDatabase.find(
          (r) => r.rule.toUpperCase() === selectedRuleNumber.toUpperCase()
        ) || null
      );
    }
    return rulesDatabase[0] || null;
  });
  const [selectedPart, setSelectedPart] = useState<string>('all');

  if (!isOpen) return null;

  // Extract unique parts
  const parts = Array.from(new Set(rulesDatabase.map((r) => r.part))).filter(Boolean);

  // Filter rules
  const filteredRules = rulesDatabase.filter((r) => {
    const matchesPart = selectedPart === 'all' || r.part === selectedPart;
    const q = searchQuery.trim().toLowerCase();
    const matchesQuery =
      !q ||
      r.rule.toLowerCase().includes(q) ||
      r.title.toLowerCase().includes(q) ||
      r.text.toLowerCase().includes(q);
    return matchesPart && matchesQuery;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-2xl max-w-5xl w-full border border-slate-200 shadow-elevated overflow-hidden h-[90vh] flex flex-col">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-100 text-indigo-700 rounded-xl shadow-2xs">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">
                {language === 'hi'
                  ? 'म.प्र. भूमि विकास नियम, 2012 — सम्पूर्ण नियम संकलन (106 नियम)'
                  : 'MP Bhumi Vikas Rules, 2012 — Full Rulebook Directory (106 Rules)'}
              </h3>
              <p className="text-xs text-slate-500">
                {language === 'hi'
                  ? 'आधिकारिक 108 पृष्ठों के राजपत्र से सत्यापित'
                  : 'Official Gazetted Consolidated Text through 6 March 2025'}
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

        {/* Search & Filter Toolbar */}
        <div className="p-4 bg-white border-b border-slate-100 flex flex-wrap gap-3 items-center justify-between">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                language === 'hi'
                  ? 'नियम संख्या, शीर्षक या शब्द खोजें (उदा. 56, बालकनी, setback)...'
                  : 'Search by rule number, title or keyword (e.g. 56, setback, farm house)...'
              }
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 hidden sm:inline">Part:</span>
            <select
              value={selectedPart}
              onChange={(e) => setSelectedPart(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 max-w-[260px] truncate"
            >
              <option value="all">All Parts (समस्त भाग)</option>
              {parts.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Content Columns: List on left, Full Rule on right */}
        <div className="flex-1 flex overflow-hidden">
          {/* Rules List Sidebar */}
          <div className="w-full sm:w-2/5 border-r border-slate-200 overflow-y-auto p-2 space-y-1 bg-slate-50/50">
            <div className="px-3 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              {filteredRules.length} {filteredRules.length === 1 ? 'Rule Found' : 'Rules Found'}
            </div>

            {filteredRules.map((rule) => {
              const isSelected = activeRule?.rule === rule.rule;

              return (
                <button
                  key={rule.rule}
                  type="button"
                  onClick={() => setActiveRule(rule)}
                  className={`w-full text-left p-3 rounded-xl transition-all duration-150 flex items-start justify-between gap-2 border ${
                    isSelected
                      ? 'bg-indigo-50/70 border-indigo-300 text-slate-950 shadow-xs'
                      : 'bg-white border-slate-200/60 hover:bg-slate-100/60 text-slate-700'
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="px-2 py-0.5 rounded font-mono text-[11px] font-bold bg-slate-900 text-white">
                        Rule {rule.rule}
                      </span>
                      <span className="text-[10px] text-slate-500 truncate">{rule.part}</span>
                    </div>
                    <p className="text-xs font-semibold truncate text-slate-800">{rule.title}</p>
                    <span className="text-[10px] text-slate-400">
                      PDF Pages {rule.page_start} - {rule.page_end}
                    </span>
                  </div>
                  <ChevronRight
                    className={`w-4 h-4 flex-shrink-0 mt-2 ${
                      isSelected ? 'text-indigo-600' : 'text-slate-300'
                    }`}
                  />
                </button>
              );
            })}

            {filteredRules.length === 0 && (
              <div className="p-8 text-center text-xs text-slate-400">
                No rules matched your query.
              </div>
            )}
          </div>

          {/* Full Rule Viewer on right */}
          <div className="hidden sm:flex sm:w-3/5 flex-col overflow-y-auto p-6 bg-white">
            {activeRule ? (
              <div className="space-y-4">
                <div className="border-b border-slate-100 pb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-3 py-1 rounded-lg font-mono text-xs font-bold bg-slate-900 text-white">
                      Rule {activeRule.rule}
                    </span>
                    <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                      {activeRule.part}
                    </span>
                  </div>
                  <h2 className="text-lg font-bold text-slate-900">{activeRule.title}</h2>
                  <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                    <FileText className="w-3.5 h-3.5 text-slate-400" />
                    <span>Official PDF Pages: {activeRule.page_start} to {activeRule.page_end}</span>
                  </div>
                </div>

                <div>
                  <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Bookmark className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Verbatim Legal Text from Source:</span>
                  </h4>
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 font-mono text-xs leading-relaxed text-slate-800 whitespace-pre-wrap selection:bg-indigo-100 max-h-[500px] overflow-y-auto">
                    {activeRule.text}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center text-slate-400 text-xs">
                Select a rule from the list to view its complete legal text.
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span>Dataset source: MP Bhumi Vikas Rules, 2012 (Consolidated through 6 March 2025)</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-900 text-white font-medium rounded-lg shadow-xs"
          >
            {language === 'hi' ? 'बंद करें' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};
