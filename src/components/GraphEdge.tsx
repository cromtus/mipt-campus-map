import React from 'react';
import { Line } from 'react-konva';
import { GraphEdge as GraphEdgeType, GraphNode } from '../types';

interface GraphEdgeProps {
  edge: GraphEdgeType;
  nodes: GraphNode[];
  isPathwalk: boolean;
  isSelected: boolean;
  isHovered: boolean;
  onHover: (edgeId: string | null) => void;
}

const GraphEdge: React.FC<GraphEdgeProps> = ({ edge, nodes, isPathwalk, isSelected, isHovered, onHover }) => {
  const fromNode = nodes.find(node => node.id === edge.from);
  const toNode = nodes.find(node => node.id === edge.to);

  if (!fromNode || !toNode) return null;

  return (
    <Line
      points={[fromNode.x, fromNode.y, toNode.x, toNode.y]}
      stroke={isPathwalk ? 'green' : 'white'}
      strokeWidth={isPathwalk ? 2 : (edge.width || 10)}
      dash={isPathwalk ? [5, 5] : undefined}
      opacity={isSelected || isHovered ? 0.5 : 1}
      onMouseEnter={() => onHover(edge.id)}
      onMouseLeave={() => onHover(null)}
    />
  );
};

export default GraphEdge;