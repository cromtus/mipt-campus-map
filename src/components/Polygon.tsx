import React, { useState } from 'react';
import { Line, Circle } from 'react-konva';
import Prism from './Prism';
import { Polygon as PolygonType } from '../types';

interface PolygonProps {
  polygon: PolygonType;
  centerDot: { x: number, y: number };
  interactive: boolean;
  isSelected: boolean;
  onSelect: () => void;
  onNodeDrag: (index: number, newPosition: number[]) => number[] | undefined;
  onPolygonDrag: (newPositions: number[][]) => void;
  onDescriptionDrag: (newOffset: { offsetX: number; offsetY: number }) => void;
  onDragStart: (nodeIndex: number) => void;
  onDragEnd: (nodeIndex: number) => void;
}

const Polygon: React.FC<PolygonProps> = ({
  polygon,
  centerDot,
  interactive,
  isSelected,
  onSelect,
  onNodeDrag,
  onPolygonDrag,
  onDescriptionDrag,
  onDragStart,
  onDragEnd,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isHovered, setHovered] = useState(false);

  const handlePolygonDragStart = () => {
    setIsDragging(true);
  };

  const handlePolygonDragEnd = (e: any) => {
    setIsDragging(false);
    const node = e.target;
    const dx = node.x();
    const dy = node.y();
    
    const newPositions = polygon.points.map(point => [
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
    if (polygon.type === 'pavement') {
      return {
        fill: isSelected ? 'rgb(122, 122, 112)' : isHovered ? 'rgb(183, 183, 168)' : 'rgb(245, 245, 224)', // Light yellow
      };
    } else {
      return {
        stroke: isSelected ? "blue" : isHovered ? "black" : undefined,
        strokeWidth: isSelected || isHovered ? 3 : 0,
        fill: isSelected ? "rgba(0, 0, 255, 0.1)" : isHovered ? "rgba(0, 255, 0, 0.1)" : undefined
      };
    }
  };

  const prism = polygon.type === 'building' ? (
    <Prism
      basePoints={polygon.points}
      height={polygon.height}
      color={polygon.color}
      secondaryColor={polygon.secondaryColor}
      description={polygon.description}
      handleDescriptionDrag={(newOffset) => onDescriptionDrag(newOffset)}
      canvasWidth={window.innerWidth}
      canvasHeight={window.innerHeight}
      stageX={centerDot.x}
      stageY={centerDot.y}
      entries={polygon.entries}
    />
  ) : null

  const { stroke, fill, strokeWidth } = getColors();

  return (
    <>
      {prism}
      <Line
        points={polygon.points.flat()}
        closed={true}
        stroke={stroke}
        fill={fill}
        strokeWidth={strokeWidth || (isSelected || isHovered ? 3 : 2)}
        draggable={isSelected}
        onDragStart={handlePolygonDragStart}
        onDragEnd={handlePolygonDragEnd}
        onMouseEnter={() => interactive && setHovered(true)}
        onMouseLeave={() => interactive && setHovered(false)}
        onClick={(e) => {
          if (interactive) {
            e.cancelBubble = true
            onSelect()
          }
        }}
      />
      {isSelected && !isDragging && polygon.points.map((point, index) => (
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