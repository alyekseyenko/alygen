# Guia da Página /automacao

## Visão Geral

A página `/automacao` é um sistema visual de criação e gestão de workflows de automação para o CRM. Utiliza a biblioteca **ReactFlow** para criar uma interface de drag-and-drop onde os utilizadores podem construir fluxos de automação conectando diferentes tipos de nodes.

## Estrutura da Página

### Componentes Principais

#### 1. Automation.jsx (`frontend/src/pages/Automation.jsx`)
Página principal que gere dois estados:
- **Lista de automações** (AutomationList)
- **Canvas de edição** (AutomationCanvas)

**Funcionalidades:**
- Carregar automações do backend via API
- Criar novos workflows
- Ativar/desativar automações
- Eliminar automações
- Ver logs de execução

---

#### 2. AutomationList.jsx (`frontend/src/components/automation/AutomationList.jsx`)
Componente que lista todas as automações existentes.

**Características:**
- Grid de cards com automações
- Indicadores de estado (ACTIVE/PAUSED)
- Contador de nodes e edges
- Botões para configurar, ativar/desativar, eliminar
- Sistema de templates pré-definidos

**Templates Disponíveis:**
- Lead Quente (dispara quando lead abre email 2x)
- Sem Pixel = Oportunidade (detecta leads sem pixel)
- Sem Site = Proposta Imediata
- Score Crítico (marca prioridade crítica)
- Follow-up Automático Diário
- Calendly Premium Flow

---

#### 3. AutomationCanvas.jsx (`frontend/src/components/automation/AutomationCanvas.jsx`)
Canvas visual onde os workflows são criados e editados.

**Tecnologia:**
- ReactFlow (@xyflow/react)
- ReactFlowProvider para gestão de estado

**Funcionalidades:**
- Drag & drop de nodes da sidebar
- Conexão visual entre nodes (edges)
- Edição de configurações de cada node
- Teste de workflows (dry run)
- Save de workflows
- Ativação/desativação de workflows

**Estrutura de Dados:**
```javascript
{
  nodes: [
    {
      id: 'node_v2_1_timestamp',
      type: 'trigger|action|condition',
      position: { x: 250, y: 100 },
      data: {
        label: 'Nome do Node',
        description: 'Descrição',
        iconName: 'Zap',
        color: 'accent',
        actionType: 'send_email',
        backendType: 'wait',
        config: { /* configurações específicas */ }
      }
    }
  ],
  edges: [
    {
      id: 'edge_1_source_target',
      source: 'node_id_1',
      target: 'node_id_2',
      sourceHandle: 'true|false', // para condições
      animated: true,
      style: { stroke: '#FF4F00', strokeWidth: 2 }
    }
  ]
}
```

---

#### 4. Sidebar.jsx (`frontend/src/components/automation/Sidebar.jsx`)
Barra lateral com nodes disponíveis para drag & drop.

**Categorias de Nodes:**

##### Triggers (Gatilhos)
- **Lead Analyzed** - Inicia workflow quando lead é processado
- **Calendly Booking** - Inicia workflow em novo agendamento
- **Schedule** - Inicia em horário específico

##### Actions (Ações)
- **Send Email** - Envia email automático
- **Send WhatsApp** - Envia mensagem WhatsApp
- **Google Sheets** - Adiciona linha a spreadsheet
- **Notify Admin** - Envia email para admin
- **Telegram Approval** - Aprovação humana via Telegram
- **Agenda Reminder** - Agenda lembrete
- **AI Personalizer** - Gera pitch de vendas com IA
- **Update Lead** - Atualiza campo do CRM
- **Webhook** - Envia dados para URL externa
- **Wait (Delay)** - Pausa workflow (segundos)
- **Autopilot (Próximo)** - Trigger sequence para próximo lead

##### Strategic Logic (Python)
- **Urgency: Critical** - Se site mostra abandono
- **Market Gap Awareness** - Se score abaixo da média da cidade
- **Tone: Premium** - Branch para marcas de luxo

##### General Logic
- **Condition** - If/Else branching (ex: Has Website)

---

#### 5. Nodes (Tipos de Componentes)

##### TriggerNode.jsx
- **Cor:** Laranja
- **Handle:** 1 source (bottom)
- **Função:** Ponto de entrada do workflow

##### ActionNode.jsx
- **Cores:** Azul, Verde, Roxo, Vermelho, Laranja
- **Handles:** 1 target (top), 1 source (bottom)
- **Função:** Executa uma ação específica

##### ConditionNode.jsx
- **Cor:** Amarelo
- **Handles:** 1 target (top), 2 sources (bottom: true/false)
- **Função:** Bifurcação condicional (if/else)

---

## Backend

### 1. automation-engine.js (`backend/services/automation-engine.js`)
Motor de execução de workflows.

**Função Principal:** `executeWorkflow(automation, lead, analysis, options)`

