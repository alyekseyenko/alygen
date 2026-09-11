# 🎨 Guia Visual do Projeto

## Interface do Dashboard

### 1. Tela Principal - Lista de Leads

```
┌─────────────────────────────────────────────────────────────────────┐
│  CRM Deals Manager                                                  │
│  Sistema de Análise Inteligente de Leads                           │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  [Todos] [Sem Pixel] [Performance Baixa] [Alta Prioridade]        │
│                                                                     │
├─────────────────────────────────────────────────────────────────────┤
│ Cliente    │ Site              │ Perf │ Pixel │ CTA │ Prior │ Ações│
├────────────┼───────────────────┼──────┼───────┼─────┼───────┼──────┤
│ Empresa A  │ empresa-a.com     │  45  │  ❌   │ ❌  │  🚀   │[Ver] │
│ Empresa B  │ empresa-b.com     │  78  │  ✅   │ ✅  │  ✓    │[Ver] │
│ Empresa C  │ empresa-c.com     │  -   │   -   │  -  │   -   │[Anl] │
└─────────────────────────────────────────────────────────────────────┘
```

**Cores:**
- Performance < 50: 🔴 Vermelho
- Performance 50-70: 🟡 Amarelo
- Performance > 70: 🟢 Verde
- Prioridade ALTA: 🚀 Foguete vermelho
- Prioridade MÉDIA: ⚠️ Alerta amarelo
- Prioridade BAIXA: ✓ Check verde

---

### 2. Drawer de Relatório (Painel Lateral)

```
┌─────────────────────────────────────────────────────────────────┐
│  Empresa ABC                                    [X]             │
│  https://empresa-abc.com                                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  📊 Performance                                                 │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │  Desktop: 45  (🔴 Crítico)                              │  │
│  │  Mobile:  38  (🔴 Crítico)                              │  │
│  └─────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ⚡ Pixels de Conversão                                        │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │  Meta Pixel (Facebook):  ❌ Não encontrado              │  │
│  │  Google Analytics 4:     ❌ Não encontrado              │  │
│  └─────────────────────────────────────────────────────────┘  │
│                                                                 │
│  🎯 Call-to-Action                                             │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │  ❌ CTAs pouco claros ou ausentes                       │  │
│  └─────────────────────────────────────────────────────────┘  │
│                                                                 │
│  🚨 Prioridade: ALTA                                           │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │  Este lead tem múltiplas oportunidades de melhoria.     │  │
│  │  Contato imediato recomendado.                          │  │
│  └─────────────────────────────────────────────────────────┘  │
│                                                                 │
│  📧 Email Personalizado                          [📋 Copiar]   │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │  Olá Empresa ABC,                                        │  │
│  │                                                           │  │
│  │  Realizei uma análise técnica do site...                │  │
│  │  📊 Performance: 45/100 (Crítico)                        │  │
│  │  🎯 Pixel: Não detectado                                 │  │
│  │  💡 CTA: Pouco claros                                    │  │
│  │                                                           │  │
│  │  Posso ajudar a otimizar...                             │  │
│  └─────────────────────────────────────────────────────────┘  │
│                                                                 │
│  [📧 Enviar Email]                                             │
└─────────────────────────────────────────────────────────────────┘
```

---

## Fluxo de Uso

### Passo 1: Carregar Leads
```
[Google Sheets] → [Backend] → [Frontend]
     ↓
  Exibe tabela com leads pendentes
```

### Passo 2: Analisar Lead
```
[Clique "Analisar"] → [Backend processa]
                           ↓
                    ┌──────┴──────┐
                    │             │
              [PageSpeed]   [Puppeteer]   [OpenAI]
                    │             │
                    └──────┬──────┘
                           ↓
                    [Resultado na UI]
```

### Passo 3: Ver Relatório
```
[Clique "Ver Relatório"] → [Drawer abre]
                                ↓
                         [Exibe análise completa]
                                ↓
                         [Template de email gerado]
```

### Passo 4: Enviar Email
```
[Clique "Enviar Email"] → [Backend]
                              ↓
                        [n8n ou Nodemailer]
                              ↓
                        [Email enviado ✅]
```

---

## Paleta de Cores (Dark Mode)

```css
Background:     #020617  (slate-950)
Cards:          #0f172a  (slate-900)
Borders:        #1e293b  (slate-800)
Text Primary:   #f1f5f9  (slate-100)
Text Secondary: #94a3b8  (slate-400)

Accent Blue:    #3b82f6  (blue-600)
Accent Purple:  #a855f7  (purple-600)
Accent Green:   #22c55e  (green-600)
Accent Red:     #ef4444  (red-600)
Accent Yellow:  #eab308  (yellow-600)
```

