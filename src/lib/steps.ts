export interface Step {
  id: string;
  label: string;
  icon: string;
  description: string;
}

export const STEPS: Step[] = [
  { id: "avatar", label: "Avatar", icon: "🧠", description: "Perfil psicológico profundo do público-alvo" },
  { id: "usp", label: "USP", icon: "💎", description: "Proposta Única de Vendas" },
  { id: "oferta", label: "Oferta", icon: "📦", description: "Oferta irresistível completa" },
  { id: "pagina_vendas", label: "Página de Vendas", icon: "📄", description: "Página de vendas com todas as seções" },
  { id: "upsells", label: "Upsells", icon: "🔥", description: "Order Bumps, Upsells e Upsell refinado" },
  { id: "vsl_longa", label: "VSL 60min", icon: "🎬", description: "Script completo da VSL de 60 minutos" },
  { id: "vsl_curta", label: "VSL 15min", icon: "🎥", description: "VSL condensada de 15 minutos" },
  { id: "pagina_upsell", label: "Pág. Upsell", icon: "🛒", description: "Página de upsell completa" },
  { id: "vsl_upsell", label: "VSL Upsell", icon: "📹", description: "VSL de upsell (15 min)" },
  { id: "anuncios", label: "Anúncios", icon: "📢", description: "Headlines, scripts e copies para ads" },
];
