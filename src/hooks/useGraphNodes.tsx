import { useNodesState, type Node } from "@xyflow/react";

import { Graph } from "@/lib/graph";

const useGraphNodes = (
  graph: Graph,
  getNodePosition: (nodeId: string) => {
    x: number;
    y: number;
  }
) => {
  const flowNodes: Node[] = Array.from(graph.nodes.values()).map((node) => ({
    id: node.id,
    position: getNodePosition(node.id),
    data: {
      label: node.data?.label || "",
      image: node.data?.image || "",
    },
  }));

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [nodes, _, onNodesChange] = useNodesState(flowNodes);

  return { nodes, onNodesChange };
};

export default useGraphNodes;
