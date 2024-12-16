from ..graph.state import AgentState


async def click_anywhere(state: AgentState):
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

    # Get element coordinates and dimensions
    x, y = bbox["x"], bbox["y"]
    top, bottom = bbox["top"], bbox["bottom"]
    height = bottom - top

    # Calculate a point below the element to click
    far_x = x
    far_y = bottom + height + 50  # Click 50px below the element's bottom

    # Click away from the element to close dropdowns/modals
    await page.mouse.click(far_x, far_y)

    return {
        "observation": f"I have clicked on {element} ({bbox_id}) to close any open dropdowns/modals"
    }
