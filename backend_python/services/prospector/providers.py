"""Lead discovery providers for Prospector campaigns."""
import os
import re
from abc import ABC, abstractmethod
from typing import Any, Dict, List, Optional
from urllib.parse import urlparse

import httpx


def normalize_domain(website: Optional[str]) -> str:
    if not website:
        return ""
    w = website.strip().lower()
    if not w.startswith("http"):
        w = f"https://{w}"
    try:
        host = urlparse(w).netloc.replace("www.", "")
        return host
    except Exception:
        return w.replace("www.", "")


def normalize_pt_phone(phone: Optional[str]) -> str:
    if not phone:
        return ""
    digits = re.sub(r"\D", "", phone)
    if digits.startswith("351"):
        digits = digits[3:]
    if len(digits) == 9:
        return f"+351 {digits[:3]} {digits[3:6]} {digits[6:]}"
    return phone.strip()


class LeadCandidate:
    def __init__(self, **kwargs: Any):
        self.data = kwargs

    def to_dict(self) -> Dict[str, Any]:
        return self.data


class LeadProvider(ABC):
    @abstractmethod
    async def search(self, sector: str, city: str, radius_km: float = 10) -> List[Dict[str, Any]]:
        ...


class SerpApiMapsProvider(LeadProvider):
    async def search(self, sector: str, city: str, radius_km: float = 10) -> List[Dict[str, Any]]:
        key = os.environ.get("SERPAPI_API_KEY", "")
        if not key:
            return []
        query = f"{sector} em {city}, Portugal"
        params = {
            "engine": "google_maps",
            "q": query,
            "type": "search",
            "api_key": key,
        }
        async with httpx.AsyncClient(timeout=30) as client:
            r = await client.get("https://serpapi.com/search.json", params=params)
            r.raise_for_status()
            data = r.json()
        out: List[Dict[str, Any]] = []
        for item in data.get("local_results") or []:
            website = item.get("website") or ""
            out.append({
                "title": item.get("title"),
                "phone": normalize_pt_phone(item.get("phone")),
                "website": website,
                "rating": item.get("rating"),
                "reviews": item.get("reviews"),
                "type": item.get("type") or sector,
                "address": item.get("address"),
                "place_id": item.get("place_id"),
                "domain": normalize_domain(website),
            })
        return out


class GooglePlacesProvider(LeadProvider):
    async def search(self, sector: str, city: str, radius_km: float = 10) -> List[Dict[str, Any]]:
        key = os.environ.get("GOOGLE_PLACES_API_KEY", "")
        if not key:
            return []
        text_query = f"{sector} in {city}, Portugal"
        headers = {
            "Content-Type": "application/json",
            "X-Goog-Api-Key": key,
            "X-Goog-FieldMask": "places.displayName,places.formattedAddress,places.websiteUri,places.nationalPhoneNumber,places.rating,places.userRatingCount,places.id,places.types",
        }
        body = {"textQuery": text_query, "languageCode": "pt-PT"}
        async with httpx.AsyncClient(timeout=30) as client:
            r = await client.post(
                "https://places.googleapis.com/v1/places:searchText",
                headers=headers,
                json=body,
            )
            r.raise_for_status()
            data = r.json()
        out: List[Dict[str, Any]] = []
        for place in data.get("places") or []:
            website = place.get("websiteUri") or ""
            name = (place.get("displayName") or {}).get("text", "")
            out.append({
                "title": name,
                "phone": normalize_pt_phone(place.get("nationalPhoneNumber")),
                "website": website,
                "rating": place.get("rating"),
                "reviews": place.get("userRatingCount"),
                "type": sector,
                "address": place.get("formattedAddress"),
                "place_id": place.get("id"),
                "domain": normalize_domain(website),
            })
        return out


def get_provider(name: str) -> LeadProvider:
    if name == "google_places":
        return GooglePlacesProvider()
    return SerpApiMapsProvider()
