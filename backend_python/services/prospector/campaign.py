"""Run prospector campaigns with pre-qualification."""
from typing import Any, Dict, List, Optional

from services.prospector.providers import get_provider


def prequalify(
    candidate: Dict[str, Any],
    min_rating: float = 0,
    min_reviews: int = 0,
    sector_allowlist: Optional[List[str]] = None,
) -> Dict[str, Any]:
    website = (candidate.get("website") or "").strip()
    if not website:
        candidate["qualification"] = "SEM WEBSITE"
        candidate["skip_audit"] = True
        return candidate
    rating = float(candidate.get("rating") or 0)
    reviews = int(candidate.get("reviews") or 0)
    if rating < min_rating or reviews < min_reviews:
        candidate["qualification"] = "LOW_SIGNAL"
        candidate["skip_audit"] = True
        return candidate
    if sector_allowlist:
        t = (candidate.get("type") or "").lower()
        if not any(s.lower() in t for s in sector_allowlist):
            candidate["qualification"] = "SECTOR_MISMATCH"
            candidate["skip_audit"] = True
            return candidate
    candidate["qualification"] = "QUALIFIED"
    candidate["skip_audit"] = False
    return candidate


async def run_campaign(
    sector: str,
    city: str,
    provider: str = "serpapi_maps",
    min_rating: float = 0,
    min_reviews: int = 0,
    sector_allowlist: Optional[List[str]] = None,
) -> Dict[str, Any]:
    impl = get_provider(provider)
    raw = await impl.search(sector, city)
    seen_domains = set()
    seen_places = set()
    leads: List[Dict[str, Any]] = []
    for c in raw:
        pid = c.get("place_id")
        dom = c.get("domain")
        if pid and pid in seen_places:
            continue
        if dom and dom in seen_domains:
            continue
        if pid:
            seen_places.add(pid)
        if dom:
            seen_domains.add(dom)
        leads.append(prequalify(c, min_rating, min_reviews, sector_allowlist))
    return {
        "success": True,
        "count": len(leads),
        "leads": leads,
        "provider": provider,
        "sector": sector,
        "city": city,
    }
