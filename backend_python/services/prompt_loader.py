import os
from pathlib import Path
from typing import Any, Dict, Optional

import yaml

PROMPTS_DIR = Path(__file__).resolve().parent.parent / "prompts"


def load_prompt(name: str) -> Optional[Dict[str, Any]]:
    path = PROMPTS_DIR / f"{name}.yaml"
    if not path.exists():
        return None
    with open(path, "r", encoding="utf-8") as f:
        return yaml.safe_load(f)


def format_prompt_block(block: str, variables: Dict[str, str]) -> str:
    text = block or ""
    for key, val in variables.items():
        text = text.replace("{" + key + "}", str(val))
    return text
