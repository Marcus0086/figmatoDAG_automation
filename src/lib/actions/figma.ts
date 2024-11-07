"use server";

import { Automation } from "@/lib/automation";
import { LAMBDA_FUNCTION_URL } from "@/lib/constants";
import type { BrowserResponse } from "@/lib/actions/browser";
import type { Node, Edge } from "@/lib/graph";
interface GraphData {
  nodes: Node[];
  edges: Edge[];
}

interface DAGResponse extends BrowserResponse {
  success: boolean;
  data?: {
    graph: GraphData;
  };
  error?: unknown;
}

const openFigma = async (): Promise<BrowserResponse> => {
  try {
    const automation = await Automation.getInstance();
    await automation.navigateTo("https://www.figma.com/login?locale=en-us");
    return { success: true };
  } catch (error) {
    console.error(error);
    return { success: false, error: error };
  }
};

const openFigmaFile = async (fileUrl: string): Promise<BrowserResponse> => {
  try {
    const automation = await Automation.getInstance();
    await automation.navigateTo(fileUrl);
    return { success: true };
  } catch (error) {
    console.error(error);
    return { success: false, error: error };
  }
};

const getDAGFromFigmaFile = async (
  fileUrl: string,
  token: string
): Promise<DAGResponse> => {
  const fileKey = fileUrl.split("/")[4]
  try {
    const res = await fetch(`${LAMBDA_FUNCTION_URL}/figmaToDAG`, {
      method: "POST",
      body: JSON.stringify({ "file_key": fileKey, "access_token": token }),
    });
    const data = await res.json();
    return { success: true, data};
  } catch (error) {
    console.error(error);
    return { success: false, error: error };
  }
};

export { openFigma, openFigmaFile, getDAGFromFigmaFile };
