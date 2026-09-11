// TESTE RÁPIDO - Cole no console do navegador (F12)

async function testarMultiPage() {
  const url = 'https://example.com'; // Altere para o site que está testando
  
  console.log('🧪 Testando multi-page...');
  
  try {
    const response = await fetch('http://localhost:3001/api/analyze-multipage', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url })
    });
    
    const data = await response.json();
    
    console.log('✅ Resposta:', data);
    
    if (data.success) {
      console.log('📊 Páginas encontradas:', data.data.discovery.pages);
      console.log('📈 Performance média:', data.data.analysis.summary.avgPerformance);
    }
  } catch (error) {
    console.error('❌ Erro:', error);
  }
}

// Execute:
testarMultiPage();
