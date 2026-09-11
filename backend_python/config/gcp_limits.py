import time
from typing import Dict, Tuple

# Simple sliding window rate-limiting for expensive API endpoints (e.g. Playwright, Groq)
class CostGuard:
    def __init__(self):
        self.request_history: Dict[str, list] = {}
        # Preços estimados de chamadas de API em euros
        self.costs_estimates = {
            "groq_call": 0.00015,
            "playwright_crawl": 0.005,
            "pagespeed_call": 0.001
        }
        self.accumulated_daily_cost: float = 0.0

    def check_rate_limit(self, client_ip: str, limit: int = 10, window_secs: int = 60) -> Tuple[bool, str]:
        """Garante que nenhum IP abusa dos endpoints pesados do Playwright/Groq."""
        now = time.time()
        if client_ip not in self.request_history:
            self.request_history[client_ip] = []
        
        # Limpar requisições fora da janela de tempo
        self.request_history[client_ip] = [t for t in self.request_history[client_ip] if now - t < window_secs]
        
        if len(self.request_history[client_ip]) >= limit:
            return False, f"Rate limit ultrapassado. Limite de {limit} análises pesadas por {window_secs}s."
            
        self.request_history[client_ip].append(now)
        return True, "Request allowed."

    def track_cost(self, operation: str):
        """Regista o custo aproximado das chamadas de API."""
        cost = self.costs_estimates.get(operation, 0.0)
        self.accumulated_daily_cost += cost

    def get_current_budget_report(self) -> dict:
        return {
            "current_daily_spend_estimate_eur": round(self.accumulated_daily_cost, 5),
            "safety_status": "GREEN" if self.accumulated_daily_cost < 10.0 else "ORANGE"
        }

cost_guard = CostGuard()
