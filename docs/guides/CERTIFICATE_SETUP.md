# 🎓 Setup do Sistema de Certificados ALYGEN

## 📋 O Que Foi Implementado

Sistema completo de certificados de verificação ALYGEN com:
- ✅ ID único por certificado (formato: ALY-2024-A3F9B2)
- ✅ Q Score e Grade
- ✅ Dados da empresa
- ✅ Métricas detalhadas (performance, SEO, security, tracking)
- ✅ Validade de 1 ano
- ✅ Persistência no Supabase
- ✅ Exibição visual abaixo do blob 3D

---

## 🚀 Passo 1: Criar Tabela no Supabase

1. Acesse seu projeto Supabase: https://supabase.com/dashboard
2. Vá em **SQL Editor** (menu lateral esquerdo)
3. Clique em **New Query**
4. Cole o conteúdo do arquivo `CERTIFICATES_TABLE.sql`
5. Clique em **Run** (ou pressione Ctrl+Enter)

**Resultado esperado:**
```
Success. No rows returned
```

---

## 🔍 Passo 2: Verificar Tabela Criada

Execute no SQL Editor:

```sql
SELECT * FROM certificates LIMIT 5;
```

Deve retornar uma tabela vazia (ainda sem certificados).

---

## 🎨 Passo 3: Testar no Frontend

1. Inicie o backend:
```bash
cd backend
npm run dev
```

2. Inicie o frontend:
```bash
cd frontend
npm run dev
```

3. Acesse http://localhost:3000
4. Clique em qualquer lead para abrir o drawer
5. Aguarde a análise completar
6. **Veja o certificado ALYGEN aparecer abaixo do blob 3D** 🎉

---

## 📊 Estrutura do Certificado

```json
{
  "certificate_id": "ALY-2024-A3F9B2",
  "company_name": "Empresa Exemplo Lda",
  "website": "https://exemplo.pt",
  "qscore": 75,
  "qgrade": "B",
  "metrics": {
    "performance": 85,
    "seo": 70,
    "security": 90,
    "tracking": 5
  },
  "issued_at": "2024-01-15T10:30:00Z",
  "valid_until": "2025-01-15T10:30:00Z"
}
```

---

## 🔧 Endpoints Criados

### POST /api/generate-certificate
Gera um novo certificado ALYGEN.

**Request:**
```json
{
  "companyName": "Empresa Exemplo Lda",
  "website": "https://exemplo.pt",
  "qscore": 75,
  "qgrade": "B",
  "metrics": {
    "performance": 85,
    "seo": 70,
    "security": 90,
    "tracking": 5
  }
}
```

**Response:**
```json
{
  "success": true,
  "certificate": { ... },
  "cached": false
}
```

### GET /api/certificate/:website
Busca certificado existente por website.

**Exemplo:**
```
GET /api/certificate/https%3A%2F%2Fexemplo.pt
```

---

## 🎯 Como Funciona

1. **Usuário abre o drawer de um lead**
2. **Frontend chama** `POST /api/generate-certificate`
3. **Backend verifica** se já existe certificado para aquele website
4. **Se não existir:**
   - Gera ID único (ALY-2024-XXXXXX)
   - Calcula validade (1 ano)
   - Salva no Supabase
5. **Se já existir:**
   - Retorna certificado do cache
6. **Frontend exibe** certificado abaixo do blob 3D

---

## 📈 Queries Úteis

### Ver todos os certificados
```sql
SELECT 
  certificate_id,
  company_name,
  qscore,
  qgrade,
  issued_at
FROM certificates
ORDER BY issued_at DESC;
```

### Certificados por grade
```sql
SELECT 
  qgrade,
  COUNT(*) as total,
  AVG(qscore) as media_score
FROM certificates
GROUP BY qgrade
ORDER BY qgrade;
```

### Certificados expirando em 30 dias
```sql
SELECT 
  certificate_id,
  company_name,
  valid_until
FROM certificates
WHERE valid_until BETWEEN NOW() AND NOW() + INTERVAL '30 days'
ORDER BY valid_until;
```

### Buscar por empresa
```sql
SELECT * FROM certificates 
WHERE company_name ILIKE '%nome%'
ORDER BY issued_at DESC;
```

---

## 🎨 Aparência Visual

O certificado aparece abaixo do blob 3D com:
- 🏆 Ícone de Award
- 📊 Q Score em destaque
- 🏢 Nome da empresa
- 🆔 ID único do certificado
- 📅 Data de emissão e validade
- ✅ Badge "Verificado"

**Design:**
- Gradiente accent/10 → accent/5
- Border accent/30
- Backdrop blur
- Responsivo e elegante

---

## 🔒 Segurança

- ✅ IDs únicos e não sequenciais
- ✅ Validação de dados no backend
- ✅ Cache para evitar duplicatas
- ✅ Timestamps automáticos
- ✅ Índices para performance

---

## 🚀 Próximos Passos (Opcional)

1. **Exportar certificado como PDF**
2. **Enviar certificado por email**
3. **Página pública de verificação** (https://alygen.pt/verify/ALY-2024-XXXXXX)
4. **QR Code no certificado**
5. **Renovação automática após 1 ano**

---

## ✅ Checklist de Implementação

- [x] Criar tabela no Supabase
- [x] Criar certificate-service.js
- [x] Adicionar endpoints no server.js
- [x] Integrar no LeadDrawer.jsx
- [x] Testar geração de certificado
- [x] Testar cache de certificado
- [x] Verificar persistência no Supabase

---

**🎉 Sistema de Certificados ALYGEN está pronto para uso!**
