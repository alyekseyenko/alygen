import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

async function checkAPIStatus() {
  const apiKey = process.env.GOOGLE_SEARCH_API_KEY || process.env.PAGESPEED_API_KEY || '';
  if (!apiKey) {
    console.error('❌ Nenhuma chave configurada em GOOGLE_SEARCH_API_KEY ou PAGESPEED_API_KEY');
    return;
  }
  
  console.log('🔍 Verificando status da Custom Search API...\n');
  
  try {
    // Tentar fazer uma requisição sem CX para ver o tipo de erro
    await axios.get('https://www.googleapis.com/customsearch/v1', {
      params: {
        key: apiKey,
        q: 'teste'
      }
    });
    
  } catch (error) {
    const errorData = error.response?.data?.error;
    const errorMessage = errorData?.message || '';
    
    console.log('📊 Resposta da API:');
    console.log(`Código: ${errorData?.code}`);
    console.log(`Mensagem: ${errorMessage}\n`);
    
    if (errorData?.code === 403) {
      console.log('❌ Custom Search API NÃO está ativada\n');
      console.log('✅ SOLUÇÃO RÁPIDA:');
      console.log('1. Abra: https://console.cloud.google.com/apis/library/customsearch.googleapis.com');
      console.log('2. Clique no botão "ATIVAR"');
      console.log('3. Aguarde 30 segundos');
      console.log('4. Execute este teste novamente\n');
      
    } else if (errorMessage.includes('cx') || errorMessage.includes('Custom Search')) {
      console.log('✅ API está ATIVADA! Mas falta o CX ID\n');
      console.log('📝 Próximo passo - Criar Custom Search Engine:');
      console.log('1. Abra: https://programmablesearchengine.google.com/controlpanel/create');
      console.log('2. Preencha:');
      console.log('   Nome: CRM Deals Manager');
      console.log('   O que pesquisar: Pesquisar toda a web');
      console.log('3. Clique em "Criar"');
      console.log('4. Copie o "ID do mecanismo de pesquisa"');
      console.log('5. Adicione ao .env:');
      console.log('   GOOGLE_SEARCH_CX=seu_id_aqui\n');
      
    } else if (errorData?.code === 400) {
      console.log('✅ API provavelmente está ATIVADA!\n');
      console.log('O erro é porque falta o parâmetro CX (Custom Search Engine ID)');
      console.log('\n📝 Criar Custom Search Engine:');
      console.log('1. Abra: https://programmablesearchengine.google.com/controlpanel/create');
      console.log('2. Preencha:');
      console.log('   Nome: CRM Deals Manager');
      console.log('   O que pesquisar: Pesquisar toda a web');
      console.log('3. Clique em "Criar"');
      console.log('4. Copie o "ID do mecanismo de pesquisa" (ex: a1b2c3d4e5f6g7h8i)');
      console.log('5. Adicione ao .env:');
      console.log('   GOOGLE_SEARCH_API_KEY=sua_google_api_key_aqui');
      console.log('   GOOGLE_SEARCH_CX=seu_cx_id_aqui\n');
      
    } else {
      console.log('⚠️ Erro inesperado. Detalhes completos:');
      console.log(JSON.stringify(errorData, null, 2));
    }
  }
}

checkAPIStatus();
