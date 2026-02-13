export interface Step {
  id: string;
  label: string;
  icon: string;
  description: string;
  agent: string;
}

export const STEPS: Step[] = [
  { id: "avatar", label: "Avatar", icon: "🧠", description: "Psicologia do Consumidor", agent: "Dr. Marcus Vale" },
  { id: "oferta", label: "Oferta", icon: "📦", description: "Oferta Irresistível", agent: "Especialista em Ofertas" },
  { id: "usp", label: "USP", icon: "💎", description: "Proposta Única de Vendas", agent: "Especialista USP" },
  { id: "pagina_vendas", label: "Página de Vendas", icon: "📄", description: "Copy de Alta Conversão", agent: "Copywriter" },
  { id: "upsells", label: "Upsells", icon: "🔥", description: "Order Bumps & Upsells", agent: "Especialista em Funis" },
  { id: "anuncios", label: "Anúncios", icon: "📢", description: "Criativos de Tráfego Pago", agent: "Especialista em Ads" },
  { id: "vsl_longa", label: "VSL 60min", icon: "🎬", description: "VSL Completa de Vendas", agent: "Roteirista" },
  { id: "pagina_upsell", label: "Pág. Upsell", icon: "🛒", description: "Página Pós-Compra", agent: "Copywriter Pós-Compra" },
  { id: "vsl_upsell", label: "VSL Upsell", icon: "📹", description: "VSL 15min Pós-Compra", agent: "Roteirista" },
];
