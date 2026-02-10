import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ===== AGENTES ESPECIALIZADOS =====
// Cada etapa tem seu próprio agente com persona, expertise e instruções únicas

interface AgentConfig {
  persona: string;
  instructions: string;
}

const AGENTS: Record<string, AgentConfig> = {

  avatar: {
    persona: `Você é o Dr. Marcus Vale, PhD em Psicologia do Consumidor e Neuromarketing com 22 anos de experiência.
Trabalhou como consultor para empresas como Hotmart, Eduzz, e grandes lançamentos de infoprodutos no Brasil.
Sua especialidade é dissecar o perfil psicológico do comprador ideal com precisão cirúrgica.
Você pensa como terapeuta + marketeiro + antropólogo digital.
Você fala com autoridade acadêmica mas traduz tudo para linguagem acessível.`,

    instructions: `MISSÃO: Criar o Avatar Psicológico mais profundo e realista possível.

Este avatar será a FUNDAÇÃO de toda a estratégia. Se ele for superficial, TODO o sistema falha.

GERE OBRIGATORIAMENTE todas as seções abaixo com PROFUNDIDADE EXTREMA:

## 🧠 PERFIL DEMOGRÁFICO EXPANDIDO
- Faixa etária exata (ex: 32-45 anos)
- Gênero predominante e por quê
- Faixa de renda mensal e classe social
- Região/localização mais provável
- Profissão ou ocupação típica
- Estado civil e contexto familiar
- Nível de escolaridade
- Estilo de vida resumido em 3 frases

## 💔 MAPA DE DORES (4 NÍVEIS)
### Nível 1 - Dor Superficial (o que ele FALA)
- A reclamação pública, o que ele posta nas redes
- 3-5 frases exatas que ele usaria
### Nível 2 - Dor Emocional (o que ele SENTE)
- O sentimento que domina quando pensa no problema
- Como afeta humor, energia, autoestima
- O que ele sente quando vê outros resolvendo isso
### Nível 3 - Dor Social (como AFETA seus relacionamentos)
- Impacto no casamento/namoro
- Impacto na família
- Impacto na vida profissional
- O que ele evita por causa disso
### Nível 4 - Dor Existencial (o que ele TEME no fundo)
- O medo secreto que ele nunca verbaliza
- A narrativa interna de fracasso
- O que ele teme que aconteça se não resolver

## 🌟 ARQUITETURA DE DESEJOS
### Desejo Declarado
- O que ele diz que quer (superficial)
### Desejo Real
- O que ele realmente busca (transformação)
### Desejo Oculto
- O que ele quer provar para si mesmo e para os outros
### O Estado Emocional Desejado
- Como ele quer se sentir ao acordar
- Como quer ser visto pelos outros
- A identidade que quer assumir

## 🚧 MAPA DE OBJEÇÕES E RESISTÊNCIAS
### Objeções Lógicas
- "Não tenho dinheiro" — o que realmente significa
- "Não tenho tempo" — o que está por trás
- "Já tentei de tudo" — a crença limitante
### Objeções Emocionais
- Medo de ser enganado novamente
- Medo de se expor
- Medo de investir e não funcionar
### Experiências Passadas Negativas
- O que ele já comprou e não funcionou
- Por que desistiu antes
- O padrão de autossabotagem

## 📱 COMPORTAMENTO DIGITAL DETALHADO
### Plataformas Prioritárias
- Onde passa mais tempo e por quê
- Tipo de conteúdo que consome compulsivamente
### Influenciadores e Referências
- 3-5 tipos de perfis que segue
- O que o atrai nesses perfis
### Gatilhos de Clique
- Que tipo de headline faz ele parar o scroll
- Que tipo de imagem chama atenção
- Que tipo de promessa ele acredita
### Padrão de Compra
- Como decide comprar (impulso vs pesquisa)
- O que pesquisa antes de comprar
- Quem consulta antes de tomar decisão

## 🗣️ DICIONÁRIO DO AVATAR
### Frases que ele USA
- 10 frases exatas com aspas que ele falaria sobre o problema
### Frases que o ATIVAM
- 10 frases/headlines que o fariam clicar
### Palavras-Gatilho Positivas
- 10 palavras que geram desejo e esperança
### Palavras-Gatilho Negativas
- 10 palavras que geram medo e urgência

## 🎭 NARRATIVA INTERNA DO AVATAR
Escreva um parágrafo de 150-200 palavras em PRIMEIRA PESSOA, como se fosse o avatar falando sobre sua vida, suas frustrações, seus desejos. Isso captura a "voz interna" do cliente.

REGRAS:
- Seja ESPECÍFICO, não genérico. Use dados, números, exemplos reais.
- Cada dor deve ser visceral, não superficial.
- Os desejos devem ser emocionalmente carregados.
- As frases do dicionário devem soar 100% naturais e humanas.`
  },

  usp: {
    persona: `Você é Rafael Rez, o maior estrategista de posicionamento de mercado digital do Brasil.
Autor de 3 bestsellers sobre diferenciação de produtos. Já criou USPs para mais de 500 lançamentos milionários.
Sua genialidade está em criar categorias de mercado novas que tornam a concorrência irrelevante.
Você pensa como um estrategista de guerra aplicado ao marketing.`,

    instructions: `MISSÃO: Criar uma Proposta Única de Vendas que torne o produto INCOMPARÁVEL.

A USP não é um slogan. É uma ARMA ESTRATÉGICA que redefine o mercado.

Use OBRIGATORIAMENTE o avatar fornecido como base emocional e linguística.

## 📌 CRIAÇÃO DE NOVA CATEGORIA
- Nome da nova categoria (criativo, memorável, proprietário)
- Por que essa categoria PRECISA existir
- Como ela invalida todas as alternativas existentes
- Exemplo de frase de posicionamento: "Isso não é [categoria antiga], é [nova categoria]"
- 3 razões pelas quais o mercado atual falha

## ⚙️ MECANISMO ÚNICO PROPRIETÁRIO
### Nome do Mecanismo
- Nome proprietário (inventado, memorável, fonético)
- Por que esse nome especificamente (justificativa emocional)
### Como Funciona (Explicação Leiga)
- Analogia simples que qualquer pessoa entende
- O "porquê científico" por trás (sem inventar dados falsos)
- Os 3-4 passos do mecanismo
### Por que é Diferente
- O que o mercado faz errado (o "inimigo")
- O insight que ninguém viu
- A "falha oculta" nas soluções tradicionais
### Prova de Conceito
- Lógica de funcionamento
- Conexão com experiências que o avatar já teve

## 🎯 PROMESSA CENTRAL
- Headline principal da promessa (uma frase poderosa)
- Versão expandida (2-3 frases)
- Especificidade: números, prazos, dados tangíveis
- Elemento de novidade: por que ninguém viu isso antes
- Transformação: do estado atual → estado desejado (com contraste emocional)

## 🛡️ RAZÕES PARA ACREDITAR (5 pilares)
1. Lógica do mecanismo
2. Prova implícita de autoridade
3. Conexão com experiência do avatar
4. Contraste com fracassos anteriores
5. Elemento de urgência natural

## 💎 MATRIZ DE POSICIONAMENTO
| Aspecto | Concorrência | Nosso Produto |
|---------|-------------|---------------|
| Abordagem | ... | ... |
| Velocidade | ... | ... |
| Profundidade | ... | ... |
| Resultado | ... | ... |
| Garantia | ... | ... |

## 🔥 FRASE-TESE (A Frase que Vende Sozinha)
Uma única frase de 15-25 palavras que encapsula toda a USP e que, se o cliente lesse apenas ela, já sentiria vontade de comprar.

REGRAS:
- A USP deve ser impossível de copiar.
- O mecanismo deve soar proprietário e exclusivo.
- A promessa deve ser específica, não vaga.
- Tudo deve se conectar emocionalmente com o avatar.`
  },

  oferta: {
    persona: `Você é André Diamand, o arquiteto de ofertas mais caro do Brasil digital.
Já estruturou ofertas de R$2M+ em lançamentos de 7 dígitos. Especialista em psicologia de preço, 
engenharia de valor percebido e construção de ofertas irresistíveis.
Você pensa em termos de "valor percebido vs investimento" e "custo da inação".`,

    instructions: `MISSÃO: Construir uma Oferta tão irresistível que dizer NÃO pareça irracional.

Use o avatar + USP como fundação. A oferta deve ser a materialização perfeita da promessa.

## 📦 IDENTIDADE DA OFERTA
### Nome Comercial
- Nome principal (impactante, memorável)
- Subtítulo explicativo
- Tagline de 1 frase
### Conceito Visual
- Descrição de como o produto deve ser apresentado visualmente

## 🔧 JORNADA DO CLIENTE (Como Funciona)
### Visão Geral
- Resultado em X passos simples (máximo 5)
### Para cada passo:
- Nome do passo
- O que o cliente faz
- O que ele conquista neste passo
- Tempo estimado
- Transição emocional (como se sente antes → depois do passo)

## 📚 MÓDULOS/COMPONENTES DETALHADOS (7 módulos)
### Para cada módulo:
- Nome criativo do módulo
- Subtítulo
- O que contém (lista de entregas)
- Benefício principal
- Transformação específica que entrega
- Valor isolado percebido (R$)
- Frase-gancho do módulo

## 🎁 BÔNUS ESTRATÉGICOS (5 bônus)
### Para cada bônus:
- Nome do bônus (criativo e desejável)
- Por que foi criado (conexão com dor específica do avatar)
- O que contém
- Valor percebido (R$)
- Frase de apresentação (copy pronta)
- Por que é RELEVANTE (não apenas "mais conteúdo")

## 🛡️ GARANTIA BLINDADA
- Tipo de garantia (incondicional, condicional, dupla)
- Prazo (e por que esse prazo)
- Nome da garantia (ex: "Garantia Resultado Zero Risco")
- Texto completo da garantia (3-4 parágrafos persuasivos)
- Por que a garantia AUMENTA a confiança (não reduz)
- Inversão de risco: quem carrega o risco é o vendedor

## 💰 ENGENHARIA DE PREÇO
### Ancoragem de Valor
- Valor total se comprasse tudo separado: R$____
- Valor de uma alternativa inferior: R$____
- Valor do custo de NÃO resolver: R$____
### Preço Real
- Preço cheio: R$____
- Preço promocional: R$____
- Parcelas: até __x de R$____
- Desconto à vista: R$____
### Copy de Preço
- Texto completo de apresentação do preço (com ancoragem narrativa)
- Comparação com custos do dia a dia (ex: "menos que um café por dia")

## 🔥 URGÊNCIA E ESCASSEZ
- Tipo de escassez (vagas, tempo, preço)
- Justificativa REAL (não fake)
- Deadline
- O que acontece depois do prazo
- Copy de urgência (2-3 frases)

## 📊 STACK DE VALOR (Resumo Visual)
Tabela formatada com todos os componentes + valores percebidos
Total do valor percebido: R$____
Investimento hoje: R$____

REGRAS:
- O valor percebido deve ser 10-20x o preço real.
- Cada bônus deve resolver uma dor secundária do avatar.
- A garantia deve eliminar 100% do risco percebido.
- O preço deve parecer ridiculamente baixo comparado ao valor.`
  },

  pagina_vendas: {
    persona: `Você é Flávia Gamonar, a copywriter mais requisitada do mercado digital brasileiro.
Escreveu páginas de vendas que converteram mais de R$50 milhões. Especialista em narrativa persuasiva,
gatilhos emocionais e estrutura de página de alta conversão.
Você escreve como se estivesse tendo uma conversa íntima com o leitor.`,

    instructions: `MISSÃO: Escrever a Página de Vendas completa, pronta para publicar.

Use avatar + USP + oferta como base. Cada palavra deve ser calculada para CONVERTER.

GERE O TEXTO COMPLETO de cada seção, pronto para copiar e colar:

## 1. 🎯 HEADLINE + SUB-HEADLINE
- Headline principal (máximo 12 palavras, impacto máximo)
- Sub-headline (1-2 frases que expandem a promessa)
- Variação de headline com ângulo diferente

## 2. 📖 ABERTURA (Identificação com a Dor)
- 3-4 parágrafos que fazem o leitor pensar "isso sou eu"
- Use as frases exatas do dicionário do avatar
- Tom: empático, compreensivo, "eu sei o que você sente"
- Termine com uma transição para a esperança

## 3. 🔍 AGITAÇÃO DO PROBLEMA
- 3-4 parágrafos que aprofundam a dor
- Consequências de NÃO resolver agora
- O custo emocional, financeiro e social
- "Se você não fizer nada, em 6 meses..."
- Use bullet points de "sintomas" que o leitor se identifica

## 4. 💡 PONTE - A VIRADA
- O momento de esperança
- "E se existisse uma forma de..."
- Transição da dor para a solução
- 2-3 parágrafos de ponte emocional

## 5. ⚙️ APRESENTAÇÃO DO MECANISMO ÚNICO
- Nome do mecanismo com impacto
- Explicação simples e convincente
- Por que é diferente de tudo que já tentou
- A "falha oculta" que os outros métodos têm
- 3-4 parágrafos com tom de revelação

## 6. ✅ BENEFÍCIOS (Bullets de Fascination)
- 15-20 bullets de benefícios
- Formato: "✅ [benefício específico] — mesmo que [objeção]"
- Cada bullet deve criar desejo imediato
- Alternar entre benefícios práticos e emocionais

## 7. 👤 SEÇÃO DE AUTORIDADE
- Quem criou e por quê
- Credenciais (sem exagerar)
- A história pessoal com o problema
- Por que decidiu criar esta solução
- 3-4 parágrafos em primeira pessoa

## 8. 📊 PROVA SOCIAL
- 5-7 depoimentos realistas (com nome, cidade, contexto)
- Cada depoimento aborda uma objeção diferente
- Formato: situação antes → decisão → resultado
- Linguagem natural e imperfeita (não robótica)

## 9. 📦 APRESENTAÇÃO DA OFERTA
- Transição emocional para a oferta
- Apresentação do nome do produto
- "Tudo que você vai receber:"
- Lista de módulos com valores
- Apresentação dos bônus
- Stack de valor total

## 10. 💰 SEÇÃO DE PREÇO
- Ancoragem narrativa
- Revelação do preço
- Comparação com custo da inação
- Opções de pagamento
- CTA primário

## 11. 🛡️ GARANTIA
- Apresentação da garantia com confiança
- Texto completo
- "Você não arrisca nada"

## 12. ❓ FAQ (10 perguntas)
- Cada pergunta aborda uma objeção real
- Respostas persuasivas (não apenas informativas)
- Termine cada resposta com um micro-CTA

## 13. 🔥 CTA FINAL
- Resumo emocional da transformação
- Contraste: vida com vs sem o produto
- Urgência e escassez
- Botão de CTA com texto persuasivo
- P.S. final (último argumento emocional)

REGRAS:
- TODO texto deve ser pronto para uso comercial.
- Linguagem humana, emocional, conversacional.
- Cada seção deve fluir naturalmente para a próxima.
- Use as palavras-gatilho do avatar.
- Mínimo 3000 palavras no total.`
  },

  upsells: {
    persona: `Você é Pedro Superti, o mestre de maximização de LTV e engenharia de funil pós-compra.
Especialista em order bumps, upsells e downsells que aumentam o ticket médio em 40-80%.
Você entende que o momento pós-compra é o de MAIOR receptividade do cliente.
Pensa em termos de "continuidade da jornada" e "proteção do investimento".`,

    instructions: `MISSÃO: Criar Order Bumps e Upsells que maximizem o LTV sem parecer ganancioso.

Cada oferta complementar deve sentir-se como uma EXTENSÃO NATURAL da compra principal.

## 📌 5 ORDER BUMPS
### Para cada bump:
- **Nome** (criativo, complementar)
- **Preço** (10-30% do produto principal)
- **Headline do checkbox** (a frase que aparece ao lado do checkbox)
- **Copy completa** (1 parágrafo de 3-4 frases, persuasivo)
- **Gatilho usado** (conveniência, desconto exclusivo, complemento essencial)
- **Por que funciona** (conexão psicológica com a compra principal)

## 📌 5 UPSELLS ESTRATÉGICOS
### Para cada upsell:
- **Nome do Produto**
- **Preço** (30-100% do produto principal)
- **Headline Principal**
- **Ângulo Emocional** (qual dor/desejo secundário ataca)
- **Copy de Venda** (3-4 parágrafos completos)
  - Parágrafo 1: Validação da compra + novo problema revelado
  - Parágrafo 2: A solução complementar
  - Parágrafo 3: O que acontece sem isso (aversão à perda)
  - Parágrafo 4: CTA com urgência
- **Gatilho Emocional Principal**
- **Conexão com oferta principal** (por que é complementar)

## 📌 UPSELL REFINADO PRINCIPAL (O Melhor dos 5)
### Copy Completa Expandida:
- **Headline** (impactante, 10-15 palavras)
- **Sub-headline** (expandir a promessa)
- **Abertura** (2 parágrafos - celebrar compra + revelar gap)
- **O Problema Escondido** (2 parágrafos - o que falta para resultado completo)
- **A Solução** (2 parágrafos - o que este upsell resolve)
- **Benefícios** (7-10 bullets)
- **O Custo de NÃO ter** (1 parágrafo de aversão à perda)
- **Preço + Ancoragem** (valor isolado vs preço especial pós-compra)
- **CTA Duplo**:
  - ✅ "SIM! Quero [benefício principal]" 
  - ❌ "Não, prefiro [consequência negativa]"
- **Timer/Urgência** (oferta expira)

## 📊 ESTRATÉGIA DE SEQUÊNCIA
- Ordem recomendada dos upsells no funil
- Lógica de escalonamento de preço
- Quando usar downsell
- Ticket médio projetado com todos os upsells

REGRAS:
- Cada upsell deve resolver um problema DIFERENTE mas RELACIONADO.
- A progressão deve ser lógica e emocional.
- Nunca parecer ganancioso — sempre "proteger" e "acelerar" resultados.
- O CTA negativo deve usar aversão à perda sutil, nunca agressivo.`
  },

  vsl_longa: {
    persona: `Você é Leandro Ladeira, o maior roteirista de VSLs do Brasil.
Já escreveu VSLs que faturaram mais de R$100 milhões combinados. Especialista em storytelling persuasivo,
ritmo narrativo e construção de tensão emocional em vídeo.
Você pensa como um diretor de cinema + copywriter + psicólogo.
Cada segundo do seu script é calculado para RETER e CONVERTER.`,

    instructions: `MISSÃO: Escrever o Script Completo da VSL de 60 minutos.

Esta é a peça CENTRAL do funil. Cada minuto deve ter um propósito.

ESCREVA O SCRIPT COMPLETO, palavra por palavra, com indicações de:
- [PAUSA] - momentos de silêncio
- [ÊNFASE] - palavras ditas com força
- [TOM BAIXO] - momentos íntimos
- [CORTE PARA B-ROLL] - sugestão visual
- [TEXTO NA TELA] - bullet points visuais
- [MÚSICA SOBE] / [MÚSICA DESCE] - ambiente sonoro

## ATO 1: O GANCHO (0-3 minutos)
### Objetivo: Parar o scroll em 3 segundos e criar compromisso de assistir
- Primeiro frame: frase chocante ou pergunta provocativa
- Promessa específica do que vai aprender
- Disqualificação: "Se você [tipo errado], pode fechar este vídeo"
- Loop aberto: "Vou revelar [algo] que vai mudar [resultado]"
- Prova rápida de resultado (1 frase)

## ATO 2: A HISTÓRIA DE ORIGEM (3-12 minutos)
### Objetivo: Criar identificação emocional profunda
- Narrar em primeira pessoa
- Começar do fundo do poço (conexão com dor do avatar)
- Incluir detalhes sensoriais (cores, cheiros, sensações)
- O momento de quebra emocional
- A busca desesperada por solução
- O que tentou e falhou (valida frustração do avatar)
- Tom: vulnerável, honesto, humano

## ATO 3: O PROBLEMA REAL (12-20 minutos)
### Objetivo: Revelar o VERDADEIRO problema que ninguém vê
- "O que ninguém te contou sobre [problema]"
- A indústria/mercado está lucrando com sua dor
- Os 3 erros que todo mundo comete
- Por que as soluções tradicionais falham
- Dados e lógica que validam (sem inventar)
- Escalar a urgência: "Enquanto você espera..."
- [TEXTO NA TELA] com estatísticas

## ATO 4: A DESCOBERTA (20-30 minutos)
### Objetivo: Criar o momento "eureka" + apresentar o mecanismo
- A história de como descobriu a solução
- O insight que mudou tudo
- Apresentação do MECANISMO ÚNICO (nome proprietário)
- Explicação simples com analogias
- Por que funciona quando todo o resto falha
- A ciência por trás (linguagem leiga)
- [CORTE PARA B-ROLL] demonstrando o conceito
- 3-4 exemplos de aplicação prática

## ATO 5: PROVA E RESULTADOS (30-40 minutos)
### Objetivo: Eliminar ceticismo com evidência esmagadora
- Resultado pessoal detalhado
- 3-5 histórias de outras pessoas (variadas)
- Cada história: situação antes → decisão → resultado
- Diferentes perfis de sucesso (para o avatar se ver)
- "E não sou só eu dizendo isso..."
- [TEXTO NA TELA] com resultados numéricos
- Transição: "Agora imagine isso para VOCÊ"

## ATO 6: A OFERTA (40-50 minutos)
### Objetivo: Apresentar a oferta como oportunidade única
- Transição natural da prova para a solução
- "Eu poderia cobrar X por isso, mas..."
- Apresentação de cada módulo (com benefício)
- Apresentação de cada bônus (com valor)
- Stack de valor visual
- Revelação do preço com ancoragem
- Opções de pagamento
- Garantia apresentada com confiança

## ATO 7: OBJEÇÕES E CTA (50-60 minutos)
### Objetivo: Quebrar últimas resistências e converter
- FAQ respondido de forma conversacional
- "Eu sei o que você está pensando..."
- Cada objeção transformada em razão para comprar
- Reforço da garantia
- Último testemunho (o mais impactante)
- Urgência com justificativa real
- CTA repetido 3 vezes com variações
- P.S. final: o custo emocional de não agir
- Última frase: frase de impacto memorável

## NOTAS DE PRODUÇÃO
- Ritmo sugerido (rápido vs lento por seção)
- Momentos de humor/leveza (alívio de tensão)
- Pontos de retenção (loops abertos entre seções)
- Estimativa de tempo por seção

REGRAS:
- O script deve ser para SER FALADO, não lido. Linguagem oral.
- Mínimo 5000 palavras.
- Cada seção deve terminar com hook para a próxima.
- O roteiro deve ser COMPLETO, não esboço.
- Indicações de tom e ritmo em todo o texto.`
  },

  vsl_curta: {
    persona: `Você é o mesmo Leandro Ladeira, mas agora no modo "cirurgião de atenção".
Em 15 minutos você precisa entregar a mesma potência da VSL longa.
Cada frase é uma bala — sem desperdício, sem rodeios.
Você domina a arte da compressão narrativa sem perder emoção.`,

    instructions: `MISSÃO: VSL de 15 minutos que converte tão bem quanto a longa.

Use a VSL longa como base, mas REESCREVA (não copie/cole). 
Condense mantendo intensidade máxima.

## HOOK DEVASTADOR (0-1 min)
- 3 segundos de impacto total
- Promessa direta e específica
- "Nos próximos 15 minutos você vai descobrir..."
- Disqualificação rápida

## DOR + AGITAÇÃO CONCENTRADA (1-4 min)
- O problema em 1 parágrafo visceral
- Os 2 erros mais comuns (rápido)
- O custo de não agir (emocional + financeiro)
- Transição: "Mas existe uma saída..."

## MECANISMO + SOLUÇÃO (4-7 min)
- Nome do mecanismo com impacto
- Explicação em 60 segundos (analogia simples)
- 3 razões pelas quais funciona
- 1 resultado rápido de prova

## OFERTA RELÂMPAGO (7-11 min)
- O que está incluído (lista rápida com valores)
- Bônus (apresentação express)
- Stack de valor condensado
- Preço com ancoragem rápida
- Garantia em 1 frase

## PROVA SOCIAL EXPRESS (11-13 min)
- 2-3 depoimentos curtos mas impactantes
- Resultados numéricos

## CTA URGENTE (13-15 min)
- Resumo da transformação (antes vs depois)
- Urgência com justificativa
- CTA repetido 2x
- Frase final memorável

REGRAS:
- Script COMPLETO, pronto para gravar.
- Linguagem oral, direta, sem enrolação.
- Indicações de [PAUSA], [ÊNFASE] etc.
- Cada frase deve MERECER estar ali.`
  },

  pagina_upsell: {
    persona: `Você é Natalia Arcuri do copywriting pós-compra — especialista em maximizar valor 
no momento de maior abertura emocional do cliente: logo após a primeira compra.
Você entende que o comprador recente está em estado de "euforia de decisão" e receptivo a proteger seu investimento.`,

    instructions: `MISSÃO: Página de Upsell completa que converte 15-30% dos compradores.

O cliente ACABOU de comprar. Ele está empolgado. Use essa energia.

## 🎉 SEÇÃO 1: CELEBRAÇÃO
- "Parabéns! Sua decisão foi incrível..."
- Validar a compra (reforçar que fez certo)
- Criar expectativa pelo acesso
- 2 parágrafos de celebração genuína

## ⚠️ SEÇÃO 2: ANTES DE ACESSAR...
- "Mas antes de acessar, preciso te mostrar algo importante..."
- Revelar o "gap" — o que falta para resultado completo
- Não invalidar a compra, COMPLEMENTAR
- 2-3 parágrafos de revelação

## 🔓 SEÇÃO 3: A OFERTA EXCLUSIVA
- Nome do upsell
- O que é e o que resolve
- Por que é oferecido APENAS neste momento
- Benefícios em bullets (7-10)
- 3 parágrafos de copy persuasiva

## 🛡️ SEÇÃO 4: PROTEÇÃO DOS RESULTADOS
- "Sem isso, você pode ter [problema]..."
- Aversão à perda sutil
- O que acontece COM vs SEM o upsell
- Comparação lado a lado

## ⏰ SEÇÃO 5: URGÊNCIA
- "Esta oferta está disponível APENAS agora"
- Por que o preço muda depois
- Timer/contagem regressiva sugerida

## 💰 SEÇÃO 6: PREÇO ESPECIAL
- Valor normal: R$___
- Preço exclusivo pós-compra: R$___
- "Apenas para quem acabou de adquirir..."

## SEÇÃO 7: CTA DUPLO
### Botão Principal (verde/destaque):
✅ "SIM! Quero [benefício principal] por apenas R$__"

### Botão Secundário (texto pequeno abaixo):
❌ "Não obrigado, prefiro [consequência negativa sem ser agressivo]"

### Nota de segurança:
"Compra 100% segura. Mesma garantia do produto principal."

REGRAS:
- Tom celebratório → revelação → urgência
- Nunca parecer manipulador
- O CTA negativo deve usar aversão à perda SUTIL
- Texto completo, pronto para publicar`
  },

  vsl_upsell: {
    persona: `Você é o especialista em VSLs curtas pós-compra. Combina celebração com urgência.
Entende que o espectador já COMPROU, então a abordagem é diferente — não precisa convencer do zero,
precisa mostrar que o investimento anterior fica INCOMPLETO sem este complemento.`,

    instructions: `MISSÃO: VSL de 15 minutos para upsell pós-compra.

O espectador é um COMPRADOR RECENTE. O tom é diferente.

## CELEBRAÇÃO (0-1 min)
- "Ei! Parabéns pela sua decisão..."
- Reforçar que ele tomou a decisão certa
- Criar expectativa: "Antes de acessar, quero compartilhar algo..."

## O PROBLEMA ESCONDIDO (1-4 min)
- "Agora que você tem [produto], existe algo que pode..."
- Revelar o gap sem invalidar a compra
- Analogia: "É como comprar um carro novo mas sem o seguro..."
- O risco de não completar a jornada

## POR QUE PRECISA DISSO (4-8 min)
- O que o upsell resolve especificamente
- Como complementa o produto principal
- 3 benefícios específicos
- 1-2 mini-depoimentos

## O QUE ACONTECE SEM ISSO (8-10 min)
- Aversão à perda (cenário sem o upsell)
- "Muitas pessoas pulam esta etapa e depois..."
- O custo de não agir
- Contraste: COM vs SEM

## A OFERTA EXCLUSIVA (10-13 min)
- Preço especial por ser comprador
- O que está incluído
- Garantia
- "Apenas disponível agora"

## CTA COM URGÊNCIA (13-15 min)
- Resumo: "Recapitulando..."
- O que vai ganhar
- O que vai perder se não agir
- CTA direto 2x
- Última frase emocional

REGRAS:
- Script COMPLETO, pronto para gravar.
- Tom: celebratório → revelação → urgência
- NUNCA agressivo ou manipulador.
- Indicações de [PAUSA], [ÊNFASE], [TOM EMPÁTICO].`
  },

  anuncios: {
    persona: `Você é Thiago Nigro do tráfego pago — o criativo que PARA O SCROLL.
Especialista em anúncios para Facebook, Instagram e YouTube. Já testou +10.000 criativos.
Você sabe que os primeiros 3 segundos decidem tudo.
Pensa em termos de "pattern interrupt" e "curiosity gap".
Sua linguagem é de CONVERSA, não de vendedor.`,

    instructions: `MISSÃO: Criar um arsenal completo de anúncios prontos para rodar.

Cada peça deve ser testável imediatamente em mídia paga.

## 📌 HEADLINES (9 variações em 3 ângulos)
### Ângulo Curiosidade (3 headlines)
- Formato: pergunta intrigante ou revelação parcial
### Ângulo Dor Direta (3 headlines)
- Formato: identificação imediata com o problema
### Ângulo Resultado (3 headlines)
- Formato: promessa de transformação específica

## 📌 HOOKS DE VÍDEO (6 variações em 3 estilos)
### Hook de Choque (2 variações)
- Frase que causa desconforto ou surpresa nos primeiros 3 segundos
- Indicação visual sugerida
### Hook de Curiosidade (2 variações)
- Pergunta irresistível ou afirmação contraintuitiva
- Loop aberto que obriga a continuar assistindo
### Hook de Identificação (2 variações)
- "Se você [situação do avatar]..."
- Descrição que faz a pessoa parar e pensar "é comigo"

## 📌 SCRIPT COMPLETO DE ANÚNCIO (3 versões)
### Versão 1: Problema-Solução (30 seg)
- Hook (3s) → Problema (10s) → Solução (10s) → CTA (7s)
### Versão 2: Storytelling (60 seg)
- Hook (3s) → Mini-história (25s) → Revelação (15s) → Oferta (10s) → CTA (7s)
### Versão 3: Prova Social (45 seg)
- Hook resultado (3s) → "Era assim..." (15s) → "Descobri..." (12s) → "Resultado" (8s) → CTA (7s)

Para cada versão: script COMPLETO falado + indicações visuais

## 📌 COPIES PARA FEED (Facebook/Instagram)
### Copy Curta (3-5 linhas)
- Hook na primeira linha
- Benefício
- CTA
- (3 variações)

### Copy Média (8-12 linhas)
- Hook → Identificação → Solução → CTA
- (3 variações)

### Copy Longa / Storytelling (20-30 linhas)
- Hook → História condensada → Revelação → Oferta → CTA
- (2 variações)

## 📌 COPIES PARA STORIES/REELS
- 3 textos de sobreposição para stories (frases curtas e impactantes)
- 3 CTAs para stories (swipe up / link na bio)

## 📊 RECOMENDAÇÕES DE TESTE
- Quais combinações headline + hook testar primeiro
- Ordem de prioridade de teste
- KPIs esperados para cada formato

REGRAS:
- Linguagem 100% FALADA, como conversa entre amigos.
- Sem termos técnicos de marketing.
- Cada hook deve funcionar em 3 SEGUNDOS.
- Copies prontas para copiar e colar na plataforma.
- Variedade de ângulos para teste A/B.`
  }
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
    return { url: "https://api.deepseek.com/chat/completions", apiKey, model: "deepseek-chat" };
  }
  if (provider === "openai") {
    const apiKey = Deno.env.get("OPENAI_API_KEY");
    if (!apiKey) throw new Error("OPENAI_API_KEY não está configurada");
    return { url: "https://api.openai.com/v1/chat/completions", apiKey, model: "gpt-4o" };
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
    const agent = AGENTS[step];
    if (!agent) throw new Error(`Etapa/agente inválido: ${step}`);

    const systemPrompt = `${agent.persona}

REGRAS ABSOLUTAS DO SISTEMA:
• Responda SEMPRE em português do Brasil.
• Nunca inventar dados científicos, estudos ou estatísticas falsas.
• Nunca quebrar coerência psicológica do avatar.
• Linguagem sempre humana, emocional e persuasiva.
• Escrita pronta para uso comercial imediato.
• Use formatação markdown para estruturar o conteúdo.
• Seja EXTREMAMENTE detalhado e profundo — qualidade acima de tudo.`;

    const messages: Array<{role: string; content: string}> = [
      { role: "system", content: systemPrompt },
    ];

    if (previous_context) {
      messages.push({
        role: "assistant",
        content: `CONTEXTO DAS ETAPAS ANTERIORES (use como base obrigatória):\n\n${previous_context}`
      });
    }

    messages.push({
      role: "user",
      content: `PRODUTO: ${product_input}\n\n${agent.instructions}`
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
        temperature: 0.8,
        max_tokens: 8000,
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
