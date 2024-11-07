import { ReactNode, useCallback, useEffect } from "react";
import {
  addEdge,
  Connection,
  Edge,
  MarkerType,
  useEdgesState,
} from "@xyflow/react";

import { Graph } from "@/lib/graph";

const useGraphEdges = (
  graph: Graph,
  selection: { startNode: string; endNode: string }
) => {
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

  const createEdges = useCallback(() => {
    const flowEdges: Edge[] = graph.edges.map((edge) => {
      const isSelectedPath =
        (edge.sourceId === selection.startNode &&
          edge.targetId === selection.endNode) ||
        (edge.sourceId === selection.endNode &&
          edge.targetId === selection.startNode);
      return {
        id: `${edge.sourceId}-${edge.targetId}`,
        source: edge.sourceId,
        target: edge.targetId,
        data: {
          action: edge.data?.triggerType || "",
          image: edge.data?.image || "",
        },
        label: edge.data?.label as ReactNode,
        type: "smoothstep",
        style: {
          strokeDasharray: isSelectedPath ? "10 10" : undefined,
          strokeWidth: isSelectedPath ? "#ff0000" : undefined,
        },
        animated: isSelectedPath,
        markerEnd: {
          type: MarkerType.Arrow,
          width: 20,
          height: 20,
        },
      };
    });
    return flowEdges;
  }, [graph.edges, selection.endNode, selection.startNode]);

  useEffect(() => {
    setEdges(createEdges());
  }, [createEdges, setEdges]);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );
  return { edges, onEdgesChange, onConnect };
};

export default useGraphEdges;
