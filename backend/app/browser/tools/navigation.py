from ..graph.state import AgentState


async def to_google(state: AgentState):
    page = state["page"]
    await page.goto("https://www.google.com/")
    return {"observation": "I have navigated to google.com."}
