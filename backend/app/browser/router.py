from fastapi import APIRouter
from fastapi.responses import StreamingResponse

from .schema import BrowserRequest, SetUrlRequest
from .service.agent import stream_agent, set_url

router = APIRouter()


@router.post("/browser/set-url")
async def set_url_handler(request: SetUrlRequest):
    return await set_url(request.url)


@router.post("/browser/run")
async def run_browser_handler(request: BrowserRequest):
    return StreamingResponse(
        stream_agent(request),
        media_type="text/event-stream",
    )
