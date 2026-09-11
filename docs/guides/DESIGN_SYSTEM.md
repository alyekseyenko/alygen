# 🎨 Sistema de Design - Glassmorphism

## Conceito

Design moderno com efeito de vidro fosco (glassmorphism), suportando tema claro e escuro com transições suaves.

---

## Paleta de Cores

### Tema Escuro (Padrão)
```css
Background:     #020817  (slate-950)
Card:           #0f172a  (slate-900)
Border:         #1e293b  (slate-800)
Text Primary:   #f1f5f9  (slate-100)
Text Secondary: #94a3b8  (slate-400)

Primary (Blue):    #3b82f6
Secondary (Purple): #a855f7
Accent (Green):    #22c55e
Destructive (Red): #ef4444
```

### Tema Claro
```css
Background:     #f8fafc  (slate-50)
Card:           #f1f5f9  (slate-100)
Border:         #e2e8f0  (slate-200)
Text Primary:   #0f172a  (slate-900)
Text Secondary: #64748b  (slate-500)

Primary (Blue):    #3b82f6
Secondary (Purple): #a855f7
Accent (Green):    #22c55e
Destructive (Red): #ef4444
```

---

## Componentes Glassmorphism

### 1. Glass Card
```jsx
<div className="glass-card p-6">
  Conteúdo
</div>
```

**Propriedades:**
- `backdrop-blur-xl` - Desfoque de fundo
- `bg-white/10` - Fundo semi-transparente
- `border border-white/20` - Borda sutil
- `rounded-2xl` - Bordas arredondadas
- `shadow-2xl` - Sombra profunda

### 2. Glass Button
```jsx
<button className="glass-button">
  Clique aqui
</button>
```

**Estados:**
- Hover: Aumenta opacidade e escala
- Active: Reduz escala
- Disabled: Opacidade 50%

### 3. Glass Input
```jsx
<input className="glass-input" placeholder="Digite..." />
```

**Estados:**
- Focus: Borda azul + ring
- Error: Borda vermelha

---

## Efeitos Especiais

### Gradient Text
```jsx
<h1 className="gradient-text">
  CRM Deals Manager
</h1>
```

Gradiente animado: Blue → Purple → Green

### Glow Effect
```jsx
<div className="glass-card glow">
  Conteúdo com brilho
</div>
```

Sombra colorida ao redor do elemento.

### Float Animation
```jsx
<div className="float">
  Elemento flutuante
</div>
```

Movimento suave para cima e para baixo.

---

## Toggle de Tema

### Implementação
```jsx
import ThemeToggle from './components/ThemeToggle'

<ThemeToggle />
```

**Funcionalidades:**
- Salva preferência no localStorage
- Transição suave entre temas
- Ícone animado (Sol/Lua)

---

## Scrollbar Customizada

```jsx
<div className="scrollbar-thin overflow-auto">
  Conteúdo com scroll
</div>
```

**Estilo:**
- Largura: 8px
- Cor: Semi-transparente
- Hover: Aumenta opacidade

---

## Animações

### Fade In
```jsx
<div className="animate-in fade-in duration-300">
  Aparece suavemente
</div>
```

### Slide In
```jsx
<div className="animate-in slide-in-from-right duration-500">
  Desliza da direita
</div>
```

### Spin (Loading)
```jsx
<Loader2 className="animate-spin" />
```

---

## Responsividade

### Breakpoints
```css
sm: 640px   /* Mobile landscape */
md: 768px   /* Tablet */
lg: 1024px  /* Desktop */
xl: 1280px  /* Large desktop */
2xl: 1536px /* Extra large */
```

### Exemplo
```jsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
  {/* Responsivo */}
</div>
```

---

## Hierarquia Visual

### Títulos
```jsx
<h1 className="text-5xl font-bold gradient-text">
  Título Principal
</h1>

<h2 className="text-3xl font-bold text-foreground">
  Subtítulo
</h2>

<h3 className="text-xl font-semibold text-foreground">
  Seção
</h3>
```

### Texto
```jsx
<p className="text-foreground">
  Texto principal
</p>

<p className="text-foreground/70">
  Texto secundário
</p>

<p className="text-foreground/50">
  Texto terciário
</p>
```

---

## Estados de Feedback

### Success
```jsx
<div className="glass-card border-accent bg-accent/10">
  ✅ Operação bem-sucedida
</div>
```

### Error
```jsx
<div className="glass-card border-destructive bg-destructive/10">
  ❌ Erro ao processar
</div>
```

