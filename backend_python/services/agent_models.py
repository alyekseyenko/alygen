"""Structured outputs for market-intel LangGraph nodes."""
from typing import List

from pydantic import BaseModel, Field


class CompetitorItem(BaseModel):
    name: str = Field(min_length=2, max_length=80)
    source_url: str = Field(default="", max_length=500)


class CompetitorSet(BaseModel):
    competitors: List[CompetitorItem] = Field(default_factory=list, max_length=5)


class StrategyBrief(BaseModel):
    gaps: List[str] = Field(default_factory=list, max_length=5)
    sales_hook: str = Field(min_length=20, max_length=600)
    evidence: List[str] = Field(default_factory=list, max_length=5)


class VerdictOutput(BaseModel):
    verdict: str = Field(
        min_length=40,
        max_length=1200,
        description="Parágrafo persuasivo em PT-PT, máximo 4 frases, fórmula Alygen",
    )
    competitors_mentioned: List[str] = Field(default_factory=list, max_length=5)
