# 📊 Configuração do Google Sheet

## Sheet ID
```
1BSFyHaMlWJNWa0aHqAbY5r_3MbzcmkWcK6h4_WrZcQY
```

## Estrutura

### Aba: **Results**
O sistema busca dados da aba "Results" (gid=2023033319)

### Colunas Utilizadas
- **Coluna C (website)** - URL do site a ser analisado
- **title** - Nome do negócio
- **phone** - Telefone de contato
- **rating** - Avaliação
- **reviews** - Número de reviews
- **type** - Tipo de negócio
- **address** - Endereço

## Configuração Rápida

### 1. Criar Service Account

1. Acesse: https://console.cloud.google.com/
2. Crie um projeto ou selecione existente
3. Ative a **Google Sheets API**:
   - Menu → APIs & Services → Library
   - Busque "Google Sheets API"
   - Clique em "Enable"

### 2. Criar Credenciais

1. Menu → APIs & Services → Credentials
2. Create Credentials → Service Account
3. Nome: `crm-sheets-reader`
4. Role: **Viewer** (apenas leitura)
5. Create and Continue → Done

### 3. Gerar Chave

1. Clique na Service Account criada
2. Keys → Add Key → Create new key
3. Tipo: **JSON**
4. Baixe o arquivo

### 4. Compartilhar o Sheet

1. Abra o Google Sheet: https://docs.google.com/spreadsheets/d/1BSFyHaMlWJNWa0aHqAbY5r_3MbzcmkWcK6h4_WrZcQY/edit
2. Clique em "Compartilhar"
3. Cole o email da service account (do JSON baixado):
   ```
   crm-sheets-reader@seu-projeto.iam.gserviceaccount.com
   ```
4. Permissão: **Viewer**
5. Desmarque "Notify people"
6. Compartilhar

### 5. Configurar .env

Abra o arquivo JSON baixado e extraia:

```json
{
  "client_email": "crm-sheets-reader@projeto.iam.gserviceaccount.com",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
}
```

Cole no `backend/.env`:

```env
GOOGLE_SERVICE_ACCOUNT_EMAIL=crm-sheets-reader@projeto.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nSUA_CHAVE_COMPLETA_AQUI\n-----END PRIVATE KEY-----\n"
GOOGLE_SHEET_ID=1BSFyHaMlWJNWa0aHqAbY5r_3MbzcmkWcK6h4_WrZcQY
```

**IMPORTANTE:** Mantenha as aspas duplas e os `\n` na private key!

## Testar Conexão

```bash
cd backend
node -e "import('./services/sheets.js').then(m => m.fetchLeads().then(d => console.log('✅ Leads encontrados:', d.length)))"
```

Se retornar o número de leads, está funcionando! ✅

## Estrutura Esperada

O sistema irá:
1. Conectar ao Sheet ID: `1BSFyHaMlWJNWa0aHqAbY5r_3MbzcmkWcK6h4_WrZcQY`
2. Buscar a aba "Results"
3. Ler todas as linhas que têm a coluna `website` preenchida
4. Ignorar linhas vazias ou sem website

## Exemplo de Dados

```
| title          | phone        | website              | rating | reviews |
|----------------|--------------|----------------------|--------|---------|
| Empresa ABC    | 123-456-7890 | https://abc.com      | 4.5    | 120     |
| Loja XYZ       | 987-654-3210 | https://xyz.com      | 4.8    | 85      |
```

## Troubleshooting

### Erro: "No key or keyFile set"
- Verifique se o `.env` está configurado corretamente
- Confirme que a `GOOGLE_PRIVATE_KEY` tem as aspas duplas

### Erro: "The caller does not have permission"
- Compartilhe o Sheet com o email da service account
- Aguarde 1-2 minutos para propagar

### Erro: "Unable to parse range"
- Verifique se a aba "Results" existe
- Confirme que há dados na planilha

### Nenhum lead retornado
- Verifique se a coluna `website` está preenchida
- Confirme que está na aba "Results"
- Teste com: `console.log(rows.map(r => r.get('website')))`

## Segurança

⚠️ **NUNCA** commite o arquivo `.env` no Git!

O `.gitignore` já está configurado para ignorar:
```
.env
.env.local
```

---

**Configuração específica para o Sheet fornecido! 🎯**
