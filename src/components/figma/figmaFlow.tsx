"use client";

import { useState } from "react";
import { ReactFlowProvider } from "@xyflow/react";
import { Loader2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import GraphDrawer from "@/components/graphDrawer";
import FigmaCredentialsCard from "@/components/figma/figmaCredentialsCard";

import { getDAGFromFigmaFile, openFigma } from "@/lib/actions/figma";
import { Graph } from "@/lib/graph";

import { useGraphStore } from "@/app/store/graphStore";
import { startAutomation } from "@/lib/actions/browser";

const FigmaFlow = () => {
  const [isFigmaOpen, setIsFigmaOpen] = useState(false);
  const [isFigmaOpenLoading, setIsFigmaOpenLoading] = useState(false);
  const [isAutomationLoading, setIsAutomationLoading] = useState(false);
  const [screenshots, setScreenshots] = useState<string[]>([]);

  const { graph, setGraph, selection, setSelection } = useGraphStore();
  const [credentials, setCredentials] = useState<{
    fileUrl: string;
    token: string;
  } | null>(null);

  const handleOpenFigma = async () => {
    setIsFigmaOpenLoading(true);
    const response = await openFigma();
    if (response.success) {
      setIsFigmaOpen(true);
    }
    setIsFigmaOpenLoading(false);
  };
  const handleCredentialsChange = (credentials: {
    fileUrl: string;
    token: string;
  }) => {
    setCredentials(credentials);
  };

  const handleBuildDAG = async (fileUrl: string, token: string) => {
    const response = await getDAGFromFigmaFile(fileUrl, token);
    if (response.success) {
      if (response.data?.graph.nodes && response.data?.graph.edges) {
        const graph = new Graph();
        graph.buildGraph(response.data.graph.nodes, response.data.graph.edges);
        setGraph(graph);
        toast.success("DAG built from Figma file", {
          description: "You can now start the automation",
        });
      }
    }
  };

  const handleStartAutomation = async () => {
    setIsAutomationLoading(true);
    const selectedNodes = selection;
    const response = await startAutomation(
      graph.stringify(),
      selectedNodes.startNode,
      selectedNodes.endNode
    );
    setIsAutomationLoading(false);
    if (response.success && response.screenshots) {
      const newScreenshots = response.screenshots;
      setScreenshots((prevScreenshots) => [
        ...prevScreenshots,
        ...newScreenshots,
      ]);
      toast.success("Automation completed", {
        description: "Screenshots have been saved to the public/images folder",
        action: {
          label: "View",
          onClick: () => {
            window.open(`/images/${newScreenshots[0]}`, "_blank");
          },
        },
      });
      resetSelection();
    }
  };

  const resetSelection = () => {
    setSelection({ startNode: "", endNode: "" });
  };

  return (
    <div className="flex flex-col items-center gap-4">
      {!isFigmaOpen ? (
        <Button onClick={handleOpenFigma} disabled={isFigmaOpenLoading}>
          {isFigmaOpenLoading ? (
            <Loader2 className="animate-spin" />
          ) : (
            "Open Figma"
          )}
        </Button>
      ) : !credentials ? (
        <FigmaCredentialsCard
          onCredentialsChange={handleCredentialsChange}
          onBuildDAG={handleBuildDAG}
        />
      ) : !graph ? (
        <div>Building DAG from Figma file...</div>
      ) : (
        <div className="flex flex-col items-center gap-4">
          <h3 className="text-lg font-bold">DAG built from Figma file</h3>
          <div className="p-4 mb-4 bg-white rounded-lg shadow">
            <h3 className="font-semibold mb-2">Selected Nodes</h3>
            <div className="space-y-1">
              <div>Start Node: {selection.startNode || "Not selected"}</div>
              <div>End Node: {selection.endNode || "Not selected"}</div>
            </div>
            <div className="text-sm text-gray-500 mt-2">
              Hold Cmd/Ctrl + click to select nodes
            </div>
            {selection.startNode && selection.endNode && (
              <Button
                variant="default"
                className="mt-4"
                onClick={handleStartAutomation}
                disabled={isAutomationLoading}
              >
                {isAutomationLoading ? (
                  <>
                    <Loader2 className="animate-spin" />
                    <h3 className="ml-2">Running Automation</h3>
                  </>
                ) : (
                  "Start Automation"
                )}
              </Button>
            )}
          </div>
          <ReactFlowProvider>
            <GraphDrawer />
          </ReactFlowProvider>
        </div>
      )}
      {screenshots.length ? (
        <div className="flex flex-wrap items-center gap-2">
          {screenshots.map((screenshot, index) => (
            <Link href={`/images/${screenshot}`} key={index}>
              <Image
                src={`/images/${screenshot}`}
                alt="Screenshot"
                width={100}
                height={120}
                className="rounded-lg shadow-sm border border-gray-200"
              />
            </Link>
          ))}
        </div>
      ) : null}
    </div>
  );
};

export default FigmaFlow;
