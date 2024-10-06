export type Tool = 'pan' | 'select' | 'building' | 'pavement' | 'pathwalk' | 'road' | 'fence' | 'rect';

export type TextAlignment = 'left' | 'center' | 'right';

export type Entry = {
  id: string;
  position: number; // Value between 0 and 1
};

export interface BuildingDescription {
  text: string;
  offsetX: number;
  offsetY: number;
  alignment: TextAlignment;
  reversed: boolean;
}

export type Polygon = {
  points: number[][];
} & (
  | { 
      type: 'building'; 
      height: number; 
      color: string; 
      secondaryColor?: string;
      description?: BuildingDescription;
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

export type Rect = {
  x: number;
  y: number;
  width: number;
  height: number;
  cornerRadius: number;
};