"""Pool de chaves Groq (GROQ_API_KEYS ou GROQ_API_KEY) — rotação em rate limit."""
import os
import threading
import time
from typing import List, Optional


def parse_groq_keys() -> List[str]:
    raw = os.environ.get("GROQ_API_KEYS") or os.environ.get("GROQ_API_KEY", "")
    return [k.strip() for k in raw.split(",") if k.strip()]


def has_groq_keys() -> bool:
    return len(parse_groq_keys()) > 0


def _retryable(exc: BaseException) -> bool:
    msg = str(exc).lower()
    return any(
        token in msg
        for token in (
            "rate",
            "limit",
            "429",
            "quota",
            "overloaded",
            "capacity",
            "invalid api key",
            "authentication",
            "401",
            "403",
        )
    )


class GroqKeyPool:
    def __init__(self) -> None:
        self._keys: List[str] = parse_groq_keys()
        self._index = 0
        self._failed: set[int] = set()
        self._failed_since = time.time()
        self._lock = threading.Lock()

    def reload(self) -> None:
        with self._lock:
            self._keys = parse_groq_keys()
            if not self._keys:
                self._index = 0
                self._failed.clear()

    def count(self) -> int:
        return len(self._keys)

    def current(self) -> Optional[str]:
        with self._lock:
            if not self._keys:
                return None
            if len(self._failed) >= len(self._keys):
                if time.time() - self._failed_since > 3600:
                    self._failed.clear()
                    self._index = 0
                    self._failed_since = time.time()
                else:
                    return None
            attempts = 0
            while self._index in self._failed and attempts < len(self._keys):
                self._index = (self._index + 1) % len(self._keys)
                attempts += 1
            if attempts >= len(self._keys):
                return None
            return self._keys[self._index]

    def mark_failed(self, key: Optional[str]) -> None:
        if not key:
            return
        with self._lock:
            try:
                idx = self._keys.index(key)
            except ValueError:
                return
            self._failed.add(idx)

    def rotate(self) -> Optional[str]:
        with self._lock:
            if not self._keys:
                return None
            self._index = (self._index + 1) % len(self._keys)
        return self.current()


_pool = GroqKeyPool()


def current_groq_key() -> Optional[str]:
    return _pool.current()


def mark_groq_key_failed(key: Optional[str]) -> None:
    _pool.mark_failed(key)


def rotate_groq_key() -> Optional[str]:
    return _pool.rotate()


def groq_key_retryable(exc: BaseException) -> bool:
    return _retryable(exc)
