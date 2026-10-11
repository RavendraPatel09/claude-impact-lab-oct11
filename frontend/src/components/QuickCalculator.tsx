import React, { useState } from 'react';
import { Calculator, X, ShieldAlert, CheckCircle2 } from 'lucide-react';
import type { Language } from '../types/api';

interface QuickCalculatorProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
}

export const QuickCalculator: React.FC<QuickCalculatorProps> = ({
  isOpen,
  onClose,
  language,
}) => {
  const [roadWidth, setRoadWidth] = useState<number>(9.0);
  const [plotArea, setPlotArea] = useState<number>(200);
  const [buildingType, setBuildingType] = useState<'detached' | 'semi-detached' | 'row'>('detached');
  const [voltageType, setVoltageType] = useState<'low' | 'high'>('low');

  if (!isOpen) return null;

  // Rule 56(1)(a) Front open space calculation
  let frontSetback = 3.0;
  let frontRuleText = 'Rule 56(1)(a) S.No. 1';
  if (roadWidth <= 9.0) {
    frontSetback = 3.0;
    frontRuleText = 'Rule 56(1)(a) S.No. 1 (Up to 9.0m road)';
  } else if (roadWidth <= 12.0) {
    frontSetback = 3.6;
    frontRuleText = 'Rule 56(1)(a) S.No. 2 (>9.0m to 12.0m road)';
  } else if (roadWidth <= 18.0) {
    frontSetback = 4.5;
    frontRuleText = 'Rule 56(1)(a) S.No. 3 (>12.0m to 18.0m road)';
  } else {
    frontSetback = 6.0;
    frontRuleText = 'Rule 56(1)(a) S.No. 4 (Above 18.0m road)';
  }

  // Rule 56(2)(a) Rear open space calculation
  let rearSetback = 0;
  let rearRuleText = 'Rule 56(2)(a)';
  if (plotArea <= 40) {
    rearSetback = 0;
    rearRuleText = 'Rule 56(2)(a) S.No. 1 (Up to 40 sq m -> Nil)';
  } else if (plotArea <= 150) {
    rearSetback = 1.5;
    rearRuleText = 'Rule 56(2)(a) S.No. 2 (>40 to 150 sq m)';
  } else if (plotArea <= 225) {
    rearSetback = 2.5;
    rearRuleText = 'Rule 56(2)(a) S.No. 3 (>150 to 225 sq m)';
  } else {
    rearSetback = 3.0;
    rearRuleText = 'Rule 56(2)(a) S.No. 4 (Above 225 sq m)';
  }

  // Rule 56(3) Side open space
  let sideSetback = '3.0m on both sides';
  if (buildingType === 'semi-detached') {
    sideSetback = '3.0m on one side';
  } else if (buildingType === 'row') {
    sideSetback = 'Nil (Not required for row-housing)';
  }

  // Rule 52 Electric line clearance
  const electricVertical = voltageType === 'low' ? 2.5 : 3.7;
  const electricHorizontal = 1.2;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-2xl max-w-xl w-full border border-slate-200 shadow-elevated overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-100 text-indigo-700 rounded-xl shadow-2xs">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">
                {language === 'hi' ? 'नियम 56 सेटबैक एवं नियम 52 कैलकुलेटर' : 'Deterministic Setback & Clearance Calculator'}
              </h3>
              <p className="text-xs text-slate-500">
                {language === 'hi'
                  ? 'म.प्र. भूमि विकास नियम 2012 तालिका आधारित सटीक गणना'
                  : 'Official Table Lookups from MP Bhumi Vikas Rules, 2012'}
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

        {/* Form Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs sm:text-sm">
          {/* Inputs Section */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                {language === 'hi' ? 'सड़क की चौड़ाई (मीटर):' : 'Street / Road Width (meters):'}
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="3"
                  max="45"
                  step="0.5"
                  value={roadWidth}
                  onChange={(e) => setRoadWidth(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                />
                <span className="text-slate-500 font-mono text-xs">m</span>
              </div>
              <div className="flex gap-1.5 mt-1.5">
                {[6, 9, 12, 18].map((w) => (
                  <button
                    key={w}
                    type="button"
                    onClick={() => setRoadWidth(w)}
                    className="px-2 py-0.5 text-[11px] rounded bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
                  >
                    {w}m
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                {language === 'hi' ? 'भूखंड क्षेत्रफल (वर्ग मीटर):' : 'Plot Area (square meters):'}
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="20"
                  max="5000"
                  step="5"
                  value={plotArea}
                  onChange={(e) => setPlotArea(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                />
                <span className="text-slate-500 font-mono text-xs">m²</span>
              </div>
              <div className="flex gap-1.5 mt-1.5">
                {[40, 150, 200, 300].map((a) => (
                  <button
                    key={a}
                    type="button"
                    onClick={() => setPlotArea(a)}
                    className="px-2 py-0.5 text-[11px] rounded bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
                  >
                    {a}m²
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                {language === 'hi' ? 'भवन का प्रकार:' : 'Building Pattern:'}
              </label>
              <select
                value={buildingType}
                onChange={(e) => setBuildingType(e.target.value as any)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 text-xs"
              >
                <option value="detached">Detached (स्वतंत्र भवन)</option>
                <option value="semi-detached">Semi-Detached (अर्ध-स्वतंत्र)</option>
                <option value="row">Row-Type (पंक्तिबद्ध आवास)</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                {language === 'hi' ? 'ओवरहेड विद्युत लाइन प्रकार:' : 'Overhead Electric Line:'}
              </label>
              <select
                value={voltageType}
                onChange={(e) => setVoltageType(e.target.value as any)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 text-xs"
              >
                <option value="low">Low/Medium Voltage (&lt;650V)</option>
                <option value="high">High Voltage (Up to 33kV)</option>
              </select>
            </div>
          </div>

          {/* Results Summary Box */}
          <div className="bg-slate-50/80 border border-slate-200/90 rounded-xl p-4 space-y-3 shadow-card">
            <div className="flex items-center gap-2 font-bold text-slate-900 uppercase tracking-wider text-xs">
              <CheckCircle2 className="w-4 h-4 text-indigo-600" />
              <span>{language === 'hi' ? 'गणना परिणाम (नियम 56 एवं 52):' : 'Calculated Rule Mandates:'}</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="bg-white p-3 rounded-lg border border-slate-200/80 shadow-2xs">
                <span className="text-slate-500 block text-[11px]">
                  {language === 'hi' ? 'न्यूनतम फ्रंट ओपन स्पेस (आगे का सेटबैक):' : 'Minimum Front Open Space:'}
                </span>
                <span className="text-lg font-bold font-mono text-slate-900">
                  {frontSetback.toFixed(1)} meters
                </span>
                <span className="block text-[10px] text-slate-400 mt-0.5">{frontRuleText}</span>
              </div>

              <div className="bg-white p-3 rounded-lg border border-slate-200/80 shadow-2xs">
                <span className="text-slate-500 block text-[11px]">
                  {language === 'hi' ? 'न्यूनतम रियर ओपन स्पेस (पीछे का सेटबैक):' : 'Minimum Rear Open Space:'}
                </span>
                <span className="text-lg font-bold font-mono text-slate-900">
                  {rearSetback === 0 ? 'Nil' : `${rearSetback.toFixed(2)} meters`}
                </span>
                <span className="block text-[10px] text-slate-400 mt-0.5">{rearRuleText}</span>
              </div>

              <div className="bg-white p-3 rounded-lg border border-slate-200/80 shadow-2xs">
                <span className="text-slate-500 block text-[11px]">
                  {language === 'hi' ? 'साइड ओपन स्पेस (बगल का खुला स्थान):' : 'Side Open Space:'}
                </span>
                <span className="text-sm font-bold font-mono text-slate-900">
                  {sideSetback}
                </span>
                <span className="block text-[10px] text-slate-400 mt-0.5">Rule 56(3)</span>
              </div>

              <div className="bg-white p-3 rounded-lg border border-slate-200/80 shadow-2xs">
                <span className="text-slate-500 block text-[11px]">
                  {language === 'hi' ? 'विद्युत लाइन सुरक्षा दूरी (नियम 52):' : 'Electric Line Clearance:'}
                </span>
                <span className="text-sm font-bold font-mono text-slate-900">
                  {electricVertical}m Vert. | {electricHorizontal}m Horiz.
                </span>
                <span className="block text-[10px] text-slate-400 mt-0.5">Rule 52(1) (Table)</span>
              </div>
            </div>
          </div>

          {/* August 2026 Alert Notice if plot <= 500 */}
          {plotArea <= 500 && (
            <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 text-[11px] text-amber-900 flex items-start gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
              <div>
                <span className="font-bold">
                  {language === 'hi' ? 'नोट (प्लॉट &lt;= 500 वर्ग मीटर): ' : 'Note (Plot &lt;= 500 sq m): '}
                </span>
                <span>
                  {language === 'hi'
                    ? '28 अगस्त 2026 को म.प्र. शासन ने 500 वर्ग मीटर तक के भूखंडों के लिए विकास अनुमति नियमों में संशोधन किया था। कृपया नवीनतम राजपत्र से आवश्यक छूट की पुष्टि करें।'
                    : 'A state amendment dated 28 August 2026 reportedly modified Rule 2(5)(c) regarding separate development permission for plots up to 500 sq m in approved layouts.'}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white font-medium text-xs rounded-xl shadow-xs"
          >
            {language === 'hi' ? 'बंद करें' : 'Close Calculator'}
          </button>
        </div>
      </div>
    </div>
  );
};
