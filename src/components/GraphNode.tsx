import React from 'react';
import { Circle } from 'react-konva';
import { GraphNode as GraphNodeType } from '../types';

interface GraphNodeProps {
  node: GraphNodeType;
  isSelected: boolean;
  onDragStart: (node: GraphNodeType) => void;
  onDragEnd: (node: GraphNodeType) => void;
  onDragMove: (node: GraphNodeType, newX: number, newY: number) => { x: number, y: number };
  isHovered: boolean;
  onHover: (nodeId: string | null) => void;
}

const GraphNode: React.FC<GraphNodeProps> = ({ node, isSelected, onDragStart, onDragEnd, onDragMove, isHovered, onHover }) => {
  return (
    <Circle
      x={node.x}
      y={node.y}
      radius={5}
      fill={isSelected ? 'red' : isHovered ? 'yellow' : 'transparent'}
      draggable
      onMouseEnter={() => onHover(node.id)}
      onMouseLeave={() => onHover(null)}
      onDragStart={() => onDragStart(node)}
      onDragEnd={() => onDragEnd(node)}
      onDragMove={(e) => {
        const newX = e.target.x();
        const newY = e.target.y();
        e.target.position(onDragMove(node, newX, newY));
      }}
    />
  );
};

export default GraphNode;