import platform

from ..graph.state import AgentState


async def type_text(state: AgentState):
    page = state["page"]
    element = ""
    type_args = state["prediction"]["args"]
    if type_args is None or len(type_args) != 2:
        return {
            "observation": f"Failed to type in element from bounding box labeled as number {type_args}"
        }
    bbox_id = type_args[0]
    bbox_id = int(bbox_id)
    bbox = state["bboxes"][bbox_id]
    element = bbox["text"]
    x, y = bbox["x"], bbox["y"]
    text_content = type_args[1]
    await page.mouse.click(x, y)
    # Check if MacOS
    select_all = "Meta+A" if platform.system() == "Darwin" else "Control+A"
    await page.keyboard.press(select_all)
    await page.keyboard.press("Backspace")
    await page.keyboard.type(text_content)
    await page.keyboard.press("Enter")
    return {"observation": f"I am typing {text_content} and submitting into {element}"}
