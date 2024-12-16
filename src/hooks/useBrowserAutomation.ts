import { useState, useRef } from "react";

import { useActionStore } from "@/app/store/actionStore";
interface BrowserRequest {
  journey: string;
  title: string;
  url?: string;
  attributes: {
    productFamiliarity: string;
    patience: number;
    techSavviness: string;
    domainFamiliarity: string;
    industryExpertise: string;
  };
  groundTruth: {
    img?: string;
    description?: string;
  };
}

interface StreamResponse {
  step?: number;
  action?: string;
  action_input?: string[];
  type?: string;
  answer?: string;
  rationale?: string;
  before_annotated_img?: string;
  img?: string;
  ux_law_summary?: string;
}

export function useBrowserAutomation() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const actionStore = useActionStore();
   const abortControllerRef = useRef<AbortController | null>(null);

  const setUrlHandler = async (url: string) => {
    abortControllerRef.current = new AbortController();
    try {
      const backendUrl = process.env.BACKEND_URL || "http://localhost:8000";
      const response = await fetch(`${backendUrl}/api/browser/set-url`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
        signal: abortControllerRef.current.signal
      });
      if (!response.ok) {
        setError("Failed to set URL");
      }
      return response.json();
    } catch (error) {
      console.error("Error setting URL:", error);
      setError(
        error instanceof Error ? error.message : "Unknown error occurred"
      );
    }
  };

  const runAutomation = async (request: BrowserRequest) => {
    abortControllerRef.current = new AbortController();
    setIsLoading(true);
    setError(null);
    actionStore.resetState();
    try {
      const backendUrl = process.env.BACKEND_URL || "http://localhost:8000";
      const response = await fetch(`${backendUrl}/api/browser/run`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: request.journey,
          max_steps: 150,
          title: request.title,
          url: request.url,
          attributes: request.attributes,
          ground_truth: request.groundTruth,
        }),
        signal: abortControllerRef.current.signal
      });

      if (!response.ok || !response.body) {
        throw new Error("Failed to start automation");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || ""; // Keep incomplete line in buffer

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data: StreamResponse = JSON.parse(line.slice(5));
              if (data.type === "generating_summary") {
                actionStore.setIsGeneratingSummary(true);
              } else if (data.type === "final") {
                actionStore.setSummary(data.answer || "");
                actionStore.setIsGeneratingSummary(false);
              } else if (data.step !== undefined) {
                actionStore.setActions((prevActions) => [
                  ...prevActions,
                  {
                    data: {
                      timestamp: new Date().toLocaleTimeString(),
                      step: data?.step || 0,
                      beforeImageUrl: data.before_annotated_img || "",
                      annotatedImageUrl: data.img || "",
                      actionDescription: `${data.action || ""} ${
                        data.action_input ? data.action_input : ""
                      }`,
                      rationale: data.rationale || "",
                      actionInput: data.action_input || [],
                      ux_law_summary: data.ux_law_summary || ""
                    },
                  },
                ]);
              }
            } catch (e) {
              console.error("Error parsing stream data:", e);
              setError("Failed to parse automation response");
            }
          }
        }
      }
    } catch (error) {
      console.error("Automation error:", error);
      setError(
        error instanceof Error ? error.message : "Unknown error occurred"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const cancelAutomation = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  };

  return {
    runAutomation,
    isLoading,
    error,
    setUrlHandler,
    cancelAutomation
  };
}
