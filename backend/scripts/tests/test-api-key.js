import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

async function testAPIKey() {
  const apiKey = process.env.GOOGLE_SEARCH_API_KEY || process.env.PAGESPEED_API_KEY || '';
  if (!apiKey) {
    console.error('❌ Nenhuma chave configurada em GOOGLE_SEARCH_API_KEY ou PAGESPEED_API_KEY');
    return;
  }
  
  console.log('🔍 Testando se API Key do PageSpeed funciona para Custom Search...\n');
  
  // Primeiro, verificar se Custom Search API está ativada
  try {
    const { data } = await axios.get('https://www.googleapis.com/customsearch/v1', {
      params: {
        key: apiKey,
        cx: 'teste', // CX fake só para testar a API Key
        q: 'teste'
      },
      timeout: 10000
    });
    
    console.log('✅ API Key funciona para Custom Search!');
    
  } catch (error) {
    const errorData = error.response?.data?.error;
    
    if (errorData?.code === 400 && errorData?.message?.includes('Invalid Value')) {
      console.log('✅ API Key é válida!');
      console.log('⚠️ Mas você precisa criar um Custom Search Engine (CX ID)\n');
      console.log('📖 Próximo passo:');
      console.log('1. Acesse: https://programmablesearchengine.google.com/controlpanel/create');
      console.log('2. Preencha:');
      console.log('   - Nome: "CRM Deals Manager SERP"');
      console.log('   - O que pesquisar: "Pesquisar toda a web"');
      console.log('3. Clique em "Criar"');
      console.log('4. Copie o "ID do mecanismo de pesquisa" (algo como: a1b2c3d4e5f6g7h8i)');
      console.log('5. Adicione ao .env:');
      console.log('   GOOGLE_SEARCH_API_KEY=sua_google_api_key_aqui');
      console.log('   GOOGLE_SEARCH_CX=seu_cx_id_aqui\n');
      
    } else if (errorData?.code === 403) {
      console.log('❌ API Key não tem permissão para Custom Search API\n');
      console.log('📖 Você precisa:');
      console.log('1. Ir em: https://console.cloud.google.com/apis/library/customsearch.googleapis.com');
      console.log('2. Clicar em "Ativar"');
      console.log('3. Aguardar alguns segundos');
      console.log('4. Testar novamente\n');
      
    } else {
      console.log('❌ Erro desconhecido:', errorData);
    }
  }
}

testAPIKey();
