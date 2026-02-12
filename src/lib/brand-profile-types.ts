// Types for brand profile DNA sections

export interface BrandIdentity {
  biography: string;
  mission: string;
  differentials: string;
  market_focus: string;
}

export interface BrandVoice {
  voice_essence: string;
  brand_persona: string;
  audience_relationship: string;
  personality_pillars: string;
  linguistic_profile: string;
  tone_spectrum: string;
  signature_expressions: string;
}

export interface TargetAudience {
  demographics: string;
  avatar_description: string;
  central_problem: string;
  secondary_problems: string;
  emotions: string;
  fears: string;
  secret_desires: string;
  objections: string;
  powerful_words: string;
  powerful_phrases: string;
}

export interface ProductService {
  main_problem: string;
  unique_mechanism: string;
  main_promise: string;
  methodology: string;
  deliverables: string;
  offer_name: string;
  unique_value_proposition: string;
}

export interface Credentials {
  experience: string;
  specialization: string;
  certifications: string;
  results: string;
  authority_summary: string;
}

export interface BrandProfileData {
  brand_identity: BrandIdentity;
  brand_voice: BrandVoice;
  target_audience: TargetAudience;
  product_service: ProductService;
  credentials: Credentials;
}

export const EMPTY_BRAND_IDENTITY: BrandIdentity = {
  biography: "",
  mission: "",
  differentials: "",
  market_focus: "",
};

export const EMPTY_BRAND_VOICE: BrandVoice = {
  voice_essence: "",
  brand_persona: "",
  audience_relationship: "",
  personality_pillars: "",
  linguistic_profile: "",
  tone_spectrum: "",
  signature_expressions: "",
};

export const EMPTY_TARGET_AUDIENCE: TargetAudience = {
  demographics: "",
  avatar_description: "",
  central_problem: "",
  secondary_problems: "",
  emotions: "",
  fears: "",
  secret_desires: "",
  objections: "",
  powerful_words: "",
  powerful_phrases: "",
};

export const EMPTY_PRODUCT_SERVICE: ProductService = {
  main_problem: "",
  unique_mechanism: "",
  main_promise: "",
  methodology: "",
  deliverables: "",
  offer_name: "",
  unique_value_proposition: "",
};

export const EMPTY_CREDENTIALS: Credentials = {
  experience: "",
  specialization: "",
  certifications: "",
  results: "",
  authority_summary: "",
};

