import React, { useState } from 'react';
import { Send, CornerDownLeft, Sparkles, X, AlertCircle } from 'lucide-react';
import type { Language } from '../types/api';
import { sampleQuestionsList } from '../services/mockData';

interface QuestionInputProps {
  question: string;
  setQuestion: (val: string) => void;
  onSubmit: () => void;
  isLoading: boolean;
  language: Language;
}

const MAX_CHAR_LIMIT = 600;

export const QuestionInput: React.FC<QuestionInputProps> = ({
  question,
  setQuestion,
  onSubmit,
  isLoading,
  language,
}) => {
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = question.trim();

    if (!trimmed) {
      setValidationError(
        language === 'hi'
          ? 'कृपया प्रश्न दर्ज करें। रिक्त प्रश्न जमा नहीं किया जा सकता।'
          : 'Please enter a building regulation question before submitting.'
      );
      return;
    }

    if (trimmed.length > MAX_CHAR_LIMIT) {
      setValidationError(
        language === 'hi'
          ? `प्रश्न ${MAX_CHAR_LIMIT} अक्षरों से अधिक नहीं हो सकता।`
          : `Question exceeds the maximum limit of ${MAX_CHAR_LIMIT} characters.`
      );
      return;
    }

    setValidationError(null);
    onSubmit();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey || !e.shiftKey)) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleSelectSample = (sampleText: string) => {
    setQuestion(sampleText);
    setValidationError(null);
  };

  return (
    <div className="w-full">
      <form onSubmit={handleSubmit} className="relative">
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-card hover:shadow-elevated transition-all duration-200 overflow-hidden focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-600">
          <div className="relative p-3.5 sm:p-4">
            <textarea
              id="question-input-textarea"
              rows={3}
              value={question}
              onChange={(e) => {
                setQuestion(e.target.value);
                if (validationError) setValidationError(null);
              }}
              onKeyDown={handleKeyDown}
              disabled={isLoading}
              maxLength={MAX_CHAR_LIMIT}
              placeholder={
                language === 'hi'
                  ? 'म.प्र. भूमि विकास नियम 2012 के संबंध में प्रश्न पूछें (उदा. 200 वर्ग मीटर प्लॉट पर सेटबैक, सड़क चौड़ाई, फार्म हाउस FAR...)'
                  : 'Ask about MP Bhumi Vikas Rules 2012 (e.g. Setback for 200 sq m plot, road width, farm house FAR, lift rules...)'
              }
              className="w-full resize-none text-slate-800 placeholder-slate-400 bg-transparent text-base leading-relaxed focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
            />

            {question && !isLoading && (
              <button
                type="button"
                onClick={() => {
                  setQuestion('');
                  setValidationError(null);
                }}
                className="absolute top-4 right-4 p-1 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors"
                title="Clear question"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Action bar below textarea */}
          <div className="bg-slate-50/80 px-4 py-2.5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-3 text-slate-500">
              <span className="hidden sm:inline-flex items-center gap-1 text-[11px] text-slate-400">
                <CornerDownLeft className="w-3 h-3" /> Press Enter or Click Submit
              </span>
              <span
                className={`text-[11px] font-mono ${
                  question.length > MAX_CHAR_LIMIT * 0.9
                    ? 'text-amber-600 font-semibold'
                    : 'text-slate-400'
                }`}
              >
                {question.length}/{MAX_CHAR_LIMIT}
              </span>
            </div>

            <button
              type="submit"
              id="submit-question-btn"
              disabled={isLoading || !question.trim()}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 active:scale-[0.98] shadow-xs hover:-translate-y-0.5 active:translate-y-0 transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>{language === 'hi' ? 'खोज जारी है...' : 'Verifying Rules...'}</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 text-indigo-400" />
                  <span>{language === 'hi' ? 'उत्तर प्राप्त करें' : 'Get Verified Answer'}</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Validation message */}
        {validationError && (
          <div className="mt-2 flex items-center gap-1.5 text-xs font-medium text-rose-600 animate-fadeIn">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{validationError}</span>
          </div>
        )}
      </form>

      {/* Sample Question Chips */}
      <div className="mt-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>
              {language === 'hi' ? 'सामान्य काउंटर प्रश्न (नमूने):' : 'BMC Counter Sample Questions:'}
            </span>
          </div>
          <span className="text-[11px] text-slate-400">Click any chip to test</span>
        </div>

        <div className="flex flex-wrap gap-2">
          {sampleQuestionsList.map((sample) => {
            const sampleText = language === 'hi' ? sample.textHi : sample.textEn;
            const categoryName = language === 'hi' ? sample.categoryHi : sample.category;
            const isSelected = question === sampleText;

            return (
              <button
                key={sample.id}
                type="button"
                onClick={() => handleSelectSample(sampleText)}
                className={`text-left group inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all duration-150 hover:-translate-y-0.5 ${
                  isSelected
                    ? 'bg-indigo-50/80 border-indigo-300 text-indigo-900 shadow-xs'
                    : 'bg-white border-slate-200 text-slate-700 hover:border-indigo-300 hover:bg-indigo-50/40 hover:text-slate-900 shadow-[0_1px_2px_rgba(0,0,0,0.03)]'
                }`}
              >
                <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 group-hover:bg-indigo-100 group-hover:text-indigo-800 transition-colors">
                  {sample.ruleHint}
                </span>
                <span className="truncate max-w-[280px] sm:max-w-[340px] md:max-w-[420px]">
                  {categoryName}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
