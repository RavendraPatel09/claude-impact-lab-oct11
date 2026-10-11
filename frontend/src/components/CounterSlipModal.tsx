import React from 'react';
import { Printer, X, CheckCircle2, Building2, Ruler } from 'lucide-react';
import type { AnswerResponse, Language } from '../types/api';

interface CounterSlipModalProps {
  isOpen: boolean;
  onClose: () => void;
  question: string;
  response: AnswerResponse;
  language: Language;
}

export const CounterSlipModal: React.FC<CounterSlipModalProps> = ({
  isOpen,
  onClose,
  question,
  response,
  language,
}) => {
  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const todayStr = new Date().toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  const timeStr = new Date().toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const criteria = response.plot_criteria;
  const setbacks = response.calculated_setbacks;
  const farmHouse = response.farm_house_norms;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-2xl max-w-2xl w-full border border-slate-200 shadow-elevated overflow-hidden max-h-[92vh] flex flex-col">
        {/* Modal Controls Header */}
        <div className="px-6 py-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between no-print">
          <div className="flex items-center gap-2">
            <Printer className="w-4 h-4 text-indigo-600" />
            <h3 className="text-sm font-bold text-slate-800">
              {language === 'hi' ? 'काउंटर पूछताछ पर्ची (नागरिक प्रति)' : 'Citizen Inquiry Slip — BMC Counter'}
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold shadow-xs hover:-translate-y-0.5 active:translate-y-0 transition-all"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>{language === 'hi' ? 'प्रिंट करें' : 'Print Slip'}</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Slip Container */}
        <div className="p-6 overflow-y-auto">
          <div
            id="printable-counter-slip"
            className="p-6 rounded-xl border border-slate-300 bg-white font-sans text-slate-900 space-y-4"
          >
            {/* Slip Header */}
            <div className="text-center border-b-2 border-slate-900 pb-3">
              <div className="flex items-center justify-center gap-2 mb-1">
                <Building2 className="w-5 h-5 text-slate-800" />
                <h2 className="text-base font-extrabold uppercase tracking-wide">
                  Bhopal Municipal Corporation (भोपाल नगर निगम)
                </h2>
              </div>
              <p className="text-xs font-semibold text-slate-700">
                Building Permission Facilitation Counter · SSR Global Skills Park
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Bhumi Vikas Sahayak Decision-Support Record
              </p>
            </div>

            {/* Meta Row */}
            <div className="flex items-center justify-between text-xs border-b border-slate-200 pb-2 text-slate-600 font-mono">
              <span>Date: {todayStr} ({timeStr})</span>
              <span>Slip ID: BMC-{Math.floor(100000 + Math.random() * 900000)}</span>
              <span>Rules Cutoff: {response.source_version || '2025-03-06'}</span>
            </div>

            {/* Structured Plot Details if present */}
            {criteria && (
              <div className="p-3 bg-slate-50 rounded border border-slate-200 text-xs">
                <span className="font-bold text-slate-700 block mb-1">
                  Plot & Proposed Construction Details:
                </span>
                <div className="grid grid-cols-3 gap-2 font-mono">
                  <div>
                    <span className="text-[10px] text-slate-500 block">Plot Area:</span>
                    <span className="font-bold text-slate-900">
                      {criteria.plotArea} {criteria.areaUnit}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">Location & Road:</span>
                    <span className="font-bold text-slate-900 truncate block">
                      {criteria.location} ({criteria.roadWidth}m road)
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">Proposed Building:</span>
                    <span className="font-bold text-slate-900 truncate block">
                      {criteria.buildingType}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Statutory Setbacks / Farm House Norms */}
            {farmHouse ? (
              <div className="p-3 bg-slate-50/80 rounded border border-slate-300 text-xs space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-slate-900">
                  <Ruler className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Rule 17: Farm House Statutory Planning Norms:</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-slate-900 font-bold pt-1 text-[11px]">
                  <div>Min Plot: 0.40 Ha (4000m²)</div>
                  <div>Max FAR: 0.10 (10%)</div>
                  <div>MOS (All Sides): 7.50m</div>
                  <div>Max Height: 7.5m (Sloping)</div>
                </div>
              </div>
            ) : setbacks ? (
              <div className="p-3 bg-slate-50/80 rounded border border-slate-300 text-xs space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-slate-900">
                  <Ruler className="w-3.5 h-3.5 text-indigo-600" />
                  <span>
                    {setbacks.rule === '17'
                      ? 'Rule 17: Farm House Norms:'
                      : 'Statutory Setback Mandates (Rule 56 Table 13 & 14):'}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 font-mono text-slate-900 font-bold pt-1">
                  <div>Front Setback: {setbacks.front_open_space_m}m</div>
                  <div>Rear Setback: {setbacks.rear_open_space_m}m</div>
                  <div>Side Setback: {setbacks.side_open_space_m}m</div>
                </div>
              </div>
            ) : null}

            {/* Citizen Question */}
            <div>
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                Citizen Inquiry at Counter:
              </span>
              <p className="p-2.5 rounded bg-slate-50 border border-slate-200 text-xs font-medium text-slate-900 italic">
                "{question}"
              </p>
            </div>

            {/* Rule Decision & Answer */}
            <div>
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" />
                <span>Verified Regulatory Guidance:</span>
              </div>
              <div className="p-3 bg-slate-50/50 rounded border border-slate-200 text-xs leading-relaxed text-slate-900 whitespace-pre-line font-serif">
                {response.answer}
              </div>
            </div>

            {/* Citations List */}
            {response.citations && response.citations.length > 0 && (
              <div>
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Governing Rule Citations:
                </span>
                <div className="space-y-1.5">
                  {response.citations.map((c, i) => (
                    <div key={i} className="p-2 bg-slate-50 rounded border border-slate-200 text-xs">
                      <div className="font-bold text-slate-900">
                        Rule {c.rule}: {c.title || ''} (PDF Pages {c.page_start} - {c.page_end})
                      </div>
                      <div className="text-[11px] font-mono text-slate-600 mt-0.5 pl-2 border-l-2 border-indigo-600">
                        "{c.excerpt}"
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Warnings if any */}
            {response.warnings && response.warnings.length > 0 && (
              <div className="p-2 rounded bg-amber-50 border border-amber-200 text-[11px] text-amber-900">
                <span className="font-bold block">Important Notice:</span>
                {response.warnings.map((w, i) => (
                  <p key={i}>• {w}</p>
                ))}
              </div>
            )}

            {/* Signature & Disclaimer Footer */}
            <div className="pt-4 border-t border-dashed border-slate-300 mt-6 grid grid-cols-2 gap-4 text-[10px] text-slate-500">
              <div>
                <p className="font-semibold text-slate-700">Notice:</p>
                <p>
                  This slip is generated for citizen facilitation. It points to the MP Bhumi Vikas Rules, 2012. It does not replace an official sanction order.
                </p>
              </div>
              <div className="text-right flex flex-col justify-end">
                <div className="h-8 border-b border-slate-400 w-36 ml-auto"></div>
                <p className="mt-1 font-semibold text-slate-700">Counter Clerk / Officer Signature</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
