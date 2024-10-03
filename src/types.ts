export type Tool = 'pan' | 'building' | 'select' | 'pavement' | 'pathwalk' | 'road';

export type GraphNode = {
  id: string;
  x: number;
  y: number;
};

export type GraphEdge = {
  id: string;
  from: string;
  to: string;
  width?: number; // Only for road edges
};

export type Graph = {
  nodes: GraphNode[];
  edges: GraphEdge[];
};