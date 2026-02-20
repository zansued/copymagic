import type { ImportedAd } from "./types";

export function exportAdsToCsv(ads: ImportedAd[]) {
  const headers = [
    "ID", "Página/Anunciante", "Headline", "Texto Principal", "País", "Plataforma",
    "Status", "Score Geral", "Score Oferta", "Score Risco", "Promessa",
    "Mecanismo", "Prova", "CTA", "Alertas Compliance", "Link",
  ];
  const rows = ads.map((a) => [
    a.id, a.pageOrAdvertiser, a.headline, a.mainText.replace(/\n/g, " "),
    a.country, a.platform, a.status, a.overallScore, a.offerScore, a.riskScore,
    a.detectedPromise, a.detectedMechanism, a.detectedProof, a.detectedCTA,
    a.complianceAlerts.join("; "), a.link,
  ]);

  const csv = [headers, ...rows].map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `adoffer-export-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
