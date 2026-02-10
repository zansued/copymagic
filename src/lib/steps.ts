export interface Step {
  id: string;
  label: string;
  icon: string;
  description: string;
  agent: string;
}

export const STEPS: Step[] = [
  { id: "avatar", label: "Avatar", icon: "🧠", description: "Dr. Marcus Vale — Psicologia do Consumidor", agent: "Dr. Marcus Vale" },
  { id: "usp", label: "USP", icon: "💎", description: "Rafael Rez — Estrategista de Posicionamento", agent: "Rafael Rez" },
  { id: "oferta", label: "Oferta", icon: "📦", description: "André Diamand — Arquiteto de Ofertas", agent: "André Diamand" },
  { id: "pagina_vendas", label: "Página de Vendas", icon: "📄", description: "Flávia Gamonar — Copywriter de Alta Conversão", agent: "Flávia Gamonar" },
  { id: "upsells", label: "Upsells", icon: "🔥", description: "Pedro Superti — Maximização de LTV", agent: "Pedro Superti" },
  { id: "vsl_longa", label: "VSL 60min", icon: "🎬", description: "Leandro Ladeira — Roteirista de VSLs", agent: "Leandro Ladeira" },
  { id: "vsl_curta", label: "VSL 15min", icon: "🎥", description: "Leandro Ladeira — Modo Cirurgião de Atenção", agent: "Leandro Ladeira" },
  { id: "pagina_upsell", label: "Pág. Upsell", icon: "🛒", description: "Natalia Arcuri — Copywriting Pós-Compra", agent: "Natalia Arcuri" },
  { id: "vsl_upsell", label: "VSL Upsell", icon: "📹", description: "Especialista em VSL Pós-Compra", agent: "Especialista" },
  { id: "anuncios", label: "Anúncios", icon: "📢", description: "Thiago Nigro — Criativo de Tráfego Pago", agent: "Thiago Nigro" },
];
