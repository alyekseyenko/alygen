import os
import logging
from dotenv import load_dotenv

# Carregar ambiente
env_path = os.path.join(os.path.dirname(__file__), '..', 'backend', '.env')
load_dotenv(env_path)

logging.basicConfig(level=logging.INFO)
log = logging.getLogger('test-agent')

try:
    from agent_rag import run_market_intel
    
    print("🚀 Testando Agentic AI (Market Intel)...")
    result = run_market_intel(
        name="1638 Restaurant",
        city="Lisboa",
        sector="restauração",
        website="https://www.1638restaurant.com/"
    )
    
    if result.get('success'):
        print("\n✅ SUCESSO!")
        print(f"RESUMO: {result.get('intel')}")
    else:
        print("\n❌ FALHA NO AGENTE:")
        print(f"ERRO: {result.get('error')}")

except Exception as e:
    print(f"\n💥 ERRO CRÍTICO NO SCRIPT DE TESTE: {e}")
    import traceback
    traceback.print_exc()
