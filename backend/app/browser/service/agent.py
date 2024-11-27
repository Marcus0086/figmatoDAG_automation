from ..main import Browser
from ..graph.graph import graph
import json
import asyncio

from ..schema import BrowserRequest
from ..agent import summary_llm

browser = Browser()


async def stream_agent(
    data: BrowserRequest,
):

    try:
        eval_data = data.model_dump()
        page = browser.page
        if page is None:
            yield "data: " + json.dumps({"error": "Failed to start browser"}) + "\n\n"
        url = eval_data.get("url")
        if url:
            await page.goto(url)
        event_stream = graph.astream(
            {
                "page": page,
                "input": eval_data.get("query", ""),
                "scratchpad": [],
                "title": eval_data.get("title", ""),
                "product_familiarity": eval_data.get("attributes", {}).get(
                    "productFamiliarity", 0
                ),
                "patience": eval_data.get("attributes", {}).get("patience", 0),
                "tech_savviness": eval_data.get("attributes", {}).get(
                    "techSavviness", 0
                ),
            },
            {"recursion_limit": eval_data.get("max_steps", 150)},
        )

        steps = []
        async for event in event_stream:
            if "agent" not in event:
                continue

            pred = event["agent"].get("prediction", {})
            action = pred.get("action")
            before_annotated_img = event.get("agent", {}).get("before_annotated_img")
            img = event.get("agent", {}).get("img")
            action_input = pred.get("args")
            goal_verification_result = event.get("agent", {}).get(
                "goal_verification_result", {}
            )
            scratchpad = event.get("agent", {}).get("scratchpad", [])
            step_info = {
                "step": len(steps) + 1,
                "action": action,
                "action_input": action_input,
                "rationale": pred.get("rationale", "No rationale provided"),
                "before_annotated_img": before_annotated_img,
                "img": img,
            }

            steps.append(step_info)
            yield "data: " + json.dumps(step_info) + "\n\n"
            await asyncio.sleep(0.1)

            if goal_verification_result.get("is_achieved"):
                try:
                    yield "data: " + json.dumps({"type": "generating_summary"}) + "\n\n"
                    summary = await summary_llm.ainvoke(
                        {
                            "goal": eval_data.get("query", ""),
                            "scratchpad": scratchpad,
                            "img": img,
                        }
                    )
                    final_response = {
                        "type": "final",
                        "answer": summary,
                    }
                    yield "data: " + json.dumps(final_response) + "\n\n"
                    break
                except json.JSONDecodeError:
                    yield "data: " + json.dumps(
                        {"error": "Failed to parse completion response"}
                    ) + "\n\n"
                    break
    except Exception as e:
        yield "data: " + json.dumps({"error": str(e)}) + "\n\n"
