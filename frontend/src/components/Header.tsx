import React, { useState, useRef, useEffect } from 'react';
import {
  Building2,
  BookOpen,
  Calculator,
  Info,
  Sun,
  Bell,
  MoreHorizontal,
  ExternalLink,
  ShieldAlert,
  Server,
  Zap,
  CheckCircle2,
  Printer,
  X,
  Menu,
  UserCheck,
  Building,
} from 'lucide-react';
import type { Language } from '../types/api';
import { LanguageToggle } from './LanguageToggle';

interface HeaderProps {
  language: Language;
  onLanguageChange: (lang: Language) => void;
  isBackendConnected: boolean;
  isDemoMode: boolean;
  onToggleDemoMode: () => void;
  onOpenRulebook: () => void;
  onOpenCalculator: () => void;
  onOpenCoverage: () => void;
  onOpenCounterSlip?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  language,
  onLanguageChange,
  isBackendConnected,
  isDemoMode,
  onToggleDemoMode,
  onOpenRulebook,
  onOpenCalculator,
  onOpenCoverage,
  onOpenCounterSlip,
}) => {
  const isHindi = language === 'hi';

  // Dropdown & Modal States
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [hasUnreadAlerts, setHasUnreadAlerts] = useState(true);
  const [isSignInModalOpen, setIsSignInModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDarkModeActive, setIsDarkModeActive] = useState(false);

  const moreRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (moreRef.current && !moreRef.current.contains(event.target as Node)) {
        setIsMoreOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setIsNotificationsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const scrollToStandards = () => {
    const el = document.getElementById('regulatory-standards');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleThemeToggle = () => {
    setIsDarkModeActive((prev) => !prev);
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-100 shadow-2xs transition-colors">
        <div className="w-full px-4 sm:px-6 lg:px-12">
          <div className="flex items-center justify-between h-16 sm:h-20">
            {/* 1. LEFT: Brand Logo & Typography (TripMate Aesthetic) */}
            <div className="flex items-center gap-3">
              <a
                href="/"
                className="flex items-center gap-3 group focus:outline-hidden"
                aria-label="Bhumi Vikas Sahayak Home"
              >
                {/* Colorful circular sphere/compass logo mark */}
                <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-gradient-to-tr from-amber-500 via-rose-500 to-indigo-600 p-0.5 shadow-md group-hover:scale-105 transition-transform duration-200">
                  <div className="w-full h-full bg-white rounded-full flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-indigo-600" />
                  </div>
                </div>

                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-lg sm:text-xl font-black tracking-tight text-slate-900 font-sans">
                      Bhumi<span className="text-indigo-600">Vikas</span>
                    </span>
                    <span className="hidden sm:inline-block px-1.5 py-0.5 rounded text-[10px] font-bold font-mono tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-100">
                      SAHAYAK
                    </span>
                  </div>
                  <p className="text-[10px] sm:text-[11px] text-slate-400 font-medium line-clamp-1">
                    {isHindi ? 'भोपाल नगर निगम · भवन अनुज्ञा' : 'MP Building Regulations 2012'}
                  </p>
                </div>
              </a>
            </div>

            {/* 2. CENTER: Clean Minimalist Nav Links */}
            <nav className="hidden lg:flex items-center gap-7 xl:gap-9 text-sm font-medium text-slate-600">
              <button
                type="button"
                onClick={onOpenRulebook}
                className="hover:text-slate-900 transition-colors focus:outline-hidden cursor-pointer"
              >
                {isHindi ? 'नियम संकलन (106)' : 'Rulebook'}
              </button>

              <button
                type="button"
                onClick={onOpenCalculator}
                className="hover:text-slate-900 transition-colors focus:outline-hidden cursor-pointer"
              >
                {isHindi ? 'सेटबैक कैलकुलेटर' : 'Calculator'}
              </button>

              <button
                type="button"
                onClick={onOpenCoverage}
                className="hover:text-slate-900 transition-colors focus:outline-hidden cursor-pointer"
              >
                {isHindi ? 'कवरेज सीमाएं' : 'Coverage'}
              </button>

              <button
                type="button"
                onClick={scrollToStandards}
                className="hover:text-slate-900 transition-colors focus:outline-hidden cursor-pointer"
              >
                {isHindi ? 'मानक संदर्भ' : 'Standards'}
              </button>

              {/* More ··· Dropdown */}
              <div className="relative" ref={moreRef}>
                <button
                  type="button"
                  onClick={() => setIsMoreOpen((prev) => !prev)}
                  className="flex items-center gap-1 hover:text-slate-900 transition-colors focus:outline-hidden cursor-pointer py-1"
                  aria-expanded={isMoreOpen}
                >
                  <span>{isHindi ? 'अधिक' : 'More'}</span>
                  <MoreHorizontal className="w-4 h-4 ml-0.5 text-slate-500" />
                </button>

                {isMoreOpen && (
                  <div className="absolute top-full left-0 mt-2 w-64 bg-white rounded-2xl shadow-elevated border border-slate-200/90 py-2.5 z-50 animate-fadeIn text-xs">
                    <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 mb-1">
                      {isHindi ? 'अतिरिक्त विधिक साधन' : 'Regulatory Resources'}
                    </div>

                    <a
                      href="https://mptownplan.gov.in/NewsPDF/bvn06032025E.pdf"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between px-3.5 py-2 hover:bg-slate-50 text-slate-700 hover:text-indigo-600 transition-colors"
                    >
                      <span className="flex items-center gap-2">
                        <BookOpen className="w-3.5 h-3.5 text-indigo-500" />
                        <span>Official Gazette PDF (English)</span>
                      </span>
                      <ExternalLink className="w-3 h-3 text-slate-400" />
                    </a>

                    <a
                      href="https://mptownplan.gov.in/NewsPDF/bvn06032025H.pdf"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between px-3.5 py-2 hover:bg-slate-50 text-slate-700 hover:text-indigo-600 transition-colors"
                    >
                      <span className="flex items-center gap-2">
                        <BookOpen className="w-3.5 h-3.5 text-indigo-500" />
                        <span>आधिकारिक राजपत्र PDF (हिंदी)</span>
                      </span>
                      <ExternalLink className="w-3 h-3 text-slate-400" />
                    </a>

                    {onOpenCounterSlip && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsMoreOpen(false);
                          onOpenCounterSlip();
                        }}
                        className="w-full text-left flex items-center gap-2 px-3.5 py-2 hover:bg-slate-50 text-slate-700 hover:text-indigo-600 transition-colors"
                      >
                        <Printer className="w-3.5 h-3.5 text-slate-500" />
                        <span>{isHindi ? 'काउंटर पर्ची प्रिंट करें' : 'Print Counter Slip'}</span>
                      </button>
                    )}

                    <div className="my-1 border-t border-slate-100" />

                    <button
                      type="button"
                      onClick={() => {
                        onToggleDemoMode();
                        setIsMoreOpen(false);
                      }}
                      className="w-full text-left flex items-center justify-between px-3.5 py-2 hover:bg-slate-50 text-slate-700 transition-colors"
                    >
                      <span className="flex items-center gap-2">
                        {isDemoMode ? (
                          <Zap className="w-3.5 h-3.5 text-purple-600" />
                        ) : (
                          <Server className="w-3.5 h-3.5 text-indigo-600" />
                        )}
                        <span>{isDemoMode ? 'Demo Engine' : 'Live Backend Engine'}</span>
                      </span>
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                          isDemoMode
                            ? 'bg-purple-100 text-purple-700'
                            : 'bg-indigo-100 text-indigo-700'
                        }`}
                      >
                        {isDemoMode ? 'Client' : 'API Live'}
                      </span>
                    </button>
                  </div>
                )}
              </div>
            </nav>

            {/* 3. RIGHT: Controls, Icons & Primary Black Pill Button (TripMate Style) */}
            <div className="flex items-center gap-2.5 sm:gap-4">
              {/* Sun / Theme appearance icon */}
              <button
                type="button"
                onClick={handleThemeToggle}
                className="p-2 rounded-full text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors focus:outline-hidden cursor-pointer"
                title={isDarkModeActive ? 'Switch to Light Theme' : 'Theme Settings'}
                aria-label="Toggle Theme"
              >
                <Sun className="w-4 h-4 text-slate-600 hover:rotate-45 transition-transform duration-200" />
              </button>

              {/* Notification Bell with Red Badge Dot */}
              <div className="relative" ref={notifRef}>
                <button
                  type="button"
                  onClick={() => {
                    setIsNotificationsOpen((prev) => !prev);
                    setHasUnreadAlerts(false);
                  }}
                  className="p-2 rounded-full text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors focus:outline-hidden cursor-pointer relative"
                  title="Notifications & Regulatory Notices"
                  aria-label="View notifications"
                >
                  <Bell className="w-4 h-4 text-slate-600" />
                  {hasUnreadAlerts && (
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white animate-pulse" />
                  )}
                </button>

                {/* Notifications Popover */}
                {isNotificationsOpen && (
                  <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-elevated border border-slate-200 p-4 z-50 animate-fadeIn text-xs space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                      <div className="flex items-center gap-1.5 font-bold text-slate-900">
                        <Bell className="w-3.5 h-3.5 text-indigo-600" />
                        <span>{isHindi ? 'विधिक सूचनाएं एवं चेतावनियां' : 'Regulatory Notifications'}</span>
                      </div>
                      <span className="text-[10px] text-slate-400">BMC Counter Portal</span>
                    </div>

                    {/* Alert 1: August 2026 Alert */}
                    <div className="p-3 bg-amber-50/80 rounded-xl border border-amber-200/80 space-y-1">
                      <div className="flex items-center gap-1.5 font-bold text-amber-900 text-[11px]">
                        <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
                        <span>August 2026 Amendment Alert</span>
                      </div>
                      <p className="text-[11px] text-amber-950 leading-relaxed">
                        The Government of MP reportedly amended Rule 2(5)(c) regarding separate development permissions for sub-divided plots up to 500 sq m. Available rulebook cutoff is 6 March 2025.
                      </p>
                    </div>

                    {/* Alert 2: Engine Status */}
                    <div className="p-3 bg-indigo-50/80 rounded-xl border border-indigo-200/80 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <div>
                          <span className="font-bold text-slate-800 block text-[11px]">
                            {isBackendConnected ? 'FastAPI Backend Live' : 'Client Engine Active'}
                          </span>
                          <span className="text-[10px] text-slate-500">
                            Consolidated 106 Rules Indexed
                          </span>
                        </div>
                      </div>
                      <span className="font-mono text-[10px] font-bold text-indigo-700 bg-white px-2 py-0.5 rounded border border-indigo-200">
                        v2025-03-06
                      </span>
                    </div>

                    <div className="text-center pt-1 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => setIsNotificationsOpen(false)}
                        className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800"
                      >
                        {isHindi ? 'बंद करें' : 'Dismiss All'}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Language Switcher */}
              <LanguageToggle language={language} onLanguageChange={onLanguageChange} />

              {/* TripMate High-Contrast Black Pill Button */}
              <button
                type="button"
                id="sign-in-nav-btn"
                onClick={() => setIsSignInModalOpen(true)}
                className="rounded-full bg-slate-900 text-white px-4 sm:px-5 py-2 text-xs sm:text-sm font-semibold hover:bg-slate-800 transition-all shadow-xs hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
              >
                {isHindi ? 'लॉग इन' : 'Sign In'}
              </button>

              {/* Mobile Hamburger Menu Toggle */}
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen((prev) => !prev)}
                className="lg:hidden p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                aria-label="Toggle mobile menu"
              >
                {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {isMobileMenuOpen && (
          <div className="lg:hidden border-t border-slate-100 bg-white px-5 py-4 space-y-3 animate-fadeIn text-sm">
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  onOpenRulebook();
                }}
                className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-left font-semibold text-slate-800 hover:bg-slate-100"
              >
                <BookOpen className="w-4 h-4 text-indigo-600 mb-1" />
                <span>{isHindi ? 'नियम संकलन (106)' : 'Rulebook'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  onOpenCalculator();
                }}
                className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-left font-semibold text-slate-800 hover:bg-slate-100"
              >
                <Calculator className="w-4 h-4 text-indigo-600 mb-1" />
                <span>{isHindi ? 'सेटबैक कैलकुलेटर' : 'Calculator'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  onOpenCoverage();
                }}
                className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-left font-semibold text-slate-800 hover:bg-slate-100"
              >
                <Info className="w-4 h-4 text-indigo-600 mb-1" />
                <span>{isHindi ? 'कवरेज सीमाएं' : 'Coverage'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  scrollToStandards();
                }}
                className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-left font-semibold text-slate-800 hover:bg-slate-100"
              >
                <Building className="w-4 h-4 text-indigo-600 mb-1" />
                <span>{isHindi ? 'मानक संदर्भ' : 'Standards'}</span>
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Operator Sign In / Session Modal */}
      {isSignInModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-elevated overflow-hidden p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-slate-900 text-white">
                  <UserCheck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {isHindi ? 'नागरिक काउंटर ऑपरेटर सत्र' : 'Counter Desk Operator'}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Bhopal Municipal Corporation Facilitation Desk
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsSignInModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500">Operator Status:</span>
                  <span className="font-bold text-emerald-700 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Authenticated Desk
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Location:</span>
                  <span className="font-bold text-slate-800">SSR Global Skills Park, Bhopal</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Assigned Desk:</span>
                  <span className="font-bold text-slate-800">Counter #04 (Building Permission)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Dataset Version:</span>
                  <span className="font-mono font-bold text-slate-800">06-Mar-2025</span>
                </div>
              </div>

              <p className="text-[11px] text-slate-500 leading-relaxed">
                {isHindi
                  ? 'आप वर्तमान में भोपाल नगर निगम काउंटर ऑपरेटर के रूप में अधिकृत हैं। सभी उत्पन्न पर्चियां आधिकारिक रिकॉर्ड आईडी के साथ सुरक्षित की जाती हैं।'
                  : 'You are authenticated on the building permission decision assistant. Counter slips printed during this session bear BMC reference hashes.'}
              </p>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsSignInModalOpen(false)}
                className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs transition-colors shadow-xs"
              >
                {isHindi ? 'सत्र जारी रखें' : 'Continue Session'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