**Processo de Execução:**
1. Verifica imunidade do lead
2. Aplica debounce (evita execuções duplicadas)
3. Encontra o node trigger
4. Executa sequência recursivamente (suporta bifurcação paralela)
5. Processa cada node baseado no tipo
6. Regista logs de execução
7. Notifica Telegram em caso de sucesso

**Tipos de Nodes Processados:**

- **trigger:** Continua para o próximo node
- **condition:** Avalia condição e retorna branch (true/false)
- **action:** Executa ação via `actions-core.js`
- **wait:** Persiste estado em Supabase e agenda retoma

**Função de Retoma:** `resumeWorkflow(stateId)`
- Retoma workflow que estava em pausa (checkpoint)
- Continua a partir do nó onde parou

**Função Principal:** `runAutomationsForLead(lead, analysis)`
- Chamada após cada análise
- Busca automações ativas
- Enriquece lead com histórico de contacto
- Executa workflows para o lead

**Função Temporizada:** `runTimedAutomations()`
- Executa automações agendadas
- Processa leads recentes

---

### 2. actions-core.js (`backend/services/automation/actions-core.js`)
Contém a lógica de execução de cada tipo de ação.

**Ações Disponíveis:**
- send_email
- whatsapp
- google_sheets
- notify_admin
- telegram_approval
- meeting_reminder
- ai_personalizer
- update_lead
- webhook
- trigger_next_lead

---

### 3. automations.controller.js (`backend/controllers/automations.controller.js`)
Controlador da API.

**Endpoints:**
- `GET /automations` - Lista automações
- `POST /automations` - Cria/atualiza automação
- `DELETE /automations/:id` - Elimina automação
- `GET /automations/:id/logs` - Lista logs de execução
- `POST /automations/test` - Testa workflow (dry run)

**Função de Teste:** `testAutomation(req, res)`
- Usa análise mais recente como teste
- Executa workflow em modo dry run
- Captura logs e retorna resultado

---

### 4. automations.routes.js (`backend/routes/automations.routes.js`)
Rotas da API de automações.

```javascript
GET /automations
POST /automations
DELETE /automations/:id
GET /automations/:id/logs
POST /automations/test
```

---

## Fluxo de Dados

### Criação de Workflow
1. Utilizador arrasta nodes da sidebar para o canvas
2. Conecta nodes visualmente (edges)
3. Configura cada node (SettingsPanel)
4. Clica em "Save"
5. Frontend converte dados para formato backend
6. Envia para API via POST /automations
7. Backend guarda em Supabase (tabela `automations`)

### Execução de Workflow
1. Lead é analisado
2. Backend chama `runAutomationsForLead(lead, analysis)`
3. Busca automações ativas
4. Para cada automação:
   - Chama `executeWorkflow(automation, lead, analysis)`
   - Encontra trigger node
   - Executa nodes sequencialmente
   - Processa condições (bifurcação)
   - Executa ações (email, WhatsApp, etc.)
   - Regista logs
5. Notifica Telegram em caso de sucesso

### Teste de Workflow
1. Utilizador clica em "Test Workflow"
2. Frontend envia workflow para POST /automations/test
3. Backend usa análise mais recente
4. Executa em modo dry run (não envia emails reais)
5. Captura logs
6. Retorna resultado para frontend
7. Frontend mostra alert com logs

---

## Ligações (Edges)

### Estrutura
```javascript
{
  id: 'edge_1_source_target',
  source: 'node_id_1',
  target: 'node_id_2',
  sourceHandle: 'true|false', // opcional, para condições
  animated: true,
  style: { stroke: '#FF4F00', strokeWidth: 2 }
}
```

### Tipos de Conexão
- **Simples:** Node → Node (trigger → action)
- **Condicional:** Condition → Node (branch true/false)
- **Paralela:** Node → Múltiplos nodes

### Lógica de Execução
```javascript
// Encontra próximos nodes baseados nos edges
const nextEdges = workflow.edges?.filter(
  e => e.from === node.id && 
  (e.condition === undefined || e.condition === result.branch)
) || []

const nextNodes = nextEdges.map(edge => 
  nodes.find(n => n.id === edge.to)
).filter(Boolean)

// Executa em paralelo se múltiplos caminhos
if (nextNodes.length > 0) {
  await Promise.all(nextNodes.map(nextNode => runPath(nextNode)))
}
```

---

## Configuração de Nodes

### SettingsPanel
Painel lateral que aparece quando um node é selecionado.

**Funcionalidades:**
- Editar label e descrição
- Configurar parâmetros específicos (config)
- Duplicar node
- Eliminar node

**Exemplo de Configuração:**
```javascript
{
  actionType: 'send_email',
  config: {
    template: 'pixel',
    subject: 'Proposta Personalizada',
    body: 'Olá {{lead.name}}...'
  }
}
```

---

## Persistência de Estado (Checkpoints)

### automation_states (Supabase)
Tabela que guarda estados de workflows em pausa.

