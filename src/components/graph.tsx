"use client";

import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  Node as ReactFlowNode,
} from "@xyflow/react";

import "@xyflow/react/dist/style.css";

import { useGraphStore } from "@/app/store/graphStore";

import type { Graph } from "@/lib/graph";

import useGraphNodes from "@/hooks/useGraphNodes";
import useGraphEdges from "@/hooks/useGraphEdges";

import dagre from "dagre";

const GraphComponent = ({ graph }: { graph: Graph }) => {
  const { selection, setSelection } = useGraphStore();

  const nodeWidth = 150;
  const nodeHeight = 50;

  // 1. Create a Dagre graph
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));

  // Set the graph rank direction (TB, BT, LR, RL)
  dagreGraph.setGraph({ rankdir: "TB", ranker: "tight-tree" }); // Change to "LR" for horizontal layout

  // 2. Add nodes and edges to Dagre graph
  graph.nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
  });

  graph.edges.forEach((edge) => {
    dagreGraph.setEdge(edge.sourceId, edge.targetId);
  });

  // 3. Run Dagre layout
  dagre.layout(dagreGraph);

  // 4. Get positions from Dagre and update nodes
  const getNodePosition = (nodeId: string) => {
    const nodeWithPosition = dagreGraph.node(nodeId);
    return {
      x: nodeWithPosition.x - nodeWidth / 2,
      y: nodeWithPosition.y - nodeHeight / 2,
    };
  };

  // Use the positions from Dagre in your nodes
  const { nodes, onNodesChange } = useGraphNodes(graph, getNodePosition);
  const { edges, onEdgesChange, onConnect } = useGraphEdges(graph, selection);

  const handleNodeClick = (event: React.MouseEvent, node: ReactFlowNode) => {
    if (!event.metaKey && !event.ctrlKey) return;
    if (selection.startNode === "") {
      setSelection({ ...selection, startNode: node.id });
    } else if (selection.endNode === "") {
      setSelection({ ...selection, endNode: node.id });
    } else {
      setSelection({ startNode: "", endNode: "" });
    }
  };

  return (
    <div style={{ width: "100vw", height: "80vh" }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={handleNodeClick}
        attributionPosition="bottom-left"
      >
        <Background />
        <Controls />
        <MiniMap />
      </ReactFlow>
    </div>
  );
};

export default GraphComponent;
