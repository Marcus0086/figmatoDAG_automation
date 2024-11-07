import { chromium, Browser, Page, BrowserContext } from "playwright";

import { USER_AGENT, BROWSER_ARGS } from "@/lib/constants";
import { Edge, Graph } from "@/lib/graph";

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

class Automation {
  private static instance: Automation | null = null;
  private browser: Browser | null = null;
  private context: BrowserContext | null = null;
  private page: Page | null = null;

  private constructor() {}

  public static async getInstance(): Promise<Automation> {
    if (!Automation.instance) {
      Automation.instance = new Automation();
    }
    return Automation.instance;
  }

  public async startBrowser(): Promise<void> {
    if (!this.page) {
      this.browser = await chromium.launch({
        headless: false,
        args: BROWSER_ARGS,
      });

      this.context = await this.browser.newContext({
        userAgent: USER_AGENT,
        deviceScaleFactor: 1,
        isMobile: false,
        locale: "en-US",
        timezoneId: "UTC",
        ignoreHTTPSErrors: true,
        permissions: ["geolocation", "notifications"],
      });

      // Add anti-detection script
      await this.context.addInitScript(`
        Object.defineProperty(navigator, 'webdriver', {get: () => undefined})
      `);

      // Handle cookies
      const cookies = await this.context.cookies();
      await this.context.addCookies(cookies);

      this.page = await this.context.newPage();
      this.page.setDefaultNavigationTimeout(60000);
      await this.page.goto("https://www.google.com");
    }
  }

  public async navigateTo(url: string): Promise<void> {
    if (this.page) {
      await this.page.goto(url);
    }
  }

  public async getPage(): Promise<Page | null> {
    return this.page;
  }

  public async executeGraph(graph: Graph, startNode: string, endNode: string) {
    if (!this.page) {
      throw new Error("Page not initialized");
    }

    if (!this.page.url().includes("figma.com/design")) {
      throw new Error("Not on figma design page");
    }

    const figmaUrl = this.page.url();
    const splits = figmaUrl.split("/");
    splits[3] = "proto";
    const protoUrl = splits.join("/");
    const url = new URL(protoUrl);
    url.searchParams.set("node-id", startNode);
    await this.navigateTo(url.toString());
    await sleep(6000);

    const path = this.findPath(graph, startNode, endNode);
    if (!path) {
      throw new Error("No path found");
    }

    const screenshots: string[] = [];

    for (let i = 0; i < path.length - 1; i++) {
      const currentNode = graph.nodes.get(path[i]);
      const nextNode = graph.nodes.get(path[i + 1]);
      const edge = this.findEdge(graph, path[i], path[i + 1]);
      if (!edge || !currentNode || !nextNode) {
        throw new Error(`Edge not found between ${path[i]} and ${path[i + 1]}`);
      }

      url.searchParams.set("node-id", nextNode.id);
      await this.navigateTo(url.toString());
      await sleep(6000);
      const screenshot = `${edge.sourceId}_${edge.targetId}.png`;
      await this.page.screenshot({
        path: `public/images/${screenshot}`,
        fullPage: true,
      });
      screenshots.push(screenshot);
    }

    await this.navigateTo(figmaUrl);
    return screenshots;
  }

  private findPath(
    graph: Graph,
    startNode: string,
    endNode: string
  ): string[] | null {
    const visited = new Set<string>();
    const path: string[] = [];

    const dfs = (currentNodeId: string): boolean => {
      if (currentNodeId === endNode) {
        path.push(currentNodeId);
        return true;
      }
      visited.add(currentNodeId);
      path.push(currentNodeId);

      const edges = graph.edges.filter(
        (edge) => edge.sourceId === currentNodeId
      );
      for (const edge of edges) {
        const targetNodeId = edge.targetId;
        if (!visited.has(targetNodeId) && dfs(targetNodeId)) {
          return true;
        }
      }
      path.pop();
      return false;
    };

    return dfs(startNode) ? path : null;
  }

  private findEdge(
    graph: Graph,
    sourceId: string,
    targetId: string
  ): Edge | null {
    return (
      graph.edges.find(
        (edge) => edge.sourceId === sourceId && edge.targetId === targetId
      ) || null
    );
  }

  public async closeBrowser(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      this.context = null;
      this.page = null;
    }
  }
}

export { Automation };
