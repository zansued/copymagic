export interface AgentDef {
  id: string;
  name: string;
  emoji: string;
  role: string;
  description: string;
  category: "copywriting" | "content" | "branding";
  available: boolean;
}

export const AGENT_CATEGORIES = [
  { id: "copywriting" as const, label: "Copywriting", emoji: "✍️", color: "from-purple-500 to-pink-500" },
  { id: "content" as const, label: "Conteúdo & Social", emoji: "📱", color: "from-blue-500 to-cyan-500" },
  { id: "branding" as const, label: "Branding & Estratégia", emoji: "💎", color: "from-amber-500 to-orange-500" },
] as const;

export const AGENTS: AgentDef[] = [
  // Copywriting
  {
    id: "sales-page",
    name: "Arquiteto de Vendas",
    emoji: "🏗️",
    role: "Especialista em Páginas de Vendas",
    description: "Cria páginas de vendas de alta conversão com narrativa persuasiva, provas sociais e CTAs estratégicos.",
    category: "copywriting",
    available: true,
  },
  {
    id: "vsl-writer",
    name: "Roteirista VSL",
    emoji: "🎬",
    role: "Especialista em Video Sales Letters",
    description: "Produz roteiros cinematográficos para VSLs de 15 a 60 minutos com gatilhos emocionais e estrutura narrativa.",
    category: "copywriting",
    available: true,
  },
  {
    id: "email-sequence",
    name: "Estrategista de E-mails",
    emoji: "📧",
    role: "Especialista em Sequências de E-mail",
    description: "Cria sequências de e-mail automatizadas para nutrição, lançamento e recuperação de carrinho.",
    category: "copywriting",
    available: false,
  },
  // Content & Social
  {
    id: "carousel-creator",
    name: "Designer de Carrosséis",
    emoji: "🎠",
    role: "Especialista em Conteúdo Visual",
    description: "Cria roteiros de carrosséis para Instagram e LinkedIn com hooks irresistíveis e CTAs de engajamento.",
    category: "content",
    available: true,
  },
  {
    id: "video-script",
    name: "Roteirista de Reels",
    emoji: "🎥",
    role: "Especialista em Vídeos Curtos",
    description: "Produz scripts para Reels, TikTok e Shorts com ganchos nos primeiros 3 segundos.",
    category: "content",
    available: false,
  },
  {
    id: "youtube-titles",
    name: "Ângulos e Títulos YouTube",
    emoji: "▶️",
    role: "Especialista em Títulos e CTR",
    description: "Gera ângulos, variações e títulos otimizados para maximizar CTR e performance no YouTube.",
    category: "content",
    available: true,
  },
  // Branding & Strategy
  {
    id: "brand-voice",
    name: "Arquiteto de Marca",
    emoji: "🎭",
    role: "Especialista em Tom de Voz",
    description: "Define o posicionamento, tom de voz e identidade verbal da marca com guidelines aplicáveis.",
    category: "branding",
    available: true,
  },
  {
    id: "naming-expert",
    name: "Naming Expert",
    emoji: "💡",
    role: "Especialista em Naming",
    description: "Gera nomes criativos para produtos, marcas e ofertas com análise de disponibilidade e sonoridade.",
    category: "branding",
    available: false,
  },
  // Storytelling (special - content category)
  {
    id: "storytelling-adapter",
    name: "Adaptador de Storytelling",
    emoji: "📖",
    role: "Especialista em Narrativa Persuasiva",
    description: "Transforma qualquer conteúdo em uma narrativa mais poderosa usando frameworks clássicos de storytelling.",
    category: "content",
    available: true,
  },
  {
    id: "universal-adapter",
    name: "Adaptador Universal",
    emoji: "🔄",
    role: "Especialista em Replicação Estrutural",
    description: "Replica a arquitetura persuasiva de qualquer criativo validado, adaptando o conteúdo ao DNA da sua campanha.",
    category: "copywriting",
    available: true,
  },
  {
    id: "ad-angles",
    name: "Ângulos de Anúncios",
    emoji: "🎯",
    role: "Especialista em Ângulos Criativos",
    description: "Transforma um anúncio em 5 abordagens estratégicas únicas para maximizar performance no Meta Ads.",
    category: "copywriting",
    available: true,
  },
  {
    id: "writing-analysis",
    name: "Análise de Escrita",
    emoji: "🔍",
    role: "Especialista em Análise Estilística",
    description: "Decifra e replica qualquer estilo de escrita com precisão, revelando padrões de tom, estrutura e elementos distintivos.",
    category: "branding",
    available: true,
  },
];
