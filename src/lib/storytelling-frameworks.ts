export interface StorytellingFramework {
  id: string;
  name: string;
  emoji: string;
  description: string;
  structure: string;
}

export const STORYTELLING_FRAMEWORKS: StorytellingFramework[] = [
  {
    id: "heros-journey",
    name: "Jornada do Herói",
    emoji: "⚔️",
    description: "O framework épico de Joseph Campbell. Ideal para transformações profundas e narrativas longas.",
    structure: `Reestruture o conteúdo seguindo a Jornada do Herói de Joseph Campbell:
1. MUNDO COMUM — Apresente a situação atual do protagonista (o leitor/avatar).
2. CHAMADO À AVENTURA — Mostre o evento ou insight que desafia o status quo.
3. RECUSA DO CHAMADO — Aborde os medos e objeções iniciais.
4. ENCONTRO COM O MENTOR — Apresente a solução/produto como o guia.
5. TRAVESSIA DO LIMIAR — O momento de decisão e compromisso.
6. PROVAÇÕES E ALIADOS — Os desafios enfrentados e como o método ajuda.
7. APROXIMAÇÃO DA CAVERNA — O confronto com o medo maior.
8. PROVAÇÃO SUPREMA — A transformação central.
9. RECOMPENSA — Os resultados concretos alcançados.
10. CAMINHO DE VOLTA — Como a nova vida se consolida.
11. RESSURREIÇÃO — O insight final que muda tudo.
12. RETORNO COM O ELIXIR — O CTA e a promessa de transformação permanente.`,
  },
  {
    id: "pas",
    name: "PAS (Problema-Agitação-Solução)",
    emoji: "🔥",
    description: "Rápido e direto. Perfeito para e-mails, posts e textos curtos de alta conversão.",
    structure: `Reestruture o conteúdo seguindo o framework PAS:
1. PROBLEMA — Identifique e nomeie a dor principal de forma visceral e específica. O leitor deve pensar "isso sou eu".
2. AGITAÇÃO — Amplifique a dor. Mostre as consequências de não agir. Use cenários concretos, emoções e urgência. Faça a ferida arder.
3. SOLUÇÃO — Apresente a solução como alívio natural e inevitável. Conecte diretamente à dor agitada. Termine com CTA claro.`,
  },
  {
    id: "aida",
    name: "AIDA",
    emoji: "🎯",
    description: "O clássico do marketing direto. Atenção → Interesse → Desejo → Ação.",
    structure: `Reestruture o conteúdo seguindo o framework AIDA:
1. ATENÇÃO — Abra com um gancho irresistível: uma estatística chocante, pergunta provocativa ou afirmação ousada que pare o scroll.
2. INTERESSE — Desenvolva o gancho com informações relevantes, dados e storytelling que mantenham o leitor engajado.
3. DESEJO — Transforme interesse em desejo: mostre benefícios emocionais, provas sociais, resultados concretos. O leitor deve QUERER.
4. AÇÃO — CTA claro, urgente e irresistível. Remova objeções finais e dê o empurrão.`,
  },
  {
    id: "before-after-bridge",
    name: "Antes-Depois-Ponte",
    emoji: "🌉",
    description: "Simples e poderoso. Mostra o contraste entre a situação atual e a transformação.",
    structure: `Reestruture o conteúdo seguindo o framework Antes-Depois-Ponte:
1. ANTES — Pinte um quadro vívido e emocional da situação atual do leitor. Use detalhes sensoriais e emocionais que criem identificação.
2. DEPOIS — Mostre o futuro transformado em contraste direto. Use os mesmos elementos do "Antes" mas invertidos para mostrar a mudança.
3. PONTE — Conecte os dois mundos mostrando COMO a transição acontece. Apresente o produto/método como a ponte e feche com CTA.`,
  },
  {
    id: "star-story-solution",
    name: "Star-Story-Solution",
    emoji: "⭐",
    description: "Centrado em personagem. Ideal para case studies, depoimentos e narrativas pessoais.",
    structure: `Reestruture o conteúdo seguindo o framework Star-Story-Solution:
1. STAR (Protagonista) — Apresente um personagem com quem o leitor se identifique. Dê detalhes que criem empatia e conexão.
2. STORY (História) — Conte a jornada desse personagem: os desafios, as tentativas fracassadas, o momento de virada. Use tensão narrativa.
3. SOLUTION (Solução) — Mostre como a solução resolveu o problema do protagonista. Termine com resultados concretos e CTA.`,
  },
  {
    id: "pixar",
    name: "Pixar Storytelling",
    emoji: "🎬",
    description: "A fórmula da Pixar: 'Era uma vez... Todo dia... Até que um dia...'",
    structure: `Reestruture o conteúdo seguindo a fórmula narrativa da Pixar:
1. "ERA UMA VEZ..." — Estabeleça o contexto e o protagonista.
2. "TODO DIA..." — Mostre a rotina e o status quo (a dor normalizada).
3. "ATÉ QUE UM DIA..." — O evento disruptivo que muda tudo.
4. "POR CAUSA DISSO..." — As consequências e a cadeia de eventos.
5. "POR CAUSA DISSO..." — A escalada do conflito/descoberta.
6. "ATÉ QUE FINALMENTE..." — A resolução, a transformação e o CTA.`,
  },
  {
    id: "freytag",
    name: "Pirâmide de Freytag",
    emoji: "🏔️",
    description: "Estrutura dramática clássica com clímax e resolução. Para narrativas com tensão crescente.",
    structure: `Reestruture o conteúdo seguindo a Pirâmide de Freytag:
1. EXPOSIÇÃO — Apresente o cenário, o protagonista e o problema inicial.
2. AÇÃO ASCENDENTE — Construa tensão progressiva. Mostre tentativas, frustrações e a escalada do problema.
3. CLÍMAX — O ponto de virada mais intenso. A descoberta, a revelação ou o momento "eureka".
4. AÇÃO DESCENDENTE — Mostre as consequências positivas da descoberta. Os primeiros resultados.
5. RESOLUÇÃO — O novo equilíbrio. A transformação completa e o CTA.`,
  },
];
