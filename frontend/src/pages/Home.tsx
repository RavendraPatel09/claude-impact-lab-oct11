import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Building,
  Ruler,
  AlertTriangle,
  BookOpen,
  Calculator,
  CheckCircle2,
} from 'lucide-react';
import type { AnswerResponse, Language, PlotSearchCriteria } from '../types/api';
import { askQuestion, checkBackendHealth, submitPlotInquiry } from '../services/api';
import { PlotInquirySearch } from '../components/PlotInquirySearch';
import { AnswerCard } from '../components/AnswerCard';
import { LoadingState } from '../components/LoadingState';
import { ErrorState } from '../components/ErrorState';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { QuickCalculator } from '../components/QuickCalculator';
import { RuleDirectoryModal } from '../components/RuleDirectoryModal';
import { SourceCoverageModal } from '../components/SourceCoverageModal';
import { CounterSlipModal } from '../components/CounterSlipModal';

export const Home: React.FC = () => {
  const [language, setLanguage] = useState<Language>('en');
  const [lastSubmittedQuestion, setLastSubmittedQuestion] = useState<string>('');
  const [lastSubmittedCriteria, setLastSubmittedCriteria] = useState<PlotSearchCriteria | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [answerData, setAnswerData] = useState<AnswerResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // System & Modal states
  const [isBackendConnected, setIsBackendConnected] = useState<boolean>(false);
  const [isDemoMode, setIsDemoMode] = useState<boolean>(false);
  const [isRulebookOpen, setIsRulebookOpen] = useState<boolean>(false);
  const [selectedRuleNumber, setSelectedRuleNumber] = useState<string | null>(null);
  const [isCalculatorOpen, setIsCalculatorOpen] = useState<boolean>(false);
  const [isCoverageOpen, setIsCoverageOpen] = useState<boolean>(false);
  const [isCounterSlipOpen, setIsCounterSlipOpen] = useState<boolean>(false);

  // Check backend health on initial load
  useEffect(() => {
    let isMounted = true;
    checkBackendHealth().then((healthy) => {
      if (isMounted) {
        setIsBackendConnected(healthy);
      }
    });

    const interval = setInterval(() => {
      checkBackendHealth().then((healthy) => {
        if (isMounted) setIsBackendConnected(healthy);
      });
    }, 15000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  // Handle Guided Plot Inquiry (Area, Location, What to build)
  const handlePlotSubmit = async (criteria: PlotSearchCriteria) => {
    setIsLoading(true);
    setErrorMessage(null);
    setLastSubmittedCriteria(criteria);

    const areaSqm = criteria.areaUnit === 'sqft'
      ? Math.round((criteria.plotArea * 0.092903) * 10) / 10
      : criteria.plotArea;

    const querySummary = language === 'hi'
      ? `भूखंड: ${areaSqm} वर्ग मीटर, स्थान: ${criteria.location} (${criteria.roadWidth}m सड़क), निर्माण: ${criteria.buildingType}`
      : `Plot: ${areaSqm} sq m, Location: ${criteria.location} (${criteria.roadWidth}m road), Construction: ${criteria.buildingType}`;

    setLastSubmittedQuestion(querySummary);

    try {
      const { response, usedBackend } = await submitPlotInquiry(
        criteria,
        language,
        isDemoMode
      );

      setAnswerData(response);
      if (usedBackend && !isBackendConnected) {
        setIsBackendConnected(true);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown network failure';
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Free-text / Specific question submission
  const handleFreeTextSubmit = async (questionText: string) => {
    if (!questionText.trim()) return;

    setIsLoading(true);
    setErrorMessage(null);
    setLastSubmittedCriteria(null);
    setLastSubmittedQuestion(questionText.trim());

    try {
      const { response, usedBackend } = await askQuestion(
        {
          question: questionText.trim(),
          language,
        },
        isDemoMode
      );

      setAnswerData(response);
      if (usedBackend && !isBackendConnected) {
        setIsBackendConnected(true);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown network failure';
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRetry = () => {
    if (lastSubmittedCriteria) {
      handlePlotSubmit(lastSubmittedCriteria);
    } else if (lastSubmittedQuestion) {
      handleFreeTextSubmit(lastSubmittedQuestion);
    }
  };

  const handleOpenRuleDetail = (ruleNum: string) => {
    setSelectedRuleNumber(ruleNum);
    setIsRulebookOpen(true);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800">
      {/* Top Header */}
      <Header
        language={language}
        onLanguageChange={setLanguage}
        isBackendConnected={isBackendConnected}
        isDemoMode={isDemoMode}
        onToggleDemoMode={() => setIsDemoMode((prev) => !prev)}
        onOpenRulebook={() => {
          setSelectedRuleNumber(null);
          setIsRulebookOpen(true);
        }}
        onOpenCalculator={() => setIsCalculatorOpen(true)}
        onOpenCoverage={() => setIsCoverageOpen(true)}
        onOpenCounterSlip={() => setIsCounterSlipOpen(true)}
      />

      {/* Main Container */}
      <main className="flex-1 w-full px-4 sm:px-6 lg:px-10 py-5 sm:py-7 space-y-6">
        {/* Executive Civic Header */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-7 shadow-xs relative overflow-hidden animate-fadeIn">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-2 max-w-3xl">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
                <span>
                  {language === 'hi'
                    ? 'भोपाल नगर निगम — भवन अनुज्ञा सहायता काउंटर'
                    : 'Bhopal Municipal Corporation · Facilitation Counter System'}
                </span>
              </div>

              <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                {language === 'hi'
                  ? 'म.प्र. भूमि विकास नियम 2012 — निर्णय सहायता प्रणाली'
                  : 'Madhya Pradesh Building Regulations Decision Assistant'}
              </h2>

              <p className="text-xs sm:text-sm text-slate-500 leading-relaxed font-normal">
                {language === 'hi'
                  ? '106 नियमों एवं राजपत्र तालिकाओं पर आधारित सटीक विधिक मार्गदर्शन। सेटबैक गणना, फार्म हाउस अनुमति, एवं कानूनी संदर्भ।'
                  : 'FastAPI & rule-grounded guidance based on 106 consolidated Town & Country Planning rules. Instant Rule 56 setback computation, Farm House norms, and citations.'}
              </p>
            </div>

            {/* Quick Status & Cutoff Badge Strip */}
            <div className="flex flex-wrap md:flex-col items-start md:items-end gap-2 flex-shrink-0 text-xs">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-50 text-slate-700 border border-slate-200/80 font-mono text-[11px] font-medium">
                📖 106 Rules Indexed
              </span>

              <button
                type="button"
                onClick={() => setIsCoverageOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-50 hover:bg-amber-100/80 text-amber-900 border border-amber-200 font-medium text-[11px] transition-colors"
                title="View cutoff details and August 2026 amendment on Rule 2(5)(c)"
              >
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                <span>Cutoff: 06 Mar 2025 (Aug 2026 Alert)</span>
              </button>
            </div>
          </div>
        </div>

        {/* Unified Search & Multi-Dimensional Filter Console */}
        <section aria-label="Regulatory Search and Filter Console" className="animate-slideUp">
          <PlotInquirySearch
            onPlotSubmit={handlePlotSubmit}
            onFreeTextSubmit={handleFreeTextSubmit}
            isLoading={isLoading}
            language={language}
          />
        </section>

        {/* Loading State */}
        {isLoading && <LoadingState language={language} />}

        {/* Error State */}
        {errorMessage && !isLoading && (
          <ErrorState
            message={errorMessage}
            onRetry={handleRetry}
            onSwitchToDemo={() => {
              setIsDemoMode(true);
              handleRetry();
            }}
            language={language}
          />
        )}

        {/* Answer Output View */}
        {answerData && !isLoading && !errorMessage && (
          <section aria-label="Answer Output Section" className="animate-scaleIn">
            <AnswerCard
              data={answerData}
              language={language}
              onOpenCounterSlip={() => setIsCounterSlipOpen(true)}
              onOpenRuleDetail={handleOpenRuleDetail}
            />
          </section>
        )}

        {/* Initial Clean Regulatory Knowledge Dashboard (When idle) */}
        {!answerData && !isLoading && !errorMessage && (
          <div id="regulatory-standards" className="space-y-4 animate-fadeIn">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-700 uppercase tracking-wider">
                <BookOpen className="w-4 h-4 text-indigo-600" />
                <span>{language === 'hi' ? 'प्रमुख भवन नियम संदर्भ (त्वरित जांच):' : 'Key Regulatory Standards (Quick Access):'}</span>
              </div>
              <span className="text-[11px] text-slate-400">Click any card to evaluate instantly</span>
            </div>

            {/* 4 Clean Executive Rule Knowledge Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
              {/* Card 1: Rule 56 Residential Setbacks */}
              <div
                role="button"
                tabIndex={0}
                onClick={() =>
                  handlePlotSubmit({
                    plotArea: 200,
                    areaUnit: 'sqm',
                    roadWidth: 9.0,
                    buildingType: 'Residential House',
                    location: 'Bhopal Municipal Corporation Area',
                  })
                }
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handlePlotSubmit({
                      plotArea: 200,
                      areaUnit: 'sqm',
                      roadWidth: 9.0,
                      buildingType: 'Residential House',
                      location: 'Bhopal Municipal Corporation Area',
                    });
                  }
                }}
                className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-xs hover:border-indigo-300 hover:shadow-card hover:-translate-y-0.5 active:translate-y-0 transition-all duration-150 cursor-pointer text-left space-y-2 group"
              >
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded font-mono text-[10px] font-bold bg-slate-100 group-hover:bg-indigo-50 text-slate-700 group-hover:text-indigo-700 border border-slate-200 group-hover:border-indigo-200 transition-colors">
                    Rule 56 Table 13 & 14
                  </span>
                  <Ruler className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 transition-colors" />
                </div>
                <h4 className="text-xs sm:text-sm font-bold text-slate-900 leading-tight">
                  {language === 'hi' ? 'आवासीय खुले स्थान एवं सेटबैक' : 'Residential Setbacks & MOS'}
                </h4>
                <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                  Front setback from 3.0m (≤9m road) up to 6.0m (over 18m road); Rear setback based on plot area.
                </p>
                <span className="text-[11px] font-semibold text-indigo-600 group-hover:underline inline-block pt-1">
                  Evaluate 200 m² Setbacks →
                </span>
              </div>

              {/* Card 2: Rule 17 Farm House */}
              <div
                role="button"
                tabIndex={0}
                onClick={() =>
                  handlePlotSubmit({
                    plotArea: 4000,
                    areaUnit: 'sqm',
                    roadWidth: 7.5,
                    buildingType: 'Farm House (Agricultural)',
                    location: 'Agricultural Zone',
                  })
                }
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handlePlotSubmit({
                      plotArea: 4000,
                      areaUnit: 'sqm',
                      roadWidth: 7.5,
                      buildingType: 'Farm House (Agricultural)',
                      location: 'Agricultural Zone',
                    });
                  }
                }}
                className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-xs hover:border-indigo-300 hover:shadow-card hover:-translate-y-0.5 active:translate-y-0 transition-all duration-150 cursor-pointer text-left space-y-2 group"
              >
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded font-mono text-[10px] font-bold bg-slate-100 group-hover:bg-indigo-50 text-slate-700 group-hover:text-indigo-700 border border-slate-200 group-hover:border-indigo-200 transition-colors">
                    Rule 17 (Page 34)
                  </span>
                  <Building className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 transition-colors" />
                </div>
                <h4 className="text-xs sm:text-sm font-bold text-slate-900 leading-tight">
                  {language === 'hi' ? 'फार्म हाउस निर्माण विनियम' : 'Farm House Planning Norms'}
                </h4>
                <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                  Min 0.40 Ha (4,000 m²) plot, 0.10 FAR (10% built-up), 7.50m open space on all sides, 100 trees/ha.
                </p>
                <span className="text-[11px] font-semibold text-indigo-600 group-hover:underline inline-block pt-1">
                  Inspect Farmhouse Norms →
                </span>
              </div>

              {/* Card 3: Rule 12-A Deemed Approval */}
              <div
                role="button"
                tabIndex={0}
                onClick={() =>
                  handlePlotSubmit({
                    plotArea: 186,
                    areaUnit: 'sqm',
                    roadWidth: 9.0,
                    buildingType: 'Residential House',
                    location: 'Bhopal Municipal Corporation Area',
                  })
                }
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handlePlotSubmit({
                      plotArea: 186,
                      areaUnit: 'sqm',
                      roadWidth: 9.0,
                      buildingType: 'Residential House',
                      location: 'Bhopal Municipal Corporation Area',
                    });
                  }
                }}
                className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-xs hover:border-indigo-300 hover:shadow-card hover:-translate-y-0.5 active:translate-y-0 transition-all duration-150 cursor-pointer text-left space-y-2 group"
              >
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded font-mono text-[10px] font-bold bg-slate-100 group-hover:bg-indigo-50 text-slate-700 group-hover:text-indigo-700 border border-slate-200 group-hover:border-indigo-200 transition-colors">
                    Rule 12-A (30 Days)
                  </span>
                  <CheckCircle2 className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 transition-colors" />
                </div>
                <h4 className="text-xs sm:text-sm font-bold text-slate-900 leading-tight">
                  {language === 'hi' ? 'डीम्ड अनुमति (Plots ≤ 186 m²)' : 'Deemed Approval (≤ 186 m²)'}
                </h4>
                <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                  Statutory 30-day timeline for residential plots. Automatic deemed sanction if no communication issued.
                </p>
                <span className="text-[11px] font-semibold text-indigo-600 group-hover:underline inline-block pt-1">
                  Check Deemed Sanction →
                </span>
              </div>

              {/* Card 4: Rule 52 Power Line Clearance */}
              <div
                role="button"
                tabIndex={0}
                onClick={() =>
                  handleFreeTextSubmit(
                    language === 'hi'
                      ? 'कम वोल्टेज वाली ओवरहेड बिजली लाइन से बालकनी की दूरी लंबवत और क्षैतिज कितनी होनी चाहिए?'
                      : 'How far must my balcony stay from a low-voltage overhead electric line, vertically and horizontally?'
                  )
                }
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleFreeTextSubmit(
                      language === 'hi'
                        ? 'कम वोल्टेज वाली ओवरहेड बिजली लाइन से बालकनी की दूरी लंबवत और क्षैतिज कितनी होनी चाहिए?'
                        : 'How far must my balcony stay from a low-voltage overhead electric line, vertically and horizontally?'
                    );
                  }
                }}
                className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-xs hover:border-indigo-300 hover:shadow-card hover:-translate-y-0.5 active:translate-y-0 transition-all duration-150 cursor-pointer text-left space-y-2 group"
              >
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded font-mono text-[10px] font-bold bg-slate-100 group-hover:bg-indigo-50 text-slate-700 group-hover:text-indigo-700 border border-slate-200 group-hover:border-indigo-200 transition-colors">
                    Rule 52 Clearance
                  </span>
                  <ShieldCheck className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 transition-colors" />
                </div>
                <h4 className="text-xs sm:text-sm font-bold text-slate-900 leading-tight">
                  {language === 'hi' ? 'ओवरहेड विद्युत लाइन दूरी' : 'Overhead Line Clearance'}
                </h4>
                <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                  Safe mandatory clearance: 2.5m vertical for &lt;650V lines, 3.7m for lines up to 33kV; 1.2m horizontal.
                </p>
                <span className="text-[11px] font-semibold text-indigo-600 group-hover:underline inline-block pt-1">
                  Check Line Distance →
                </span>
              </div>
            </div>

            {/* Direct Tool Buttons Toolbar */}
            <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setIsCalculatorOpen(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200 shadow-xs hover:-translate-y-0.5 active:translate-y-0 transition-all duration-150"
              >
                <Calculator className="w-4 h-4 text-indigo-600" />
                <span>{language === 'hi' ? 'सेटबैक कैलकुलेटर खोलें' : 'Open Rule 56 Calculator'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setSelectedRuleNumber(null);
                  setIsRulebookOpen(true);
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200 shadow-xs hover:-translate-y-0.5 active:translate-y-0 transition-all duration-150"
              >
                <BookOpen className="w-4 h-4 text-slate-600" />
                <span>{language === 'hi' ? 'सम्पूर्ण नियम संकलन (106)' : 'Browse Full Rulebook (106 Rules)'}</span>
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <Footer language={language} onOpenCoverage={() => setIsCoverageOpen(true)} />

      {/* Modals */}
      <QuickCalculator
        isOpen={isCalculatorOpen}
        onClose={() => setIsCalculatorOpen(false)}
        language={language}
      />

      <RuleDirectoryModal
        isOpen={isRulebookOpen}
        onClose={() => {
          setIsRulebookOpen(false);
          setSelectedRuleNumber(null);
        }}
        selectedRuleNumber={selectedRuleNumber}
        language={language}
      />

      <SourceCoverageModal
        isOpen={isCoverageOpen}
        onClose={() => setIsCoverageOpen(false)}
        language={language}
      />

      {answerData && (
        <CounterSlipModal
          isOpen={isCounterSlipOpen}
          onClose={() => setIsCounterSlipOpen(false)}
          question={lastSubmittedQuestion}
          response={answerData}
          language={language}
        />
      )}
    </div>
  );
};
