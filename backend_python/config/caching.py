import sqlite3
import hashlib
import json
import os
import time
from typing import Optional, Any
from .settings import settings

class DeterministicCache:
    def __init__(self):
        self.db_path = os.path.join(settings.CACHE_DIR, "deterministic_cache.db")
        self._init_db()

    def _init_db(self):
        with sqlite3.connect(self.db_path) as conn:
            conn.execute("""
                CREATE TABLE IF NOT EXISTS cache (
                    key TEXT PRIMARY KEY,
                    value TEXT,
                    timestamp REAL
                )
            """)
            conn.commit()

    def _make_key(self, identifier: str) -> str:
        # Chave determinística lowercase MD5
        return hashlib.md5(identifier.lower().strip().encode('utf-8')).hexdigest()

    def get(self, identifier: str, max_age_days: int = 14) -> Optional[Any]:
        key = self._make_key(identifier)
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                cursor.execute("SELECT value, timestamp FROM cache WHERE key = ?", (key,))
                row = cursor.fetchone()
                if row:
                    value_str, timestamp = row
                    if time.time() - timestamp < (max_age_days * 86400):
                        return json.loads(value_str)
        except Exception:
            pass
        return None

    def set(self, identifier: str, value: Any):
        key = self._make_key(identifier)
        try:
            value_str = json.dumps(value)
            with sqlite3.connect(self.db_path) as conn:
                conn.execute(
                    "INSERT OR REPLACE INTO cache (key, value, timestamp) VALUES (?, ?, ?)",
                    (key, value_str, time.time())
                )
                conn.commit()
        except Exception:
            pass

cache = DeterministicCache()
