import React from 'react';
import { Circle } from 'react-konva';
import { GraphNode as GraphNodeType } from '../types';

interface GraphNodeProps {
  node: GraphNodeType;
  isSelected: boolean;
  onSelect: (node: GraphNodeType) => void;
  onDragMove: (node: GraphNodeType, newX: number, newY: number) => void;
}

const GraphNode: React.FC<GraphNodeProps> = ({ node, isSelected, onSelect, onDragMove }) => {
  return (
    <Circle
      x={node.x}
      y={node.y}
      radius={5}
      fill={isSelected ? 'red' : 'blue'}
      draggable
      onClick={() => onSelect(node)}
      onTap={() => onSelect(node)}
      onDragMove={(e) => {
        const newX = e.target.x();
        const newY = e.target.y();
        onDragMove(node, newX, newY);
      }}
    />
  );
};

export default GraphNode;