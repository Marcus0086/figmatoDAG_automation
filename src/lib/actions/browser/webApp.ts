"use server";

import { Stagehand } from "@browserbasehq/stagehand";
import { journeyToActions } from "@/lib/actions/ai";

type LogLine = {
  id?: string;
  category?: string;
  message: string;
  level?: 0 | 1 | 2;
  timestamp?: string;
  auxiliary?: {
    [key: string]: {
      value: string;
      type: "object" | "string" | "html" | "integer" | "float" | "boolean";
    };
  };
};

class WebApp {
  private static instance: WebApp | null = null;
  public stagehand: Stagehand | null = null;
  public logLines: LogLine[] = [];
  private constructor() {
    this.stagehand = new Stagehand({
      env: "LOCAL",
      enableCaching: true,
      domSettleTimeoutMs: 1000,
      logger: (message) => {
        console.log("stagehand", message);
        this.logLines.push(message);
      },
    });
  }

  public static async getInstance(): Promise<WebApp> {
    if (!WebApp.instance) {
      WebApp.instance = new WebApp();
    }
    return WebApp.instance;
  }

  public async init() {
    if (!this.stagehand) {
      throw new Error("Stagehand not initialized");
    }
    await this.stagehand.init({
      modelName: "gpt-4o",
    });
    await this.stagehand.page.goto("https://www.dropbox.com/login", {
      timeout: 10000,
      waitUntil: "domcontentloaded",
    });
  }
}

const startStagehand = async () => {
  const webApp = await WebApp.getInstance();
  return await webApp.init();
};

const webAppTesting = async (journey: string) => {
  const webApp = await WebApp.getInstance();
  const stagehand = webApp.stagehand;
  if (!stagehand) {
    throw new Error("Stagehand not initialized");
  }
  await stagehand.page.goto("https://www.dropbox.com/paper", {
    timeout: 10000,
    waitUntil: "domcontentloaded",
  });

  const actions = await journeyToActions(journey);
  console.log("actions", actions);
  const steps = [];
  for (const action of actions) {
    const step = await stagehand.act({ action: action.description });
    steps.push(step);
  }
  // await stagehand.context.close();
  console.log("steps", steps);
};

export { webAppTesting, startStagehand };
