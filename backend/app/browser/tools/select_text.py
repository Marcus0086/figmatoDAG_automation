import platform

from ..graph.state import AgentState
from ..service.mark_page import mark_page


async def select_text(state: AgentState):
    page = state["page"]
    element = ""
    select_text_args = state["prediction"]["args"]
    if select_text_args is None or len(select_text_args) < 1:
        return {
            "observation": f"Failed to select text from bounding box labeled as number {select_text_args}"
        }
    bbox_id = select_text_args[0]
    bbox_id = int(bbox_id)
    bbox = state["bboxes"][bbox_id]
    element = bbox["text"]
    selector = bbox["selector"]
    await page.click(selector=selector)
    # Check if MacOS
    select_all = "Meta+A" if platform.system() == "Darwin" else "Control+A"
    await page.keyboard.press(select_all)

    await page.wait_for_timeout(2000)

    marked_page = await mark_page.with_retry().ainvoke(state["page"])
    return {
        "observation": f"I have selected {element}",
        **marked_page,
    }
