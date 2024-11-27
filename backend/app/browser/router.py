from fastapi import APIRouter
from fastapi.responses import StreamingResponse

from .schema import BrowserRequest
from .service.agent import stream_agent

router = APIRouter()


@router.post("/browser")
async def run_browser(request: BrowserRequest):
    return StreamingResponse(
        stream_agent(request),
        media_type="text/event-stream",
    )
