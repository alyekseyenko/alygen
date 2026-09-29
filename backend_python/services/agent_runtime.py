"""Runtime único de agentes Alygen — delega para agent_orchestration."""
from services.agent_orchestration import run_multitask_intel, run_graceful_fallback

__all__ = ["run_multitask_intel", "run_graceful_fallback"]
