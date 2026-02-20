import type { KeywordPackage, Modifier, NegativeWord } from "./types";

export const defaultModifiers: Modifier[] = [
  "truque", "método", "ritual", "protocolo", "receita", "fórmula", "segredo",
  "passo a passo", "3 ingredientes", "natural", "caseiro", "comprovado",
  "cientificamente", "médicos", "farmacêutico", "Anvisa", "em 7 dias",
  "em 15 dias", "em 21 dias", "sem dieta", "sem treino", "sem academia",
  "antes e depois", "depoimento", "resultado real", "prova real",
].map((w) => ({ word: w, enabled: true }));

export const defaultNegativeWords: NegativeWord[] = [
  "grátis total", "download grátis", "meme", "piada",
  "teste de personalidade", "horóscopo",
].map((w) => ({ word: w, enabled: true }));

export const defaultKeywordPackages: KeywordPackage[] = [
  {
    nicheId: "emagrecimento",
    nicheName: "Emagrecimento / Metabolismo",
    enabled: true,
    keywordsBase: [
      "truque da banana", "truque da cúrcuma", "receita do cacau", "truque do café",
      "truque do limão", "truque do gengibre", "truque do vinagre de maçã",
      "truque da gelatina bariátrica", "truque do pó bariátrico", "truque bariátrico",
      "truque do arroz", "truque do sal rosa", "chá bariátrico natural",
      "chá bariátrico japonês", "chá que seca gordura", "semente bariátrica",
      "parasita emagrecedor", "bactéria que engorda", "método do arroz",
      "ritual matinal para emagrecer", "receita caseira que derrete gordura",
      "derreta gordura localizada", "receita secreta que seca barriga",
      "queime banha dormindo", "receita para desinchar",
      "bebida natural que derrete gordura", "dieta low carb", "dieta cetogênica",
      "dieta carnívora", "mounjaro natural", "wegovy natural", "ozempic natural",
      "receita mounjaro caseira",
    ],
    termosComplementares: [
      "secar barriga", "desinchar", "gordura visceral", "metabolismo lento",
      "reset metabólico", "termogênico natural", "chá detox", "suco detox",
    ],
  },
  {
    nicheId: "prostata",
    nicheName: "Próstata / Urinário / Hormônios",
    enabled: true,
    keywordsBase: [
      "truque da água morna", "truque japonês da próstata", "truque da maçã próstata",
      "truque do vinagre próstata", "receita caseira para próstata",
      "esvaziar a bexiga naturalmente", "desinche a próstata",
      "chá redutor de próstata", "urine sem esforço",
      "bactéria que desinflama próstata",
    ],
    termosComplementares: [
      "jato fraco urina", "levantar à noite para urinar",
      "próstata aumentada solução", "hiperplasia prostática natural",
    ],
  },
  {
    nicheId: "virilidade",
    nicheName: "Desempenho Masculino / Virilidade",
    enabled: true,
    keywordsBase: [
      "truque do mel amazônico", "truque do sal azul", "truque do touro indiano",
      "truque da melancia", "truque do pepino", "truque do cavalo",
      "truque do rei Salomão", "receita natural de viagra", "tadalafila caseira",
      "ritual do gengibre", "tônico da virilidade", "duro como pedra",
      "receita para ereção", "mistura secreta para potência",
      "truque do bicarbonato", "técnica do anel mágico", "truque do sal matinal",
      "cobra gigante natural", "anaconda natural",
    ],
    termosComplementares: [
      "potência masculina", "libido baixa solução",
      "desempenho masculino", "energia masculina",
    ],
  },
  {
    nicheId: "diabetes",
    nicheName: "Diabetes / Glicose",
    enabled: true,
    keywordsBase: [
      "baixar glicose", "controlar açúcar no sangue", "hemoglobina glicada baixar",
      "resistência à insulina", "picos de glicose",
    ],
    termosComplementares: ["diabete tipo 2", "glicose alta", "insulina alta"],
  },
  {
    nicheId: "pressao",
    nicheName: "Pressão / Colesterol / Coração",
    enabled: true,
    keywordsBase: [
      "baixar pressão", "pressão alta natural", "colesterol alto solução",
      "triglicerídeos baixar", "limpar artérias",
    ],
    termosComplementares: ["circulação", "coração saudável"],
  },
  {
    nicheId: "dor",
    nicheName: "Dor / Articulações",
    enabled: true,
    keywordsBase: [
      "dor no joelho solução", "artrose natural", "dor na coluna solução",
      "inflamação crônica", "colágeno tipo 2",
    ],
    termosComplementares: ["anti-inflamatório natural", "dor articular"],
  },
  {
    nicheId: "sono",
    nicheName: "Sono / Ansiedade / Foco",
    enabled: true,
    keywordsBase: [
      "dormir rápido", "insônia solução natural", "ansiedade controle natural",
      "calmante natural", "foco e concentração", "memória melhorar",
    ],
    termosComplementares: ["estresse alto", "mente acelerada"],
  },
  {
    nicheId: "renda",
    nicheName: "Renda Extra / Dinheiro",
    enabled: true,
    keywordsBase: [
      "renda extra", "ganhar dinheiro no celular", "pix diário", "lucro garantido",
      "robô de investimento", "robô de pix", "aplicativo que paga",
      "trabalhe 2 horas por dia", "sem experiência",
    ],
    termosComplementares: ["renda automática", "renda em casa"],
  },
];
