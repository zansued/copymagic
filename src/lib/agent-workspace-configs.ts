// Agent workspace configurations - defines inputs and prompts per agent

export interface AgentInput {
  key: string;
  label: string;
  placeholder: string;
  type: "textarea" | "select" | "input";
  options?: { value: string; label: string }[];
  required?: boolean;
}

export interface AgentWorkspaceConfig {
  id: string;
  name: string;
  emoji: string;
  subtitle: string;
  inputs: AgentInput[];
  buildPrompt: (inputs: Record<string, string>, brandContext?: string) => string;
}

export const AGENT_WORKSPACE_CONFIGS: Record<string, AgentWorkspaceConfig> = {
  "sales-page": {
    id: "sales-page",
    name: "Arquiteto de Vendas",
    emoji: "🏗️",
    subtitle: "Crie páginas de vendas de alta conversão",
    inputs: [
      {
        key: "product_description",
        label: "Produto / Oferta",
        placeholder: "Descreva seu produto ou oferta em detalhes: o que é, para quem, qual a transformação principal, preço, garantia...",
        type: "textarea",
        required: true,
      },
      {
        key: "page_format",
        label: "Formato da Página",
        type: "select",
        placeholder: "",
        options: [
          { value: "long-form", label: "Carta de Vendas (longa)" },
          { value: "landing-page", label: "Landing Page (média)" },
          { value: "mini-page", label: "Mini-Page (curta)" },
        ],
      },
      {
        key: "tone",
        label: "Tom Principal",
        type: "select",
        placeholder: "",
        options: [
          { value: "urgente", label: "🔥 Urgente e Escasso" },
          { value: "empatico", label: "💛 Empático e Acolhedor" },
          { value: "autoridade", label: "🎓 Autoritário e Científico" },
          { value: "provocativo", label: "⚡ Provocativo e Ousado" },
        ],
      },
      {
        key: "extra",
        label: "Instruções Extras",
        placeholder: "Ex: 'Inclua seção de FAQ', 'Foque em provas sociais', 'Tom mais casual'...",
        type: "textarea",
      },
    ],
    buildPrompt: (inputs, brandContext) => {
      const format = inputs.page_format || "long-form";
      const formatMap: Record<string, string> = {
        "long-form": "Carta de Vendas longa e detalhada (3000-5000 palavras)",
        "landing-page": "Landing Page de tamanho médio (1500-2500 palavras)",
        "mini-page": "Mini-page concisa e direta (800-1200 palavras)",
      };
      const toneMap: Record<string, string> = {
        urgente: "urgente, com escassez e FOMO",
        empatico: "empático, acolhedor e compreensivo",
        autoridade: "autoritário, científico e técnico",
        provocativo: "provocativo, ousado e desafiador",
      };

      return `Você é o Arquiteto de Vendas — um copywriter de elite especializado em criar páginas de vendas de altíssima conversão.

MISSÃO: Criar uma ${formatMap[format]} completa e pronta para uso.

TOM: ${toneMap[inputs.tone] || "equilibrado entre autoridade e empatia"}

ESTRUTURA OBRIGATÓRIA:
1. HEADLINE PRINCIPAL — gancho irresistível com big promise
2. SUB-HEADLINE — reforço emocional
3. LEAD/ABERTURA — história ou gancho que prende nos primeiros parágrafos
4. IDENTIFICAÇÃO DO PROBLEMA — dores do avatar detalhadas
5. AGITAÇÃO — consequências de não agir
6. APRESENTAÇÃO DA SOLUÇÃO — o produto como ponte
7. MECANISMO ÚNICO — como e por que funciona
8. BENEFÍCIOS — lista emocional e tangível
9. PROVAS SOCIAIS — depoimentos e resultados
10. OFERTA IRRESISTÍVEL — stack de valor
11. BÔNUS — complementos que aumentam o valor percebido
12. GARANTIA — eliminação de risco
13. CTA PRINCIPAL — chamada à ação urgente
14. FAQ — objeções transformadas em respostas
15. CTA FINAL — fechamento com urgência

${brandContext ? `\n--- DNA DE MARCA ---\n${brandContext}` : ""}
${inputs.extra ? `\n--- INSTRUÇÕES EXTRAS ---\n${inputs.extra}` : ""}

PRODUTO/OFERTA:
${inputs.product_description}`;
    },
  },

  "vsl-writer": {
    id: "vsl-writer",
    name: "Roteirista VSL",
    emoji: "🎬",
    subtitle: "Produza roteiros cinematográficos para Video Sales Letters",
    inputs: [
      {
        key: "product_description",
        label: "Produto / Oferta",
        placeholder: "Descreva o produto, a transformação que oferece, provas, preço e garantia...",
        type: "textarea",
        required: true,
      },
      {
        key: "duration",
        label: "Duração do Vídeo",
        type: "select",
        placeholder: "",
        options: [
          { value: "15min", label: "⚡ Curto (15 min)" },
          { value: "30min", label: "🎯 Médio (30 min)" },
          { value: "45min", label: "🎬 Longo (45 min)" },
          { value: "60min", label: "🎥 Épico (60 min)" },
        ],
      },
      {
        key: "style",
        label: "Estilo Narrativo",
        type: "select",
        placeholder: "",
        options: [
          { value: "emotional", label: "💔 Emocional (história pessoal)" },
          { value: "logical", label: "🧠 Lógico (dados e provas)" },
          { value: "mixed", label: "⚖️ Misto (emoção + lógica)" },
          { value: "documentary", label: "📹 Documentário (investigativo)" },
        ],
      },
      {
        key: "extra",
        label: "Instruções Extras",
        placeholder: "Ex: 'Inclua pattern interrupt a cada 5 min', 'Foco em urgência no final'...",
        type: "textarea",
      },
    ],
    buildPrompt: (inputs, brandContext) => {
      const durationMap: Record<string, string> = {
        "15min": "15 minutos (~2.200 palavras)",
        "30min": "30 minutos (~4.500 palavras)",
        "45min": "45 minutos (~6.700 palavras)",
        "60min": "60 minutos (~9.000 palavras)",
      };
      const styleMap: Record<string, string> = {
        emotional: "emocional, com história pessoal central e gatilhos emocionais profundos",
        logical: "lógico e baseado em evidências, dados, estudos e provas científicas",
        mixed: "equilibrado entre emoção e lógica, alternando entre histórias e dados",
        documentary: "estilo documentário investigativo, como se revelasse uma descoberta oculta",
      };

      return `Você é o Roteirista VSL — um especialista em criar roteiros cinematográficos para Video Sales Letters que mantêm o espectador grudado do início ao fim.

MISSÃO: Criar um roteiro completo de VSL de ${durationMap[inputs.duration] || "30 minutos"}.

ESTILO: ${styleMap[inputs.style] || "misto"}

ESTRUTURA OBRIGATÓRIA DO ROTEIRO:

[GANCHO — 0:00 a 0:30]
Primeiros 30 segundos que param o scroll. Big promise + curiosidade + padrão interrompido.

[IDENTIFICAÇÃO — 0:30 a 3:00]
"Se você é [avatar]..." — crie identificação profunda com o espectador.

[HISTÓRIA DE ORIGEM — 3:00 a 8:00]
A história do herói/descoberta. Use tensão narrativa crescente.

[O PROBLEMA REAL — 8:00 a 12:00]
Revele a causa raiz que ninguém fala. Mude a perspectiva.

[A DESCOBERTA — 12:00 a 18:00]
O mecanismo único, a "virada de chave", o insight revolucionário.

[PROVAS E RESULTADOS — 18:00 a 22:00]
Cases, dados, estudos, depoimentos. Stack de credibilidade.

[A OFERTA — 22:00 a 26:00]
Apresentação do produto como solução inevitável. Stack de valor.

[URGÊNCIA E ESCASSEZ — 26:00 a 28:00]
Por que agir AGORA. Bônus limitados, vagas, tempo.

[CTA FINAL — 28:00 a 30:00]
Fechamento emocional + racional. Resumo da transformação.

DIREÇÕES DE CENA:
- Inclua [PAUSA], [ZOOM], [B-ROLL], [TEXTO NA TELA] quando relevante
- Marque PATTERN INTERRUPTS a cada 5 minutos
- Use timestamps aproximados

${brandContext ? `\n--- DNA DE MARCA ---\n${brandContext}` : ""}
${inputs.extra ? `\n--- INSTRUÇÕES EXTRAS ---\n${inputs.extra}` : ""}

PRODUTO/OFERTA:
${inputs.product_description}`;
    },
  },

  "carousel-creator": {
    id: "carousel-creator",
    name: "Designer de Carrosséis",
    emoji: "🎠",
    subtitle: "Crie roteiros de carrosséis virais para redes sociais",
    inputs: [
      {
        key: "topic",
        label: "Tema / Assunto",
        placeholder: "Qual o tema do carrossel? Ex: '5 erros que destroem suas vendas online', 'Como perder 10kg sem dieta restritiva'...",
        type: "textarea",
        required: true,
      },
      {
        key: "platform",
        label: "Plataforma",
        type: "select",
        placeholder: "",
        options: [
          { value: "instagram", label: "📸 Instagram" },
          { value: "linkedin", label: "💼 LinkedIn" },
          { value: "both", label: "🔄 Ambos (adaptável)" },
        ],
      },
      {
        key: "slides_count",
        label: "Número de Slides",
        type: "select",
        placeholder: "",
        options: [
          { value: "5", label: "5 slides (rápido)" },
          { value: "7", label: "7 slides (ideal)" },
          { value: "10", label: "10 slides (completo)" },
        ],
      },
      {
        key: "objective",
        label: "Objetivo",
        type: "select",
        placeholder: "",
        options: [
          { value: "engagement", label: "💬 Engajamento (salvar/compartilhar)" },
          { value: "authority", label: "🎓 Autoridade (educar)" },
          { value: "sales", label: "💰 Vendas (converter)" },
          { value: "viral", label: "🚀 Viral (alcance máximo)" },
        ],
      },
      {
        key: "extra",
        label: "Instruções Extras",
        placeholder: "Ex: 'Use dados estatísticos', 'Tom humorístico', 'Inclua CTA para link na bio'...",
        type: "textarea",
      },
    ],
    buildPrompt: (inputs, brandContext) => {
      const platformMap: Record<string, string> = {
        instagram: "Instagram (visual, emojis, linguagem casual, hashtags)",
        linkedin: "LinkedIn (profissional, insights, dados, credibilidade)",
        both: "Instagram e LinkedIn (versátil, adaptável)",
      };
      const objMap: Record<string, string> = {
        engagement: "máximo engajamento (salvar + compartilhar + comentar)",
        authority: "construir autoridade e educar o público",
        sales: "converter seguidores em leads/compradores",
        viral: "alcance viral máximo",
      };

      return `Você é o Designer de Carrosséis — um criador de conteúdo visual especializado em carrosséis que viralizam e convertem.

MISSÃO: Criar um roteiro completo de carrossel com ${inputs.slides_count || "7"} slides.

PLATAFORMA: ${platformMap[inputs.platform] || "Instagram"}
OBJETIVO: ${objMap[inputs.objective] || "engajamento"}

ESTRUTURA POR SLIDE:

Para cada slide, forneça:
- **SLIDE [N]** — Título do slide
- **TEXTO PRINCIPAL** — O conteúdo do slide (2-4 linhas, impactante)
- **NOTA DE DESIGN** — Sugestão visual (cor de fundo, ícone, layout)
- **HOOK/GANCHO** (apenas slide 1) — A frase que para o scroll

REGRAS:
1. SLIDE 1 = HOOK IRRESISTÍVEL — deve parar o scroll em 1.5 segundos
2. Cada slide deve ter uma ideia ÚNICA e autossuficiente
3. Use frases curtas, diretas e visualmente escaneáveis
4. Alterne entre provocação, dados, insights e emoção
5. ÚLTIMO SLIDE = CTA claro (salvar, compartilhar, comentar, link na bio)
6. Inclua sugestão de CAPTION (legenda) com emojis e hashtags
7. Linguagem adaptada à plataforma

${brandContext ? `\n--- DNA DE MARCA ---\n${brandContext}` : ""}
${inputs.extra ? `\n--- INSTRUÇÕES EXTRAS ---\n${inputs.extra}` : ""}

TEMA:
${inputs.topic}`;
    },
  },

  "universal-adapter": {
    id: "universal-adapter",
    name: "Adaptador Universal",
    emoji: "🔄",
    subtitle: "Replique estruturalmente qualquer criativo validado",
    inputs: [
      {
        key: "original_copy",
        label: "Copy Original",
        placeholder: "Cole aqui toda a copy da página/criativo que você quer replicar estruturalmente (headlines, benefícios, CTAs, depoimentos, etc.)",
        type: "textarea",
        required: true,
      },
      {
        key: "extra",
        label: "Instruções Extras Para o Agente",
        placeholder: 'Ex: "Use a notícia abaixo como base para criar um novo carrossel", "Faça 20 variações do hook", "Aqui alguns nomes de ofertas que gostei: [...]"...',
        type: "textarea",
      },
    ],
    buildPrompt: (inputs, brandContext) => {
      return `Você é o Adaptador Universal — um especialista em engenharia reversa de criativos e replicação estrutural de copy de alta performance.

MISSÃO: Analisar a copy original fornecida, extrair sua ARQUITETURA PERSUASIVA completa e replicá-la com conteúdo totalmente personalizado para o DNA de campanha do usuário.

PROCESSO OBRIGATÓRIO:

## FASE 1 — ANÁLISE ESTRUTURAL
Analise silenciosamente a copy original e identifique:
- Tipo de criativo (página de vendas, VSL, e-mail, carrossel, anúncio, etc.)
- Sequência de seções/blocos
- Gatilhos persuasivos utilizados (escassez, autoridade, prova social, etc.)
- Estrutura de headlines e sub-headlines
- Padrão de CTAs (posição, frequência, tom)
- Elementos de prova (depoimentos, dados, cases)
- Formato e extensão de cada bloco
- Ritmo narrativo (emocional → lógico, problema → solução, etc.)

## FASE 2 — REPLICAÇÃO PERSONALIZADA
Crie uma NOVA versão que:
1. MANTÉM a mesma arquitetura persuasiva, sequência e posicionamento de elementos
2. PRESERVA o tipo e formato do criativo original
3. ADAPTA todo o conteúdo (headlines, benefícios, CTAs, provas) para o contexto do DNA de Campanha
4. REPLICA o tom, ritmo e energia do original adaptando à voz da marca
5. SUBSTITUI dados, nomes e referências pelos do novo contexto
6. MANTÉM a mesma extensão aproximada de cada seção

REGRAS:
- NÃO copie frases literais — replique a ESTRUTURA, não o texto
- Cada elemento deve ser funcional e coerente com o novo contexto
- Se o original tem 15 seções, a replicação deve ter 15 seções equivalentes
- Mantenha a mesma densidade de gatilhos persuasivos
- Entregue o resultado PRONTO PARA USO, sem comentários meta

${brandContext ? `\n--- DNA DE CAMPANHA ---\n${brandContext}` : "⚠️ Nenhum DNA de Campanha selecionado. Adapte o conteúdo de forma genérica mantendo a estrutura."}
${inputs.extra ? `\n--- INSTRUÇÕES EXTRAS ---\n${inputs.extra}` : ""}

COPY ORIGINAL PARA REPLICAR:
${inputs.original_copy}`;
    },
  },

  "brand-voice": {
    id: "brand-voice",
    name: "Arquiteto de Marca",
    emoji: "🎭",
    subtitle: "Defina o posicionamento e tom de voz da sua marca",
    inputs: [
      {
        key: "brand_info",
        label: "Informações da Marca",
        placeholder: "Descreva sua marca/empresa: nome, setor, o que oferece, como começou, valores, o que a torna única...",
        type: "textarea",
        required: true,
      },
      {
        key: "industry",
        label: "Setor / Indústria",
        type: "input",
        placeholder: "Ex: Saúde e Bem-estar, Marketing Digital, Educação, Tecnologia...",
      },
      {
        key: "references",
        label: "Marcas de Referência",
        type: "input",
        placeholder: "Ex: 'Tom da Apple + energia da Red Bull + acessibilidade da Nubank'",
      },
      {
        key: "extra",
        label: "Instruções Extras",
        placeholder: "Ex: 'Foco em redes sociais', 'Tom mais jovem', 'Marca premium'...",
        type: "textarea",
      },
    ],
    buildPrompt: (inputs, brandContext) => {
      return `Você é o Arquiteto de Marca — um estrategista de branding especializado em definir identidade verbal, tom de voz e posicionamento de marca com precisão cirúrgica.

MISSÃO: Criar um GUIA COMPLETO DE TOM DE VOZ E POSICIONAMENTO para a marca descrita.

ESTRUTURA OBRIGATÓRIA:

## 1. ESSÊNCIA DA MARCA
- Propósito central (por que existe)
- Visão (onde quer chegar)
- Missão (como vai chegar)
- Valores fundamentais (3-5 valores com descrição)

## 2. POSICIONAMENTO
- Declaração de posicionamento (frase única)
- Categoria que ocupa na mente do consumidor
- Diferencial competitivo
- Promessa de marca

## 3. PERSONALIDADE DE MARCA
- Arquétipo dominante (Jung) + arquétipo secundário
- 5 adjetivos que definem a personalidade
- Se a marca fosse uma pessoa: idade, estilo, como fala, como se veste

## 4. TOM DE VOZ
- Tom principal (ex: confiante, acolhedor, provocativo)
- Espectro de formalidade (escala de 1-10)
- Palavras que USA (lista de 10-15 palavras-chave)
- Palavras que NUNCA usa (lista de 10 proibidas)
- Estruturas de frase preferidas
- Ritmo e cadência da escrita

## 5. GUIA DE APLICAÇÃO
- Como falar em redes sociais
- Como falar em e-mails
- Como falar em anúncios
- Como falar em atendimento
- Exemplos de frases no tom certo vs. tom errado (tabela comparativa)

## 6. IDENTIDADE VERBAL
- Tagline principal
- 3 taglines alternativas
- Expressões proprietárias (bordões da marca)
- Estilo de títulos e headlines

${inputs.industry ? `\nSETOR: ${inputs.industry}` : ""}
${inputs.references ? `\nREFERÊNCIAS: ${inputs.references}` : ""}
${brandContext ? `\n--- DNA DE MARCA EXISTENTE (use como base e expanda) ---\n${brandContext}` : ""}
${inputs.extra ? `\n--- INSTRUÇÕES EXTRAS ---\n${inputs.extra}` : ""}

INFORMAÇÕES DA MARCA:
${inputs.brand_info}`;
    },
  },

  "writing-analysis": {
    id: "writing-analysis",
    name: "Análise de Escrita",
    emoji: "🔍",
    subtitle: "Decifre e replique qualquer estilo de escrita com precisão",
    inputs: [
      {
        key: "source_text",
        label: "Conteúdo para Análise",
        placeholder: "Cole aqui os textos do estilo que você quer decifrar e replicar. Quanto mais texto, mais precisa será a análise estilística.",
        type: "textarea",
        required: true,
      },
      {
        key: "extra",
        label: "Instruções Extras",
        placeholder: 'Ex: "Foque nos padrões de headline", "Compare com tom corporativo", "Analise só os CTAs"...',
        type: "textarea",
      },
    ],
    buildPrompt: (inputs, brandContext) => {
      return `Você é o Analista de Escrita — um especialista em linguística aplicada, estilística e engenharia reversa de voz autoral. Sua capacidade de decifrar padrões de escrita é cirúrgica.

MISSÃO: Analisar profundamente o texto fornecido e entregar um GUIA DE ESTILO COMPLETO que permita replicar esse estilo com fidelidade absoluta.

ESTRUTURA OBRIGATÓRIA DA ANÁLISE:

## 1. DNA DO TOM
- **Espectro de Formalidade**: escala de 1 (ultra casual) a 10 (ultra formal) com justificativa
- **Temperatura Emocional**: frio/analítico ↔ quente/passional — onde se posiciona
- **Registro Dominante**: conversacional, jornalístico, acadêmico, publicitário, literário, técnico
- **Atitude**: assertivo, questionador, provocativo, acolhedor, autoritário, conspiratório
- **Persona Implícita**: quem é o "eu" por trás do texto (mentor, amigo, especialista, rebelde, etc.)

## 2. ARQUITETURA ESTRUTURAL
- **Tamanho médio de frases**: curtas (até 10 palavras), médias (10-20), longas (20+)
- **Tamanho médio de parágrafos**: quantas frases por bloco
- **Ritmo e Cadência**: alternância entre frases curtas e longas, padrão rítmico
- **Estrutura de abertura**: como começa textos/seções (pergunta, afirmação, história, dado)
- **Transições**: como conecta ideias (conectivos, quebras, perguntas retóricas)
- **Fechamento**: padrão de encerramento (CTA, reflexão, provocação, resumo)

## 3. VOCABULÁRIO E LINGUAGEM
- **Nível de sofisticação lexical**: simples, intermediário, avançado
- **Palavras-chave recorrentes**: lista das 15-20 palavras/expressões mais usadas
- **Palavras NUNCA usadas**: padrões de evitação lexical
- **Jargão/Terminologia**: termos técnicos ou de nicho frequentes
- **Estrangeirismos**: uso de palavras em outros idiomas
- **Gírias e coloquialismos**: presença e frequência

## 4. ELEMENTOS DISTINTIVOS
- **Metáforas e analogias**: padrões de comparação usados
- **Gatilhos emocionais**: quais emoções são acionadas e como
- **Recursos retóricos**: anáfora, paralelismo, ironia, hipérbole, etc.
- **Pontuação expressiva**: uso de travessões, reticências, exclamações, parênteses
- **Formatação**: uso de negrito, itálico, caps, listas, emojis
- **Storytelling**: presença e estilo de narrativas

## 5. PADRÕES PERSUASIVOS
- **Framework implícito**: PAS, AIDA, storytelling, lógico-dedutivo, etc.
- **Prova social**: como apresenta credibilidade e autoridade
- **Objeções**: como antecipa e neutraliza resistências
- **CTAs**: estilo, frequência e posicionamento de chamadas à ação
- **Urgência/Escassez**: como e se utiliza esses gatilhos

## 6. GUIA DE REPLICAÇÃO PRÁTICA
- **10 Regras de Ouro**: lista das regras mais importantes para escrever neste estilo
- **Template de parágrafo**: exemplo de estrutura de parágrafo típico
- **Frases modelo**: 5 frases de exemplo no estilo analisado (originais, não copiadas)
- **Checklist de revisão**: 10 itens para verificar se um texto está no estilo correto
- **O que FAZER vs. O que NÃO FAZER**: tabela comparativa

${brandContext ? `\n--- DNA DE CAMPANHA (use para contextualizar a análise e sugerir adaptações) ---\n${brandContext}` : ""}
${inputs.extra ? `\n--- INSTRUÇÕES EXTRAS ---\n${inputs.extra}` : ""}

TEXTO PARA ANÁLISE:
${inputs.source_text}`;
    },
  },
};
