import React, { useState } from 'react';
import {
  Search,
  Filter,
  SlidersHorizontal,
  X,
  Sparkles,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  RotateCcw,
} from 'lucide-react';
import type { Language, PlotSearchCriteria } from '../types/api';

interface PlotInquirySearchProps {
  onPlotSubmit: (criteria: PlotSearchCriteria) => void;
  onFreeTextSubmit: (question: string) => void;
  isLoading: boolean;
  language: Language;
}

export const PlotInquirySearch: React.FC<PlotInquirySearchProps> = ({
  onPlotSubmit,
  onFreeTextSubmit,
  isLoading,
  language,
}) => {
  const isHindi = language === 'hi';

  // Unified Search Query
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Structured Numerical Parameters
  const [plotArea, setPlotArea] = useState<number>(200);
  const [areaUnit, setAreaUnit] = useState<'sqm' | 'sqft'>('sqm');
  const [roadWidth, setRoadWidth] = useState<number>(9.0);
  const [location, setLocation] = useState<string>('Bhopal Municipal Corporation Area');
  const [buildingType, setBuildingType] = useState<string>('Residential House');
  const [buildingHeight] = useState<number>(9.0);

  // UI State toggles
  const [showPlotSpecs, setShowPlotSpecs] = useState<boolean>(false);
  const [showFilterDrawer, setShowFilterDrawer] = useState<boolean>(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Filter States
  const [filterBuildingCategory, setFilterBuildingCategory] = useState<string>('all');
  const [filterPlotSize, setFilterPlotSize] = useState<string>('all');
  const [filterRoadWidth, setFilterRoadWidth] = useState<string>('all');
  const [filterRuleSubject, setFilterRuleSubject] = useState<string>('all');

  // Active filters count
  const activeFiltersCount =
    (filterBuildingCategory !== 'all' ? 1 : 0) +
    (filterPlotSize !== 'all' ? 1 : 0) +
    (filterRoadWidth !== 'all' ? 1 : 0) +
    (filterRuleSubject !== 'all' ? 1 : 0);

  // Quick Curated Scenarios for Counter Clerks
  const quickScenarios = [
    {
      id: 'residential-200',
      labelEn: '200 m² Residential (9m Road)',
      labelHi: '200 वर्ग मीटर आवासीय (9m सड़क)',
      ruleHint: 'Rule 56 Table 13',
      criteria: {
        plotArea: 200,
        areaUnit: 'sqm' as const,
        roadWidth: 9.0,
        buildingType: 'Residential House',
        location: 'Bhopal Municipal Corporation Area',
      },
    },
    {
      id: 'farmhouse-rule17',
      labelEn: 'Farm House Norms (Rule 17)',
      labelHi: 'फार्म हाउस नियम (नियम 17)',
      ruleHint: 'Rule 17 (0.40 Ha)',
      criteria: {
        plotArea: 4000,
        areaUnit: 'sqm' as const,
        roadWidth: 7.5,
        buildingType: 'Farm House (Agricultural)',
        location: 'Agricultural Zone / Outside Municipal Area',
      },
    },
    {
      id: 'small-plot-150',
      labelEn: '150 m² Rear Setback (Table 14)',
      labelHi: '150 वर्ग मीटर पीछे का सेटबैक',
      ruleHint: 'Rule 56(2)(a)',
      criteria: {
        plotArea: 150,
        areaUnit: 'sqm' as const,
        roadWidth: 9.0,
        buildingType: 'Residential House',
        location: 'Bhopal Municipal Corporation Area',
      },
    },
    {
      id: 'deemed-rule12a',
      labelEn: 'Rule 12-A Deemed Approval (186 m²)',
      labelHi: 'नियम 12-A डीम्ड अनुमति (186 m²)',
      ruleHint: 'Rule 12-A (30 Days)',
      criteria: {
        plotArea: 186,
        areaUnit: 'sqm' as const,
        roadWidth: 9.0,
        buildingType: 'Residential House',
        location: 'Bhopal Municipal Corporation Area',
      },
    },
    {
      id: 'power-line-rule52',
      labelEn: 'Overhead Power Line Distance',
      labelHi: 'बिजली लाइन सुरक्षा दूरी (नियम 52)',
      ruleHint: 'Rule 52',
      query: isHindi
        ? 'कम वोल्टेज वाली ओवरहेड बिजली लाइन से बालकनी की दूरी लंबवत और क्षैतिज कितनी होनी चाहिए?'
        : 'How far must my balcony stay from a low-voltage overhead electric line, vertically and horizontally?',
    },
  ];

  // Apply Building Category Filter
  const handleCategoryFilterSelect = (cat: string) => {
    setFilterBuildingCategory(cat);
    if (cat !== 'all') {
      setBuildingType(cat);
      if (cat.includes('Farm')) {
        setPlotArea(4000);
        setRoadWidth(7.5);
      }
    }
  };

  // Apply Plot Size Filter
  const handlePlotSizeFilterSelect = (sizeKey: string) => {
    setFilterPlotSize(sizeKey);
    if (sizeKey === 'small') setPlotArea(120);
    else if (sizeKey === 'medium') setPlotArea(200);
    else if (sizeKey === 'large') setPlotArea(400);
    else if (sizeKey === 'farmhouse') {
      setPlotArea(4000);
      setBuildingType('Farm House (Agricultural)');
    }
  };

  // Apply Road Width Filter
  const handleRoadWidthFilterSelect = (rwKey: string) => {
    setFilterRoadWidth(rwKey);
    if (rwKey === 'narrow') setRoadWidth(6.0);
    else if (rwKey === 'standard') setRoadWidth(9.0);
    else if (rwKey === 'medium') setRoadWidth(12.0);
    else if (rwKey === 'wide') setRoadWidth(18.0);
  };

  // Reset all filters
  const handleResetFilters = () => {
    setFilterBuildingCategory('all');
    setFilterPlotSize('all');
    setFilterRoadWidth('all');
    setFilterRuleSubject('all');
  };

  // Handle Main Submission
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    // If search input has free-text that does not appear to be just area numbers, evaluate as smart query
    const trimmed = searchQuery.trim();

    if (showPlotSpecs || !trimmed) {
      if (!plotArea || plotArea <= 0) {
        setValidationError(
          isHindi ? 'कृपया वैध भूखंड क्षेत्रफल (Plot Area) दर्ज करें।' : 'Please enter a valid plot area greater than zero.'
        );
        return;
      }

      onPlotSubmit({
        plotArea,
        areaUnit,
        roadWidth,
        location: location.trim() || 'Bhopal Municipal Corporation Area',
        buildingType,
        buildingHeight,
        additionalQuery: trimmed || undefined,
      });
      return;
    }

    // Free text inquiry
    onFreeTextSubmit(trimmed);
  };

  // Execute quick scenario
  const handleSelectScenario = (sc: typeof quickScenarios[0]) => {
    setValidationError(null);
    if (sc.criteria) {
      setPlotArea(sc.criteria.plotArea);
      setAreaUnit(sc.criteria.areaUnit);
      setRoadWidth(sc.criteria.roadWidth);
      setBuildingType(sc.criteria.buildingType);
      setLocation(sc.criteria.location);
      setSearchQuery('');
      onPlotSubmit(sc.criteria);
    } else if (sc.query) {
      setSearchQuery(sc.query);
      onFreeTextSubmit(sc.query);
    }
  };

  return (
    <div className="w-full bg-white rounded-2xl border border-slate-200/90 shadow-card overflow-hidden transition-all duration-200">
      {/* 1. TOP EXECUTIVE SEARCH BAR */}
      <form onSubmit={handleFormSubmit} className="p-4 sm:p-5 border-b border-slate-100">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          {/* Main Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              id="unified-search-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              disabled={isLoading}
              placeholder={
                isHindi
                  ? 'भूखंड क्षेत्रफल, स्थान, निर्माण प्रकार दर्ज करें अथवा कोई भी विधिक प्रश्न पूछें...'
                  : 'Enter plot area (e.g. 200 sqm), street width, building type, or ask any regulation question...'
              }
              className="w-full pl-10 pr-9 py-3 rounded-xl border border-slate-200 text-sm font-medium text-slate-900 bg-slate-50/50 hover:bg-white focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all placeholder:text-slate-400"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded-full"
                title="Clear input"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Action Tools: Filter Toggle & Numerical Specs Toggle */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Filter Toggle Button */}
            <button
              type="button"
              id="toggle-filter-btn"
              onClick={() => setShowFilterDrawer(!showFilterDrawer)}
              className={`inline-flex items-center gap-1.5 px-3.5 py-3 rounded-xl text-xs font-semibold border transition-all duration-150 ${
                showFilterDrawer || activeFiltersCount > 0
                  ? 'bg-indigo-50 border-indigo-300 text-indigo-700 shadow-2xs'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300'
              }`}
              title="Toggle regulatory filters"
            >
              <Filter className="w-3.5 h-3.5 text-indigo-600" />
              <span>{isHindi ? 'फ़िल्टर' : 'Filters'}</span>
              {activeFiltersCount > 0 && (
                <span className="w-4 h-4 rounded-full bg-indigo-600 text-white text-[10px] flex items-center justify-center font-mono font-bold">
                  {activeFiltersCount}
                </span>
              )}
            </button>

            {/* Numerical Plot Specs Toggle */}
            <button
              type="button"
              id="toggle-specs-btn"
              onClick={() => setShowPlotSpecs(!showPlotSpecs)}
              className={`inline-flex items-center gap-1.5 px-3.5 py-3 rounded-xl text-xs font-semibold border transition-all duration-150 ${
                showPlotSpecs
                  ? 'bg-slate-900 border-slate-900 text-white shadow-2xs'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300'
              }`}
              title="Toggle detailed plot specification inputs"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>{isHindi ? 'भूखंड विवरण' : 'Plot Specs'}</span>
              {showPlotSpecs ? (
                <ChevronUp className="w-3 h-3 text-slate-400" />
              ) : (
                <ChevronDown className="w-3 h-3 text-slate-400" />
              )}
            </button>

            {/* Primary Submit Button */}
            <button
              type="submit"
              id="evaluate-rules-btn"
              disabled={isLoading}
              className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-xs sm:text-sm font-bold text-white bg-slate-900 hover:bg-slate-800 active:scale-[0.98] shadow-sm hover:shadow-md transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
            >
              {isLoading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>{isHindi ? 'सत्यापन जारी...' : 'Evaluating...'}</span>
                </>
              ) : (
                <>
                  <span>{isHindi ? 'नियम जांचें' : 'Evaluate Rules'}</span>
                  <ArrowRight className="w-3.5 h-3.5 text-indigo-400" />
                </>
              )}
            </button>
          </div>
        </div>

        {/* Validation Alert */}
        {validationError && (
          <div className="mt-3 flex items-center gap-2 p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-xs font-medium text-rose-700 animate-fadeIn">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{validationError}</span>
          </div>
        )}
      </form>

      {/* 2. DEDICATED REGULATORY FILTER STRIP */}
      {showFilterDrawer && (
        <div className="px-4 sm:px-5 py-3.5 bg-slate-50/80 border-b border-slate-200/80 animate-fadeIn space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Filter className="w-3.5 h-3.5 text-indigo-600" />
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                {isHindi ? 'नियम एवं भूखंड फ़िल्टर' : 'Regulatory & Planning Filters'}
              </span>
            </div>

            {activeFiltersCount > 0 && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 hover:text-indigo-600 transition-colors"
              >
                <RotateCcw className="w-3 h-3" />
                <span>{isHindi ? 'फ़िल्टर हटाएं' : 'Reset Filters'}</span>
              </button>
            )}
          </div>

          {/* Filter Selectors Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 text-xs">
            {/* Filter 1: Building Category */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                {isHindi ? 'भवन श्रेणी:' : 'Building Category:'}
              </label>
              <select
                id="filter-building-category"
                value={filterBuildingCategory}
                onChange={(e) => handleCategoryFilterSelect(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
              >
                <option value="all">{isHindi ? 'सभी श्रेणियां (All Types)' : 'All Building Categories'}</option>
                <option value="Residential House">{isHindi ? 'आवासीय (Residential House)' : 'Residential House'}</option>
                <option value="Commercial Shop / Complex">{isHindi ? 'व्यावसायिक (Commercial Complex)' : 'Commercial Shop / Complex'}</option>
                <option value="Farm House (Agricultural)">{isHindi ? 'फार्म हाउस (Farm House - Rule 17)' : 'Farm House (Agricultural - Rule 17)'}</option>
                <option value="Multi-Storey / Group Housing">{isHindi ? 'बहुमंजिला (Multi-Storey / Flats)' : 'Multi-Storey / Group Housing'}</option>
                <option value="Mixed Use (Shop + Residence)">{isHindi ? 'मिश्रित उपयोग (Mixed Use)' : 'Mixed Use (Commercial + Res)'}</option>
                <option value="Industrial / Warehouse">{isHindi ? 'औद्योगिक (Industrial / Shed)' : 'Industrial / Warehouse'}</option>
              </select>
            </div>

            {/* Filter 2: Plot Size Range */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                {isHindi ? 'भूखंड आकार सीमा:' : 'Plot Size Range:'}
              </label>
              <select
                id="filter-plot-size"
                value={filterPlotSize}
                onChange={(e) => handlePlotSizeFilterSelect(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
              >
                <option value="all">{isHindi ? 'समस्त आकार (All Sizes)' : 'All Plot Sizes'}</option>
                <option value="small">{isHindi ? 'छोटा भूखंड (≤150 m²)' : 'Small Plot (≤150 sq m)'}</option>
                <option value="medium">{isHindi ? 'मध्यम भूखंड (151–300 m²)' : 'Medium Plot (151–300 sq m)'}</option>
                <option value="large">{isHindi ? 'बड़ा भूखंड (301–500 m²)' : 'Large Plot (301–500 sq m)'}</option>
                <option value="farmhouse">{isHindi ? 'फार्म हाउस भूमि (≥4,000 m²)' : 'Farmhouse Land (≥4,000 sq m)'}</option>
              </select>
            </div>

            {/* Filter 3: Road Width */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                {isHindi ? 'सड़क चौड़ाई (Rule 56 Table 13):' : 'Street Width (Rule 56):'}
              </label>
              <select
                id="filter-road-width"
                value={filterRoadWidth}
                onChange={(e) => handleRoadWidthFilterSelect(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
              >
                <option value="all">{isHindi ? 'समस्त सड़कें (All Roads)' : 'All Street Widths'}</option>
                <option value="narrow">{isHindi ? '6m सड़क (3.0m फ्रंट सेटबैक)' : '≤6.0m Street (3.0m Setback)'}</option>
                <option value="standard">{isHindi ? '9m सड़क (3.0m फ्रंट सेटबैक)' : '6.1–9.0m Street (3.0m Setback)'}</option>
                <option value="medium">{isHindi ? '12m सड़क (3.6m फ्रंट सेटबैक)' : '9.1–12.0m Street (3.6m Setback)'}</option>
                <option value="wide">{isHindi ? '18m+ सड़क (4.5m–6.0m सेटबैक)' : '>12.0m Street (4.5m–6.0m Setback)'}</option>
              </select>
            </div>

            {/* Filter 4: Regulatory Subject */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                {isHindi ? 'विनियमन विषय:' : 'Rule Focus / Subject:'}
              </label>
              <select
                id="filter-rule-subject"
                value={filterRuleSubject}
                onChange={(e) => setFilterRuleSubject(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
              >
                <option value="all">{isHindi ? 'समस्त विषय (All Rules)' : 'All Regulation Focus'}</option>
                <option value="setback">{isHindi ? 'नियम 56 सेटबैक एवं खुले स्थान' : 'Rule 56 Setbacks & Open Space'}</option>
                <option value="farmhouse">{isHindi ? 'नियम 17 फार्म हाउस एवं FAR' : 'Rule 17 Farm House Norms'}</option>
                <option value="deemed">{isHindi ? 'नियम 12-A डीम्ड अनुमति' : 'Rule 12-A Deemed Approval'}</option>
                <option value="electric">{isHindi ? 'नियम 52 विद्युत लाइन दूरी' : 'Rule 52 Power Line Clearance'}</option>
                <option value="validity">{isHindi ? 'नियम 23 अनुमति वैधता व नवीनीकरण' : 'Rule 23 Sanction Validity'}</option>
              </select>
            </div>
          </div>

          {/* Active Filter Badges */}
          {activeFiltersCount > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[11px]">
              <span className="text-slate-400 font-medium">Applied:</span>
              {filterBuildingCategory !== 'all' && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200 font-medium">
                  {filterBuildingCategory}
                  <button type="button" onClick={() => setFilterBuildingCategory('all')} className="hover:text-indigo-900">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {filterPlotSize !== 'all' && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200 font-medium">
                  Size: {filterPlotSize}
                  <button type="button" onClick={() => setFilterPlotSize('all')} className="hover:text-indigo-900">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {filterRoadWidth !== 'all' && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200 font-medium">
                  Road: {filterRoadWidth}
                  <button type="button" onClick={() => setFilterRoadWidth('all')} className="hover:text-indigo-900">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {filterRuleSubject !== 'all' && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200 font-medium">
                  Subject: {filterRuleSubject}
                  <button type="button" onClick={() => setFilterRuleSubject('all')} className="hover:text-indigo-900">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
            </div>
          )}
        </div>
      )}

      {/* 3. STRUCTURED PLOT SPECIFICATIONS DRAWER (When Expanded) */}
      {showPlotSpecs && (
        <div className="p-4 sm:p-5 bg-slate-50/50 border-b border-slate-100 animate-fadeIn">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-600" />
              <span>{isHindi ? 'सटीक भूखंड एवं सड़क विनिर्देश:' : 'Exact Plot & Road Specifications:'}</span>
            </span>
            <span className="text-[11px] text-slate-400 font-mono">
              ≈ {areaUnit === 'sqm' ? `${Math.round(plotArea * 10.764)} sq ft` : `${Math.round(plotArea * 0.093)} sq m`}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
            {/* Field 1: Plot Area */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1 flex items-center justify-between">
                <span>{isHindi ? 'भूखंड क्षेत्रफल:' : 'Plot Area:'}</span>
                <div className="inline-flex rounded-md p-0.5 bg-slate-200 text-[10px]">
                  <button
                    type="button"
                    onClick={() => setAreaUnit('sqm')}
                    className={`px-1.5 py-0.5 rounded ${areaUnit === 'sqm' ? 'bg-white font-bold text-slate-900 shadow-2xs' : 'text-slate-600'}`}
                  >
                    m²
                  </button>
                  <button
                    type="button"
                    onClick={() => setAreaUnit('sqft')}
                    className={`px-1.5 py-0.5 rounded ${areaUnit === 'sqft' ? 'bg-white font-bold text-slate-900 shadow-2xs' : 'text-slate-600'}`}
                  >
                    sq ft
                  </button>
                </div>
              </label>
              <input
                type="number"
                min="10"
                max="100000"
                value={plotArea || ''}
                onChange={(e) => setPlotArea(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 font-mono text-sm font-semibold text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
              />
            </div>

            {/* Field 2: Facing Street Width */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                {isHindi ? 'सड़क चौड़ाई (मीटर):' : 'Street Width (meters):'}
              </label>
              <div className="flex gap-1">
                {[6.0, 9.0, 12.0, 18.0].map((w) => (
                  <button
                    key={w}
                    type="button"
                    onClick={() => setRoadWidth(w)}
                    className={`flex-1 py-2 text-xs rounded-lg font-mono font-bold transition-all ${
                      roadWidth === w
                        ? 'bg-slate-900 text-white shadow-2xs'
                        : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {w}m
                  </button>
                ))}
              </div>
            </div>

            {/* Field 3: Building Type */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                {isHindi ? 'निर्माण प्रकार:' : 'Building Use:'}
              </label>
              <select
                value={buildingType}
                onChange={(e) => setBuildingType(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs font-medium text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
              >
                <option value="Residential House">Residential House (आवासीय)</option>
                <option value="Commercial Shop / Complex">Commercial Complex (व्यावसायिक)</option>
                <option value="Farm House (Agricultural)">Farm House (फार्म हाउस - Rule 17)</option>
                <option value="Multi-Storey / Group Housing">Multi-Storey / Group Housing</option>
                <option value="Mixed Use (Shop + Residence)">Mixed Use (दुकान + आवास)</option>
                <option value="Industrial / Warehouse">Industrial / Godown Shed</option>
              </select>
            </div>

            {/* Field 4: Location */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                {isHindi ? 'स्थान / नगर निगम क्षेत्र:' : 'Location Area:'}
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Bhopal Municipal Corporation Area"
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs font-medium text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
              />
            </div>
          </div>
        </div>
      )}

      {/* 4. CURATED TOP COUNTER SCENARIO CHIPS */}
      <div className="px-4 sm:px-5 py-3 bg-slate-50/40 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-1.5 text-slate-500 text-[11px] font-semibold uppercase tracking-wider">
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          <span>{isHindi ? 'त्वरित काउंटर परिदृश्य:' : 'Standard Counter Scenarios:'}</span>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {quickScenarios.map((sc) => (
            <button
              key={sc.id}
              type="button"
              onClick={() => handleSelectScenario(sc)}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-white hover:bg-indigo-50 border border-slate-200 hover:border-indigo-300 text-slate-700 hover:text-indigo-900 transition-all duration-150 shadow-2xs hover:-translate-y-0.5"
            >
              <span className="text-[10px] font-mono px-1 py-0.2 rounded bg-slate-100 text-slate-600 font-bold">
                {sc.ruleHint}
              </span>
              <span>{isHindi ? sc.labelHi : sc.labelEn}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
