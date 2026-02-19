

# Agente WhatsApp Copy

Novo agente especializado em criar sequencias de mensagens para WhatsApp, cobrindo broadcast, atendimento, follow-up e recuperacao de vendas.

## O que sera criado

Dois arquivos serao editados para adicionar o agente completo:

### 1. Registro do agente (`src/lib/agents.ts`)

Adicionar entrada na categoria **copywriting** com:
- **ID**: `whatsapp-copy`
- **Nome**: WhatsApp Copy
- **Emoji**: 📲 (ou similar, diferenciando do Story Launch)
- **Role**: Especialista em Sequencias de WhatsApp
- **Descricao**: Cria sequencias de mensagens para WhatsApp — broadcast, atendimento, follow-up e recuperacao de vendas — com tom conversacional e gatilhos de resposta.

### 2. Configuracao do workspace (`src/lib/agent-workspace-configs.ts`)

Adicionar configuracao `whatsapp-copy` seguindo o padrao existente com:

**Inputs**:
| Campo | Tipo | Obrigatorio |
|-------|------|-------------|
| Produto/Oferta (descricao do produto, transformacao, preco) | textarea | Sim |
| Tipo de Sequencia (Broadcast promocional, Follow-up pos-lead, Recuperacao de vendas, Atendimento/Suporte, Lancamento) | select | Nao |
| Numero de Mensagens (3, 5, 7, 10) | select | Nao |
| Tom (Casual/amigo, Profissional, Urgente, Consultivo) | select | Nao |
| Instrucoes Extras | textarea | Nao |

**Prompt (`buildPrompt`)**:

O system prompt definira a persona como um Estrategista de Conversao por WhatsApp com as seguintes regras:

- Mensagens curtas (maximo 3 paragrafos por mensagem), escaneáveis e naturais
- Emojis estrategicos (sem exagero)
- Cada mensagem com objetivo claro (abrir conversa, gerar resposta, criar urgencia, fechar)
- Incluir gatilhos de resposta (perguntas, enquetes informais, opcoes "responde 1 ou 2")
- Indicacoes de timing entre mensagens (ex: "enviar 2h depois", "dia seguinte as 9h")
- Estrutura por mensagem: numero, timing, texto completo, objetivo da mensagem e gatilho de resposta
- Adaptar tom conforme selecao (casual, profissional, urgente, consultivo)
- Templates por tipo: broadcast (promocao com escassez), follow-up (nutricao pos-lead), recuperacao (reativacao de interesse), atendimento (scripts de resposta), lancamento (sequencia de aquecimento)

## Detalhes tecnicos

Nenhuma alteracao de backend e necessaria. O agente usa a mesma edge function `agent-generate` que todos os outros agentes ja utilizam.

Arquivos modificados:
- `src/lib/agents.ts` — adicionar 1 objeto `AgentDef` na secao copywriting
- `src/lib/agent-workspace-configs.ts` — adicionar 1 bloco `AgentWorkspaceConfig` com inputs e `buildPrompt`

