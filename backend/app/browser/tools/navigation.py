from ..graph.state import AgentState


async def to_google(state: AgentState):
    page = state["page"]
    await page.goto("https://www.google.com/")
    return {"observation": "I navigated to google.com."}
