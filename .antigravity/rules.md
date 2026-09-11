# Antigravity Workspace Rules — Alygen CRM

This document contains rules and conventions to be followed strictly during codebase development, updates, and maintenance.

---

## 1. Directory Structure Enforcement
Any new backend Python code must strictly align with the modular layered structure:
- **`backend_python/config/`**: Environment, configurations, cache managers, and API budget limits.
- **`backend_python/core/`**: Deep mathematical algorithms (NumPy Q-Score, RandomForest models, Selectolax parses).
- **`backend_python/services/`**: Integration services (Playwright scrapers, PDF compilers, LangChain agents).
- **`backend_python/workers/`**: Job queue consumers, background task schedules.
- **`backend_python/main.py`**: Unified entrypoint, ASGI FastAPI server on Port `3003`.

---

## 2. Python Development Standards (v3.12+)
- **Strict Typing:** Always use typing annotations (`from typing import List, Dict, Optional, Any`).
- **Pydantic Validation:** All incoming and outgoing request payloads must be validated using `Pydantic v2` BaseModel schemas.
- **No Incomplete Code:** Never leave `"TODO"` comments or placeholder files. Code must be fully implemented, with exceptions handled.
- **Asynchronous Flow:** Use `async/await` for network requests (via `httpx`), database transactions, or external API tasks to maintain high concurrency.

---

## 3. High Performance & Cost Optimization Rules
- **Deterministic Caching:** Every heavy technical website check, scraping task, or API call must pass through a cache lookup. Cache keys should be generated deterministically (e.g., lowercase MD5/SHA256 of the target URL or payload).
- **GCP Cost Limits:** Keep Cloud Run scale-to-zero enabled. Optimize startup latency. Avoid storing state in-memory that cannot recover from cold restarts.
- **No Expensive APIs:** Use free, localized crawlers (like Playwright for Google search and scraping) wherever possible rather than high-cost paid services.
