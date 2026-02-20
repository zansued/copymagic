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

// Risk categories aligned with Meta/Google Ads policy violations
const COMPLIANCE_RISK_TERMS: { term: string; severity: "high" | "medium" | "low"; category: string }[] = [
  // 🔴 HIGH — likely ad rejection + account restriction
  { term: "cura garantida", severity: "high", category: "Promessa de cura" },
  { term: "100% garantido", severity: "high", category: "Garantia absoluta" },
  { term: "aprovado pela anvisa", severity: "high", category: "Uso indevido de órgão regulador" },
  { term: "anvisa", severity: "high", category: "Menção a órgão regulador" },
  { term: "emagreça dormindo", severity: "high", category: "Promessa irreal" },
  { term: "sem esforço nenhum", severity: "high", category: "Promessa irreal" },
  { term: "resultado garantido", severity: "high", category: "Garantia absoluta" },
  { term: "ganhe dinheiro fácil", severity: "high", category: "Esquema financeiro" },
  { term: "renda extra garantida", severity: "high", category: "Esquema financeiro" },
  { term: "fique rico", severity: "high", category: "Esquema financeiro" },
  { term: "ganhe r$", severity: "high", category: "Promessa financeira explícita" },
  { term: "sem risco", severity: "high", category: "Garantia absoluta" },
  { term: "cloaker", severity: "high", category: "Técnica proibida" },
  { term: "burlar", severity: "high", category: "Técnica proibida" },
  { term: "black hat", severity: "high", category: "Técnica proibida" },
  { term: "compre seguidores", severity: "high", category: "Prática proibida" },
  { term: "remédio natural que cura", severity: "high", category: "Promessa de cura" },
  { term: "substitui remédio", severity: "high", category: "Promessa de cura" },
  
  // 🟡 MEDIUM — flag de revisão manual / risco moderado
  { term: "antes e depois", severity: "medium", category: "Conteúdo restrito" },
  { term: "médicos recomendam", severity: "medium", category: "Autoridade não verificável" },
  { term: "cientificamente comprovado", severity: "medium", category: "Claim não verificável" },
  { term: "sem efeitos colaterais", severity: "medium", category: "Claim médico" },
  { term: "natural + remédio", severity: "medium", category: "Claim médico" },
  { term: "milagre", severity: "medium", category: "Linguagem exagerada" },
  { term: "instantâneo", severity: "medium", category: "Promessa temporal irreal" },
  { term: "em 24 horas", severity: "medium", category: "Promessa temporal irreal" },
  { term: "em 7 dias", severity: "medium", category: "Promessa temporal agressiva" },
  { term: "derrete gordura", severity: "medium", category: "Claim de saúde" },
  { term: "seca barriga", severity: "medium", category: "Claim de saúde" },
  { term: "emagreça", severity: "medium", category: "Claim de saúde" },
  { term: "pare de sofrer", severity: "medium", category: "Apelo emocional extremo" },
  { term: "última chance", severity: "medium", category: "Falsa urgência" },
  { term: "só hoje", severity: "medium", category: "Falsa urgência" },
  { term: "vagas limitadas", severity: "medium", category: "Falsa escassez" },
  { term: "depoimento", severity: "medium", category: "Prova social (verificar autenticidade)" },
  { term: "testei e aprovei", severity: "medium", category: "Prova social (verificar autenticidade)" },
  
  // 🟢 LOW — atenção, mas geralmente aceito
  { term: "grátis", severity: "low", category: "Isca de clique" },
  { term: "oferta especial", severity: "low", category: "Urgência leve" },
  { term: "tempo limitado", severity: "low", category: "Urgência leve" },
  { term: "desconto exclusivo", severity: "low", category: "Urgência leve" },
  { term: "garantia de", severity: "low", category: "Promessa parcial" },
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
  const fullText = `${ad.mainText || ""} ${ad.headline || ""} ${ad.promiseSummary || ""} ${ad.mechanism || ""} ${ad.proof || ""}`.toLowerCase();

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
    if (days > 0) longevityScore = Math.min(15, Math.floor(days / 3));
  }

  const samePageVariations = allAds.filter(
    (a) => a.pageOrAdvertiser === ad.pageOrAdvertiser && a.headline !== ad.headline
  ).length;
  const varietyScore = Math.min(20, samePageVariations * 5);

  // Bonus for having AI-enriched fields (promise, mechanism, proof filled)
  let aiFieldsBonus = 0;
  if (ad.promiseSummary && ad.promiseSummary.length > 3) aiFieldsBonus += 8;
  if (ad.mechanism && ad.mechanism.length > 3) aiFieldsBonus += 7;
  if (ad.proof && ad.proof.length > 3) aiFieldsBonus += 5;

  const offerScore = Math.min(100, promiseScore + mechScore + densityScore + longevityScore + varietyScore + aiFieldsBonus);

  const alerts: string[] = [];
  let riskPoints = 0;
  const flaggedCategories = new Set<string>();
  for (const { term, severity, category } of COMPLIANCE_RISK_TERMS) {
    if (fullText.includes(term)) {
      const icon = severity === "high" ? "🔴" : severity === "medium" ? "🟡" : "🟢";
      alerts.push(`${icon} "${term}" — ${category} (${severity})`);
      riskPoints += severity === "high" ? 30 : severity === "medium" ? 12 : 4;
      flaggedCategories.add(category);
    }
  }
  // Multiple distinct risk categories compound the risk
  if (flaggedCategories.size >= 3) riskPoints += 15;
  if (flaggedCategories.size >= 5) riskPoints += 20;
  const riskScore = Math.min(100, riskPoints);

  // Blend heuristic with AI scale score if available
  const heuristicOverall = Math.max(0, Math.min(100, offerScore - Math.floor(riskScore * 0.3)));
  const aiScore = (ad as any).aiScaleScore;
  const overallScore = typeof aiScore === "number" && aiScore > 0
    ? Math.round(aiScore * 0.6 + heuristicOverall * 0.4)
    : heuristicOverall;

  return { offerScore, riskScore, overallScore, complianceAlerts: alerts };
}