---

## Ícones (Lucide React)

| Ícone | Uso |
|-------|-----|
| 🚀 Rocket | Prioridade ALTA |
| ⚠️ AlertTriangle | Prioridade MÉDIA |
| ✓ Check | Prioridade BAIXA |
| 📊 TrendingDown | Performance |
| ⚡ Zap | Pixels |
| 🎯 Target | CTAs |
| 📧 Mail | Email |
| 📋 Copy | Copiar |
| ❌ X | Fechar |
| ⏳ Loader2 | Loading |

---

## Animações

### Loading State
```
[Analisando...]
  ⏳ (rotação infinita)
```

### Hover Effects
```css
button:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 20px rgba(0,0,0,0.2);
}
```

### Drawer Slide-in
```css
@keyframes slideIn {
  from { transform: translateX(100%); }
  to { transform: translateX(0); }
}
```

---

## Responsividade

### Desktop (> 1024px)
- Tabela completa
- Drawer lateral (50% da tela)

### Tablet (768px - 1024px)
- Tabela com scroll horizontal
- Drawer lateral (70% da tela)

### Mobile (< 768px)
- Cards ao invés de tabela
- Drawer fullscreen

---

## Estados da UI

### 1. Loading
```
┌─────────────────────────┐
│                         │
│         ⏳              │
│    Carregando...        │
│                         │
└─────────────────────────┘
```

### 2. Empty State
```
┌─────────────────────────┐
│                         │
│         📭              │
│  Nenhum lead encontrado │
│                         │
└─────────────────────────┘
```

### 3. Error State
```
┌─────────────────────────┐
│                         │
│         ❌              │
│  Erro ao carregar dados │
│    [Tentar novamente]   │
│                         │
└─────────────────────────┘
```

### 4. Success State
```
┌─────────────────────────┐
│                         │
│         ✅              │
│  Email enviado!         │
│                         │
└─────────────────────────┘
```

---

## Tipografia

```css
Heading 1: 36px, Bold, Gradient (Blue → Purple)
Heading 2: 24px, Bold
Heading 3: 20px, Semibold
Body:      16px, Regular
Small:     14px, Regular
Tiny:      12px, Regular

Font Family: System UI (Inter, SF Pro, Segoe UI)
```

---

## Componentes Reutilizáveis

### Button
```jsx
<button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg">
  Analisar
</button>
```

### Badge
```jsx
<span className="px-2 py-1 bg-red-900/20 text-red-400 rounded-full text-xs">
  ALTA
</span>
```

### Card
```jsx
<div className="bg-slate-900 p-6 rounded-xl border border-slate-800">
  Conteúdo
</div>
```

---

## Demonstração para Recrutadores

### Script de Apresentação

1. **Abertura (10s)**
   - "Este é o CRM Deals Manager, uma solução de Sales Intelligence."

2. **Mostrar Dashboard (20s)**
   - "Aqui vemos todos os leads importados do Google Sheets."
   - "Posso filtrar por prioridade, performance, ou presença de pixels."

3. **Analisar Lead (30s)**
   - "Ao clicar em Analisar, o sistema dispara 3 análises simultâneas."
   - "PageSpeed para performance, Puppeteer para pixels, OpenAI para CTAs."
   - "Em 10 segundos, tenho um diagnóstico completo."

4. **Mostrar Relatório (30s)**
   - "O relatório mostra todos os detalhes."
   - "Performance crítica, sem pixels, CTAs fracos."
   - "Prioridade ALTA - contato imediato recomendado."

5. **Email Automático (20s)**
   - "O sistema já gerou um email personalizado."
   - "Baseado nos dados reais da análise."
   - "Um clique e o email é enviado."

6. **Fechamento (10s)**
   - "Isso reduz o tempo de prospecção em 90%."
   - "De 15 minutos para 10 segundos por lead."

**Tempo total: 2 minutos**

---

## Screenshots Sugeridos

1. `dashboard-overview.png` - Tela principal
2. `lead-analysis.png` - Lead sendo analisado
3. `report-drawer.png` - Drawer de relatório
4. `email-template.png` - Template de email
5. `filters.png` - Filtros ativos
6. `mobile-view.png` - Versão mobile

---

## Vídeo Demo

Grave um vídeo de 2 minutos mostrando:
1. Abrir o dashboard
2. Analisar um lead
3. Ver o relatório
4. Copiar o email
5. Mostrar o código (rápido)

**Ferramentas:** OBS Studio, Loom, ou Screen Studio
