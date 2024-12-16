import re

from typing import Any, Dict
from langchain_core.messages import SystemMessage

from .state import AgentState


def update_scratchpad(state: AgentState):
    """After a tool is invoked, we want to update
    the scratchpad so the agent is aware of its previous steps"""
    old = state.get("scratchpad")
    if old:
        txt = old[0].content
        last_line = txt.rsplit("\n", 1)[-1]
        step = int(re.match(r"\d+", last_line).group()) + 1
    else:
        txt = "Previous action observations:\n"
        step = 1
    txt += f"\n{step}. {state["observation"]}"

    return {"scratchpad": [SystemMessage(content=txt)]}


def format_product_memory(state: AgentState):
    product_familiarity = state["product_familiarity"]
    if product_familiarity == "EXPERT":
        product_memory = f"Your product knowledge: {state['product_knowledge']}"
    else:
        product_memory = f"You have product familiarity: {product_familiarity}"
    return {**state, "product_memory": product_memory}


def format_ranking_inputs(state: AgentState):
    actions = state["actions_to_rank"]["actions"]

    available_actions = "\n".join([action["action"] for action in actions])
    product_memory = format_product_memory(state)
    return {
        **state,
        **product_memory,
        "available_actions": available_actions,
    }


def update_max_retries(state: AgentState):
    retry_count = state.get("retry_count", 0)
    return {"retry_count": retry_count + 1}


async def verify_goal_after_action(state: AgentState):
    goal_verification_result = state["goal_verification_result"]

    if goal_verification_result.get("is_achieved"):
        return "analyse"

    retry_count = state.get("retry_count", 0)
    patience_level = state.get("patience", 0.5)  # Default to medium patience if not set
    patience_threshold = {0: 3, 0.5: 6, 1: 9}

    max_retries = patience_threshold[patience_level]

    if retry_count < max_retries:
        return "update_max_retries"
    else:
        return "analyse"


def select_next_action(state: AgentState):
    ranked_actions = state.get("action_rankings", []).get("rankings")
    next_action = ranked_actions[0].get("action")
    return {"selected_action": next_action}


def handle_tool_result(result: Dict[str, Any]) -> Dict[str, Any]:
    """Handle tool execution results and map to state updates"""
    if isinstance(result, str):
        # Handle string results
        return {"observation": result}
    elif isinstance(result, dict):
        tool_result = {}
        if "observation" in result:
            return {"observation": result["observation"]}


def select_tool(state: AgentState):
    action = state["prediction"]["action"]
    if action == "retry":
        return "agent"

    return action
