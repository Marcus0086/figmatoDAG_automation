import { useActionStore } from "@/app/store/actionStore";
import { useState } from "react";

interface BrowserRequest {
  journey: string;
  title: string;
  url?: string;
  attributes: {
    productFamiliarity: number;
    patience: number;
    techSavviness: number;
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
}

export function useBrowserAutomation() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const actionStore = useActionStore();

  const setUrlHandler = async (url: string) => {
    try {
      const backendUrl = process.env.BACKEND_URL || "http://localhost:8000";
      const response = await fetch(`${backendUrl}/api/browser/set-url`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
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
    setIsLoading(true);
    setError(null);

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
        }),
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

  return {
    runAutomation,
    isLoading,
    error,
    setUrlHandler,
  };
}
