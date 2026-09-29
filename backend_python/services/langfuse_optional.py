"""Optional Langfuse tracing when LANGFUSE_* env vars are set."""
import os
from typing import Any, List, Optional

_handler: Any = None


def get_langfuse_handler() -> Optional[Any]:
    global _handler
    if _handler is not None:
        return _handler
    if not os.environ.get("LANGFUSE_PUBLIC_KEY") or not os.environ.get("LANGFUSE_SECRET_KEY"):
        return None
    try:
        from langfuse.callback import CallbackHandler

        _handler = CallbackHandler(
            public_key=os.environ["LANGFUSE_PUBLIC_KEY"],
            secret_key=os.environ["LANGFUSE_SECRET_KEY"],
            host=os.environ.get("LANGFUSE_HOST", "https://cloud.langfuse.com"),
        )
        return _handler
    except Exception:
        return None


def langfuse_config() -> dict:
    h = get_langfuse_handler()
    if not h:
        return {}
    return {"callbacks": [h]}
