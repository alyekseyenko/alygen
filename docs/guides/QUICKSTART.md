# 🚀 Início Rápido - CRM Deals Manager

## Instalação Automática (Windows)

```bash
# Execute o script de setup
setup.bat
```

## Instalação Manual

### Backend

```bash
cd backend
npm install
cp .env.example .env
# Configure o .env com suas credenciais
npm run dev
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

## Configuração Mínima

### 1. Google Sheets API

Siga o guia completo: `GOOGLE_SHEETS_SETUP.md`

Resumo:
- Crie um projeto no Google Cloud
- Ative a Google Sheets API
- Crie uma Service Account
- Baixe o JSON de credenciais
- Compartilhe seu Sheet com o email da service account

### 2. OpenAI API

```env
OPENAI_API_KEY=sk-proj-xxxxx
```

Obtenha em: https://platform.openai.com/api-keys

### 3. PageSpeed API (Opcional)

```env
PAGESPEED_API_KEY=AIzaSyxxxxx
```

Obtenha em: https://developers.google.com/speed/docs/insights/v5/get-started

**Nota:** Funciona sem a key, mas com rate limit menor.

## Uso

### 1. Preparar Dados

Crie um Google Sheet com as colunas:
- Nome
- Email
- Site
- Status

Veja exemplo completo em: `SHEET_TEMPLATE.md`

### 2. Iniciar Servidores

Terminal 1 (Backend):
```bash
cd backend
npm run dev
```

Terminal 2 (Frontend):
```bash
cd frontend
npm run dev
```

### 3. Acessar Dashboard

Abra: http://localhost:3000

### 4. Fluxo de Trabalho

1. **Carregar Leads**: O sistema busca automaticamente do Google Sheets
2. **Analisar**: Clique em "Analisar" para processar um lead
3. **Ver Relatório**: Clique em "Ver Relatório" para detalhes
4. **Enviar Email**: Use o template gerado ou edite manualmente

## Estrutura de Arquivos

```
CRM Deals Manager/
├── backend/
│   ├── server.js              # Servidor Express
│   ├── services/
│   │   ├── analyzer.js        # Análise de leads
│   │   ├── sheets.js          # Google Sheets
│   │   └── email.js           # Envio de emails
│   ├── package.json
│   └── .env
├── frontend/
│   ├── src/
│   │   ├── App.jsx            # Componente principal
│   │   ├── components/
│   │   │   └── LeadDrawer.jsx # Drawer de relatório
│   │   └── main.jsx
│   ├── package.json
│   └── index.html
└── README.md
```

## Troubleshooting

### Erro: "Cannot find module"
```bash
cd backend && npm install
cd ../frontend && npm install
```

### Erro: "Google Sheets API not enabled"
- Verifique se ativou a API no Google Cloud Console
- Confirme que compartilhou o Sheet com a service account

### Erro: "OpenAI API key invalid"
- Verifique se a key está correta no `.env`
- Confirme que tem créditos na conta OpenAI

### Performance Score sempre 0
- Adicione uma PageSpeed API key no `.env`
- Ou aguarde (funciona sem key, mas mais lento)

## Próximos Passos

1. ✅ Configure as credenciais
2. ✅ Teste com 2-3 leads
3. ✅ Personalize os templates de email
4. ✅ Integre com seu n8n (opcional)
5. ✅ Deploy em produção (Vercel + Railway)

## Deploy em Produção

### Backend (Railway)
```bash
railway login
railway init
railway up
```

### Frontend (Vercel)
```bash
vercel login
vercel
```

## Suporte

- 📖 Documentação: Leia os arquivos `.md` na raiz
- 🐛 Issues: Abra uma issue no GitHub
- 💬 Dúvidas: Consulte o `PITCH.md` para entender a arquitetura

---

**Desenvolvido para demonstrar habilidades em:**
- Integração de múltiplas APIs
- Orquestração de serviços
- IA Generativa (OpenAI)
- React + Node.js Full Stack
- UI/UX Moderno
