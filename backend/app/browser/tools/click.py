from ..graph.state import AgentState


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
    x, y = bbox["x"], bbox["y"]
    await page.mouse.click(x, y)
    # TODO: In the paper, they automatically parse any downloaded PDFs
    # We could add something similar here as well and generally
    # improve response format.
    return {"observation": f"I am clicking {bbox_id} on {element}"}
