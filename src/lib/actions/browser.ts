"use server";

import { Automation, AutomationError } from "@/lib/automation";
import { Graph } from "@/lib/graph";
interface BrowserResponse {
  success: boolean;
  error?: unknown;
}
interface AutomationResponse extends BrowserResponse {
  screenshots?: string[];
}

const startBrowser = async (): Promise<BrowserResponse> => {
  try {
    const automation = await Automation.getInstance();
    await automation.startBrowser();
    return { success: true };
  } catch (error) {
    console.error(error);
    return { success: false, error: error };
  }
};

const startAutomation = async (graphString: string, startNode: string, endNode: string): Promise<AutomationResponse> => {
  try {
    const graph = new Graph().parse(graphString);
    const automation = await Automation.getInstance();
    const screenshots = await automation.executeGraph(graph, startNode, endNode);
    return { success: true, screenshots };
  } catch (error) {
    console.error(error);
    if (error instanceof AutomationError) {
      return { success: false, error: error.message };
    } 
    return { success: false, error: "Error running automation" };
  }
}


const closeBrowser = async (): Promise<BrowserResponse> => {
  try {
    const automation = await Automation.getInstance();
    await automation.closeBrowser();
    return { success: true };
  } catch (error) {
    console.error(error);
    return { success: false, error: error };
  }
};


export { startBrowser, closeBrowser, startAutomation };
export type { BrowserResponse, AutomationResponse };