export const PROFILE_SECTIONS = [
  {
    key: "brand_identity" as const,
    emoji: "🏢",
    title: "Identidade da Marca",
    subtitle: "Quem é sua marca e o que ela representa",
    fields: [
      { key: "biography", label: "Biografia", placeholder: "Descreva a história e missão da marca...", multiline: true },
      { key: "mission", label: "Missão & Propósito", placeholder: "O propósito central da marca..." },
      { key: "differentials", label: "Diferenciais", placeholder: "O que torna sua marca única..." },
      { key: "market_focus", label: "Foco de Mercado", placeholder: "Nicho e segmento de atuação..." },
    ],
  },
  {
    key: "brand_voice" as const,
    emoji: "🎭",
    title: "Voz da Marca",
    subtitle: "Como sua marca se comunica com o mundo",
    fields: [
      { key: "voice_essence", label: "Essência da Voz", placeholder: "Ex: Prático, Resolutivo, Direto, Moderno..." },
      { key: "brand_persona", label: "Persona da Marca", placeholder: "Descreva a persona que a marca representa..." },
      { key: "audience_relationship", label: "Relação com a Audiência", placeholder: "Como a marca se relaciona com o público..." },
      { key: "personality_pillars", label: "Pilares da Personalidade", placeholder: "Os pilares que sustentam a personalidade da marca...", multiline: true },
      { key: "linguistic_profile", label: "Perfil Linguístico", placeholder: "Expressões assinatura, estruturas, recursos retóricos...", multiline: true },
      { key: "tone_spectrum", label: "Espectro de Tom", placeholder: "Formal ↔ Informal, Técnico ↔ Simples, Distante ↔ Próximo...", multiline: true },
      { key: "signature_expressions", label: "Expressões Assinatura", placeholder: "Frases e expressões características da marca...", multiline: true },
    ],
  },
  {
    key: "target_audience" as const,
    emoji: "🎯",
    title: "Público-Alvo & ICP",
    subtitle: "Para quem você fala e quem é seu cliente ideal",
    fields: [
      { key: "demographics", label: "Dados Demográficos", placeholder: "Idade, gênero, renda, localização..." },
      { key: "avatar_description", label: "Avatar / Perfil Representativo", placeholder: "Descreva seu cliente ideal em detalhes...", multiline: true },
      { key: "central_problem", label: "Problema Central", placeholder: "O principal problema que enfrentam..." },
      { key: "secondary_problems", label: "Problemas Secundários", placeholder: "Outros problemas e dores...", multiline: true },
      { key: "emotions", label: "Emoções Viscerais", placeholder: "Frustração, ansiedade, vergonha, sobrecarga...", multiline: true },
      { key: "fears", label: "Maiores Medos", placeholder: "Os medos que os impedem de agir...", multiline: true },
      { key: "secret_desires", label: "Desejos Secretos", placeholder: "O que realmente desejam no fundo...", multiline: true },
      { key: "objections", label: "Objeções", placeholder: "Objeções práticas e emocionais...", multiline: true },
      { key: "powerful_words", label: "Palavras Poderosas", placeholder: "Palavras que ressoam com o público..." },
      { key: "powerful_phrases", label: "Frases Poderosas", placeholder: "Frases que o público usa...", multiline: true },
    ],
  },
  {
    key: "product_service" as const,
    emoji: "📦",
    title: "Produto / Serviço & Oferta",
    subtitle: "O que você oferece e como transforma vidas",
    fields: [
      { key: "main_problem", label: "Problema que Resolve", placeholder: "O problema principal que seu produto resolve..." },
      { key: "unique_mechanism", label: "Mecanismo Único", placeholder: "O que torna sua solução diferente de todas as outras...", multiline: true },
      { key: "main_promise", label: "Promessa Principal", placeholder: "A promessa central da sua oferta..." },
      { key: "methodology", label: "Metodologia", placeholder: "Os passos do seu método ou framework...", multiline: true },
      { key: "deliverables", label: "Entregáveis", placeholder: "O que o cliente recebe concretamente...", multiline: true },
      { key: "offer_name", label: "Nome da Oferta", placeholder: "O nome do seu produto/serviço principal..." },
      { key: "unique_value_proposition", label: "Proposta Única de Valor (PUV)", placeholder: "Sua PUV completa..." },
    ],
  },
  {
    key: "credentials" as const,
    emoji: "🏆",
    title: "Credenciais & Provas",
    subtitle: "Autoridade e evidências que sustentam sua marca",
    fields: [
      { key: "experience", label: "Experiência", placeholder: "Anos de experiência, volume de clientes..." },
      { key: "specialization", label: "Especialização", placeholder: "Área de especialização principal..." },
      { key: "certifications", label: "Certificações", placeholder: "Certificações e reconhecimentos..." },
      { key: "results", label: "Resultados", placeholder: "Resultados alcançados para clientes..." },
      { key: "authority_summary", label: "Resumo de Autoridade", placeholder: "Resumo que posiciona sua autoridade no mercado...", multiline: true },
    ],
  },
] as const;

// Export helpers
export function profileToMarkdown(name: string, data: BrandProfileData): string {
  let md = `# DNA de Marca: ${name}\n\n`;

  for (const section of PROFILE_SECTIONS) {
    const sectionData = data[section.key] as unknown as Record<string, string>;
    const hasContent = Object.values(sectionData).some((v) => v?.trim());
    if (!hasContent) continue;

    md += `## ${section.emoji} ${section.title}\n\n`;
    for (const field of section.fields) {
      const value = sectionData[field.key];
      if (value?.trim()) {
        md += `### ${field.label}\n${value.trim()}\n\n`;
      }
    }
  }

  return md;
}

export function profileToJSON(name: string, data: BrandProfileData): string {
  return JSON.stringify({ name, ...data }, null, 2);
}
