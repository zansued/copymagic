import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `Você é um Software Profissional de Inteligência de Marketing Direto, especializado em:
• Psicologia profunda de decisão
• Copywriting de resposta direta
• Funis de alta conversão
• VSLs longas e curtas
• Maximização de LTV com Upsells e Order Bumps

REGRAS ABSOLUTAS:
• Nunca inventar dados científicos ou promessas irreais
• Nunca quebrar coerência psicológica do avatar
• Linguagem sempre humana, emocional e persuasiva
• Escrita pronta para uso comercial imediato
• Responda SEMPRE em português do Brasil
• Use formatação markdown para estruturar o conteúdo`;

const STEP_PROMPTS: Record<string, string> = {
  avatar: `ETAPA 1 – AVATAR PSICOLÓGICO PROFUNDO

Com base no produto informado, gere um Avatar psicológico profundo e detalhado incluindo:

🧠 PERFIL DEMOGRÁFICO
- Idade, gênero, renda, localização, profissão

💔 DORES PROFUNDAS
- Dor superficial (o que ele diz)
- Dor emocional (o que ele sente)
- Dor existencial (o que ele teme)

🌟 DESEJOS SECRETOS
- O que ele quer de verdade (além do produto)
- Como ele quer se sentir
- O que ele quer provar para os outros

🚧 OBJEÇÕES INTERNAS
- Por que ele não comprou antes
- O que o faz hesitar
- Crenças limitantes

📱 COMPORTAMENTO DIGITAL
- Onde ele consome conteúdo
- Quem ele segue
- O que o faz clicar

🗣️ LINGUAGEM DO AVATAR
- Como ele descreve o problema
- Frases que ele usa no dia a dia
- Palavras gatilho

Seja extremamente detalhado e realista. Este avatar é a BASE de todo o sistema.`,

  usp: `ETAPA 2 – PROPOSTA ÚNICA DE VENDAS (USP)

Usando o avatar gerado anteriormente como base emocional, crie a USP completa:

📌 NOME DA CATEGORIA ÚNICA
- Crie uma nova categoria de mercado que posicione o produto como único

⚙️ MECANISMO ÚNICO PROPRIETÁRIO
- Nome proprietário do mecanismo
- Como funciona (explicação leiga)
- Por que é diferente de tudo que existe
- Prova de conceito

🎯 PROMESSA CENTRAL
- Uma frase que capture a transformação
- Tempo estimado de resultado
- Especificidade (números, dados)

🛡️ RAZÃO PARA ACREDITAR
- Por que funciona
- O que o mercado estava fazendo errado
- A descoberta/insight por trás

💎 POSICIONAMENTO
- Como se diferencia da concorrência
- Por que as alternativas falham
- O que torna isso inevitável`,

  oferta: `ETAPA 3 – OFERTA IRRESISTÍVEL

Usando avatar + USP, monte a oferta completa:

📦 NOME DO PRODUTO
- Nome comercial atraente

🔧 COMO FUNCIONA
- Passo a passo simples (3-5 passos)

📚 MÓDULOS/COMPONENTES
- Liste 5-7 módulos com nome, descrição e benefício de cada

🎁 BÔNUS (5 bônus)
- Nome criativo
- Valor percebido
- Por que é relevante

🛡️ GARANTIA
- Tipo de garantia
- Prazo
- Texto da garantia (persuasivo)

💰 INVESTIMENTO
- Ancoragem de preço
- Preço real
- Parcelas
- Economia percebida

🔥 URGÊNCIA/ESCASSEZ
- Elemento de urgência
- Justificativa real`,

  pagina_vendas: `ETAPA 4 – PÁGINA DE VENDAS COMPLETA

Usando avatar + USP + oferta, gere TODAS as seções da página de vendas na ordem:

1. 🎯 HEADLINE PRINCIPAL (com sub-headline)
2. 📖 ABERTURA (identificação com a dor)
3. 🔍 AGITAÇÃO DO PROBLEMA
4. 💡 APRESENTAÇÃO DA SOLUÇÃO
5. ⚙️ MECANISMO ÚNICO (como funciona)
6. ✅ BENEFÍCIOS (lista com bullets)
7. 📊 PROVA SOCIAL (depoimentos fictícios realistas)
8. 📦 APRESENTAÇÃO DA OFERTA
9. 🎁 BÔNUS
10. 🛡️ GARANTIA
11. ❓ FAQ (8-10 perguntas)
12. 🔥 CTA FINAL (com urgência)

Cada seção deve ter texto pronto para uso, persuasivo e completo.`,

  upsells: `ETAPA 5 – ORDER BUMPS E UPSELLS

Gere:

📌 5 ORDER BUMPS
Para cada:
- Nome
- Preço
- Descrição (1 parágrafo persuasivo)
- Por que complementa a oferta principal

📌 5 UPSELLS
Para cada:
- Nome
- Preço
- Proposta de valor
- Copy de venda (2-3 parágrafos)
- Gatilho emocional usado

📌 1 UPSELL REFINADO PRINCIPAL
- Copy completa de venda
- Headline
- Benefícios
- Urgência
- CTA`,

  vsl_longa: `ETAPA 6 – VSL DE 60 MINUTOS

Gere o script completo da VSL longa com:

🎬 ESTRUTURA OBRIGATÓRIA:
1. HOOK (0-2 min) - Promessa impactante
2. HISTÓRIA DE ORIGEM (2-10 min) - Storytelling em primeira pessoa
3. O PROBLEMA REAL (10-18 min) - Aprofundamento na dor
4. A DESCOBERTA (18-28 min) - Momento eureka
5. O MECANISMO (28-35 min) - Como funciona (ciência leiga)
6. PROVA (35-42 min) - Resultados e depoimentos
7. A OFERTA (42-50 min) - Apresentação irresistível
8. OBJEÇÕES (50-55 min) - Quebra de objeções
9. CTA FINAL (55-60 min) - Chamada para ação com urgência

Use linguagem cinematográfica, emocional, em primeira pessoa.
Inclua indicações de [PAUSA], [ÊNFASE], [TOM MAIS BAIXO] etc.`,

  vsl_curta: `ETAPA 7 – VSL DE 15 MINUTOS (PRODUTO)

Condense a VSL longa em 15 minutos mantendo:

1. HOOK DIRETO (0-1 min)
2. PROBLEMA + AGITAÇÃO (1-4 min)
3. MECANISMO RESUMIDO (4-7 min)
4. OFERTA + BÔNUS (7-11 min)
5. PROVA SOCIAL (11-13 min)
6. CTA COM URGÊNCIA (13-15 min)

Mantenha a mesma intensidade emocional mas de forma mais direta.`,

  pagina_upsell: `ETAPA 8 – PÁGINA DE UPSELL

Gere a página completa de upsell com:

1. 🎉 PARABÉNS (acknowledge da compra)
2. ⚠️ ANTES DE ACESSAR... (gancho)
3. 🔓 OFERTA EXCLUSIVA
4. 🛡️ PROTEÇÃO DOS RESULTADOS
5. ⏰ DISPONÍVEL APENAS AGORA
6. 💰 PREÇO ESPECIAL

CTA DUPLO:
✅ SIM! Quero proteger meus resultados (botão principal)
❌ Não, prefiro arriscar sozinho (botão secundário com copy de aversão à perda)`,

  vsl_upsell: `ETAPA 9 – VSL DE UPSELL (15 MIN)

Script completo da VSL de upsell:

1. CELEBRAÇÃO (0-1 min)
2. O PROBLEMA ESCONDIDO (1-4 min)
3. POR QUE PRECISA DISSO (4-8 min)
4. O QUE ACONTECE SEM ISSO (8-10 min) - Aversão à perda
5. A OFERTA EXCLUSIVA (10-13 min)
6. CTA COM URGÊNCIA (13-15 min)

Tom: autoridade + urgência + empatia`,

  anuncios: `ETAPA 10 – ANÚNCIOS (ADS)

Gere para mídia paga:

📌 3 HEADLINES (variações)
- Curiosidade
- Dor direta
- Resultado

📌 SCRIPT COMPLETO DE ANÚNCIO (1-2 min falado)
- Hook (primeiros 3 segundos)
- Problema
- Solução
- CTA

📌 3 VARIAÇÕES DE HOOK
- Hook de choque
- Hook de curiosidade
- Hook de identificação

📌 3 COPIES PARA FACEBOOK/INSTAGRAM
- Copy curta (1 parágrafo)
- Copy média (3 parágrafos)
- Copy longa (storytelling)

Linguagem falada, natural, como se estivesse conversando.`
};