### Warning
```jsx
<div className="glass-card border-yellow-500 bg-yellow-500/10">
  ⚠️ Atenção necessária
</div>
```

### Info
```jsx
<div className="glass-card border-primary bg-primary/10">
  ℹ️ Informação importante
</div>
```

---

## Badges de Status

### Alta Prioridade
```jsx
<span className="px-3 py-1 rounded-full bg-destructive/20 text-destructive text-sm font-medium">
  ALTA
</span>
```

### Média Prioridade
```jsx
<span className="px-3 py-1 rounded-full bg-yellow-500/20 text-yellow-500 text-sm font-medium">
  MÉDIA
</span>
```

### Baixa Prioridade
```jsx
<span className="px-3 py-1 rounded-full bg-accent/20 text-accent text-sm font-medium">
  BAIXA
</span>
```

---

## Ícones com Background

```jsx
<div className="p-2 rounded-xl bg-primary/20">
  <Icon className="w-6 h-6 text-primary" />
</div>
```

**Variações:**
- Primary: `bg-primary/20 text-primary`
- Secondary: `bg-secondary/20 text-secondary`
- Accent: `bg-accent/20 text-accent`
- Destructive: `bg-destructive/20 text-destructive`

---

## Tabela Glassmorphism

```jsx
<div className="glass-card overflow-hidden">
  <table className="w-full">
    <thead className="backdrop-blur-xl bg-white/10">
      <tr>
        <th className="px-6 py-4 text-left font-semibold">
          Coluna
        </th>
      </tr>
    </thead>
    <tbody>
      <tr className="border-t border-white/10 hover:bg-white/5">
        <td className="px-6 py-4">Dado</td>
      </tr>
    </tbody>
  </table>
</div>
```

---

## Drawer/Modal

```jsx
<div className="fixed inset-0 bg-black/50 backdrop-blur-sm">
  <div className="glass-card w-full max-w-2xl h-full">
    {/* Conteúdo */}
  </div>
</div>
```

**Características:**
- Backdrop com blur
- Animação de entrada
- Scroll interno
- Botão de fechar

---

## Boas Práticas

### ✅ Fazer
- Usar `glass-card` para containers principais
- Aplicar `glass-button` em ações
- Manter hierarquia visual clara
- Usar transições suaves
- Testar em ambos os temas

### ❌ Evitar
- Múltiplos níveis de blur (performance)
- Cores muito saturadas
- Texto com baixo contraste
- Animações excessivas
- Bordas muito grossas

---

## Performance

### Otimizações
```css
/* Usar will-change para animações */
.glass-button {
  will-change: transform, opacity;
}

/* Reduzir blur em mobile */
@media (max-width: 768px) {
  .glass-card {
    backdrop-filter: blur(8px);
  }
}
```

---

## Acessibilidade

### Contraste
- Texto principal: Mínimo 4.5:1
- Texto grande: Mínimo 3:1
- Elementos interativos: Mínimo 3:1

### Focus States
```jsx
<button className="glass-button focus:ring-2 focus:ring-primary">
  Acessível
</button>
```

### ARIA Labels
```jsx
<button aria-label="Alternar tema">
  <Sun />
</button>
```

---

## Exemplos Completos

### Card de Análise
```jsx
<div className="glass-card p-6 glow">
  <div className="flex items-center gap-3 mb-4">
    <div className="p-2 rounded-xl bg-primary/20">
      <TrendingDown className="w-6 h-6 text-primary" />
    </div>
    <h3 className="text-xl font-semibold">Performance</h3>
  </div>
  <div className="glass-card p-4">
    <p className="text-4xl font-bold text-primary">85</p>
  </div>
</div>
```

### Botão de Ação
```jsx
<button className="glass-button bg-accent/20 border-accent">
  <Mail className="w-5 h-5" />
  Enviar Email
</button>
```

---

## Manutenção

### Adicionar Nova Cor
```css
/* index.css */
:root {
  --new-color: 200 100% 50%;
}

/* tailwind.config.js */
colors: {
  newColor: 'hsl(var(--new-color))'
}
```

### Criar Novo Componente Glass
```css
.glass-new-component {
  @apply backdrop-blur-xl bg-white/10 dark:bg-white/5 
         border border-white/20 dark:border-white/10 
         rounded-2xl shadow-2xl;
}
```

---

**Design System criado para máxima elegância e usabilidade! ✨**
