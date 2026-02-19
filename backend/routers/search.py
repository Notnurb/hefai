"""
Search Router — Dual Web Search (xAI + Exa)
"""

from typing import Optional
from pydantic import BaseModel
from fastapi import APIRouter

from services.search_service import search_xai, search_exa, search_combined

router = APIRouter()


class SearchRequest(BaseModel):
    query: str
    num_results: int = 10
    category: Optional[str] = None


@router.post("/xai")
async def api_search_xai(req: SearchRequest):
    """Search the web via xAI (Grok + web_search tool)."""
    results = await search_xai(req.query, req.num_results)
    return {"source": "xai", "results": results, "count": len(results)}


@router.post("/firecrawl")
async def api_search_firecrawl(req: SearchRequest):
    """Search the web via Firecrawl."""
    from services.search_service import search_firecrawl
    results = await search_firecrawl(req.query, req.num_results)
    return {"source": "firecrawl", "results": results, "count": len(results)}


@router.post("/combined")
async def api_search_combined(req: SearchRequest):
    """Run dual search (xAI + Exa) in parallel, merge and deduplicate results."""
    result = await search_combined(req.query, req.num_results, req.category)
    return result
