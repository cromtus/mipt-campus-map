import React, { useState } from 'react';
import { Line, Circle, Group } from 'react-konva';

interface PolygonProps {
  points: number[][];
  isSelected: boolean;
  isHovered: boolean;
  isEditing: boolean;
  type: 'building' | 'grass' | 'footpath' | 'pavement' | 'road';
  onNodeDrag: (index: number, newPosition: number[]) => number[] | undefined;
  onPolygonDrag: (newPositions: number[][]) => void;
  onDragStart: (nodeIndex: number) => void;
  onDragEnd: (nodeIndex: number) => void;
}

const Polygon: React.FC<PolygonProps> = ({ 
  points, 
  isSelected, 
  isHovered, 
  isEditing, 
  type,
  onNodeDrag, 
  onPolygonDrag,
  onDragStart,
  onDragEnd
}) => {
  const [isDragging, setIsDragging] = useState(false);

  const handlePolygonDragStart = () => {
    setIsDragging(true);
  };

  const handlePolygonDragEnd = (e: any) => {
    setIsDragging(false);
    const node = e.target;
    const dx = node.x();
    const dy = node.y();
    
    const newPositions = points.map(point => [
      point[0] + dx,
      point[1] + dy
    ]);
    
    onPolygonDrag(newPositions);
    node.position({ x: 0, y: 0 });
  };

  const handleNodeDragMove = (index: number) => (e: any) => {
    const node = e.target;
    const newPosition = [node.x(), node.y()];
    const finalPosition = onNodeDrag(index, newPosition) ?? newPosition;
    node.x(finalPosition[0]);
    node.y(finalPosition[1]);
  };

  const getColors = () => {
    if (type === 'grass') {
      return {
        fill: isHovered && !isSelected ? 'rgba(0, 100, 0, 0.5)' : 'rgba(0, 100, 0, 0.1)',
      };
    } else if (type === 'pavement') {
      return {
        fill: 'rgba(245, 245, 224, 1)', // Light yellow
      };
    } else {
      return {
        stroke: isSelected ? "blue" : isHovered ? "black" : undefined,
        strokeWidth: isSelected || isHovered ? 3 : 0,
        fill: isSelected ? "rgba(0, 0, 255, 0.1)" : isHovered ? "rgba(0, 255, 0, 0.1)" : "rgba(0, 0, 0, 0.1)"
      };
    }
  };

  const { stroke, fill, strokeWidth } = getColors();

  return (
    <>
      <Line
        points={points.flat()}
        closed={true}
        stroke={stroke}
        fill={fill}
        strokeWidth={strokeWidth || (isSelected || isHovered ? 3 : 2)}
        draggable={isSelected}
        onDragStart={handlePolygonDragStart}
        onDragEnd={handlePolygonDragEnd}
      />
      {isEditing && !isDragging && points.map((point, index) => (
        <Circle
          key={index}
          x={point[0]}
          y={point[1]}
          radius={6}
          fill="red"
          draggable
          onDragMove={handleNodeDragMove(index)}
          onDragStart={() => onDragStart(index)}
          onDragEnd={() => onDragEnd(index)}
        />
      ))}
    </>
  );
};

export default Polygon;