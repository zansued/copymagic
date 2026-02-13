

## Novo Agente: Otimizacao de LinkedIn

Adicionar o agente "Otimizacao de LinkedIn" na categoria **Branding & Posicionamento**, seguindo o padrao existente de configuracao.

### Registro do Agente

Arquivo: `src/lib/agents.ts`

- **ID:** `linkedin-optimizer`
- **Nome:** Otimizacao de LinkedIn
- **Emoji:** 💼
- **Categoria:** `branding`
- **Role:** Especialista em Perfis Profissionais de LinkedIn
- **Descricao:** Reescreve seu perfil do LinkedIn para gerar autoridade e atrair oportunidades, com diagnostico completo, 3 opcoes de headline e secoes otimizadas.

### Configuracao do Workspace

Arquivo: `src/lib/agent-workspace-configs.ts`

**Inputs:**

1. **`linkedin_goal`** (select, required) - Objetivo no LinkedIn
   - Gerar negocios e clientes
   - Atrair recrutadores e oportunidades
   - Fortalecer marca pessoal
   - Networking estrategico

2. **`strategic_profile`** (select, required) - Perfil Estrategico
   - Fortalecimento de Marca Pessoal
   - Busca por Novas Oportunidades
   - Transicao de Carreira
   - Posicionamento como Autoridade

3. **`current_role`** (input, required) - Cargo Atual ou Desejado

4. **`content`** (textarea, required) - Conteudo Atual do Perfil (Sobre, Experiencia, Formacao, etc.)

5. **`reference_url`** (input, opcional) - URL de referencia

6. **`extra`** (textarea, opcional) - Instrucoes Gerais

**Logica do Prompt (`buildPrompt`):**

O system prompt instruira o agente a:

1. **Diagnostico do Perfil Atual** - Analise critica das secoes fornecidas, identificando pontos fortes e gaps
2. **3 Opcoes de Headline** - Combinando cargo, objetivo e perfil estrategico selecionados, com justificativa
3. **Secao "Sobre" Reescrita** - Narrativa profissional otimizada com gancho, trajetoria, resultados e CTA
4. **Experiencias Reescritas** - Foco em resultados mensuráveis e verbos de acao, otimizadas para o cargo informado
5. **Formacao e Certificacoes** - Reorganizacao estrategica
6. **Recomendacoes Extras** - Dicas de foto, banner, URL personalizada e skills

O prompt integrara o `brandContext` (DNA) quando disponivel e o conteudo raspado de `reference_url`.

### Secao Tecnica

- Nenhuma migracao de banco de dados necessaria
- Nenhuma nova dependencia
- Reutiliza a edge function `agent-generate` existente
- Segue o padrao identico dos agentes ja implementados (mesmo fluxo de `AgentWorkspace.tsx`)

