
# Plano do Projeto — CopyEngine Pro

## ✅ Sprints de Colaboração (Concluídas)

### Sprint 1 — Gestão de Equipe ✅
- Tabelas `teams`, `team_members`, `team_invites` com RLS
- Hook `useTeam` com CRUD completo
- Página `/team` para owners/admins gerenciarem membros
- Convites por e-mail com papéis (owner, admin, editor, viewer)

### Sprint 2 — Biblioteca Compartilhada ✅
- Tabela `shared_library` com categorias e tags
- Hook `useSharedLibrary` com busca e filtros
- Página `/library` para repositório centralizado de copies
- Permissões: leitura para todos, edição/exclusão para criador ou admin

### Sprint 3 — Fluxo de Revisão e Aprovação ✅
- Tabelas `review_requests` e `review_comments`
- Fluxo pending → approved/rejected com timestamps
- Página `/reviews` com visualização Markdown e comentários
- Aprovação restrita a owners/admins

### Sprint 4 — Dashboard de Métricas ✅
- Função `get_team_member_stats` (SECURITY DEFINER)
- Página `/team-dashboard` com cards de resumo e tabela por membro
- Métricas: gerações, revisões, itens na biblioteca, última atividade
- Acesso restrito a owners/admins

---

## 🔜 Próximos Passos

### 1. Botão "Enviar para Revisão" no AgentWorkspace
- Adicionar ação pós-geração para enviar output diretamente ao fluxo de aprovação
- Preencher automaticamente título, conteúdo e agent_name

### 2. Botão "Salvar na Biblioteca" no AgentWorkspace
- Permitir salvar outputs aprovados ou gerados diretamente na shared_library
- Pré-preencher categoria e tags com base no agente usado

### 3. Agente WhatsApp Copy
- Novo agente especializado em sequências de mensagens para WhatsApp
- Registro em `agents.ts` e configuração em `agent-workspace-configs.ts`
- Tipos: broadcast, follow-up, recuperação de vendas, atendimento, lançamento
- Sem alteração de backend (usa `agent-generate` existente)

### 4. Notificações in-app
- Avisar membros quando uma revisão for aprovada/rejeitada
- Notificar admins sobre novas solicitações de revisão

### 5. Onboarding de Time
- Fluxo guiado para owners criarem seu primeiro time
- Aceite automático de convites ao fazer login com e-mail convidado
