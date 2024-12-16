from ..graph.state import AgentState
from ..service.mark_page import mark_page


async def click(state: AgentState):
    page = state["page"]
    element = ""
    click_args = state["prediction"]["args"]
    if click_args is None or len(click_args) != 1:
        return {
            "observation": f"Failed to click bounding box labeled as number {click_args}"
        }
    bbox_id = click_args[0]
    bbox_id = int(bbox_id)
    try:
        bbox = state["bboxes"][bbox_id]
        element = bbox["text"]
    except Exception:
        return {"observation": f"Error: no bbox for {element} ({bbox_id})"}
    selector = bbox.get("selector", "")
    await page.click(selector=selector)
    await page.wait_for_timeout(2000)
    marked_page = await mark_page.with_retry().ainvoke(state["page"])
    return {"observation": f"I have clicked on {element} ({bbox_id})", **marked_page}
