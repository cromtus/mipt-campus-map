import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { GraphNode, GraphEdge } from '../types';

interface GraphState {
  nodes: GraphNode[];
  edges: GraphEdge[];
  selectedEdgeId: string | null;
}

const initialState: GraphState = {
  nodes: [],
  edges: [],
  selectedEdgeId: null,
};

const slice = createSlice({
  name: 'graph',
  initialState,
  reducers: {
    addNode(state, action: PayloadAction<GraphNode>) {
      state.nodes.push(action.payload);
    },

    addEdge(state, action: PayloadAction<GraphEdge>) {
      state.edges.push(action.payload);
      // Update node references
      state.nodes = state.nodes.map(node => {
        if (node.id === action.payload.from || node.id === action.payload.to) {
          return { ...node, edges: [...node.edges, action.payload.id] };
        }
        return node;
      });
    },

    updateNodePosition(state, action: PayloadAction<{ id: string; x: number; y: number }>) {
      const node = state.nodes.find(n => n.id === action.payload.id);
      if (node) {
        node.x = action.payload.x;
        node.y = action.payload.y;
      }
    },

    setSelectedEdge(state, action: PayloadAction<string | null>) {
      state.selectedEdgeId = action.payload;
    },

    updateEdgeWidth(state, action: PayloadAction<{ id: string; width: number }>) {
      const edge = state.edges.find(e => e.id === action.payload.id);
      if (edge && edge.type === 'road') {
        edge.width = action.payload.width;
      }
    },

    deleteEdge(state, action: PayloadAction<string>) {
      const edgeId = action.payload;
      state.edges = state.edges.filter(edge => edge.id !== edgeId);
      state.nodes = state.nodes.map(node => ({
        ...node,
        edges: node.edges.filter(id => id !== edgeId),
      })).filter(node => node.edges.length > 0);
      if (state.selectedEdgeId === edgeId) {
        state.selectedEdgeId = null;
      }
    },
  },
});

export default slice.reducer;
export const {
  addNode,
  addEdge,
  updateNodePosition,
  setSelectedEdge,
  updateEdgeWidth,
  deleteEdge,
} = slice.actions;

export const selectCurrentEdge = (state: { graph: GraphState }) => 
  state.graph.selectedEdgeId ? 
    state.graph.edges.find(e => e.id === state.graph.selectedEdgeId) 
  : null;