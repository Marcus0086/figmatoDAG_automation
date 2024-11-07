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

const GraphComponent = ({ graph }: { graph: Graph }) => {
  const { selection, setSelection } = useGraphStore();

  const VERTICAL_SPACING = 150;
  const HORIZONTAL_SPACING = 250;

  // Helper to get node's children
  const getChildren = (nodeId: string) =>
    graph.edges
      .filter((edge) => edge.sourceId === nodeId)
      .map((edge) => edge.targetId);

  // Helper to get node's parents
  const getParents = (nodeId: string) =>
    graph.edges
      .filter((edge) => edge.targetId === nodeId)
      .map((edge) => edge.sourceId);

  // 1. Assign layers (y-coordinates)
  const layers = new Map<string, number>();
  const assignLayers = () => {
    // Find root nodes (nodes with no parents)
    const roots = Array.from(graph.nodes.keys()).filter(
      (nodeId) => getParents(nodeId).length === 0
    );

    // Assign layer 0 to roots
    roots.forEach((nodeId) => layers.set(nodeId, 0));

    // BFS to assign layers to all nodes
    let currentNodes = [...roots];
    let currentLayer = 1;

    while (currentNodes.length > 0) {
      const nextNodes: string[] = [];

      currentNodes.forEach((nodeId) => {
        const children = getChildren(nodeId);
        children.forEach((childId) => {
          if (!layers.has(childId)) {
            layers.set(childId, currentLayer);
            nextNodes.push(childId);
          }
        });
      });

      currentNodes = nextNodes;
      currentLayer++;
    }
  };

  // 2. Assign x-coordinates within each layer
  const getNodePosition = (nodeId: string) => {
    const layer = layers.get(nodeId) || 0;
    const nodesInLayer = Array.from(layers.entries())
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      .filter(([_, l]) => l === layer);

    const indexInLayer = nodesInLayer.findIndex(([id]) => id === nodeId);
    const layerWidth = nodesInLayer.length * HORIZONTAL_SPACING;
    const startX = -layerWidth / 2;

    return {
      x: startX + indexInLayer * HORIZONTAL_SPACING,
      y: layer * VERTICAL_SPACING,
    };
  };

  // Execute layout algorithm
  assignLayers();

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
