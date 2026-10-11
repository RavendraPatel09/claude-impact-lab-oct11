import type {
  AnswerResponse,
  AskRequest,
  FarmHouseNorms,
  PlotSearchCriteria,
  Rule,
  SetbackCalculationRequest,
  SetbackCalculationResponse,
  SourceInfo,
  Language,
} from '../types/api';
import { queryLocalRules, rulesDatabase } from './mockData';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export const sourceMetadata: SourceInfo = {
  title: 'Madhya Pradesh Bhumi Vikas Rules, 2012 (Consolidated)',
  version: '2025-03-06',
  consolidation_date: '6 March 2025',
  source_authority: 'Town & Country Planning Department (MP), Bhopal',
  total_rules: 106,
  total_pages: 108,
  amendment_note: 'Note: Consolidated through 6 March 2025. The later amendment of 28 August 2026 affecting Rule 2(5)(c) for plots up to 500 sq. m. is not included in the supplied dataset.',
  pdf_links: {
    en: 'https://mptownplan.gov.in/NewsPDF/bvn06032025E.pdf',
    hi: 'https://mptownplan.gov.in/NewsPDF/bvn06032025H.pdf'
  }
};

/**
 * Check if the FastAPI backend is running and reachable
 */
export async function checkBackendHealth(): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);
    const res = await fetch(`${BASE_URL}/api/health`, {
      method: 'GET',
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    if (!res.ok) return false;
    const data = await res.json();
    return data?.status === 'ok';
  } catch {
    return false;
  }
}

/**
 * Call backend deterministic setback calculation endpoint POST /api/calculate/setback
 */
export async function calculateSetbacksApi(
  payload: SetbackCalculationRequest
): Promise<SetbackCalculationResponse | null> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);
    const res = await fetch(`${BASE_URL}/api/calculate/setback`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    if (res.ok) {
      return (await res.json()) as SetbackCalculationResponse;
    }
  } catch (err) {
    console.warn('Setback calculation API call failed, using client calculations:', err);
  }

  // Client-side fallback calculation matching Rule 56
  return calculateLocalSetbacks(payload.street_width_m, payload.plot_area_sqm);
}

function calculateLocalSetbacks(
  streetWidth: number,
  plotArea: number
): SetbackCalculationResponse {
  let front = 3.0;
  if (streetWidth <= 9.0) front = 3.0;
  else if (streetWidth <= 12.0) front = 3.6;
  else if (streetWidth <= 18.0) front = 4.5;
  else front = 6.0;

  let rear = 0.0;
  if (plotArea <= 40) rear = 0.0;
  else if (plotArea <= 150) rear = 1.5;
  else if (plotArea <= 225) rear = 2.5;
  else rear = 3.0;

  const side = plotArea <= 150 ? 1.5 : 3.0;

  return {
    front_open_space_m: front,
    rear_open_space_m: rear,
    side_open_space_m: side,
    building_height_limit_m: 12.5,
    rule: '56',
    explanation: `For residential plot of ${plotArea} sq. m. on ${streetWidth} m street: Front Open Space = ${front.toFixed(1)}m (Rule 56(1)(a)); Rear Open Space = ${rear.toFixed(2)}m (Rule 56(2)(a)); Side Open Space = ${side.toFixed(1)}m under Rule 56(3).`,
    citations: [
      {
        rule: '56',
        title: 'Residential Buildings',
        page_start: 77,
        page_end: 80,
        excerpt: 'Rule 56. Residential Buildings.- Exterior open spaces for buildings having height up to 12.5 meters. (1) Front open spaces,- (a) Every Residential Building having height up to 12.5 meters, facing street shall have a front open space... (2) Rear Open Space,- Every Residential Building, having height up to 12.5 meters, shall have a Rear Open Space...'
      }
    ],
    warnings: []
  };
}

/**
 * Submit question to POST /api/ask with automatic mock fallback
 */
export async function askQuestion(
  req: AskRequest,
  forceDemo: boolean = false
): Promise<{ response: AnswerResponse; usedBackend: boolean }> {
  if (forceDemo) {
    await new Promise((resolve) => setTimeout(resolve, 500));
    return {
      response: queryLocalRules(req.question, req.language),
      usedBackend: false,
    };
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000);

    const res = await fetch(`${BASE_URL}/api/ask`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(req),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      throw new Error(`Server returned HTTP ${res.status}: ${res.statusText}`);
    }

    const data: AnswerResponse = await res.json();
    return {
      response: data,
      usedBackend: true,
    };
  } catch (err: unknown) {
    console.warn('Backend call failed, falling back to local grounded rules engine:', err);
    await new Promise((resolve) => setTimeout(resolve, 350));
    const fallbackResponse = queryLocalRules(req.question, req.language);
    
    return {
      response: {
        ...fallbackResponse,
        warnings: [
          ...(fallbackResponse.warnings || []),
          'Served via Client Verification Engine (Backend connection unavailable at ' + BASE_URL + ')'
        ]
      },
      usedBackend: false,
    };
  }
}

