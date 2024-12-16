import os

from typing import Optional
from playwright.async_api import (
    async_playwright,
    Page,
    BrowserContext as PlaywrightContext,
)

from .constants import USER_AGENT, BROWSER_ARGS


CONNECTION_TIMEOUT = 30000


class Browser:
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(Browser, cls).__new__(cls)
            cls.context: Optional[PlaywrightContext] = None
            cls.page: Optional[Page] = None
        return cls._instance

    async def start_browser(self, browser_ws_endpoint: Optional[str] = None):
        try:
            if self.page and self.context and self.browser:
                await self.page.evaluate("1")
                return self.page
        except Exception:
            self.page = None
            self.context = None
            self.browser = None

        playwright = await async_playwright().start()

        # If browser_ws_endpoint is provided, always try to connect to existing Chrome
        if browser_ws_endpoint:
            try:
                self.browser = await playwright.chromium.connect(
                    ws_endpoint=browser_ws_endpoint,
                    timeout=CONNECTION_TIMEOUT,
                    slow_mo=1000,
                )
                # Use existing context from the running browser
                context = await self.browser.new_context(
                    accept_downloads=True,
                    device_scale_factor=1,
                    locale="en-US",
                    timezone_id="America/New_York",
                    ignore_https_errors=True,
                    viewport={"width": 1250, "height": 800},
                    permissions=["geolocation", "notifications"],
                    bypass_csp=True,
                )
                self.context = context

                # Create a new page in the existing context
                self.page = await self.context.new_page()
                self.page.set_default_navigation_timeout(60000)
                await self.page.goto("https://www.google.com")
                await self.page.wait_for_load_state("domcontentloaded")
                return self.page
            except Exception as e:
                print(f"Failed to connect to existing browser: {e}")
                # Optionally fall back to launching new browser
                raise

        # Launch new browser if no endpoint provided
        self.browser = await playwright.chromium.launch(
            headless=False, args=BROWSER_ARGS
        )
        self.context = await self.browser.new_context(
            accept_downloads=True,
            device_scale_factor=1,
            locale="en-US",
            timezone_id="America/New_York",
            ignore_https_errors=True,
            viewport={"width": 1250, "height": 800},
            permissions=["geolocation", "notifications"],
            bypass_csp=True,
        )
        await self.context.add_init_script(
            """
            Object.defineProperty(navigator, 'webdriver', {get: () => undefined});
            Object.defineProperty(navigator, 'languages', {get: () => ['en-US', 'en']});
            Object.defineProperty(navigator, 'plugins', {get: () => [1, 2, 3, 4, 5]});
            delete window.__playwright;
            delete window.__pw_manual;
            delete window.__PW_inspect;
            Object.defineProperty(navigator, 'headless', {get: () => false});
            const originalQuery = window.navigator.permissions.query;
            window.navigator.permissions.query = (parameters) => 
                parameters.name === 'notifications' 
                    ? Promise.resolve({state: Notification.permission})
                    : originalQuery(parameters);
        """
        )
        self.page = await self.browser.new_page()

        self.page.set_default_navigation_timeout(60000)
        await self.page.goto("https://www.google.com")
        await self.page.wait_for_load_state("domcontentloaded")
        return self.page

    async def close_browser(self):
        await self.browser.close()
