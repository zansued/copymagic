import type { ImportedAd } from "./types";

const PROMISE_WORDS = [
  "seca", "derrete", "em 7 dias", "em 15 dias", "em 21 dias", "sem esforço",
  "garantido", "comprovado", "milagre", "instantâneo", "rápido", "elimina",
  "acaba com", "resolve", "transforma", "resultado", "incrível", "surpreendente",
  "dormindo", "sem dieta", "sem treino",
];

const MECHANISM_WORDS = [
  "truque", "método", "ritual", "protocolo", "receita", "fórmula", "segredo",
  "técnica", "passo a passo", "ingrediente", "mistura",
];

const COMPLIANCE_RISK_TERMS = [
  { term: "cura garantida", severity: "high" as const },
  { term: "antes e depois", severity: "medium" as const },
  { term: "anvisa", severity: "high" as const },
  { term: "natural + remédio", severity: "medium" as const },
  { term: "aprovado pela anvisa", severity: "high" as const },
  { term: "médicos recomendam", severity: "medium" as const },
  { term: "cientificamente comprovado", severity: "medium" as const },
  { term: "100% garantido", severity: "high" as const },
  { term: "sem efeitos colaterais", severity: "medium" as const },
];

function countMatches(text: string, words: string[]): number {
  const lower = text.toLowerCase();
  return words.filter((w) => lower.includes(w.toLowerCase())).length;
}

export function detectFields(text: string) {
  const lower = text.toLowerCase();
  const promises = PROMISE_WORDS.filter((w) => lower.includes(w));
  const mechanisms = MECHANISM_WORDS.filter((w) => lower.includes(w));

  const ctaPatterns = [
    "clique aqui", "saiba mais", "compre agora", "acesse", "garanta",
    "aproveite", "link na bio", "confira", "descubra", "veja como",
  ];
  const ctas = ctaPatterns.filter((c) => lower.includes(c));

  const proofPatterns = [
    "depoimento", "resultado real", "prova real", "antes e depois",
    "testemunho", "print", "comprovante",
  ];
  const proofs = proofPatterns.filter((p) => lower.includes(p));

  return {
    detectedPromise: promises.join(", ") || "—",
    detectedMechanism: mechanisms.join(", ") || "—",
    detectedCTA: ctas.join(", ") || "—",
    detectedProof: proofs.join(", ") || "—",
  };
}

export function calculateScores(
  ad: Partial<ImportedAd>,
  allAds: ImportedAd[]
): { offerScore: number; riskScore: number; overallScore: number; complianceAlerts: string[] } {
  const fullText = `${ad.mainText || ""} ${ad.headline || ""}`.toLowerCase();

  const promiseCount = countMatches(fullText, PROMISE_WORDS);
  const promiseScore = Math.min(25, promiseCount * 5);

  const mechCount = countMatches(fullText, MECHANISM_WORDS);
  const mechScore = Math.min(20, mechCount * 7);

  const samePageAds = allAds.filter(
    (a) => a.pageOrAdvertiser === ad.pageOrAdvertiser && a.id !== ad.id
  ).length;
  const densityScore = Math.min(20, samePageAds * 4);

  let longevityScore = 0;
  if (ad.startDate) {
    const days = Math.floor(
      (Date.now() - new Date(ad.startDate).getTime()) / (1000 * 60 * 60 * 24)
    );
    longevityScore = Math.min(15, Math.floor(days / 3));
  }

  const samePageVariations = allAds.filter(
    (a) => a.pageOrAdvertiser === ad.pageOrAdvertiser && a.headline !== ad.headline
  ).length;
  const varietyScore = Math.min(20, samePageVariations * 5);

  const offerScore = Math.min(100, promiseScore + mechScore + densityScore + longevityScore + varietyScore);

  const alerts: string[] = [];
  let riskPoints = 0;
  for (const { term, severity } of COMPLIANCE_RISK_TERMS) {
    if (fullText.includes(term)) {
      alerts.push(`⚠️ "${term}" (${severity})`);
      riskPoints += severity === "high" ? 25 : 12;
    }
  }
  const riskScore = Math.min(100, riskPoints);

  const overallScore = Math.max(0, Math.min(100, offerScore - Math.floor(riskScore * 0.3)));

  return { offerScore, riskScore, overallScore, complianceAlerts: alerts };
}
