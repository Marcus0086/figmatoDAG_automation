import os

from typing import Optional
from playwright.async_api import (
    async_playwright,
    Page,
    BrowserContext as PlaywrightContext,
)

from .constants import USER_AGENT, BROWSER_ARGS


class Browser:
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(Browser, cls).__new__(cls)
            cls.context: Optional[PlaywrightContext] = None
            cls.page: Optional[Page] = None
        return cls._instance

    async def start_browser(self):
        if self.page is None:
            playwright = await async_playwright().start()
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
