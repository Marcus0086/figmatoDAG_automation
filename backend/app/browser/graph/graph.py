from langchain_core.runnables import RunnableLambda
from typing import Dict, Any
from langgraph.graph import END, START, StateGraph

from .state import AgentState
from .utils import (
    update_scratchpad,
    update_max_retries,
    verify_goal_after_action,
    select_next_action,
    handle_tool_result,
    select_tool,
)
from ..agent import (
    agent,
    completion_agent,
    ux_agent,
    ranking_agent,
    summary_llm,
    ux_score_llm,
)
from ..tools.click import click
from ..tools.go_back import go_back
from ..tools.navigation import to_google
from ..tools.scroll import scroll
from ..tools.type import type_text
from ..tools.wait import wait
from ..tools.hover import hover
from ..tools.click_anywhere import click_anywhere
from ..tools.select_text import select_text


graph_builder = StateGraph(AgentState)

graph_builder.add_node("ux_agent", ux_agent)
graph_builder.add_node("ux_score_agent", ux_score_llm)
graph_builder.add_node("hover_ux_agent", ux_agent)
graph_builder.add_node("ranking_agent", ranking_agent)
graph_builder.add_node("reranking_agent", ranking_agent)
graph_builder.add_node("verification_agent", completion_agent)
graph_builder.add_node("agent", agent)
graph_builder.add_node("reaccess_tool_agent", agent)
graph_builder.add_node("analyse", summary_llm)
graph_builder.add_node("select_next_action", select_next_action)
graph_builder.add_node("select_reranked_action", select_next_action)
graph_builder.add_node("update_scratchpad", update_scratchpad)
graph_builder.add_node("update_max_retries", update_max_retries)
graph_builder.add_node("Hover", hover)

graph_builder.add_edge(START, "ux_agent")
graph_builder.add_edge("ux_agent", "ux_score_agent")
graph_builder.add_edge("ux_score_agent", "ranking_agent")
graph_builder.add_edge("ranking_agent", "select_next_action")
graph_builder.add_edge("select_next_action", "agent")
graph_builder.add_edge("agent", "Hover")
graph_builder.add_edge("Hover", "hover_ux_agent")
graph_builder.add_edge("hover_ux_agent", "reranking_agent")
graph_builder.add_edge("reranking_agent", "select_reranked_action")
graph_builder.add_edge("select_reranked_action", "reaccess_tool_agent")
graph_builder.add_edge("update_max_retries", "ux_agent")
graph_builder.add_edge("update_scratchpad", "verification_agent")
graph_builder.add_edge("analyse", END)


tools = {
    "ClickAnywhere": click_anywhere,
    "Click": click,
    "Type": type_text,
    "Scroll": scroll,
    "Wait": wait,
    "GoBack": go_back,
    "Google": to_google,
    "SelectText": select_text,
}

for node_name, tool in tools.items():
    graph_builder.add_node(node_name, RunnableLambda(tool) | handle_tool_result)
    graph_builder.add_edge(node_name, "update_scratchpad")


graph_builder.add_conditional_edges("reaccess_tool_agent", select_tool)
graph_builder.add_conditional_edges("verification_agent", verify_goal_after_action)

graph = graph_builder.compile()
