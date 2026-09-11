# Configuração Google Sheets API

## Passo 1: Criar Projeto no Google Cloud

1. Acesse: https://console.cloud.google.com/
2. Crie um novo projeto: "CRM Deals Manager"
3. Ative a **Google Sheets API**:
   - Menu → APIs & Services → Library
   - Busque "Google Sheets API"
   - Clique em "Enable"

## Passo 2: Criar Service Account

1. Menu → APIs & Services → Credentials
2. Clique em "Create Credentials" → "Service Account"
3. Nome: `crm-service-account`
4. Clique em "Create and Continue"
5. Role: "Editor" (ou "Viewer" se for apenas leitura)
6. Clique em "Done"

## Passo 3: Gerar Chave JSON

1. Clique na Service Account criada
2. Aba "Keys" → "Add Key" → "Create new key"
3. Tipo: JSON
4. Baixe o arquivo (será algo como `project-id-xxxxx.json`)

## Passo 4: Extrair Credenciais

Abra o JSON baixado e copie:

```json
{
  "client_email": "crm-service-account@project-id.iam.gserviceaccount.com",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
}
```

Cole no `.env`:

```env
GOOGLE_SERVICE_ACCOUNT_EMAIL=crm-service-account@project-id.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nSUA_CHAVE_AQUI\n-----END PRIVATE KEY-----\n"
```

## Passo 5: Compartilhar o Google Sheet

1. Abra seu Google Sheet
2. Clique em "Compartilhar"
3. Cole o email da service account: `crm-service-account@project-id.iam.gserviceaccount.com`
4. Permissão: "Editor"
5. Copie o ID do Sheet da URL:
   ```
   https://docs.google.com/spreadsheets/d/[ESTE_É_O_ID]/edit
   ```

Cole no `.env`:

```env
GOOGLE_SHEET_ID=1A2B3C4D5E6F7G8H9I0J
```

## Estrutura do Sheet

Seu Google Sheet deve ter as seguintes colunas:

| Nome | Email | Site | Status | Performance Score | Tem Pixel | Tem CTA |
|------|-------|------|--------|-------------------|-----------|---------|
| Empresa X | contato@empresa.com | https://empresa.com | pending | | | |

## Teste

Execute no backend:

```bash
node -e "import('./services/sheets.js').then(m => m.fetchLeads().then(console.log))"
```

Se retornar os dados do Sheet, está funcionando! ✅
