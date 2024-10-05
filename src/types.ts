export type Tool = 'pan' | 'select' | 'building' | 'pavement' | 'pathwalk' | 'road' | 'fence';

export type TextAlignment = 'left' | 'center' | 'right';

export type Entry = {
  id: string;
  position: number; // Value between 0 and 1
};

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
        offsetX: number;
        offsetY: number;
        alignment: TextAlignment;
      };
      entries: Entry[];
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