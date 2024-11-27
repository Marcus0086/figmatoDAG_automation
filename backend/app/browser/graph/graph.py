import json

from langchain_core.runnables import RunnableLambda

from langgraph.graph import END, START, StateGraph

from .state import AgentState
from .utils import update_scratchpad
from ..agent import agent, completion_agent
from ..tools.click import click
from ..tools.go_back import go_back
from ..tools.navigation import to_google
from ..tools.scroll import scroll
from ..tools.type import type_text
from ..tools.wait import wait
from ..graph.state import GoalVerificationResult, Evidence
from typing import Dict, Any

graph_builder = StateGraph(AgentState)


graph_builder.add_node("agent", agent)
graph_builder.add_edge(START, "agent")


graph_builder.add_node("update_scratchpad", update_scratchpad)
graph_builder.add_edge("update_scratchpad", "agent")


async def goal_achieved(state: AgentState):
    goal = state["input"]
    scratchpad = state["scratchpad"]
    page = state["page"]
    result = await completion_agent.ainvoke(
        {"goal": goal, "scratchpad": scratchpad, "page": page}
    )
    goal_verification_result = result.get("goal_verification_result", {})
    state["goal_verification_result"] = GoalVerificationResult(
        is_achieved=goal_verification_result.get("is_achieved", False)
    )
    return state


# Tool result handler
def handle_tool_result(result: Dict[str, Any]) -> Dict[str, Any]:
    """Handle tool execution results and map to state updates"""
    if isinstance(result, str):
        # Handle string results
        return {"observation": result}
    elif isinstance(result, dict):
        # Handle dictionary results, preserving all state updates
        state_updates = {}
        if "observation" in result:
            state_updates["observation"] = result["observation"]
        # Copy any other state updates
        if "goal_verification_result" in result:
            state_updates["goal_verification_result"] = result[
                "goal_verification_result"
            ]
        return state_updates


tools = {
    "Click": click,
    "Type": type_text,
    "Scroll": scroll,
    "Wait": wait,
    "GoBack": go_back,
    "Google": to_google,
    "CheckGoalAchieved": goal_achieved,
}

for node_name, tool in tools.items():
    graph_builder.add_node(node_name, RunnableLambda(tool) | handle_tool_result)
    graph_builder.add_edge(node_name, "update_scratchpad")


def select_tool(state: AgentState):
    action = state["prediction"]["action"]
    if action == "retry":
        return "agent"
    return action


graph_builder.add_conditional_edges("agent", select_tool)

graph = graph_builder.compile()
