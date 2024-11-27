from ..graph.state import AgentState


async def go_back(state: AgentState):
    page = state["page"]
    await page.go_back()
    return {"observation": f"I navigated back a page to {page.url}."}
