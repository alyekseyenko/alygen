# 🏗️ Arquitetura de Componentes - Senior Level

## 📦 Estrutura shadcn/ui Completa

### ✅ Componentes Implementados (23 componentes)

#### 🎯 Core Components
- **Button** - Botão com variantes (default, outline, ghost, destructive)
- **Card** - Container com header, content, footer
- **Badge** - Tags e labels
- **Input** - Campo de texto
- **Textarea** - Campo de texto multilinha
- **Label** - Labels para formulários

#### 📐 Layout Components
- **Separator** - Divisor horizontal/vertical
- **ScrollArea** - Área com scroll customizado
- **Table** - Tabela completa (Header, Body, Row, Cell)

#### 🎭 Overlay Components
- **Dialog** - Modal/Dialog
- **Sheet** - Drawer lateral (usado no LeadDrawer)
- **Popover** - Popup posicionado
- **Tooltip** - Dica de ferramenta
- **DropdownMenu** - Menu dropdown completo

#### 🧭 Navigation Components
- **Tabs** - Abas de navegação
- **Select** - Seletor dropdown
- **Command** - Barra de pesquisa/comando

#### 💬 Feedback Components
- **Alert** - Alertas e notificações
- **Progress** - Barra de progresso
- **Skeleton** - Loading placeholder

#### 📝 Form Components
- **RadioGroup** - Grupo de radio buttons

#### 👤 Display Components
- **Avatar** - Avatar de usuário

---

## 🎨 Design System

### Tema Black & White Minimalista 2026

```css
:root {
  --background: 0 0% 0%;        /* Preto puro */
  --foreground: 0 0% 100%;      /* Branco puro */
  --card: 0 0% 3%;              /* Preto suave */
  --border: 0 0% 20%;           /* Cinza escuro */
  --primary: 0 0% 100%;         /* Branco */
  --secondary: 0 0% 15%;        /* Cinza */
  --muted: 0 0% 10%;            /* Cinza escuro */
  --accent: 0 0% 100%;          /* Branco */
}
```

### Princípios de Design

1. **Minimalismo** - Sem gradientes, sem cores vibrantes
2. **Contraste** - Preto e branco apenas
3. **Tipografia** - Inter/System fonts
4. **Espaçamento** - Consistente e respirável
5. **Animações** - Suaves e rápidas (300ms)

---

## 🏛️ Arquitetura de Pastas

```
frontend/
├── src/
│   ├── components/
│   │   ├── ui/                    # shadcn/ui components
│   │   │   ├── alert.jsx
│   │   │   ├── avatar.jsx
│   │   │   ├── badge.jsx
│   │   │   ├── button.jsx
│   │   │   ├── card.jsx
│   │   │   ├── command.jsx
│   │   │   ├── dialog.jsx
│   │   │   ├── dropdown-menu.jsx
│   │   │   ├── input.jsx
│   │   │   ├── label.jsx
│   │   │   ├── popover.jsx
│   │   │   ├── progress.jsx
│   │   │   ├── radio-group.jsx
│   │   │   ├── scroll-area.jsx
│   │   │   ├── select.jsx
│   │   │   ├── separator.jsx
│   │   │   ├── sheet.jsx
│   │   │   ├── skeleton.jsx
│   │   │   ├── table.jsx
│   │   │   ├── tabs.jsx
│   │   │   ├── textarea.jsx
│   │   │   ├── tooltip.jsx
│   │   │   └── index.js          # Barrel export
│   │   ├── LeadDrawer.jsx         # Feature component
│   │   ├── QScoreDetailed.jsx
│   │   └── QScoreAdvanced.jsx
│   ├── lib/
│   │   └── utils.js               # cn() helper
│   ├── utils/
│   │   ├── qscore.js
│   │   └── pricing.js
│   ├── App.jsx                    # Main app
│   └── index.css                  # Global styles
```

---

## 🔧 Padrões de Uso

### 1. Importação de Componentes

```jsx
// ✅ Correto - Import direto
import { Button } from './components/ui/button'
import { Card, CardHeader, CardTitle } from './components/ui/card'

// ✅ Correto - Barrel import
import { Button, Card, Badge } from './components/ui'
```

### 2. Composição de Componentes

