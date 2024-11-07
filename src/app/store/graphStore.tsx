"use client";

import { createContext, useContext, useState } from "react";
import { Graph } from "@/lib/graph";

interface GraphContextType {
  graph: Graph;
  setGraph: (graph: Graph) => void;
  selection: {
    startNode: string;
    endNode: string;
  };
  setSelection: (selection: { startNode: string; endNode: string }) => void;
}

const GraphContext = createContext<GraphContextType | undefined>(undefined);

export const useGraphStore = () => {
  const context = useContext(GraphContext);
  if (!context) {
    throw new Error("useGraphStore must be used within a GraphProvider");
  }
  return context;
};

export const GraphProvider = ({ children }: { children: React.ReactNode }) => {
  const [graph, setGraph] = useState<Graph>(new Graph());
  const [selection, setSelection] = useState({
    startNode: "",
    endNode: "",
  });

  return (
    <GraphContext.Provider
      value={{
        graph,
        setGraph,
        selection,
        setSelection,
      }}
    >
      {children}
    </GraphContext.Provider>
  );
};
