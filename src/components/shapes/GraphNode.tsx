import React, { memo, useState } from 'react';
import { Circle } from 'react-konva';
import { GraphNode } from '../../types';

interface GraphNodeProps {
  node: GraphNode;
  interactive: boolean;
  onDragMove: (newPos: { x: number; y: number }) => void;
}

const GraphNodeComponent: React.FC<GraphNodeProps> = ({
  node,
  interactive,
  onDragMove,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  return (
    <Circle
      x={node.x}
      y={node.y}
      radius={4}
      fill={isHovered ? 'rgba(255, 255, 0, 0.5)' : undefined}
      draggable={interactive}
      onDragMove={(e) => {
        const pos = e.target.position();
        onDragMove(pos);
      }}
      onMouseEnter={interactive ? () => setIsHovered(true) : undefined}
      onMouseLeave={interactive ? () => setIsHovered(false) : undefined}
    />
  );
};

export default memo(GraphNodeComponent);