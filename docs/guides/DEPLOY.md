# 🚀 Deploy em Produção

## Opções de Deploy

### 1. Backend (Node.js)

#### Opção A: Railway (Recomendado)
```bash
# Instalar CLI
npm i -g @railway/cli

# Login
railway login

# Inicializar projeto
railway init

# Deploy
railway up

# Adicionar variáveis de ambiente
railway variables set OPENAI_API_KEY=sk-...
railway variables set GOOGLE_SHEET_ID=...
```

**Vantagens:**
- ✅ Deploy automático via Git
- ✅ $5/mês de crédito grátis
- ✅ Logs em tempo real
- ✅ Fácil configuração

**URL final:** `https://seu-projeto.up.railway.app`

---

#### Opção B: Render
```bash
# 1. Criar conta em render.com
# 2. New → Web Service
# 3. Conectar repositório GitHub
# 4. Build Command: npm install
# 5. Start Command: npm start
# 6. Adicionar variáveis de ambiente
```

**Vantagens:**
- ✅ Plano gratuito (com limitações)
- ✅ SSL automático
- ✅ Deploy via Git

---

#### Opção C: AWS EC2
```bash
# Conectar via SSH
ssh -i key.pem ubuntu@ec2-ip

# Instalar Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Clonar repositório
git clone https://github.com/seu-usuario/crm-backend.git
cd crm-backend

# Instalar dependências
npm install

# Configurar PM2
npm install -g pm2
pm2 start server.js --name crm-backend
pm2 startup
pm2 save

# Configurar Nginx
sudo apt install nginx
sudo nano /etc/nginx/sites-available/crm
```

**Nginx Config:**
```nginx
server {
    listen 80;
    server_name api.seudominio.com;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

### 2. Frontend (React)

#### Opção A: Vercel (Recomendado)
```bash
# Instalar CLI
npm i -g vercel

# Login
vercel login

# Deploy
cd frontend
vercel

# Produção
vercel --prod
```

**Configuração (vercel.json):**
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "env": {
    "VITE_API_URL": "https://seu-backend.up.railway.app/api"
  }
}
```

**Vantagens:**
- ✅ Deploy instantâneo
- ✅ CDN global
- ✅ SSL automático
- ✅ Preview deployments

**URL final:** `https://seu-projeto.vercel.app`

---

#### Opção B: Netlify
```bash
# Instalar CLI
npm i -g netlify-cli

# Login
netlify login

# Deploy
cd frontend
netlify deploy --prod
```

**Configuração (netlify.toml):**
```toml
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

---

#### Opção C: AWS S3 + CloudFront
```bash
# Build
npm run build

# Upload para S3
aws s3 sync dist/ s3://seu-bucket --delete

# Invalidar cache do CloudFront
aws cloudfront create-invalidation --distribution-id E123456 --paths "/*"
```

---

## Configuração de Variáveis de Ambiente

### Backend (.env em produção)
```env
# Google Sheets
GOOGLE_SERVICE_ACCOUNT_EMAIL=service@project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
GOOGLE_SHEET_ID=1A2B3C4D5E6F7G8H9I0J

# OpenAI
OPENAI_API_KEY=sk-proj-xxxxx

# PageSpeed (opcional)
PAGESPEED_API_KEY=AIzaSyxxxxx

# n8n Webhook
N8N_WEBHOOK_URL=https://n8n.seudominio.com/webhook/send-email

# Server
PORT=3001
NODE_ENV=production
```

### Frontend (.env.production)
```env
VITE_API_URL=https://seu-backend.up.railway.app/api
```

---

## Checklist de Deploy

### Antes do Deploy

- [ ] Testar localmente com `npm run build`
- [ ] Verificar todas as variáveis de ambiente
- [ ] Testar integração com Google Sheets
- [ ] Testar análise de um lead real
- [ ] Verificar logs de erro
- [ ] Adicionar `.gitignore` (não commitar `.env`)

### Durante o Deploy

- [ ] Fazer commit do código
- [ ] Push para GitHub
- [ ] Configurar Railway/Vercel
- [ ] Adicionar variáveis de ambiente
- [ ] Fazer primeiro deploy
- [ ] Verificar logs

### Após o Deploy

- [ ] Testar URL de produção
- [ ] Verificar CORS (backend deve aceitar frontend)
- [ ] Testar análise de lead
- [ ] Verificar envio de email
- [ ] Configurar domínio customizado (opcional)
- [ ] Configurar SSL (automático na maioria)

---

## CORS (Importante!)

No backend, configure CORS para aceitar o frontend:

```javascript
// server.js
import cors from 'cors';

