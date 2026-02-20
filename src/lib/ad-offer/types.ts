export interface KeywordPackage {
  nicheId: string;
  nicheName: string;
  keywordsBase: string[];
  termosComplementares: string[];
  enabled: boolean;
}

export interface ImportedAd {
  id: string;
  pageOrAdvertiser: string;
  mainText: string;
  headline: string;
  country: string;
  platform: string;
  status: string;
  link: string;
  importedAt: string;
  startDate?: string;
  nicheId?: string;
  detectedMechanism: string;
  detectedPromise: string;
  detectedProof: string;
  detectedCTA: string;
  promiseSummary: string;
  mechanism: string;
  proof: string;
  offer: string;
  inferredAudience: string;
  offerScore: number;
  riskScore: number;
  overallScore: number;
  complianceAlerts: string[];
  savedAsReference: boolean;
}

export interface SearchFilters {
  nicheId: string;
  period: number;
  adStatus: "active" | "inactive" | "all";
  platform: "facebook" | "instagram" | "all";
  language: string;
}

export interface GeneratedQuery {
  text: string;
  copied: boolean;
}

export interface NegativeWord {
  word: string;
  enabled: boolean;
}

export interface Modifier {
  word: string;
  enabled: boolean;
}