interface ProviderConfig {
  url: string;
  apiKey: string;
  model: string;
}

function getProviderConfig(provider: string): ProviderConfig {
  if (provider === "deepseek") {
    const apiKey = Deno.env.get("DEEPSEEK_API_KEY");
    if (!apiKey) throw new Error("DEEPSEEK_API_KEY não está configurada");
    return {
      url: "https://api.deepseek.com/chat/completions",
      apiKey,
      model: "deepseek-chat",
    };
  }
  
  if (provider === "openai") {
    const apiKey = Deno.env.get("OPENAI_API_KEY");
    if (!apiKey) throw new Error("OPENAI_API_KEY não está configurada");
    return {
      url: "https://api.openai.com/v1/chat/completions",
      apiKey,
      model: "gpt-4o",
    };
  }

  throw new Error(`Provedor inválido: ${provider}`);
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { product_input, step, previous_context, provider = "deepseek" } = await req.json();

    const config = getProviderConfig(provider);
    const stepPrompt = STEP_PROMPTS[step];
    if (!stepPrompt) throw new Error(`Etapa inválida: ${step}`);

    const messages = [
      { role: "system", content: SYSTEM_PROMPT },
    ];

    if (previous_context) {
      messages.push({
        role: "assistant",
        content: `Contexto das etapas anteriores:\n\n${previous_context}`
      });
    }

    messages.push({
      role: "user",
      content: `PRODUTO: ${product_input}\n\n${stepPrompt}`
    });

    const response = await fetch(config.url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: config.model,
        messages,
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Limite de requisições excedido. Tente novamente em alguns instantes." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("API error:", response.status, t);
      return new Response(JSON.stringify({ error: `Erro na API ${provider}: ${response.status}` }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("generate-copy error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
