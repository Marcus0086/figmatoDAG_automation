from typing import List

from .service.mark_page import mark_page
from .graph.state import AgentState
from .graph.utils import format_product_memory


async def annotate(state: AgentState):
    marked_page = await mark_page.with_retry().ainvoke(state["page"])
    return {**state, **marked_page}


def format_descriptions(state: AgentState):
    labels = []
    for i, bbox in enumerate(state["bboxes"]):
        text = bbox.get("text") or bbox.get("ariaLabel") or bbox.get("aria-label") or ""
        text = text.strip()
        el_type = bbox.get("type")
        labels.append(f'{i} (<{el_type}/>): "{text}"')
    bbox_descriptions = "\nValid Bounding Boxes:\n" + "\n".join(labels)
    product_memory = format_product_memory(state)
    return {**state, **product_memory, "bbox_descriptions": bbox_descriptions}


def format_verification_input(state: AgentState):
    scratchpad = state["scratchpad"]
    ground_truth_image = state["ground_truth"]["img"]
    description = state["ground_truth"].get("description", "")
    return {
        **state,
        "ground_truth_image": ground_truth_image,
        "previous_actions": " ".join([message.content for message in scratchpad]),
        "description": description if description else "",
    }


def format_summary_inputs(state: AgentState):
    scratchpad = state["scratchpad"]
    actions = " ".join([message.content for message in scratchpad])
    return {**state, "previous_actions": actions}