**Estrutura:**
```javascript
{
  automation_id: UUID,
  lead_id: UUID,
  current_node_id: String,
  context: { lead, analysis, variables },
  resume_at: ISODate,
  status: 'pending|processing|completed|error'
}
```

**Funcionamento:**
1. Node "wait" é executado
2. Calcula tempo de retoma
3. Guarda estado em Supabase
4. Workflow para
5. Worker verifica estados pendentes
6. Quando `resume_at` é atingido, chama `resumeWorkflow(stateId)`
7. Workflow continua a partir do node onde parou

---

## Logs de Execução

### automation_logs (Supabase)
Tabela que regista execuções de automações.

**Estrutura:**
```javascript
{
  automation_id: UUID,
  lead_id: UUID,
  status: 'success|failed|pending_approval',
  details: {
    reason: String,
    steps: [
      {
        id: String,
        type: String,
        label: String,
        status: String,
        branch: String,
        message: String
      }
    ],
    leadName: String,
    leadWebsite: String
  },
  executed_at: Timestamp
}
```

---

## Variáveis de Template

### Variáveis Disponíveis
- `{{lead.id}}` - ID do lead
- `{{lead.name}}` - Nome do lead
- `{{lead.website}}` - Website do lead
- `{{lead.phone}}` - Telefone
- `{{lead.email}}` - Email
- `{{analysis.id}}` - ID da análise
- `{{analysis.qScore}}` - Score Q
- `{{analysis.reportUrl}}` - URL do relatório
- `{{analysis.performanceMobile}}` - Performance mobile
- `{{analysis.seo.score}}` - Score SEO
- `{{analysis.category}}` - Categoria
- `{{analysis.priority}}` - Prioridade
- `{{ai_pitch}}` - Pitch gerado por IA
- `{{flow.indicators}}` - Indicadores de sucesso

---

## Anti-Duplicate System

### Histórico de Contacto
O sistema enriquece o lead com flags antes de executar automações:

```javascript
lead.alreadyWhatsApped = log.some(c => c.type === 'whatsapp')
lead.alreadyEmailed = log.some(c => c.type === 'email')
lead.openedEmail = seqResult.data.some(s => (s.open_count || 0) > 0)
lead.hasEmail = !!(lead.email || analysis?.extractedEmails?.[0])
lead.hasPhone = !!(lead.phone || analysis?.extractedPhones?.[0])
```

### Debounce
Sistema de cooldown para evitar execuções duplicadas:
- 10 segundos de bloqueio para mesma lead/automação
- 5 segundos de bloqueio para mesmo node na mesma execução

---

## Imunidade

### is_immune Flag
Se a análise tiver `is_immune: true`, a automação é cancelada:
```javascript
if (analysis?.is_immune && !isDryRun) {
  console.log('🛡️ [IMUNIDADE] Automação cancelada')
  return
}
```

---

## Notificações

### Telegram
Após conclusão bem-sucedida, o sistema envia notificação para Telegram:
```javascript
✅ *Circuito Concluído: {automation.name}*
👤 *Lead:* {lead.name}
📊 *Status:* Sucesso
🔗 [Abrir CRM](http://localhost:4000/?lead={website})
```

---

## Resumo da Arquitetura

```
Frontend (React)
├── Automation.jsx (Página principal)
├── AutomationList.jsx (Lista de automações)
├── AutomationCanvas.jsx (Canvas visual)
│   ├── Sidebar.jsx (Nodes disponíveis)
│   ├── SettingsPanel.jsx (Configuração)
│   └── Nodes/
│       ├── TriggerNode.jsx
│       ├── ActionNode.jsx
│       └── ConditionNode.jsx
└── LogsModal.jsx (Visualização de logs)

Backend (Node.js)
├── automation-engine.js (Motor de execução)
├── automation/
│   ├── actions-core.js (Lógica de ações)
│   └── action-handlers.js (Handlers específicos)
├── automations.controller.js (Controlador API)
└── automations.routes.js (Rotas API)

Database (Supabase)
├── automations (Workflows)
├── automation_logs (Logs de execução)
└── automation_states (Estados em pausa)
```

---

## Exemplo de Workflow Completo

```
[Trigger: Lead Analyzed]
    │
    ▼
[Condition: hasWebsite === true]
    │
    ├─ true ──► [Action: Send Email (template: pixel)]
    │              │
    │              ▼
    │         [Action: Wait (3 dias)]
    │              │
    │              ▼
    │         [Action: Send WhatsApp]
    │
    └─ false ──► [Action: Send Email (template: nowebsite)]
                   │
                   ▼
              [Action: Wait (4 dias)]
```

---

## Conclusão

A página `/automacao` é um sistema poderoso e flexível que permite criar workflows complexos de automação sem código. A combinação de ReactFlow para a interface visual e um motor de execução robusto no backend permite criar automações sofisticadas para o CRM, desde simples envios de email até fluxos condicionais complexos com aprovação humana.