/**
 * Guided Plot Inquiry that connects directly to the backend
 * Accepts: area of plot, location, what you want to build
 */
export async function submitPlotInquiry(
  criteria: PlotSearchCriteria,
  language: Language,
  forceDemo: boolean = false
): Promise<{ response: AnswerResponse; usedBackend: boolean }> {
  // Convert area to sq m if input was in sq ft
  const areaSqm = criteria.areaUnit === 'sqft'
    ? Math.round((criteria.plotArea * 0.092903) * 10) / 10
    : criteria.plotArea;

  const isHindi = language === 'hi';

  const isFarmHouse =
    criteria.buildingType.toLowerCase().includes('farm') ||
    criteria.buildingType.toLowerCase().includes('फार्म');

  const isResidential =
    !isFarmHouse &&
    (criteria.buildingType.toLowerCase().includes('residential') ||
      criteria.buildingType.toLowerCase().includes('आवासीय') ||
      criteria.buildingType.toLowerCase().includes('house') ||
      criteria.buildingType.toLowerCase().includes('duplex') ||
      criteria.buildingType.toLowerCase().includes('mixed'));

  // Construct precise domain query
  let questionText = '';
  if (isFarmHouse) {
    if (isHindi) {
      questionText = `कृषि भूमि पर फार्म हाउस निर्माण हेतु नियम 17 की क्या शर्तें हैं? न्यूनतम भूखंड आकार (0.40 हेक्टेयर), अधिकतम FAR, ऊंचाई (7.5m ढलवां छत), और चारों ओर खुला स्थान (7.5m) क्या है? प्लॉट आकार: ${areaSqm} वर्ग मीटर।`;
    } else {
      questionText = `What are the planning norms for a farm house under Rule 17 of MP Bhumi Vikas Rules? Minimum plot size, maximum FAR, height, and open space on all sides for a plot of ${areaSqm} sq m?`;
    }
  } else if (isHindi) {
    questionText = `मेरा प्लॉट ${criteria.location} में ${areaSqm} वर्ग मीटर का है और सामने ${criteria.roadWidth} मीटर चौड़ी सड़क है। मैं ${criteria.buildingType} बनाना चाहता हूँ। म.प्र. भूमि विकास नियम 2012 के अनुसार आगे और पीछे कितना सेटबैक (खुला स्थान) छोड़ना होगा और निर्माण की क्या शर्तें हैं?`;
  } else {
    questionText = `My plot area is ${areaSqm} sq m located in ${criteria.location} facing a ${criteria.roadWidth} m wide road. I want to build a ${criteria.buildingType}. What are the front and rear setback requirements, open spaces, and building permissions under MP Bhumi Vikas Rules, 2012?`;
  }

  if (criteria.additionalQuery && criteria.additionalQuery.trim()) {
    questionText += ` ${criteria.additionalQuery.trim()}`;
  }

  // 1. Call POST /api/ask
  const { response: rawAnswer, usedBackend } = await askQuestion(
    { question: questionText, language },
    forceDemo
  );

  // 2. Compute specific calculation models
  let calculatedSetbacks: SetbackCalculationResponse | null = null;
  let farmHouseNorms: FarmHouseNorms | null = null;

  if (isFarmHouse) {
    // Farm house under Rule 17
    const maxBuiltUp = Math.round(areaSqm * 0.10);
    farmHouseNorms = {
      minimum_plot_size_hectare: 0.40,
      minimum_plot_size_sqm: 4000.0,
      maximum_far: 0.10,
      max_built_up_sqm: maxBuiltUp,
      maximum_height_m: 7.5,
      roof_type: 'sloping roof (ढलवां छत)',
      minimum_live_trees_per_hectare: 100,
      minimum_road_width_m: 7.5,
      minimum_open_space_all_sides_m: 7.50,
      explanation: `Rule 17: In any area designated for agricultural use, Farm Houses require minimum plot size of 0.40 hectare (4,000 m²), maximum FAR 0.10 (max permissible built-up: ${maxBuiltUp} m²), 7.5m max height with sloping roof, min 100 live trees/ha, road access >= 7.5m, and 7.50m open space (MOS) from all sides.`
    };

    calculatedSetbacks = {
      front_open_space_m: 7.50,
      rear_open_space_m: 7.50,
      side_open_space_m: 7.50,
      building_height_limit_m: 7.5,
      rule: '17',
      explanation: `Rule 17(f): Farm House requires minimum 7.50 meters Marginal Open Space (M.O.S.) from all sides (Front, Rear, Left, Right).`,
      citations: [
        {
          rule: '17',
          title: 'Permission of farm House',
          page_start: 34,
          page_end: 34,
          excerpt: '17. Permission of farm House.- (a) Minimum size of the plot shall be 0.40 hectare; (b) Maximum F.A.R. shall be 0.10; (c) The maximum height of structure shall be 7.5 meters with sloping roof; (d) Farm House shall have a minimum of 100 live trees per hectare; (e) Road having width not less than 7.5 meters; (f) Minimum 7.50 meters open space (MOS) from all sides.'
        }
      ],
      warnings: []
    };
  } else if (isResidential && areaSqm > 0 && criteria.roadWidth > 0) {
    calculatedSetbacks = await calculateSetbacksApi({
      street_width_m: criteria.roadWidth,
      plot_area_sqm: areaSqm,
      building_height_m: criteria.buildingHeight || 9.0,
      is_existing_narrow_street: criteria.roadWidth < 6.0,
    });
  }

  // 3. Add Rule 12-A deemed approval note if plot <= 186 sq m
  const warnings = [...(rawAnswer.warnings || [])];
  if (areaSqm <= 186 && isResidential) {
    const deemedNote = isHindi
      ? 'त्वरित डीम्ड स्वीकृति (नियम 12-A): 186 वर्ग मीटर तक के आवासीय भूखंडों पर परिशिष्ट A-2(2) एवं शपथ पत्र जमा करने पर स्वतः स्वीकृति (Deemed Approval) का प्रावधान है।'
      : 'Instant / Deemed Sanction Eligible (Rule 12-A): Residential plots up to 186 sq m qualify for deemed building approval upon submitting Appendix A-2(2) and affidavit without waiting for prior site inspection.';
    if (!warnings.some(w => w.includes('186') || w.includes('12-A'))) {
      warnings.unshift(deemedNote);
    }
  }

  // 4. Add August 2026 amendment note if plot <= 500 sq m (for non-farmhouse)
  if (areaSqm <= 500 && !isFarmHouse) {
    const amendmentAlert = isHindi
      ? '28 अगस्त 2026 संशोधन सूचना: शासन द्वारा 500 वर्ग मीटर तक के भूखंडों के लिए नियम 2(5)(c) में अलग विकास अनुमति की अनिवार्यता संशोधित की गई है। नगर निगम में वर्तमान स्थिति अवश्य सत्यापित करें।'
      : 'August 2026 Amendment Alert: The Government of MP reportedly amended Rule 2(5)(c) regarding development permission for plots up to 500 sq m. As our dataset cutoff is 6 March 2025, verify this amendment with BMC.';
    if (!warnings.some(w => w.includes('500') || w.includes('August 2026') || w.includes('अगस्त 2026'))) {
      warnings.push(amendmentAlert);
    }
  }

  return {
    response: {
      ...rawAnswer,
      warnings,
      plot_criteria: criteria,
      calculated_setbacks: calculatedSetbacks,
      farm_house_norms: farmHouseNorms,
    },
    usedBackend,
  };
}

/**
 * Retrieve one rule by rule number
 */
export async function getRuleByNumber(ruleNumber: string): Promise<Rule | null> {
  try {
    const res = await fetch(`${BASE_URL}/api/rules/${ruleNumber}`);
    if (res.ok) {
      return await res.json();
    }
  } catch {
    // ignore
  }

  const cleanNum = ruleNumber.trim().toUpperCase();
  return rulesDatabase.find(r => r.rule.toUpperCase() === cleanNum) || null;
}

/**
 * Search rules by query keyword
 */
export async function searchRules(query: string): Promise<Rule[]> {
  const q = query.trim().toLowerCase();
  if (!q) return rulesDatabase.slice(0, 20);

  return rulesDatabase.filter(r => 
    r.rule.toLowerCase().includes(q) ||
    r.title.toLowerCase().includes(q) ||
    r.text.toLowerCase().includes(q)
  );
}
