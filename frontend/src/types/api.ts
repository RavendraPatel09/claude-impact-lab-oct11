export type Language = 'en' | 'hi';

export type AnswerStatus = 
  | 'answered'
  | 'insufficient_evidence'
  | 'needs_clarification'
  | 'source_version_warning'
  | 'error';

export interface Citation {
  rule: string;
  title?: string | null;
  page_start?: number | null;
  page_end?: number | null;
  excerpt: string;
}

export interface AskRequest {
  question: string;
  language: Language;
}

export interface SetbackCalculationResponse {
  front_open_space_m: number;
  rear_open_space_m: number;
  side_open_space_m: number;
  building_height_limit_m: number;
  rule: string;
  explanation: string;
  citations: Citation[];
  warnings: string[];
}

export interface FarmHouseNorms {
  minimum_plot_size_hectare: number;
  minimum_plot_size_sqm: number;
  maximum_far: number;
  max_built_up_sqm: number;
  maximum_height_m: number;
  roof_type: string;
  minimum_live_trees_per_hectare: number;
  minimum_road_width_m: number;
  minimum_open_space_all_sides_m: number;
  explanation: string;
}

export interface PlotSearchCriteria {
  plotArea: number; // in sq. m.
  areaUnit: 'sqm' | 'sqft';
  location: string;
  roadWidth: number; // in meters
  buildingType: string;
  buildingHeight?: number;
  floors?: number;
  additionalQuery?: string;
}

export interface AnswerResponse {
  answer: string;
  status: AnswerStatus;
  citations: Citation[];
  warnings: string[];
  source_version: string | null;
  plot_criteria?: PlotSearchCriteria | null;
  calculated_setbacks?: SetbackCalculationResponse | null;
  farm_house_norms?: FarmHouseNorms | null;
}

export interface Rule {
  rule: string;
  title: string;
  part: string;
  page_start: number;
  page_end: number;
  text: string;
}

export interface SourceInfo {
  title: string;
  version: string;
  consolidation_date: string;
  source_authority: string;
  total_rules: number;
  total_pages: number;
  amendment_note: string;
  pdf_links: {
    en: string;
    hi: string;
  };
}

export interface SetbackCalculationRequest {
  street_width_m: number;
  plot_area_sqm: number;
  building_height_m?: number;
  is_existing_narrow_street?: boolean;
}
