"""Evals market-intel (sem Groq live): fallback + cases.jsonl + critic."""
import json
from pathlib import Path

from services.agent_graph import _critic_pass, run_graceful_fallback

CASES_PATH = Path(__file__).parent / "cases.jsonl"


def _load_cases():
    cases = []
    if not CASES_PATH.exists():
        return cases
    for line in CASES_PATH.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line:
            continue
        cases.append(json.loads(line))
    return cases


def test_fallback_no_fictitious_competitor_names():
    result = run_graceful_fallback("Acme Lda", "Lisboa", "advogados")
    assert result["success"] is True
    assert result["competitors"] == []
    assert result.get("degraded") is True
    text = result["intel"].lower()
    banned = ["grupo x regional", "pro lisboa", " pro "]
    for phrase in banned:
        assert phrase not in text


def test_cases_jsonl_minimum_count():
    cases = _load_cases()
    assert len(cases) >= 10


def test_cases_jsonl_fallback_critic_rules():
    for case in _load_cases():
        result = run_graceful_fallback(case["name"], case["city"], case["sector"])
        assert result["success"] is True
        intel = result.get("intel") or ""
        assertions = case.get("assertions") or {}
        if assertions.get("no_placeholders"):
            ok, reason = _critic_pass(intel)
            assert ok, f"{case['name']}: critic failed ({reason})"
        max_sent = assertions.get("max_sentences", 4)
        sentences = [s for s in intel.replace("!", ".").replace("?", ".").split(".") if s.strip()]
        assert len(sentences) <= max_sent + 1, f"{case['name']}: too many sentences"
