export type Tool = 'pan' | 'select' | 'building' | 'pavement' | 'pathwalk' | 'road' | 'fence';

export type Polygon = {
  points: number[][];
} & (
  | { 
      type: 'building'; 
      height: number; 
      color: string; 
      secondaryColor?: string;
      description?: {
        text: string;
        x: number;
        y: number;
      };
    }
  | { type: 'pavement' }
)

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
} & ({ type: 'road', width: number } | { type: 'pathwalk' } | { type: 'fence' });

export type Graph = {
  nodes: GraphNode[];
  edges: GraphEdge[];
};