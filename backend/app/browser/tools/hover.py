import logging

from ..graph.state import AgentState
from ..service.mark_page import mark_page

logger = logging.getLogger("browser_agent")
logger.setLevel(logging.DEBUG)

if not logger.handlers:
    handler = logging.StreamHandler()
    formatter = logging.Formatter(
        "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
    )
    handler.setFormatter(formatter)
    logger.addHandler(handler)


async def hover(state: AgentState):
    page = state["page"]
    element = ""
    hover_args = state["prediction"]["args"]
    if hover_args is None or len(hover_args) < 1:
        logger.info(f"Failed to hover on bounding box labeled as number {hover_args}")
    bbox_id = hover_args[0]
    bbox_id = int(bbox_id)
    try:
        bbox = state["bboxes"][bbox_id]
        element = bbox["text"]
        selector = bbox["selector"]
    except Exception:
        logger.info(f"Error: no bbox for {element} ({bbox_id})")

    await page.hover(selector=selector)
    await page.wait_for_timeout(2000)

    marked_page = await mark_page.with_retry().ainvoke(state["page"])
    logger.info(f"I have hovered on {element} ({bbox_id})")
    return {
        **marked_page,
    }
