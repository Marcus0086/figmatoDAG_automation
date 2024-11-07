class Node {
  id: string;
  data: Record<string, unknown>;

  constructor(id: string, data: Record<string, unknown>) {
    this.id = id;
    this.data = data;
  }
}

class Edge {
  sourceId: string;
  targetId: string;
  data: Record<string, unknown>;

  constructor(sourceId: string, targetId: string, data: Record<string, unknown>) {
    this.sourceId = sourceId;
    this.targetId = targetId;
    this.data = data;
  }
}

class Graph {
  nodes: Map<string, Node>;
  edges: Edge[];

  constructor() {
    this.nodes = new Map();
    this.edges = [];
  }


  addNode(id: string, data: Record<string, unknown>) {
    if (!id) {
      throw new Error("Node ID is required");
    }
    if (!this.nodes.has(id)) {
      this.nodes.set(id, new Node(id, data));
    }
  }

  addEdge(sourceId: string, targetId: string, data: Record<string, unknown>) {
    if (!this.nodes.has(sourceId)) {
      throw new Error(`Source node with ID '${sourceId}' does not exist.`);
    }
    if (!this.nodes.has(targetId)) {
      throw new Error(`Target node with ID '${targetId}' does not exist.`);
    }

    if (sourceId === targetId) {
      console.warn(
        `Edge from '${sourceId}' to '${targetId}' is a self-loop and will be ignored.`
      );
      return;
    }

    // Check for existing edge to avoid duplicates
    for (const edge of this.edges) {
      if (edge.sourceId === sourceId && edge.targetId === targetId) {
        console.warn(
          `Edge from '${sourceId}' to '${targetId}' already exists.`
        );
        return;
      }
    }

    const edge = new Edge(sourceId, targetId, data);
    this.edges.push(edge);
  }

  buildGraph(
    nodes: Node[],
    edges: Edge[],
  ) {
    try {
      if (!Array.isArray(nodes) || !Array.isArray(edges)) {
        throw new Error("Nodes and edges are in invalid format.");
      }

      // Add nodes to the graph
      for (const node of nodes) {
        this.addNode(node.id, {
          label: node.data.label,
          type: node.data.type,
          image: node.data.image,
        });
      }

      // Add edges to the graph
      for (const edge of edges) {
        this.addEdge(edge.sourceId, edge.targetId, {
          triggerType: edge.data.triggerType,
          actionType: edge.data.actionType,
          label: edge.data.label,
          image: edge.data.image,
        });
      }

      if (this.detectCycles()) {
        console.warn("Cycles detected. Modifying graph to be acyclic.");
        this.makeAcyclic();
      } else {
        console.log("Graph is already acyclic.");
      }
    } catch (error) {
      console.error("Error building graph:", error);
    }
  }

  detectCycles(): boolean {
    const visited: Set<string> = new Set();
    const recStack: Set<string> = new Set();

    const nodeValues = Array.from(this.nodes.values());
    for (let i = 0; i < nodeValues.length; i++) {
      const node = nodeValues[i];
      if (this.isCyclic(node, visited, recStack)) {
        return true;
      }
    }
    return false;
  }


  isCyclic(node: Node, visited: Set<string>, recStack: Set<string>): boolean {
    if (!visited.has(node.id)) {
      visited.add(node.id);
      recStack.add(node.id);

      for (let i = 0; i < this.edges.length; i++) {
        const edge = this.edges[i];
        if (edge.sourceId === node.id) {
          const targetNode = this.nodes.get(edge.targetId);
          if (!targetNode) {
            throw new Error(`Target node with ID '${edge.targetId}' does not exist.`);
          }
          if (
            !visited.has(targetNode.id) &&
            this.isCyclic(targetNode, visited, recStack)
          ) {
            return true;
          } else if (recStack.has(targetNode.id)) {
            return true;
          }
        }
      }
    }
    recStack.delete(node.id);
    return false;
  }

  makeAcyclic() {
    const visited: Set<string> = new Set();
    const recStack: Set<string> = new Set();

    const nodeValues = Array.from(this.nodes.values());
    for (let i = 0; i < nodeValues.length; i++) {
      const node = nodeValues[i];
      this.removeCycles(node, visited, recStack);
    }
  }

  removeCycles(node: Node, visited: Set<string>, recStack: Set<string>) {
    if (!visited.has(node.id)) {
      visited.add(node.id);
      recStack.add(node.id);

      for (let i = 0; i < this.edges.length; i++) {
        const edge = this.edges[i];
        if (edge.sourceId === node.id) {
          const targetNode = this.nodes.get(edge.targetId);
          if (!targetNode) {
            throw new Error(`Target node with ID '${edge.targetId}' does not exist.`);
          }
          if (recStack.has(targetNode.id)) {
            this.edges.splice(i, 1); // Remove edge to break cycle
            i--; // Adjust index after removal
          } else {
            this.removeCycles(targetNode, visited, recStack);
          }
        }
      }
    }
    recStack.delete(node.id);
  }

  // need to create stringify and parse methods

  stringify() {
    const nodesArray = Array.from(this.nodes.values()).map(node => ({
      id: node.id,
      data: node.data,
    }));

    const edgesArray = this.edges.map(edge => ({
      sourceId: edge.sourceId,
      targetId: edge.targetId,
      data: edge.data,
    }));

    return JSON.stringify({
      nodes: nodesArray,
      edges: edgesArray,
    });
  }

  parse(json: string) {
    const parsed = JSON.parse(json);
    const graph = new Graph();

    parsed.nodes.forEach((nodeData: { id: string; data: Record<string, unknown> }) => {
      graph.addNode(nodeData.id, nodeData.data);
    });

    parsed.edges.forEach((edgeData: { sourceId: string; targetId: string; data: Record<string, unknown> }) => {
      graph.addEdge(edgeData.sourceId, edgeData.targetId, edgeData.data);
    });

    return graph;
  }

  clear() {
    this.nodes.clear();
    this.edges = [];

  }
}

export { Graph, Node, Edge };