const allowedOrigins = [
  'http://localhost:3000',
  'https://seu-projeto.vercel.app'
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  }
}));
```

---

## Monitoramento

### 1. Logs (Railway)
```bash
railway logs
```

### 2. Uptime Monitoring (UptimeRobot)
- Crie uma conta em uptimerobot.com
- Adicione seu backend URL
- Configure alertas por email

### 3. Error Tracking (Sentry)
```bash
npm install @sentry/node

# server.js
import * as Sentry from '@sentry/node';

Sentry.init({
  dsn: 'https://xxxxx@sentry.io/xxxxx',
  environment: process.env.NODE_ENV
});
```

---

## Domínio Customizado

### Backend (Railway)
1. Settings → Domains
2. Add Custom Domain
3. Adicionar CNAME no seu DNS:
   ```
   api.seudominio.com → seu-projeto.up.railway.app
   ```

### Frontend (Vercel)
1. Settings → Domains
2. Add Domain
3. Adicionar registros DNS:
   ```
   A     @    76.76.21.21
   CNAME www  cname.vercel-dns.com
   ```

---

## Custos Estimados

### Plano Gratuito (Desenvolvimento)
- Railway: $5/mês de crédito
- Vercel: Ilimitado (hobby)
- Google Sheets API: Grátis
- OpenAI: ~$0.002 por análise
- **Total: ~$5-10/mês**

### Plano Profissional (100 leads/dia)
- Railway: $20/mês
- Vercel: $20/mês
- OpenAI: ~$6/mês (100 análises/dia)
- **Total: ~$46/mês**

### Plano Enterprise (1000 leads/dia)
- AWS EC2 (t3.medium): $30/mês
- CloudFront: $10/mês
- OpenAI: ~$60/mês
- Redis (cache): $15/mês
- **Total: ~$115/mês**

---

## Otimizações de Produção

### 1. Cache com Redis
```javascript
import Redis from 'ioredis';
const redis = new Redis(process.env.REDIS_URL);

async function analyzeLead(url) {
  const cached = await redis.get(`analysis:${url}`);
  if (cached) return JSON.parse(cached);
  
  const analysis = await performAnalysis(url);
  await redis.setex(`analysis:${url}`, 86400, JSON.stringify(analysis));
  return analysis;
}
```

### 2. Rate Limiting
```javascript
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100 // 100 requisições
});

app.use('/api/', limiter);
```

### 3. Compression
```javascript
import compression from 'compression';
app.use(compression());
```

### 4. Helmet (Segurança)
```javascript
import helmet from 'helmet';
app.use(helmet());
```

---

## CI/CD (GitHub Actions)

Crie `.github/workflows/deploy.yml`:

```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: cd backend && npm install
      - run: cd backend && npm test
      - uses: railway/deploy@v1
        with:
          railway_token: ${{ secrets.RAILWAY_TOKEN }}

  deploy-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: cd frontend && npm install
      - run: cd frontend && npm run build
      - uses: vercel/deploy@v1
        with:
          vercel_token: ${{ secrets.VERCEL_TOKEN }}
```

---

## Backup

### Google Sheets (Automático)
- Google Sheets já tem versionamento
- Configure backup diário via Google Takeout

### Logs
```bash
# Railway
railway logs > logs-$(date +%Y%m%d).txt

# AWS CloudWatch
aws logs tail /aws/ec2/crm-backend --follow
```

---

## Troubleshooting em Produção

### 1. "Cannot connect to backend"
- Verificar CORS
- Verificar URL do backend no frontend
- Verificar se backend está rodando

### 2. "Google Sheets API error"
- Verificar se variáveis de ambiente estão corretas
- Verificar se Sheet está compartilhado

### 3. "OpenAI timeout"
- Aumentar timeout no Puppeteer
- Adicionar retry logic

### 4. "Out of memory"
- Aumentar RAM no Railway/Render
- Adicionar swap no EC2
- Otimizar Puppeteer (headless mode)

---

## Próximos Passos

1. ✅ Deploy básico funcionando
2. ✅ Domínio customizado configurado
3. ✅ Monitoramento ativo
4. ✅ Backup configurado
5. ✅ CI/CD implementado

**Seu sistema está pronto para produção! 🚀**
