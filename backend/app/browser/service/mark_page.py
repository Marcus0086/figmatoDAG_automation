import asyncio
import pathlib

from playwright.async_api import Page
from langchain_core.runnables import chain as chain_decorator

from .s3_client import S3Client

mark_page_script = ""
mark_page_script_path = pathlib.Path(__file__).parent.parent / "markPage.js"

try:
    with open(mark_page_script_path, "r") as f:
        mark_page_script = f.read()
except FileNotFoundError:
    print(f"Could not find {mark_page_script_path}")
    pass

s3_client = S3Client()


@chain_decorator
async def mark_page(page: Page):
    await page.evaluate(mark_page_script)
    before_annotated_img = await page.screenshot(type="png")
    for _ in range(10):
        try:
            bboxes = await page.evaluate("markPage()")
            break
        except Exception:
            # May be loading...
            await asyncio.sleep(3)
    screenshot = await page.screenshot(type="png")
    # Ensure the bboxes don't follow us around
    await page.evaluate("unmarkPage()")

    before_annotated_img_url = await s3_client.upload_image(
        before_annotated_img, "manual", "before_annotated_img"
    )
    img_url = await s3_client.upload_image(screenshot, "manual", "img")
    return {
        "before_annotated_img": before_annotated_img_url,
        "img": img_url,
        "bboxes": bboxes,
    }
