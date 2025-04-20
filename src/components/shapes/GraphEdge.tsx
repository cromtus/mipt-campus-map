import React, { memo, useState } from 'react';
import { Line } from 'react-konva';
import { GraphEdge, GraphNode } from '../../types';

interface GraphEdgeProps {
  edge: GraphEdge;
  nodes: Map<string, GraphNode>;
  interactive: boolean;
  isSelected: boolean;
  onSelect: (e: any) => void;
}

const GraphEdgeComponent: React.FC<GraphEdgeProps> = ({
  edge,
  nodes,
  interactive,
  isSelected,
  onSelect,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const fromNode = nodes.get(edge.from);
  const toNode = nodes.get(edge.to);
  if (!fromNode || !toNode) return null;

  const getStyle = () => {
    switch (edge.type) {
      case 'road':
        return {
          stroke: isSelected || isHovered ? '#ddd' : 'white',
          strokeWidth: edge.width,
        };
      case 'pathwalk':
        return {
          stroke: isSelected || isHovered ? 'black' : 'rgba(0, 150, 0, 0.7)',
          strokeWidth: 1,
          dash: [3, 3],
        };
      case 'fence':
        return {
          stroke: isSelected || isHovered ? 'black' : 'gray',
          strokeWidth: 1,
        };
    }
  };

  return (
    <Line
      points={[fromNode.x, fromNode.y, toNode.x, toNode.y]}
      {...getStyle()}
      onClick={interactive ? onSelect : undefined}
      onTap={interactive ? onSelect : undefined}
      onMouseEnter={interactive ? () => setIsHovered(true) : undefined}
      onMouseLeave={interactive ? () => setIsHovered(false) : undefined}
    />
  );
};

export default memo(GraphEdgeComponent);