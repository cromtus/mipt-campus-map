import React from 'react';
import { Line } from 'react-konva';
import DescriptionText from './DescriptionText';
import { TextAlignment, Entry } from '../types';
import EntryMarker from './EntryMarker';

interface PrismProps {
  basePoints: number[][];
  height: number;
  color: string;
  secondaryColor?: string;
  canvasWidth: number;
  canvasHeight: number;
  stageX: number;
  stageY: number;
  description?: {
    text: string;
    offsetX: number;
    offsetY: number;
    alignment: TextAlignment;
  };
  entries: Entry[];
  handleDescriptionDrag: (newOffset: { offsetX: number; offsetY: number }) => void;
}

const Prism: React.FC<PrismProps> = ({ 
  basePoints, 
  height, 
  color, 
  secondaryColor, 
  canvasWidth, 
  canvasHeight, 
  stageX, 
  stageY,
  description,
  handleDescriptionDrag,
  entries
}) => {
  basePoints = expandBasePoints(basePoints);

  // Use expandedBasePoints instead of basePoints for the rest of the component
  const projectPoint = (x: number, y: number, z: number): [number, number] => {
    const focalLength = Math.max(canvasWidth, canvasHeight);
    
    const adjustedX = x - stageX;
    const adjustedY = y - stageY;
    
    const projectedX = (adjustedX * focalLength) / (focalLength - z);
    const projectedY = (adjustedY * focalLength) / (focalLength - z);
    
    return [projectedX + stageX, projectedY + stageY];
  };

  const baseProjected = basePoints;
  const topProjected = basePoints.map(point => projectPoint(point[0], point[1], height));

  const faceColor = 'rgba(255, 255, 255, 0.5)';

  // Sort faces based on the average distance of their vertices to the stage center
  const sortedFaces = baseProjected
    .map((_, index) => {
      const nextIndex = (index + 1) % baseProjected.length;
      const distance = distanceToSegment(stageX, stageY, baseProjected[index][0], baseProjected[index][1], baseProjected[nextIndex][0], baseProjected[nextIndex][1]);
      return { index, distance };
    })
    .sort((a, b) => b.distance - a.distance);

  const strokeWidth = 1;

  return (
    <>
      {/* Base face */}
      <Line
        points={baseProjected.flat()}
        closed={true}
        fill={faceColor}
        stroke={color}
        strokeWidth={strokeWidth}
      />
      {/* Sorted side faces */}
      {sortedFaces.map(({ index }) => {
        const nextIndex = (index + 1) % baseProjected.length;
        const points = [
          ...baseProjected[index],
          ...baseProjected[nextIndex],
          ...topProjected[nextIndex],
          ...topProjected[index],
        ];
        return (
          <Line
            lineJoin="round"
            key={index}
            points={points}
            closed={true}
            fill={faceColor}
            stroke={index % 2 === 0 ? color : (secondaryColor ?? color)}
            strokeWidth={strokeWidth}
          />
        );
      })}
      {/* Top face */}
      <Line
        points={topProjected.flat()}
        closed={true}
        fill={faceColor}
        stroke={color}
        strokeWidth={strokeWidth}
      />
      {description && (
        <DescriptionText
          description={description}
          centerX={topProjected.reduce((sum, point) => sum + point[0], 0) / topProjected.length}
          centerY={topProjected.reduce((sum, point) => sum + point[1], 0) / topProjected.length}
          onDragMove={handleDescriptionDrag}
        />
      )}
      {entries && entries.map(entry => (
        <EntryMarker
          key={entry.id}
          points={baseProjected}
          entry={entry.position}
        />
      ))}
    </>
  );
};

export default Prism;

// Function to calculate the distance from a point to a line segment
function distanceToSegment(
  px: number, py: number,
  x1: number, y1: number,
  x2: number, y2: number
): number {
  const eps = 1e-8
  const len = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2)
  x1 += (x2 - x1) * eps / len
  y1 += (y2 - y1) * eps / len
  x2 -= (x2 - x1) * eps / len
  y2 -= (y2 - y1) * eps / len
  const A = px - x1;
  const B = py - y1;
  const C = x2 - x1;
  const D = y2 - y1;

  const dot = A * C + B * D;
  const len_sq = C * C + D * D;
  let param = -1;
  if (len_sq !== 0) {
    param = dot / len_sq;
  }

  let xx, yy;

  if (param < 0) {
    xx = x1;
    yy = y1;
  } else if (param > 1) {
    xx = x2;
    yy = y2;
  } else {
    xx = x1 + param * C;
    yy = y1 + param * D;
  }

  const dx = px - xx;
  const dy = py - yy;
  return Math.sqrt(dx * dx + dy * dy);
};


function expandBasePoints(points: number[][]): number[][] {
  return points.reduce((acc: number[][], point: number[], index: number) => {
    const prevPoint = points[(points.length + index - 1) % points.length];
    const dx = point[0] - prevPoint[0];
    const dy = point[1] - prevPoint[1];
    const distance = Math.sqrt(dx * dx + dy * dy);
    const segments = Math.floor(distance / 10);

    if (segments > 0) {
      for (let i = 1; i <= segments; i++) {
        const t = i / (segments + 1);
        acc.push([
          prevPoint[0] + dx * t,
          prevPoint[1] + dy * t
        ]);
      }
    }

    acc.push(point);
    return acc;
  }, []);
};