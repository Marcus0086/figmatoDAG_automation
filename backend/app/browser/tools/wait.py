import asyncio

from ..graph.state import AgentState


async def wait(state: AgentState):
    sleep_time = 10
    await asyncio.sleep(sleep_time)
    return {"observation": f"I have waited for {sleep_time}s."}
