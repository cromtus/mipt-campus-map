import React from 'react';
import { Line } from 'react-konva';
import { GraphEdge as GraphEdgeType, GraphNode } from '../types';

interface GraphEdgeProps {
  edge: GraphEdgeType;
  nodes: GraphNode[];
  isSelected: boolean;
  isHovered: boolean;
  onHover: (edgeId: string | null) => void;
}

const GraphEdge: React.FC<GraphEdgeProps> = ({ edge, nodes, isSelected, isHovered, onHover }) => {
  const fromNode = nodes.find(node => node.id === edge.from);
  const toNode = nodes.find(node => node.id === edge.to);

  if (!fromNode || !toNode) return null;

  const stroke = edge.type === 'pathwalk' ? (
    isHovered || isSelected ? 'black' : 'rgba(0, 150, 0, 0.3)'
   ) : (
    isHovered || isSelected ? 'gray' : 'white'
   );

  return (
    <Line
      points={[fromNode.x, fromNode.y, toNode.x, toNode.y]}
      stroke={stroke}
      strokeWidth={edge.type === 'pathwalk' ? 1 : edge.width}
      dash={edge.type === 'pathwalk' ? [3, 3] : undefined}
      onMouseEnter={() => onHover(edge.id)}
      onMouseLeave={() => onHover(null)}
    />
  );
};

export default GraphEdge;