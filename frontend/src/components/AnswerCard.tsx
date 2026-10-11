import React, { useState } from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  Copy,
  Check,
  Printer,
  ShieldAlert,
  Info,
  Calendar,
  Ruler,
  MapPin,
  Building,
  Trees,
  Maximize2,
  Compass,
  Lightbulb,
  Zap,
  Clock,
  Sparkles,
} from 'lucide-react';
import type { AnswerResponse, AnswerStatus, Language } from '../types/api';
import { SourceViewer } from './SourceViewer';

interface AnswerCardProps {
  data: AnswerResponse;
  language: Language;
  onOpenCounterSlip: () => void;
  onOpenRuleDetail: (ruleNum: string) => void;
}

/**
 * Formats inline bold markers (**text**) into styled emphasis pills
 */
const renderInlineFormatted = (text: string) => {
  if (!text.includes('**')) {
    return text;
  }
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      const clean = part.slice(2, -2);
      return (
        <strong
          key={index}
          className="font-bold text-slate-900 bg-indigo-50/80 text-indigo-950 px-1 py-0.5 rounded text-[13px] inline-block font-sans"
        >
          {clean}
        </strong>
      );
    }
    return part;
  });
};

interface ParsedBlock {
  type: 'heading' | 'table' | 'bullets' | 'paragraph';
  headingText?: string;
  tableHeaders?: string[];
  tableRows?: string[][];
  bullets?: string[];
  text?: string;
}

/**
 * Intelligent Markdown Table and Section Parser for high-readability output
 */
