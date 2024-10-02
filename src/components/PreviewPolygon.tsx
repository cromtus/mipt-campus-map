import React from 'react';
import { Line, Circle } from 'react-konva';

interface PreviewPolygonProps {
  points: number[][];
  mousePosition: { x: number; y: number } | null;
  onClose: () => void;
}

const PreviewPolygon: React.FC<PreviewPolygonProps> = ({ points, mousePosition, onClose }) => {
  const isHoveringFirstNode = 
    points.length > 2 && 
    mousePosition &&
    Math.abs(points[0][0] - mousePosition.x) < 10 &&
    Math.abs(points[0][1] - mousePosition.y) < 10;

  return (
    <>
      <Line
        points={points.flat()}
        stroke="black"
        strokeWidth={2}
        closed={false}
      />
      {mousePosition && points.length > 0 && (
        <Line
          points={[...points[points.length - 1], mousePosition.x, mousePosition.y]}
          stroke="gray"
          strokeWidth={1}
        />
      )}
      {points.map((point, index) => (
        <Circle
          key={index}
          x={point[0]}
          y={point[1]}
          radius={4}
          fill="black"
        />
      ))}
      {isHoveringFirstNode && (
        <Circle
          x={points[0][0]}
          y={points[0][1]}
          radius={10}
          fill="yellow"
          opacity={0.5}
          onClick={onClose}
        />
      )}
    </>
  );
};

export default PreviewPolygon;