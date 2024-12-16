import json
import logging
import asyncio

from ..main import Browser
from ..graph.graph import graph
from ..schema import BrowserRequest
from ..agent import summary_llm
from .utils import get_product_knowledge

logger = logging.getLogger("browser_agent")
logger.setLevel(logging.DEBUG)

if not logger.handlers:
    handler = logging.StreamHandler()
    formatter = logging.Formatter(
        "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
    )
    handler.setFormatter(formatter)
    logger.addHandler(handler)

browser = Browser()


async def set_url(url: str):
    if browser.page is None:
        return {
            "success": False,
            "message": "Browser not started",
        }
    await browser.page.goto(url)
    await browser.page.wait_for_load_state("domcontentloaded")
    return {
        "success": True,
        "message": "URL set successfully",
    }


async def stream_agent(
    data: BrowserRequest,
):

    try:
        eval_data = data.model_dump()
        page = browser.page
        if page is None:
            yield "data: " + json.dumps({"error": "Failed to start browser"}) + "\n\n"
        event_stream = graph.astream(
            {
                "page": page,
                "goal": eval_data.get("query", ""),
                "ground_truth": eval_data.get("ground_truth", ""),
                "product_knowledge": get_product_knowledge(),
                "scratchpad": [],
                "title": eval_data.get("title", ""),
                "product_familiarity": eval_data.get("attributes", {}).get(
                    "productFamiliarity", "NOVICE"
                ),
                "patience": eval_data.get("attributes", {}).get("patience", 0),
                "tech_savviness": eval_data.get("attributes", {}).get(
                    "techSavviness", "LOW"
                ),
                "domain_familiarity": eval_data.get("attributes", {}).get(
                    "domainFamiliarity", "NOVICE"
                ),
                "industry_expertise": eval_data.get("attributes", {}).get(
                    "industryExpertise", "LOW"
                ),
                "retry_count": 0,
            },
            {"recursion_limit": eval_data.get("max_steps", 150)},
        )

        steps = []
        patience_level = eval_data.get("attributes", {}).get("patience", 0)
        patience_threshold = {0: 3, 0.5: 6, 1: 9}
        max_retries = patience_threshold.get(patience_level, 3)
        async for event in event_stream:
            state = event.get("reaccess_tool_agent", {})
            pred = state.get("prediction", {})
            action = pred.get("action")
            before_annotated_img = state.get("before_annotated_img")
            img = state.get("img")
            action_input = pred.get("args")
            rationale = pred.get("rationale", "No rationale provided")
            ux_law_summary = state.get("ux_score")
            if action and before_annotated_img and img and action_input:
                step_info = {
                    "step": len(steps) + 1,
                    "action": action,
                    "action_input": action_input,
                    "rationale": rationale,
                    "before_annotated_img": before_annotated_img,
                    "img": img,
                    "ux_law_summary": ux_law_summary,
                }

                steps.append(step_info)

                yield "data: " + json.dumps(step_info) + "\n\n"
                await asyncio.sleep(0.1)

            verification_state = event.get("verification_agent", {})
            goal_verification_result = verification_state.get(
                "goal_verification_result", {}
            ).get("is_achieved", False)
            retry_count = verification_state.get("retry_count", 0)
            if goal_verification_result or retry_count >= max_retries:
                yield "data: " + json.dumps({"type": "generating_summary"}) + "\n\n"
                await asyncio.sleep(0.1)

            analyse_state = event.get("analyse", {})
            summary = analyse_state.get("summary", "")
            if len(summary) > 0:
                final_response = {
                    "type": "final",
                    "answer": summary,
                }
                yield "data: " + json.dumps(final_response) + "\n\n"
    except Exception as e:
        yield "data: " + json.dumps({"error": str(e)}) + "\n\n"
