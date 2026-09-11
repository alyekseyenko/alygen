# 🔍 Configuração Google Custom Search API

## Passo 1: Criar Custom Search Engine

1. Acesse: https://programmablesearchengine.google.com/controlpanel/create
2. Preencha:
   - **Nome do mecanismo de pesquisa**: CRM Deals Manager SERP Tracker
   - **O que pesquisar**: Pesquisar toda a web
   - **Configurações de pesquisa**: Ativar "Pesquisa de imagens" e "Pesquisa segura"
3. Clique em **Criar**
4. Copie o **ID do mecanismo de pesquisa (CX)** - algo como: `a1b2c3d4e5f6g7h8i`

## Passo 2: Ativar API

1. Acesse: https://console.cloud.google.com/apis/library/customsearch.googleapis.com
2. Clique em **Ativar**
3. Aguarde alguns segundos

## Passo 3: Criar API Key (se ainda não tiver)

1. Acesse: https://console.cloud.google.com/apis/credentials
2. Clique em **+ Criar credenciais** → **Chave de API**
3. Copie a chave gerada
4. (Opcional) Clique em **Restringir chave** e limite para "Custom Search API"

## Passo 4: Configurar .env

Adicione ao seu arquivo `.env`:

```env
# Google Custom Search API
GOOGLE_SEARCH_API_KEY=AIza...sua_chave_aqui
GOOGLE_SEARCH_CX=a1b2c3d4e5f6g7h8i

# OAuth (já configurado)
GOOGLE_CLIENT_ID=9979644088-02hakjnpcftog4vu8gi50211njpg2ap2.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=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
```

## Passo 5: Testar

Execute no backend:
```bash
node test-google-search.js
```

## ⚠️ Limites da API

- **Gratuito**: 100 buscas/dia
- **Pago**: $5 por 1000 buscas adicionais

## 📊 Estrutura da Planilha Necessária

Certifique-se que sua planilha tem estas colunas:

| postal_code | type_id | type_ids |
|-------------|---------|----------|
| 2410 | Imobiliária | Imobiliária,Apartamentos,Casas |
| 1000 | Restaurante | Restaurante,Comida Portuguesa |
| 4000 | Clínica | Clínica,Dentista,Saúde |

## 🎯 Como Funciona

1. Sistema pega o `address` do lead
2. Extrai código postal (ex: "Leiria 2410" → "2410")
3. Busca na planilha o `type_id` correspondente
4. Gera keywords: "Imobiliária Leiria", "Comprar casa Leiria"
5. Busca no Google e retorna posição real

## 🚀 Próximos Passos

Depois de configurar, o sistema irá:
- Buscar automaticamente a posição no Google
- Comparar com concorrentes
- Calcular Q Score baseado em visibilidade
- Gerar relatório de SEO local
