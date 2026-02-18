

# Importar Padroes do Bolt.diy para Refinar o Landing Builder

## Contexto

Analisei o projeto gerado pelo seu Bolt.diy e o comparei com o sistema atual de geracao do `generate-site`. O Bolt produziu um projeto **React + Tailwind componentizado** (Navbar, Hero, ProblemSection, OpportunitySection, etc.), enquanto nosso sistema gera **HTML monolitico** com Tailwind via CDN.

## Diagnostico

Apos analisar os dois, identifiquei os principais padroes do Bolt que nosso prompt **nao cobre** e que melhorariam a qualidade:

| Padrao Bolt.diy | Nosso sistema atual |
|---|---|
| Gradientes em botoes (from-purple-600 to-blue-500) | Cor solida via CSS var |
| Blob animations com keyframes + delay classes | Floating orbs generico no prompt |
| Trust bar com numeros animados inline | Mencionado mas sem estrutura detalhada |
| Cards com bgColor por categoria (bg-purple-50, bg-blue-50) | Todos cards com mesmo bg-card |
| Grid "For who / Not for who" com icones coloridos | Existe no PageSpec mas sem orientacao visual |
| Pricing com toggle mensal/anual + bonus com timer | Pricing basico com anchoring |
| Navbar fixa com backdrop-blur + mobile drawer | Nao mencionado no prompt |
| Gradiente text-transparent em headings estrategicos | Nao orientado no prompt |

## Plano de Implementacao

### 1. Enriquecer o HTML_SYSTEM_PROMPT com padroes extraidos do Bolt

Adicionar novas secoes ao prompt existente em `supabase/functions/generate-site/index.ts`:

**A) NAVBAR (nova secao obrigatoria)**
- Navbar fixa com `bg-white/95 backdrop-blur-md`, logo com icone + nome, navegacao desktop com anchors, botao CTA gradient, menu hamburger mobile com drawer animado

**B) GRADIENT TEXT** 
- Adicionar instrucao para usar `bg-gradient-to-r bg-clip-text text-transparent` em headlines estrategicas (hero, titulos de secao)

**C) BLOB ANIMATIONS**
- Adicionar keyframes blob e classes `animation-delay-2000` / `animation-delay-4000` com bolhas decorativas no hero (como o Bolt fez)

**D) CARDS COM COR CATEGORIZADA**
- Instruir que cards de features/problemas usem cores distintas por categoria (bg-purple-50, bg-blue-50, bg-green-50, bg-orange-50) em vez de cor unica

**E) TRUST BAR NUMERICA**
- Adicionar padrao de trust strip com numeros grandes + label (ex: "100.000+\nConteudos Gerados")

**F) PRICING COM TOGGLE + BONUS**
- Instruir pricing com switch mensal/anual, tag "Popular", lista de features com check/x, bonus section com timer de urgencia

**G) FOR WHO / NOT FOR WHO**
- Cards lado a lado com icone verde (CheckCircle) vs vermelho (XCircle), com gradient backgrounds distintos (green-50 vs red-50)

### 2. Atualizar o EDIT_SECTION_PROMPT

Adicionar os mesmos padroes visuais como referencia ao prompt de edicao de secoes, para manter consistencia quando o usuario edita partes da pagina.

### 3. Atualizar o postProcessHtml()

Injetar os keyframes de blob animation e delay classes quando nao presentes, similar ao que ja faz com IntersectionObserver.

---

### Detalhes Tecnicos

**Arquivo modificado:** `supabase/functions/generate-site/index.ts`

**Secoes do prompt a expandir:**
- `HTML_SYSTEM_PROMPT` (linhas 14-369): Adicionar ~80 linhas com os novos padroes
- `EDIT_SECTION_PROMPT` (linhas 371-448): Adicionar ~20 linhas de referencia
- `postProcessHtml()` (linhas 885-939): Adicionar blob keyframes

**Nenhuma mudanca no frontend** -- as melhorias sao todas no prompt de geracao.

**Deploy:** Edge function `generate-site` sera redeployada automaticamente.

### Resultado Esperado

As proximas geracoes de landing pages terao:
- Visual mais rico com gradientes e cores categorizadas
- Navbar profissional fixa
- Animacoes decorativas (blobs, delays)
- Pricing mais completo com toggle e bonus
- Secoes "para quem e / para quem nao e" visualmente distintas
- Qualidade visual mais proxima do que o Bolt.diy produz