```jsx
// ✅ Padrão shadcn/ui
<Card>
  <CardHeader>
    <CardTitle>Título</CardTitle>
    <CardDescription>Descrição</CardDescription>
  </CardHeader>
  <CardContent>
    Conteúdo
  </CardContent>
  <CardFooter>
    <Button>Ação</Button>
  </CardFooter>
</Card>
```

### 3. Variantes de Componentes

```jsx
// Button variants
<Button variant="default">Default</Button>
<Button variant="outline">Outline</Button>
<Button variant="ghost">Ghost</Button>
<Button variant="destructive">Destructive</Button>

// Badge variants
<Badge variant="default">Default</Badge>
<Badge variant="secondary">Secondary</Badge>
<Badge variant="outline">Outline</Badge>
```

### 4. Utilitário cn()

```jsx
import { cn } from '@/lib/utils'

// Merge de classes com conflito
<div className={cn(
  "base-classes",
  condition && "conditional-classes",
  className // Props externas
)} />
```

---

## 🎯 Features Implementadas

### ✅ Tabela Completa com Ordenação
- 11 colunas de dados
- Ordenação clicável em todas as colunas
- Indicadores visuais (↑ ↓ ↕)
- Hover states
- Fullscreen layout

### ✅ LeadDrawer (Sheet)
- Drawer lateral com Sheet component
- Tabs para navegação
- Formulário de email
- Preview de email
- Estatísticas rápidas

### ✅ Sistema de Filtros
- Tabs para filtros rápidos
- Select para categorias
- Estado persistente

### ✅ Cards de Estatísticas
- 4 cards principais
- Dados calculados em tempo real
- Design minimalista

---

## 📊 Dependências Radix UI

```json
{
  "@radix-ui/react-dialog": "^1.0.0",
  "@radix-ui/react-dropdown-menu": "^2.0.0",
  "@radix-ui/react-label": "^2.0.0",
  "@radix-ui/react-popover": "^1.0.0",
  "@radix-ui/react-progress": "^1.0.0",
  "@radix-ui/react-radio-group": "^1.1.0",
  "@radix-ui/react-scroll-area": "^1.0.0",
  "@radix-ui/react-select": "^2.0.0",
  "@radix-ui/react-separator": "^1.0.0",
  "@radix-ui/react-tabs": "^1.0.0",
  "@radix-ui/react-tooltip": "^1.0.0",
  "@radix-ui/react-avatar": "^1.0.0",
  "class-variance-authority": "^0.7.0",
  "clsx": "^2.0.0",
  "tailwind-merge": "^2.0.0"
}
```

---

## 🚀 Próximos Passos (Opcional)

### Componentes Adicionais
- [ ] Accordion
- [ ] Checkbox
- [ ] Switch
- [ ] Slider
- [ ] Calendar
- [ ] DatePicker
- [ ] Form (com react-hook-form)
- [ ] Toast/Sonner
- [ ] Context Menu
- [ ] Menubar
- [ ] Navigation Menu
- [ ] Collapsible

### Melhorias
- [ ] Dark mode toggle
- [ ] Temas customizáveis
- [ ] Storybook
- [ ] Testes unitários
- [ ] Documentação interativa

---

## 📝 Convenções de Código

### Nomenclatura
- **Componentes**: PascalCase (`Button.jsx`)
- **Utilitários**: camelCase (`utils.js`)
- **Constantes**: UPPER_SNAKE_CASE (`API_URL`)

### Estrutura de Componente
```jsx
import * as React from "react"
import { cn } from "@/lib/utils"

const Component = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("base-classes", className)}
    {...props}
  />
))
Component.displayName = "Component"

export { Component }
```

### Props Pattern
- Sempre usar `forwardRef` para componentes base
- Sempre aceitar `className` para customização
- Usar spread `...props` para flexibilidade
- Definir `displayName` para debugging

---

## 🎓 Boas Práticas

1. **Composição sobre Configuração** - Componentes pequenos e compostos
2. **Acessibilidade** - ARIA labels, keyboard navigation
3. **Performance** - React.memo quando necessário
4. **Type Safety** - PropTypes ou TypeScript
5. **Consistência** - Seguir padrões shadcn/ui
6. **Documentação** - Comentários claros e exemplos

---

## 📚 Recursos

- [shadcn/ui Docs](https://ui.shadcn.com)
- [Radix UI Docs](https://www.radix-ui.com)
- [Tailwind CSS Docs](https://tailwindcss.com)
- [CVA Docs](https://cva.style)

---

**Arquitetura completa e pronta para produção! 🚀**
