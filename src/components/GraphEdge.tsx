import React from 'react';
import { Line } from 'react-konva';
import { GraphEdge as GraphEdgeType, GraphNode } from '../types';

interface GraphEdgeProps {
  edge: GraphEdgeType;
  nodes: GraphNode[];
  isPathwalk: boolean;
  isSelected: boolean;
  onSelect: (edge: GraphEdgeType) => void;
}

const GraphEdge: React.FC<GraphEdgeProps> = ({ edge, nodes, isPathwalk, isSelected, onSelect }) => {
  const fromNode = nodes.find(node => node.id === edge.from);
  const toNode = nodes.find(node => node.id === edge.to);

  if (!fromNode || !toNode) return null;

  return (
    <Line
      points={[fromNode.x, fromNode.y, toNode.x, toNode.y]}
      stroke={isPathwalk ? 'green' : 'white'}
      strokeWidth={isPathwalk ? 2 : (edge.width || 10)}
      dash={isPathwalk ? [5, 5] : undefined}
      onClick={() => onSelect(edge)}
      onTap={() => onSelect(edge)}
      opacity={isSelected ? 0.5 : 1}
    />
  );
};

export default GraphEdge;