const StructuredAnswerRenderer: React.FC<{ content: string; isHindi: boolean }> = ({
  content,
}) => {
  const lines = content.split('\n');
  const blocks: ParsedBlock[] = [];
  let i = 0;

  while (i < lines.length) {
    const rawLine = lines[i];
    const trimmed = rawLine.trim();

    if (!trimmed) {
      i++;
      continue;
    }

    // 1. Heading check (### or ## or #)
    if (trimmed.startsWith('#')) {
      const headingClean = trimmed.replace(/^#+\s*/, '');
      blocks.push({
        type: 'heading',
        headingText: headingClean,
      });
      i++;
      continue;
    }

    // 2. Markdown Table check
    if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
      const tableLines: string[] = [];
      while (
        i < lines.length &&
        lines[i].trim().startsWith('|') &&
        lines[i].trim().endsWith('|')
      ) {
        tableLines.push(lines[i].trim());
        i++;
      }

      if (tableLines.length >= 2) {
        const headerCells = tableLines[0]
          .split('|')
          .map((c) => c.trim())
          .filter((c) => c.length > 0);

        const separatorIdx = tableLines.findIndex((l) => l.includes('---'));
        const bodyLines =
          separatorIdx !== -1
            ? tableLines.slice(separatorIdx + 1)
            : tableLines.slice(1);
        const tableRows = bodyLines.map((l) =>
          l
            .split('|')
            .map((c) => c.trim())
            .filter((c) => c.length > 0)
        );

        blocks.push({
          type: 'table',
          tableHeaders: headerCells,
          tableRows,
        });
        continue;
      }
    }

    // 3. Bullet list check (•, -, *, or numbered list)
    if (
      trimmed.startsWith('•') ||
      trimmed.startsWith('-') ||
      trimmed.startsWith('*') ||
      /^\d+\.\s/.test(trimmed)
    ) {
      const bullets: string[] = [];
      while (
        i < lines.length &&
        lines[i].trim() &&
        (lines[i].trim().startsWith('•') ||
          lines[i].trim().startsWith('-') ||
          lines[i].trim().startsWith('*') ||
          /^\d+\.\s/.test(lines[i].trim()))
      ) {
        const cleanBullet = lines[i]
          .trim()
          .replace(/^[•\-*]\s*/, '')
          .replace(/^\d+\.\s*/, '');
        bullets.push(cleanBullet);
        i++;
      }
      blocks.push({
        type: 'bullets',
        bullets,
      });
      continue;
    }

    // 4. Regular Paragraph
    const pLines: string[] = [];
    while (
      i < lines.length &&
      lines[i].trim() &&
      !lines[i].trim().startsWith('#') &&
      !(lines[i].trim().startsWith('|') && lines[i].trim().endsWith('|')) &&
      !lines[i].trim().startsWith('•') &&
      !lines[i].trim().startsWith('-') &&
      !lines[i].trim().startsWith('*') &&
      !/^\d+\.\s/.test(lines[i].trim())
    ) {
      pLines.push(lines[i].trim());
      i++;
    }
    if (pLines.length > 0) {
      blocks.push({
        type: 'paragraph',
        text: pLines.join(' '),
      });
    }
  }

  return (
    <div className="space-y-4 text-slate-800 text-sm sm:text-base leading-relaxed">
      {blocks.map((b, idx) => {
        if (b.type === 'heading' && b.headingText) {
          return (
            <h4
              key={idx}
              className="text-sm sm:text-base font-bold text-slate-900 pt-2 flex items-center gap-2 border-b border-slate-200/60 pb-1.5"
            >
              <span className="w-1.5 h-4 bg-indigo-600 rounded-full inline-block flex-shrink-0"></span>
              <span>{renderInlineFormatted(b.headingText)}</span>
            </h4>
          );
        }

        if (b.type === 'table' && b.tableHeaders && b.tableRows) {
          return (
            <div
              key={idx}
              className="overflow-x-auto my-3 rounded-xl border border-slate-200/90 shadow-2xs bg-white"
            >
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-slate-100 text-slate-900 font-bold border-b border-slate-200">
                  <tr>
                    {b.tableHeaders.map((h, hIdx) => (
                      <th
                        key={hIdx}
                        className="py-2.5 px-3.5 font-bold text-slate-900 tracking-wide"
                      >
                        {renderInlineFormatted(h)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {b.tableRows.map((row, rIdx) => (
                    <tr
                      key={rIdx}
                      className={
                        rIdx % 2 === 1
                          ? 'bg-slate-50/60'
                          : 'bg-white hover:bg-slate-50 transition-colors'
                      }
                    >
                      {row.map((cell, cIdx) => (
                        <td
                          key={cIdx}
                          className="py-2.5 px-3.5 text-slate-800 font-medium"
                        >
                          {renderInlineFormatted(cell)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        }

        if (b.type === 'bullets' && b.bullets) {
          return (
            <div key={idx} className="space-y-2 pl-1">
              {b.bullets.map((item, bItemIdx) => (
                <div
                  key={bItemIdx}
                  className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-700"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-2 flex-shrink-0"></span>
                  <span className="flex-1 leading-relaxed">
                    {renderInlineFormatted(item)}
                  </span>
                </div>
              ))}
            </div>
          );
        }

        if (b.type === 'paragraph' && b.text) {
          return (
            <p
              key={idx}
              className="leading-relaxed text-slate-800 text-xs sm:text-sm"
            >
              {renderInlineFormatted(b.text)}
            </p>
          );
        }

        return null;
      })}
    </div>
  );
};

/**
 * Dedicated Visual Standards Card for Rule 53 (Size of plots and frontage norms)
 */
const Rule53VisualNorms: React.FC<{ isHindi: boolean }> = ({ isHindi }) => {
  return (
    <div className="bg-slate-50/70 rounded-2xl p-5 border border-slate-200/90 shadow-card space-y-4">
      <div className="flex items-center justify-between border-b border-slate-200/80 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-indigo-600 text-white shadow-xs">
            <Building className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              {isHindi
                ? 'नियम 53: भूखंडों के न्यूनतम आकार एवं फ्रंटेज मानक (आवासीय एवं व्यावसायिक)'
                : 'Rule 53: Statutory Plot Size & Frontage Mandates'}
            </h3>
            <p className="text-[11px] text-slate-500 font-medium">
              {isHindi
                ? 'भवन निर्माण के प्रकार के अनुसार अनिवार्य न्यूनतम क्षेत्रफल व सड़क की ओर चौड़ाई'
                : 'Minimum permissible land area & street frontage by development category'}
            </p>
          </div>
        </div>
        <span className="px-2.5 py-1 rounded-full bg-slate-900 text-white text-[11px] font-mono font-bold shadow-xs">
          MP Rule 53 (P. 70-76)
        </span>
      </div>

      {/* 3 Residential Core Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
        {/* Detached */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs space-y-2 hover:border-indigo-300 hover:-translate-y-0.5 transition-all">
          <div className="flex items-center justify-between">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100">
              {isHindi ? 'स्वतंत्र भवन' : 'Detached Building'}
            </span>
            <span className="text-[10px] text-slate-400 font-mono">Rule 53(1)(i)</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 block uppercase font-bold tracking-wider">
              {isHindi ? 'न्यूनतम भूखंड आकार' : 'Minimum Plot Size'}
            </span>
            <span className="text-lg font-black font-mono text-slate-900">
              Above 225 m²
            </span>
            <span className="text-[11px] text-slate-500 block">(~2,422 sq ft)</span>
          </div>
          <div className="pt-1 border-t border-slate-100">
            <span className="text-[10px] text-slate-400 block uppercase font-bold tracking-wider">
              {isHindi ? 'सड़क की ओर फ्रंटेज' : 'Road Frontage'}
            </span>
            <span className="text-sm font-bold font-mono text-indigo-600">
              Above 12.0 meters
            </span>
          </div>
          <p className="text-[11px] text-slate-600 leading-snug">
            {isHindi
              ? 'कोठी अथवा स्वतंत्र बंगला। सभी 4 दिशाओं में खुला स्थान छोड़ना आवश्यक है।'
              : 'Independent houses & villas. Requires boundary open space on all 4 flanks.'}
          </p>
        </div>

        {/* Semi-Detached */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs space-y-2 hover:border-indigo-300 hover:-translate-y-0.5 transition-all">
          <div className="flex items-center justify-between">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-100">
              {isHindi ? 'अर्ध-स्वतंत्र भवन' : 'Semi-Detached Building'}
            </span>
            <span className="text-[10px] text-slate-400 font-mono">Rule 53(1)(i)</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 block uppercase font-bold tracking-wider">
              {isHindi ? 'न्यूनतम भूखंड आकार' : 'Minimum Plot Size'}
            </span>
            <span className="text-lg font-black font-mono text-slate-900">
              125 to 225 m²
            </span>
            <span className="text-[11px] text-slate-500 block">(1,345 - 2,422 sq ft)</span>
          </div>
          <div className="pt-1 border-t border-slate-100">
            <span className="text-[10px] text-slate-400 block uppercase font-bold tracking-wider">
              {isHindi ? 'सड़क की ओर फ्रंटेज' : 'Road Frontage'}
            </span>
            <span className="text-sm font-bold font-mono text-blue-600">
              8.0 to 12.0 meters
            </span>
          </div>
          <p className="text-[11px] text-slate-600 leading-snug">
            {isHindi
              ? 'जुड़वां मकान (डुप्लेक्स)। एक साझी दीवार और दूसरी तरफ साइड सेटबैक अनिवार्य है।'
              : 'Paired duplex units sharing a single central party wall with one external side setback.'}
          </p>
        </div>

        {/* Row-Type */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs space-y-2 hover:border-indigo-300 hover:-translate-y-0.5 transition-all">
          <div className="flex items-center justify-between">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-100">
              {isHindi ? 'पंक्तिबद्ध भवन' : 'Row Type Building'}
            </span>
            <span className="text-[10px] text-slate-400 font-mono">Rule 53(1)(i)</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 block uppercase font-bold tracking-wider">
              {isHindi ? 'न्यूनतम भूखंड आकार' : 'Minimum Plot Size'}
            </span>
            <span className="text-lg font-black font-mono text-slate-900">
              50 to 225 m²
            </span>
            <span className="text-[11px] text-slate-500 block">(538 - 2,422 sq ft)</span>
          </div>
          <div className="pt-1 border-t border-slate-100">
            <span className="text-[10px] text-slate-400 block uppercase font-bold tracking-wider">
              {isHindi ? 'सड़क की ओर फ्रंटेज' : 'Road Frontage'}
            </span>
            <span className="text-sm font-bold font-mono text-amber-600">
              4.5 to 12.0 meters
            </span>
          </div>
          <p className="text-[11px] text-slate-600 leading-snug">
            {isHindi
              ? 'रो-हाउसिंग कॉलोनी। दोनों बगल साझी दीवारें; केवल आगे व पीछे सेटबैक जरूरी।'
              : 'Terraced housing with common walls on both sides; requires only front and rear open spaces.'}
          </p>
        </div>
      </div>

      {/* Special Land Uses Accordion / Table */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-3.5 space-y-2 text-xs">
        <div className="flex items-center justify-between font-bold text-slate-800 text-[11px] uppercase tracking-wider">
          <span className="flex items-center gap-1.5">
            <Maximize2 className="w-3.5 h-3.5 text-indigo-600" />
            <span>
              {isHindi
                ? 'अन्य प्रमुख गैर-आवासीय उपयोग (नियम 53(3)):'
                : 'Special Land Uses & Commercial Norms [Rule 53(3)]: '}
            </span>
          </span>
          <span className="text-[10px] text-slate-400 font-mono">
            Assembly / Cinema / Marriage Garden / EV
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 pt-1 font-sans">
          <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
            <span className="font-bold text-slate-800 block text-xs">
              {isHindi ? 'सभा भवन / रंगमंच' : 'Theatres & Halls'}
            </span>
            <span className="text-indigo-600 font-mono font-bold block text-sm mt-0.5">
              3.0 m² / Seat
            </span>
            <span className="text-[10px] text-slate-500 block mt-0.5">
              {isHindi ? 'निश्चित बैठने की क्षमता पर' : 'Based on fixed seating'}
            </span>
          </div>
          <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
            <span className="font-bold text-slate-800 block text-xs">
              {isHindi ? 'सिनेमा हॉल (सिंगल)' : 'Cinema Hall (Single)'}
            </span>
            <span className="text-indigo-600 font-mono font-bold block text-sm mt-0.5">
              Min 2,000 m²
            </span>
            <span className="text-[10px] text-slate-500 block mt-0.5">
              {isHindi ? '18m सड़क, 1.25 FAR' : '18m road, 1.25 FAR, 33% Grnd'}
            </span>
          </div>
          <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
            <span className="font-bold text-slate-800 block text-xs">
              {isHindi ? 'मैरिज गार्डन' : 'Marriage Garden'}
            </span>
            <span className="text-indigo-600 font-mono font-bold block text-sm mt-0.5">
              4,000 / 10,000 m²
            </span>
            <span className="text-[10px] text-slate-500 block mt-0.5">
              {isHindi ? 'जनसंख्या अनुसार, 0.10 FAR' : 'Pop based, 0.10 FAR, 10% Grnd'}
            </span>
          </div>
          <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
            <span className="font-bold text-slate-800 block text-xs">
              {isHindi ? 'ईवी चार्जिंग व पंप' : 'EV Charging & FFS'}
            </span>
            <span className="text-indigo-600 font-mono font-bold block text-sm mt-0.5">
              06 Mar 2025 Norms
            </span>
            <span className="text-[10px] text-slate-500 block mt-0.5">
              {isHindi ? 'सड़क चौड़ाई व PESO मानक' : 'PESO safety & road widths'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Dedicated Visual Standards Card for Rule 52 (Electric Supply Line Clearance)
 */
const Rule52VisualNorms: React.FC<{ isHindi: boolean }> = ({ isHindi }) => {
  return (
    <div className="bg-slate-50/70 rounded-2xl p-4 border border-slate-200/90 shadow-card space-y-3 text-xs">
      <div className="flex items-center justify-between border-b border-slate-200/80 pb-2.5">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-amber-500 text-white shadow-xs">
            <Zap className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-sm">
              {isHindi
                ? 'नियम 52: ओवरहेड बिजली लाइनों से अनिवार्य सुरक्षित दूरी'
                : 'Rule 52: Safe Clearance from Overhead Electric Supply Lines'}
            </h3>
            <p className="text-[11px] text-slate-500">
              {isHindi
                ? 'बालकनी, बरामदा अथवा भवन संरचना की तारों से दूरी'
                : 'Clearance required between building projections and electric lines'}
            </p>
          </div>
        </div>
        <span className="px-2 py-0.5 rounded bg-slate-900 text-white font-mono text-[10px] font-bold">
          Rule 52 Table (P. 69)
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-2xs space-y-1.5">
          <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-800 font-bold text-[10px] border border-amber-200/60 inline-block">
            Low & Medium Voltage Lines (&lt;650V)
          </span>
          <div className="grid grid-cols-2 gap-2 pt-1 font-mono">
            <div>
              <span className="text-[10px] text-slate-400 block uppercase font-bold">Vertically (लंबवत)</span>
              <span className="text-base font-black text-slate-900">2.5 meters</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block uppercase font-bold">Horizontally (क्षैतिज)</span>
              <span className="text-base font-black text-slate-900">1.2 meters</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-2xs space-y-1.5">
          <span className="px-2 py-0.5 rounded bg-rose-50 text-rose-800 font-bold text-[10px] border border-rose-200/60 inline-block">
            High Voltage Lines (Up to 33,000V)
          </span>
          <div className="grid grid-cols-2 gap-2 pt-1 font-mono">
            <div>
              <span className="text-[10px] text-slate-400 block uppercase font-bold">Vertically (लंबवत)</span>
              <span className="text-base font-black text-slate-900">3.7 meters</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block uppercase font-bold">Horizontally (क्षैतिज)</span>
              <span className="text-base font-black text-slate-900">2.0 meters</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Dedicated Visual Standards Card for Rule 23 (Duration & Validity of Sanction)
 */
const Rule23VisualNorms: React.FC<{ isHindi: boolean }> = ({ isHindi }) => {
  return (
    <div className="bg-slate-50/70 rounded-2xl p-4 border border-slate-200/90 shadow-card space-y-3 text-xs">
      <div className="flex items-center justify-between border-b border-slate-200/80 pb-2.5">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-indigo-600 text-white shadow-xs">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-sm">
              {isHindi
                ? 'नियम 23: भवन निर्माण एवं विकास अनुमति की वैधता अवधि'
                : 'Rule 23: Duration & Validity of Sanction'}
            </h3>
            <p className="text-[11px] text-slate-500">
              {isHindi
                ? 'स्वीकृति की समय-सीमा, नवीनीकरण एवं विस्तार के नियम'
                : 'Initial validity period, revalidation limits, and lapse provisions'}
            </p>
          </div>
        </div>
        <span className="px-2 py-0.5 rounded bg-slate-900 text-white font-mono text-[10px] font-bold">
          Rule 23 (P. 41)
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-2xs">
          <span className="text-[10px] text-slate-400 uppercase font-bold block">प्रारंभिक वैधता (Initial Validity)</span>
          <span className="text-lg font-black font-mono text-slate-900 block mt-0.5">3 Years</span>
          <span className="text-[11px] text-slate-500 block mt-0.5">धारा 30 के तहत स्वीकृति की तिथि से</span>
        </div>
        <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-2xs">
          <span className="text-[10px] text-slate-400 uppercase font-bold block">नवीनीकरण (Revalidation)</span>
          <span className="text-lg font-black font-mono text-indigo-600 block mt-0.5">1 Year + 1 Year</span>
          <span className="text-[11px] text-slate-500 block mt-0.5">एक-एक वर्ष की दो क्रमिक अवधियों के लिए</span>
        </div>
        <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-2xs">
          <span className="text-[10px] text-slate-400 uppercase font-bold block">अधिकतम सीमा (Absolute Cap)</span>
          <span className="text-lg font-black font-mono text-rose-600 block mt-0.5">5 Years Max</span>
          <span className="text-[11px] text-slate-500 block mt-0.5">5 वर्ष के बाद नए सिरे से आवेदन आवश्यक</span>
        </div>
      </div>
    </div>
  );
};

export const AnswerCard: React.FC<AnswerCardProps> = ({
  data,
  language,
  onOpenCounterSlip,
  onOpenRuleDetail,
}) => {
  const [copied, setCopied] = useState(false);

  const isHindi = language === 'hi';
  const criteria = data.plot_criteria;
  const setbacks = data.calculated_setbacks;
  const farmHouse = data.farm_house_norms;

  // Determine specific rule triggers
  const isRule17 =
    data.citations.some((c) => c.rule === '17') ||
    (criteria?.buildingType.toLowerCase().includes('farm') ?? false) ||
    data.answer.toLowerCase().includes('farm house');

  const isRule53 =
    data.citations.some((c) => c.rule === '53') ||
    data.answer.includes('Rule 53') ||
    data.answer.includes('नियम 53') ||
    data.answer.toLowerCase().includes('size of plots') ||
    data.answer.toLowerCase().includes('detached building');

  const isRule52 =
    data.citations.some((c) => c.rule === '52') ||
    data.answer.includes('Rule 52') ||
    data.answer.includes('नियम 52') ||
    data.answer.toLowerCase().includes('electric supply line');

  const isRule23 =
    data.citations.some((c) => c.rule === '23') ||
    data.answer.includes('Rule 23') ||
    data.answer.includes('नियम 23') ||
    data.answer.toLowerCase().includes('duration of sanction');

  const handleCopy = () => {
    let textToCopy = `[Bhumi Vikas Sahayak - MP Building Regulations]\n\n`;
    if (criteria) {
      textToCopy += `Plot Inquiry: ${criteria.plotArea} ${criteria.areaUnit} in ${criteria.location} (${criteria.roadWidth}m road) for ${criteria.buildingType}\n\n`;
    }
    if (farmHouse) {
      textToCopy += `Farm House Norms (Rule 17):\n- Min Plot: 0.40 Hectare (4,000 sq m)\n- Max FAR: 0.10 (Max built-up: ${farmHouse.max_built_up_sqm} sq m)\n- Open Space: 7.50m on all 4 sides\n- Height: 7.5m (sloping roof)\n- Trees: 100 live trees/ha\n\n`;
    } else if (setbacks) {
      textToCopy += `Calculated Setbacks (Rule 56):\n- Front Open Space: ${setbacks.front_open_space_m}m\n- Rear Open Space: ${setbacks.rear_open_space_m}m\n- Side Open Space: ${setbacks.side_open_space_m}m\n\n`;
    }
    textToCopy += `Answer:\n${data.answer}\n\nStatus: ${data.status}\n`;
    if (data.citations && data.citations.length > 0) {
      textToCopy +=
        `\nCitations:\n` +
        data.citations
          .map(
            (c) =>
              `- Rule ${c.rule}: ${c.title || ''} (Pages ${c.page_start}-${c.page_end})\n  "${c.excerpt}"`
          )
          .join('\n');
    }
    if (data.warnings && data.warnings.length > 0) {
      textToCopy += `\n\nWarnings:\n` + data.warnings.map((w) => `- ${w}`).join('\n');
    }
    textToCopy += `\n\nSource Version: ${data.source_version || '2025-03-06'}\nDisclaimer: For counter informational reference only. Not an official sanction order.`;

    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getStatusBadge = (status: AnswerStatus) => {
    switch (status) {
      case 'answered':
        return {
          icon: CheckCircle2,
          bg: 'bg-indigo-50/80 border-indigo-200/80 text-indigo-900',
          label: isHindi ? 'प्रमाणित नियम आधारित उत्तर' : 'Verified Rule-Grounded Answer',
          borderAccent: 'border-l-indigo-600',
        };
      case 'insufficient_evidence':
        return {
          icon: AlertTriangle,
          bg: 'bg-amber-50 border-amber-200 text-amber-800',
          label: isHindi ? 'नियमों में अपर्याप्त साक्ष्य (अपुष्ट)' : 'Insufficient Evidence in Rules',
          borderAccent: 'border-l-amber-500',
        };
      case 'source_version_warning':
        return {
          icon: ShieldAlert,
          bg: 'bg-orange-50 border-orange-200 text-orange-900',
          label: isHindi ? 'संशोधन एवं संस्करण चेतावनी' : 'Source Version / Amendment Notice',
          borderAccent: 'border-l-orange-500',
        };
      case 'needs_clarification':
        return {
          icon: HelpCircle,
          bg: 'bg-blue-50 border-blue-200 text-blue-800',
          label: isHindi ? 'अतिरिक्त स्पष्टीकरण आवश्यक' : 'Clarification Needed',
          borderAccent: 'border-l-blue-500',
        };
      case 'error':
      default:
        return {
          icon: AlertTriangle,
          bg: 'bg-rose-50 border-rose-200 text-rose-800',
          label: isHindi ? 'सिस्टम त्रुटि' : 'System Error',
          borderAccent: 'border-l-rose-500',
        };
    }
  };

  /**
   * Generates a concise, plain-language takeaway summary for counter operators
   */
  const getQuickTakeaway = (): string => {
    if (isRule53) {
      return isHindi
        ? 'आवासीय भूखंडों के लिए: स्वतंत्र मकान (Detached) हेतु 225 m² से बड़ा भूखंड व >12m फ्रंटेज, अर्ध-स्वतंत्र (Semi-Detached) हेतु 125-225 m² व 8-12m फ्रंटेज, तथा रो-हाउस हेतु 50-225 m² व 4.5-12m फ्रंटेज अनिवार्य है।'
        : 'Residential plot standards: Detached Bungalow requires >225 m² area and >12.0m road frontage; Semi-detached requires 125–225 m² area and 8.0–12.0m frontage; Row House requires 50–225 m² area and 4.5–12.0m frontage.';
    }
    if (isRule17) {
      return isHindi
        ? 'फार्म हाउस हेतु न्यूनतम 0.40 हेक्टेयर (4,000 m²) कृषि भूमि, अधिकतम 0.10 FAR (10% निर्माण), चारों तरफ 7.50m खुला स्थान व 7.5m ढलवां छत अनिवार्य है।'
        : 'Agricultural farm houses require minimum 0.40 Hectare (4,000 m²), max 0.10 FAR (10% coverage), 7.50m open space on all 4 sides, and max 7.5m height with sloping roof.';
    }
    if (setbacks) {
      return isHindi
        ? `नियम 56 के अनुसार आगे ${setbacks.front_open_space_m}m, पीछे ${setbacks.rear_open_space_m === 0 ? 'शून्य' : setbacks.rear_open_space_m + 'm'} तथा बगल में ${setbacks.side_open_space_m}m खुला स्थान छोड़ना अनिवार्य है।`
        : `Under Rule 56: Mandatory Front Open Space = ${setbacks.front_open_space_m}m, Rear Open Space = ${setbacks.rear_open_space_m === 0 ? 'Nil' : setbacks.rear_open_space_m + 'm'}, and Side Open Space = ${setbacks.side_open_space_m}m.`;
    }
    if (isRule52) {
      return isHindi
        ? 'कम व मध्यम वोल्टेज बिजली लाइनों से बालकनी या भवन की दूरी कम से कम 2.5 मीटर लंबवत तथा 1.2 मीटर क्षैतिज होनी चाहिए।'
        : 'Buildings and balconies must maintain at least 2.5m vertical and 1.2m horizontal clearance from low/medium overhead electric lines.';
    }
    if (isRule23) {
      return isHindi
        ? 'भवन अनुमति 3 वर्ष तक वैध रहती है, जिसे 1-1 वर्ष के दो चरणों में कुल अधिकतम 5 वर्ष तक नवीनीकृत कराया जा सकता है।'
        : 'Building permission remains valid for 3 years, extendable up to a non-relaxable cap of 5 years total.';
    }
    // Default fallback: first sentence of the answer
    const cleanAnswer = data.answer.replace(/\n+/g, ' ').trim();
    const firstPeriod = cleanAnswer.indexOf('.');
    if (firstPeriod > 20 && firstPeriod < 200) {
      return cleanAnswer.slice(0, firstPeriod + 1);
    }
    return cleanAnswer.slice(0, 160) + (cleanAnswer.length > 160 ? '...' : '');
  };

  const statusConfig = getStatusBadge(data.status);
  const StatusIcon = statusConfig.icon;

  return (
    <div className="w-full bg-white rounded-2xl border border-slate-200/90 shadow-card overflow-hidden transition-all duration-200">
      {/* Top Banner with Status & Quick Actions */}
      <div className="px-5 py-3.5 bg-slate-50/90 border-b border-slate-200/80 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${statusConfig.bg}`}
          >
            <StatusIcon className="w-3.5 h-3.5 text-indigo-600" />
            <span>{statusConfig.label}</span>
          </span>

          {data.source_version && (
            <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 bg-white px-2.5 py-0.5 rounded-full border border-slate-200/70">
              <Calendar className="w-3 h-3 text-slate-400" />
              <span>Rules Cutoff: {data.source_version}</span>
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            id="copy-answer-btn"
            onClick={handleCopy}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-100 rounded-lg border border-slate-200/80 shadow-xs hover:-translate-y-0.5 active:translate-y-0 transition-all"
            title="Copy answer and citations to clipboard"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-indigo-600" />
                <span className="text-indigo-700 font-semibold">
                  {isHindi ? 'कॉपी हो गया' : 'Copied'}
                </span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>{isHindi ? 'कॉपी करें' : 'Copy'}</span>
              </>
            )}
          </button>

          <button
            type="button"
            id="print-counter-slip-btn"
            onClick={onOpenCounterSlip}
            className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg border border-slate-200 shadow-xs hover:-translate-y-0.5 active:translate-y-0 transition-all"
            title="Generate printable receipt slip for citizen counter"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>{isHindi ? 'काउंटर पर्ची (प्रिंट)' : 'Counter Slip'}</span>
          </button>
        </div>
      </div>

      {/* Main Answer Area */}
      <div className={`p-5 sm:p-6 border-l-4 ${statusConfig.borderAccent} space-y-6`}>
        {/* 1. PLOT SPECIFICATIONS PILL BAR */}
        {criteria && (
          <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200 text-xs">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
              {isHindi ? 'नागरिक भूखंड विवरण (Inquiry Parameters):' : 'Inquiry Parameters:'}
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <div className="flex items-center gap-2 bg-white p-2.5 rounded-lg border border-slate-200/80 shadow-2xs">
                <Ruler className="w-4 h-4 text-indigo-600 flex-shrink-0" />
                <div>
                  <span className="text-[10px] text-slate-400 block leading-tight">Plot Area</span>
                  <span className="font-bold text-slate-800 font-mono">
                    {criteria.plotArea} {criteria.areaUnit}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 bg-white p-2.5 rounded-lg border border-slate-200/80 shadow-2xs">
                <MapPin className="w-4 h-4 text-indigo-600 flex-shrink-0" />
                <div className="min-w-0">
                  <span className="text-[10px] text-slate-400 block leading-tight">Location & Road</span>
                  <span className="font-bold text-slate-800 truncate block">
                    {criteria.location} ({criteria.roadWidth}m road)
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 bg-white p-2.5 rounded-lg border border-slate-200/80 shadow-2xs">
                <Building className="w-4 h-4 text-indigo-600 flex-shrink-0" />
                <div className="min-w-0">
                  <span className="text-[10px] text-slate-400 block leading-tight">Building Type</span>
                  <span className="font-bold text-slate-800 truncate block">
                    {criteria.buildingType}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 2. EXECUTIVE QUICK TAKEAWAY CALLOUT (3-SECOND VERDICT) */}
        <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white rounded-xl p-4 shadow-card flex items-start gap-3">
          <div className="p-2 rounded-lg bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 flex-shrink-0 mt-0.5">
            <Sparkles className="w-4 h-4 text-indigo-300" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-300">
                {isHindi ? 'त्वरित नागरिक निष्कर्ष (Key Takeaway)' : 'Executive Regulatory Takeaway'}
              </span>
              <span className="text-[10px] font-mono text-slate-400">
                Grounded Summary
              </span>
            </div>
            <p className="text-sm sm:text-base font-medium text-slate-100 mt-1 leading-relaxed">
              {getQuickTakeaway()}
            </p>
          </div>
        </div>

        {/* 3. RULE-SPECIFIC VISUAL DASHBOARDS */}

        {/* RULE 53 (SIZE OF PLOTS & FRONTAGE) */}
        {isRule53 && <Rule53VisualNorms isHindi={isHindi} />}

        {/* RULE 17 (FARM HOUSE NORMS) */}
        {isRule17 && (
          <div className="bg-slate-50/70 rounded-2xl p-5 border border-slate-200/90 shadow-card space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200/80 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-lg bg-slate-900 text-white shadow-xs">
                  <Lightbulb className="w-4 h-4 text-amber-400" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    {isHindi
                      ? 'फार्म हाउस नियम 17 — सरल भाषा में संपूर्ण जानकारी (आसान गाइड)'
                      : 'Rule 17: Farm House Rules Made Simple (Citizen Guide)'}
                  </h3>
                  <p className="text-[11px] text-slate-500 font-medium">
                    {isHindi
                      ? 'कृषि भूमि पर फार्म हाउस बनाने के 6 मुख्य नियम'
                      : 'The 6 Core Rules for Building a Farmhouse in Agricultural Zones'}
                  </p>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-slate-900 text-white text-[11px] font-mono font-bold shadow-xs">
                MP Rule 17 (Page 34)
              </span>
            </div>

            {/* Visual 6-Card Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 text-xs">
              {/* Point 1: Minimum Plot Size */}
              <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-2xs space-y-1 hover:border-slate-300 hover:-translate-y-0.5 transition-all duration-150">
                <div className="flex items-center gap-1.5 font-bold text-slate-900">
                  <Ruler className="w-4 h-4 text-indigo-600" />
                  <span>{isHindi ? '1. न्यूनतम प्लॉट का आकार' : '1. Minimum Land Size'}</span>
                </div>
                <div className="text-base font-extrabold text-slate-900 font-mono">
                  0.40 Hectare (4,000 m²)
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  {isHindi
                    ? 'लगभग 1 एकड़ (43,056 वर्ग फुट)। 0.40 हेक्टेयर से छोटे प्लॉट पर फार्म हाउस की अनुमति नहीं मिलती।'
                    : 'Approx. 1 Acre (43,056 sq ft). Plots smaller than 0.40 ha cannot get farmhouse sanction.'}
                </p>
              </div>

              {/* Point 2: Construction Allowed / FAR */}
              <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-2xs space-y-1 hover:border-slate-300 hover:-translate-y-0.5 transition-all duration-150">
                <div className="flex items-center gap-1.5 font-bold text-slate-900">
                  <Maximize2 className="w-4 h-4 text-indigo-600" />
                  <span>{isHindi ? '2. निर्माण सीमा (F.A.R. 0.10)' : '2. Maximum Build Area'}</span>
                </div>
                <div className="text-base font-extrabold text-indigo-600 font-mono">
                  Max 10% of Land Area
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  {isHindi
                    ? 'कुल जमीन का केवल 10% हिस्सा बना सकते हैं (उदा. 4,000 m² पर अधिकतम 400 m² कवर्ड एरिया)।'
                    : 'You can only cover 10% of land (e.g., 400 m² / 4,305 sq ft built-up on a 4,000 m² plot).'}
                </p>
              </div>

              {/* Point 3: All-round Open Space */}
              <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-2xs space-y-1 hover:border-slate-300 hover:-translate-y-0.5 transition-all duration-150">
                <div className="flex items-center gap-1.5 font-bold text-slate-900">
                  <Compass className="w-4 h-4 text-indigo-600" />
                  <span>{isHindi ? '3. चारों तरफ खाली जगह (MOS)' : '3. Boundary Setbacks'}</span>
                </div>
                <div className="text-base font-extrabold text-indigo-600 font-mono">
                  7.50 meters on ALL Sides
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  {isHindi
                    ? 'प्लॉट की चारों सीमाओं (आगे, पीछे, दोनों बगल) से कम से कम 7.5 मीटर (24.6 फीट) जगह खाली छोड़नी होगी।'
                    : 'Must leave at least 7.50m (24.6 ft) open space from all 4 boundaries (Front, Rear & Sides).'}
                </p>
              </div>

              {/* Point 4: Height & Roof */}
              <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-2xs space-y-1 hover:border-slate-300 hover:-translate-y-0.5 transition-all duration-150">
                <div className="flex items-center gap-1.5 font-bold text-slate-900">
                  <Building className="w-4 h-4 text-indigo-600" />
                  <span>{isHindi ? '4. ऊंचाई व छत का प्रकार' : '4. Height & Sloping Roof'}</span>
                </div>
                <div className="text-base font-extrabold text-slate-900 font-mono">
                  7.5 meters (ढलवां छत)
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  {isHindi
                    ? 'अधिकतम ऊंचाई 7.5 मीटर तथा छत ढलवां (sloping) होनी अनिवार्य है। सपाट छत की अनुमति नहीं है।'
                    : 'Maximum 7.5m height. Roof must be sloping (flat concrete terrace roof is not allowed).'}
                </p>
              </div>

              {/* Point 5: Trees */}
              <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-2xs space-y-1 hover:border-slate-300 hover:-translate-y-0.5 transition-all duration-150">
                <div className="flex items-center gap-1.5 font-bold text-slate-900">
                  <Trees className="w-4 h-4 text-indigo-600" />
                  <span>{isHindi ? '5. पेड़ लगाने की अनिवार्यता' : '5. Live Trees Mandate'}</span>
                </div>
                <div className="text-base font-extrabold text-slate-900 font-mono">
                  Min 100 Trees / Hectare
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  {isHindi
                    ? 'आवेदन से पहले ही प्लॉट पर प्रति हेक्टेयर कम से कम 100 जीवित पेड़ लगे होने आवश्यक हैं।'
                    : 'Must have at least 100 live trees per hectare on the plot before applying for building sanction.'}
                </p>
              </div>

              {/* Point 6: Road Access */}
              <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-2xs space-y-1 hover:border-slate-300 hover:-translate-y-0.5 transition-all duration-150">
                <div className="flex items-center gap-1.5 font-bold text-slate-900">
                  <MapPin className="w-4 h-4 text-indigo-600" />
                  <span>{isHindi ? '6. सड़क का आकार' : '6. Road Width Access'}</span>
                </div>
                <div className="text-base font-extrabold text-slate-900 font-mono">
                  Min 7.5 meters Road
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  {isHindi
                    ? 'फार्म हाउस तक पहुंचने वाली सड़क की चौड़ाई कम से कम 7.5 मीटर (25 फीट) होनी चाहिए।'
                    : 'The access road connecting to the farmhouse must be at least 7.5m wide.'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* RULE 56 (RESIDENTIAL SETBACKS) */}
        {setbacks && !isRule17 && (
          <div className="bg-slate-50/70 border border-slate-200/90 rounded-xl p-4 space-y-3 shadow-card">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-slate-900 uppercase tracking-wider text-xs">
                <CheckCircle2 className="w-4 h-4 text-indigo-600" />
                <span>
                  {isHindi
                    ? 'नियम 56: अनिवार्य खुले स्थान एवं सेटबैक (Calculated Setbacks):'
                    : 'Rule 56: Statutory Setback Mandates (Calculated):'}
                </span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-bold border border-slate-200">
                Table 13 & 14
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="bg-white p-3 rounded-xl border border-slate-200/80 shadow-2xs hover:-translate-y-0.5 transition-all duration-150">
                <span className="text-slate-500 text-[11px] block">Front Open Space (आगे का सेटबैक)</span>
                <span className="text-xl font-black font-mono text-slate-900">
                  {setbacks.front_open_space_m.toFixed(1)} meters
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  Rule 56(1)(a) Table 13
                </span>
              </div>

              <div className="bg-white p-3 rounded-xl border border-slate-200/80 shadow-2xs hover:-translate-y-0.5 transition-all duration-150">
                <span className="text-slate-500 text-[11px] block">Rear Open Space (पीछे का सेटबैक)</span>
                <span className="text-xl font-black font-mono text-slate-900">
                  {setbacks.rear_open_space_m === 0 ? 'Nil' : `${setbacks.rear_open_space_m.toFixed(2)} meters`}
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  Rule 56(2)(a) Table 14
                </span>
              </div>

              <div className="bg-white p-3 rounded-xl border border-slate-200/80 shadow-2xs hover:-translate-y-0.5 transition-all duration-150">
                <span className="text-slate-500 text-[11px] block">Side Open Space (बगल का खुला स्थान)</span>
                <span className="text-xl font-black font-mono text-slate-900">
                  {setbacks.side_open_space_m.toFixed(1)} meters
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  Rule 56(3) Detached
                </span>
              </div>
            </div>

            {setbacks.explanation && (
              <p className="text-[11px] text-slate-600 font-medium pt-1 border-t border-slate-200/60">
                • {setbacks.explanation}
              </p>
            )}
          </div>
        )}

        {/* RULE 52 (ELECTRIC LINES) */}
        {isRule52 && <Rule52VisualNorms isHindi={isHindi} />}

        {/* RULE 23 (VALIDITY & REVALIDATION) */}
        {isRule23 && <Rule23VisualNorms isHindi={isHindi} />}

        {/* 4. WARNING BANNERS */}
        {data.warnings && data.warnings.length > 0 && (
          <div className="p-4 rounded-xl bg-amber-50/90 border border-amber-200 text-amber-900 text-xs sm:text-sm leading-relaxed space-y-1.5">
            <div className="flex items-center gap-2 font-bold text-amber-800 uppercase tracking-wider text-[11px]">
              <ShieldAlert className="w-4 h-4 text-amber-600 flex-shrink-0" />
              <span>
                {isHindi
                  ? 'महत्वपूर्ण विधिक एवं संशोधन सूचना:'
                  : 'Important Regulatory Notice & Amendment Alert:'}
              </span>
            </div>
            {data.warnings.map((warn, i) => (
              <p key={i} className="pl-6 text-amber-950 font-medium">
                • {warn}
              </p>
            ))}
          </div>
        )}

        {/* 5. STRUCTURED REGULATORY ANSWER */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              {isHindi
                ? 'आधिकारिक विधिक उत्तर एवं तालिका (Grounded Regulatory Detail):'
                : 'Official Grounded Regulatory Response & Structured Detail:'}
            </span>
            <span className="text-[11px] font-mono text-indigo-600 font-semibold bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
              Structured Statutory View
            </span>
          </div>

          <div className="bg-slate-50/60 p-4 sm:p-5 rounded-xl border border-slate-200/80">
            <StructuredAnswerRenderer content={data.answer} isHindi={isHindi} />
          </div>
        </div>

        {/* 6. INSUFFICIENT EVIDENCE GUIDANCE */}
        {data.status === 'insufficient_evidence' && (
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 text-xs text-slate-600 flex items-start gap-2.5">
            <Info className="w-4 h-4 text-slate-500 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-semibold text-slate-700">
                {isHindi
                  ? 'सत्यापन टिप्पणी (नागरिक सहायता काउंटर):'
                  : 'Verification Note (Counter Assistance):'}
              </p>
              <p className="mt-0.5">
                {isHindi
                  ? 'यह प्रणाली केवल उन्हीं प्रश्नों का उत्तर देती है जिनका स्पष्ट प्रमाण म.प्र. भूमि विकास नियम 2012 में मौजूद है।'
                  : 'This tool strictly abstains from inventing rules or legal formulas when evidence is absent from MP Bhumi Vikas Rules, 2012.'}
              </p>
            </div>
          </div>
        )}

        {/* 7. CITATIONS & VERBATIM SOURCE EXCERPTS */}
        <SourceViewer
          citations={data.citations}
          language={language}
          onOpenRuleDetail={onOpenRuleDetail}
        />

        {/* 8. LEGAL DISCLAIMER FOOTER */}
        <div className="pt-4 border-t border-slate-100 flex items-start gap-2 text-[11px] text-slate-400">
          <ShieldAlert className="w-3.5 h-3.5 mt-0.5 text-slate-400 flex-shrink-0" />
          <span>
            {isHindi
              ? 'अस्वीकरण: यह प्रणाली भोपाल नगर निगम काउंटर के लिए सूचनात्मक संदर्भ उपकरण है। यह आधिकारिक भवन अनुज्ञा अथवा कानूनी फैसला नहीं है। अंतिम निर्णय सक्षम प्राधिकारी के क्षेत्राधिकार में है।'
              : 'Informational Notice: Bhumi Vikas Sahayak is a counter decision-support tool. It does not constitute official building sanction, legal approval, or a substitute for competent municipal authority orders.'}
          </span>
        </div>
      </div>
    </div>
  );
};
