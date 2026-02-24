export interface AuditScore {
  overall: number;
  clarity: number;
  specificity: number;
  dna_consistency: number;
  offer: number;
  claims_risk: number;
  cta: number;
}

export interface AuditResult {
  id: string;
  created_at: string;
  target: string;
  score: AuditScore;
  checklist: string[];
  revised_text?: string;
  variations?: string[];
  mode: "lite" | "full";
}

export const AUDIT_TARGETS: Record<string, string> = {
  pagina_vendas: "Landing Page",
  anuncios: "Anúncios",
  upsells: "Upsells",
  vsl_longa: "VSL 60min",
  pagina_upsell: "Pág. Upsell",
  vsl_upsell: "VSL Upsell",
};

export function parseAuditOutput(raw: string, mode: "lite" | "full"): Omit<AuditResult, "id" | "created_at" | "target" | "mode"> {
  const score: AuditScore = {
    overall: extractScore(raw, "SCORE_GERAL"),
    clarity: extractScore(raw, "CLAREZA"),
    specificity: extractScore(raw, "ESPECIFICIDADE"),
    dna_consistency: extractScore(raw, "CONSISTENCIA_DNA"),
    offer: extractScore(raw, "OFERTA"),
    claims_risk: extractScore(raw, "RISCO_CLAIMS"),
    cta: extractScore(raw, "CTA"),
  };

  const checklist = extractChecklist(raw);
  const revised_text = mode === "full" ? extractRevisedText(raw) : undefined;
  const variations = mode === "full" ? extractVariations(raw) : undefined;

  return { score, checklist, revised_text, variations };
}

function extractScore(text: string, key: string): number {
  const regex = new RegExp(`${key}:\\s*(\\d+(?:\\.\\d+)?)`, "i");
  const match = text.match(regex);
  return match ? Math.min(10, Math.max(0, parseFloat(match[1]))) : 0;
}

function extractChecklist(text: string): string[] {
  const checklistMatch = text.match(/CHECKLIST:\s*\n([\s\S]*?)(?=\n(?:REVISED_TEXT|VARIATIONS|$))/i);
  if (!checklistMatch) return [];
  return checklistMatch[1]
    .split("\n")
    .map((line) => line.replace(/^\d+\)\s*/, "").trim())
    .filter(Boolean);
}

function extractRevisedText(text: string): string | undefined {
  const match = text.match(/REVISED_TEXT:\s*\n<<<\s*\n([\s\S]*?)>>>/i);
  return match ? match[1].trim() : undefined;
}

function extractVariations(text: string): string[] | undefined {
  const match = text.match(/VARIATIONS:\s*\n([\s\S]*?)$/i);
  if (!match) return undefined;
  const items = match[1]
    .split("\n")
    .map((line) => line.replace(/^-\s*/, "").trim())
    .filter(Boolean);
  return items.length > 0 ? items : undefined;
}
