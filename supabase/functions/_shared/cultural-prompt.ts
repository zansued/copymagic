export interface GenerationContext {
  language_code: string;
  cultural_region: string;
  tone_formality: "casual" | "neutral" | "formal";
  avoid_real_names: boolean;
}

const VALID_LANGUAGES = ["pt-BR", "es", "en"];
const VALID_REGIONS = [
  "auto", "pt-BR",
  "es-ES", "es-MX", "es-AR", "es-CO", "es-CL",
  "en-US", "en-GB", "en-CA", "en-AU",
];
const VALID_FORMALITY = ["casual", "neutral", "formal"];

export function validateGenerationContext(raw: any): GenerationContext {
  const ctx: GenerationContext = {
    language_code: VALID_LANGUAGES.includes(raw?.language_code) ? raw.language_code : "pt-BR",
    cultural_region: VALID_REGIONS.includes(raw?.cultural_region) ? raw.cultural_region : "auto",
    tone_formality: VALID_FORMALITY.includes(raw?.tone_formality) ? raw.tone_formality as any : "neutral",
    avoid_real_names: raw?.avoid_real_names !== false,
  };
  return ctx;
}

export function buildCulturalSystemPrompt(ctx: GenerationContext): string {
  const lines: string[] = [];

  // Language
  lines.push(`IDIOMA OBRIGATÓRIO DE SAÍDA: Escreva TODO o conteúdo em ${langLabel(ctx.language_code)}.`);

  // Region
  if (ctx.cultural_region && ctx.cultural_region !== "auto") {
    lines.push(`LOCALIZAÇÃO CULTURAL: Adapte referências culturais, expressões idiomáticas, humor, exemplos de lugares, instituições e hábitos de consumo para a região "${ctx.cultural_region}".`);
    lines.push(regionGuidance(ctx.cultural_region));
  } else {
    lines.push(`LOCALIZAÇÃO CULTURAL: Escolha a região que melhor se encaixa no público-alvo inferido do produto. Se incerto, mantenha o texto idiomático mas culturalmente neutro dentro do idioma escolhido.`);
  }

  // Formality
  const formalityMap: Record<string, string> = {
    casual: "Use tom informal, descontraído e próximo. Gírias leves são bem-vindas. Trate o leitor como amigo.",
    neutral: "Use tom equilibrado entre profissional e acessível. Nem excessivamente formal, nem coloquial demais.",
    formal: "Use tom formal e profissional. Evite gírias e coloquialismos. Mantenha linguagem respeitosa e acadêmica.",
  };
  lines.push(`TOM DE FORMALIDADE: ${formalityMap[ctx.tone_formality]}`);

  // Real names
  if (ctx.avoid_real_names) {
    lines.push("NOMES: NÃO use nomes de pessoas reais (celebridades, médicos, autores). Use papéis genéricos como 'um nutricionista', 'uma pesquisadora', 'um empreendedor'. Nomes fictícios de avatares/personagens são permitidos.");
  }

  // Safety
  lines.push("SEGURANÇA CULTURAL: Nunca use estereótipos de classes protegidas ou suposições sensíveis. Use referências culturais de apoio, não dominantes. Não invente endossos falsos de instituições ou universidades. Mantenha referências como analogias, não como afirmações de endosso.");

  return lines.join("\n\n");
}

function langLabel(code: string): string {
  const map: Record<string, string> = {
    "pt-BR": "Português Brasileiro",
    es: "Espanhol",
    en: "Inglês",
  };
  return map[code] || code;
}

function regionGuidance(region: string): string {
  const guides: Record<string, string> = {
    "pt-BR": "Use vocabulário, ritmo e referências do Brasil. Exemplos: cidades brasileiras, instituições locais, hábitos de consumo brasileiros.",
    "es-ES": "Use vocabulário ibérico quando apropriado ('vosotros', 'ordenador'). Referências a cidades e instituições espanholas. Expressões locais da Espanha.",
    "es-MX": "Use vocabulário mexicano ('ustedes', 'computadora', 'chido'). Referências a cidades, escolas e cultura do México.",
    "es-AR": "Use vocabulário argentino ('vos', 'che'). Referências a Argentina, expressões portenhas.",
    "es-CO": "Use vocabulário colombiano. Referências a cidades e cultura da Colômbia.",
    "es-CL": "Use vocabulário chileno. Referências a Chile, expressões locais.",
    "en-US": "Use vocabulário e ortografia americana (color, organize). Referências a EUA: instituições, esportes (NFL, NBA), SAT, cidades americanas.",
    "en-GB": "Use ortografia britânica (colour, organise). Referências ao Reino Unido: NHS, cidades britânicas, expressões britânicas.",
    "en-CA": "Use vocabulário canadense. Referências ao Canadá.",
    "en-AU": "Use vocabulário australiano. Referências à Austrália.",
  };
  return guides[region] || "";
}
