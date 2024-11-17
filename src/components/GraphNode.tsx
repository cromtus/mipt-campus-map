import React, { useState } from 'react';
import { Circle } from 'react-konva';
import { GraphNode as GraphNodeType } from '../types';

interface GraphNodeProps {
  node: GraphNodeType;
  isSelected: boolean;
  onDragStart: (node: GraphNodeType) => void;
  onDragEnd: (node: GraphNodeType) => void;
  onDragMove: (node: GraphNodeType, newX: number, newY: number) => { x: number, y: number };
  interactive: boolean;
  onSelect: () => void;
}

const GraphNode: React.FC<GraphNodeProps> = ({ node, interactive, isSelected, onDragStart, onDragEnd, onDragMove, onSelect }) => {
  const [isHovered, setIsHovered] = useState(false);
  return (
    <Circle
      x={node.x}
      y={node.y}
      radius={5}
      fill={isSelected ? 'red' : isHovered ? 'yellow' : 'rgba(0, 0, 0, 0)'}
      draggable
      onMouseEnter={() => interactive && setIsHovered(true)}
      onMouseLeave={() => interactive && setIsHovered(false)}
      onDragStart={() => onDragStart(node)}
      onDragEnd={() => onDragEnd(node)}
      onDragMove={(e) => {
        const newX = e.target.x();
        const newY = e.target.y();
        e.target.position(onDragMove(node, newX, newY));
      }}
      onClick={e => {
        if (interactive) {
          e.cancelBubble = true;
          onSelect()
        }
      }}
    />
  );
};

export default GraphNode;