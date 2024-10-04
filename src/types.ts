export type Tool = 'pan' | 'building' | 'select' | 'pavement' | 'pathwalk' | 'road';

export type GraphNode = {
  id: string;
  x: number;
  y: number;
  edges: string[]; // Array of incident edge IDs
}

export type GraphEdge = {
  id: string;
  from: string;
  to: string;
} & ({ type: 'road', width: number } | { type: 'pathwalk' });

export type Graph = {
  nodes: GraphNode[];
  edges: GraphEdge[];
};