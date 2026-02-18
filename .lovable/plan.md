
# Catalogo de Padroes por Secao - Componentes 21dev

## Objetivo

Adicionar um **catalogo de referencia visual** ao `EDIT_SECTION_PROMPT` (e parcialmente ao `HTML_SYSTEM_PROMPT`) com padroes HTML/Tailwind extraidos dos componentes 21dev fornecidos. Isso permite que o agente de edicao tenha exemplos concretos de como construir cada tipo de secao com qualidade premium.

## Componentes Recebidos e Mapeamento

| Componente 21dev | Secao no Landing Builder | Uso |
|---|---|---|
| AnimatedTestimonials | `social-proof` | Carrossel de depoimentos com foto, nome, cargo e animacao de rotacao 3D |
| FeaturesSectionWithHoverEffects | `features` / `solution` | Grid 4x2 com hover effects, bordas condicionais e gradientes |
| GlowingEffect | Todas as secoes (cards) | Efeito de brilho reativo ao cursor com conic-gradient |
| LinkPreview | `hero` / `final-cta` | Links com preview de imagem on hover |
| TypewriterEffect | `hero` | Headlines com efeito de digitacao animada |

## Plano de Implementacao

### 1. Criar bloco COMPONENT_CATALOG no EDIT_SECTION_PROMPT

Adicionar uma nova secao apos "BOLT-LEVEL PREMIUM PATTERNS" (linha ~494) com snippets HTML/Tailwind puros (adaptados de React para HTML estatico) organizados por tipo de secao:

**A) social-proof - Animated Testimonials Pattern**
- Layout com imagem a esquerda (stack rotacionado com perspectiva CSS) e texto a direita
- Navegacao com setas prev/next
- Animacao de entrada por palavra no depoimento (CSS stagger)
- Avatar com rotate3d e sombra

**B) features - Hover Grid Pattern**
- Grid de 4 colunas com bordas compartilhadas (border-right + border-bottom condicionais)
- Hover com gradiente radial: `hover:bg-[radial-gradient(var(--mask-size)_circle_at_var(--mouse-x)_var(--mouse-y),...]`
- Icones no topo + titulo + descricao com hierarquia clara
- Gradientes separados para linhas superiores vs inferiores

**C) Qualquer card - Glowing Border Pattern**
- Borda com `conic-gradient` reativa ao cursor via CSS custom properties (`--start`, `--active`)
- Fallback para glow estatico quando cursor fora de alcance
- Versao simplificada via CSS puro (sem JS reativo) para HTML estatico

**D) hero - Typewriter Headlines**
- CSS keyframes para efeito typewriter com cursor piscante
- `animation: typing Xs steps(N), blink 0.75s step-end infinite`
- `overflow: hidden; white-space: nowrap; border-right: 3px solid`

### 2. Adaptar snippets de React para HTML puro

Os componentes usam React/Next.js (useState, framer-motion, Image). No catalogo, serao convertidos para:
- HTML semantico com classes Tailwind
- CSS keyframes injetados no `<style>` para animacoes (typewriter, glow, stagger)
- JS vanilla minimo no final do body (para interatividade como carrossel de testimonials e glow tracking)

### 3. Atualizar HTML_SYSTEM_PROMPT

Adicionar mencoes aos novos padroes nas secoes relevantes do prompt principal:
- Na secao de social-proof: referenciar o padrao AnimatedTestimonials
- Na secao de features: referenciar o padrao HoverGrid
- No hero: referenciar o padrao TypewriterHeadline

### 4. Atualizar postProcessHtml()

Adicionar keyframes CSS adicionais no head quando detectar patterns relevantes:
- `@keyframes typing` para typewriter
- CSS vars para glowing effect (`--start`, `--active`, `--spread`)

---

## Detalhes Tecnicos

**Arquivo modificado:** `supabase/functions/generate-site/index.ts`

**Locais de edicao:**
- `EDIT_SECTION_PROMPT` (linhas 487-510): Expandir "BOLT-LEVEL PREMIUM PATTERNS" com o catalogo completo de snippets
- `HTML_SYSTEM_PROMPT` (linhas ~340-383): Adicionar referencias aos novos padroes nas secoes de social-proof, features e hero
- `postProcessHtml()`: Adicionar keyframes de typewriter e glowing vars

**Deploy:** Edge function `generate-site` sera redeployada automaticamente.

## Resultado Esperado

Ao editar uma secao (ex: clicar em "social-proof" e pedir "melhore"), o agente tera snippets concretos de referencia para gerar:
- Testimonials com layout foto+texto animado em vez de cards simples
- Features com grid hover-gradient em vez de cards genericos
- Heroes com headline typewriter em vez de texto estatico
- Cards com bordas glowing em vez de sombras comuns
