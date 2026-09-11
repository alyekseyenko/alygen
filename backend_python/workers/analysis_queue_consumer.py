import asyncio
import logging
from typing import Dict, Any
from services.stealth_scraper import deep_scrape_website

log = logging.getLogger("alygen-python")

class AnalysisQueueConsumer:
    def __init__(self):
        self.queue: asyncio.Queue = asyncio.Queue()
        self.running = False
        self.results: Dict[str, Any] = {}

    async def add_to_queue(self, lead_id: str, url: str):
        await self.queue.put((lead_id, url))
        log.info(f"📥 Enfileirado Lead ID: {lead_id} para URL: {url}")

    async def start(self):
        if self.running:
            return
        self.running = True
        asyncio.create_task(self._consume())
        log.info("⚙️ Worker de Fila de Análise iniciado com sucesso.")

    async def _consume(self):
        while self.running:
            try:
                lead_id, url = await self.queue.get()
                log.info(f"🚀 A processar Lead {lead_id} em background...")
                
                # Executar análise assíncrona
                data = await deep_scrape_website(url)
                self.results[lead_id] = {
                    "status": "completed",
                    "data": data
                }
                
                self.queue.task_done()
            except Exception as e:
                log.error(f"❌ Erro no Worker de processamento: {e}")
                await asyncio.sleep(2)

analysis_worker = AnalysisQueueConsumer()
