import os

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .browser.router import router as browser_router
from .browser.main import Browser
from .config.config import get_settings

settings = get_settings()
browser = Browser()

os.environ["LANGCHAIN_TRACING_V2"] = "true"
os.environ["LANGCHAIN_ENDPOINT"] = settings.LANGCHAIN_ENDPOINT
os.environ["LANGCHAIN_API_KEY"] = settings.LANGCHAIN_API_KEY
os.environ["LANGCHAIN_PROJECT"] = settings.LANGCHAIN_PROJECT


@asynccontextmanager
async def browser_lifecycle(app: FastAPI):
    """
    Asynchronous context manager that manages the browser lifecycle.

    It starts the browser when the application starts and closes it when the application shuts down.

    Args:
        app (FastAPI): The FastAPI application instance.
    """

    await browser.start_browser(
        browser_ws_endpoint="ws://0.0.0.0:3000/playwright/chromium?headless=false&stealth=true"
    )
    try:
        # This `yield` allows the app to run while keeping the browser open
        yield
    except Exception as e:
        print(e)
    finally:
        # Closes the browser and clean any resource when the app stops
        await browser.close_browser()


app = FastAPI(lifespan=browser_lifecycle)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(router=browser_router, prefix="/api", tags=["browser"])


@app.get("/")
async def read_root():
    return {"Status": "Live and running"}
