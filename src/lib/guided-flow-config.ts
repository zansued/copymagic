/**
 * Configuration for the Guided V1 Campaign Flow (Venda Direta)
 * Maps each step to its agent, copy_results key, and display info.
 */

export interface GuidedStep {
  id: string;
  agentId: string;
  label: string;
  emoji: string;
  copyKey: string; // key in projects.copy_results
  description: string;
}

export const GUIDED_STEPS: GuidedStep[] = [
  {
    id: "avatar",
    agentId: "icp-profile",
    label: "Avatar / ICP",
    emoji: "🎯",
    copyKey: "avatar",
    description: "Mapeie o cliente ideal com profundidade psicológica",
  },
  {
    id: "oferta",
    agentId: "oferta-usp",
    label: "Oferta & USP",
    emoji: "💰",
    copyKey: "oferta",
    description: "Crie uma oferta irresistível com USP clara",
  },
  {
    id: "provas",
    agentId: "proof-builder",
    label: "Proof Builder",
    emoji: "🛡️",
    copyKey: "proofs",
    description: "Construa provas de credibilidade sem depoimentos",
  },
  {
    id: "landing",
    agentId: "sales-page",
    label: "Landing de Vendas",
    emoji: "🏗️",
    copyKey: "pagina_vendas",
    description: "Crie a página de vendas de alta conversão",
  },
  {
    id: "ads",
    agentId: "ads-studio",
    label: "Ads Studio",
    emoji: "📣",
    copyKey: "anuncios",
    description: "Gere anúncios prontos para Meta Ads",
  },
  {
    id: "auditoria",
    agentId: "audit-premium",
    label: "Auditoria Premium",
    emoji: "🩺",
    copyKey: "", // audit saves separately
    description: "Audite toda a copy gerada com score e revisão",
  },
];
