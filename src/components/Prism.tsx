import React, { useMemo } from 'react';
import { Group, Line } from 'react-konva';
import DescriptionText from './DescriptionText';
import { BuildingDescription, Entry } from '../types';
import EntryMarker from './EntryMarker';
import { union } from '@turf/union';
import { featureCollection, polygon } from '@turf/helpers';

interface PrismProps {
  basePoints: number[][];
  height: number;
  color: string;
  secondaryColor?: string;
  canvasWidth: number;
  canvasHeight: number;
  stageX: number;
  stageY: number;
  description?: BuildingDescription;
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
  const mainPoints = basePoints;
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
  const topProjected = useMemo(
    () => basePoints.map(point => projectPoint(point[0], point[1], height)),
    [basePoints, height, projectPoint]
  );

  const mainProjected = useMemo(
    () => mainPoints.map(point => projectPoint(point[0], point[1], height)),
    [mainPoints, height, projectPoint]
  );

  const orientedArea = useMemo(() => basePoints.reduce((area, point, index) => {
    const nextIndex = (index + 1) % basePoints.length;
    return area + (point[0] * basePoints[nextIndex][1] - basePoints[nextIndex][0] * point[1]);
  }, 0), [basePoints]);

  const faceColor = 'rgba(255, 255, 255, 0.5)';

  // Sort faces based on the average distance of their vertices to the stage center
  const sortedFaces = useMemo(() => baseProjected
    .map((_, index) => {
      const nextIndex = (index + 1) % baseProjected.length;
      const distance = distanceToSegment(stageX, stageY, baseProjected[index][0], baseProjected[index][1], baseProjected[nextIndex][0], baseProjected[nextIndex][1]);
      const sweepArea = vectorProduct(baseProjected[index][0] - stageX, baseProjected[index][1] - stageY, baseProjected[nextIndex][0] - stageX, baseProjected[nextIndex][1] - stageY);
      const isSeen = sweepArea * orientedArea < 0;
      return { index, distance, isSeen };
    })
    .sort((a, b) => b.distance - a.distance),
  [baseProjected, stageX, stageY, orientedArea]);

  const strokeWidth = 0.7;
  const thickerStrokeWidth = 3

  const allPolygons = [
    mainPoints,
    ...mainPoints.map((_, index) => {
      const nextIndex = (index + 1) % mainPoints.length;
      return [
        mainPoints[index],
        mainPoints[nextIndex],
        mainProjected[nextIndex],
        mainProjected[index],
      ];
    }),
    mainProjected
  ]
  const unionPoints = allPolygons.reduce(unionPolygons, []).flat();

  return (
    <Group>
      {/* Base face */}
      <Line
        points={baseProjected.flat()}
        closed={true}
        fill={faceColor}
        stroke={color}
        strokeWidth={strokeWidth}
      />
      {/* Sorted side faces */}
      {sortedFaces.map(({ index, isSeen }) => {
        const nextIndex = (index + 1) % baseProjected.length;
        const points = [
          ...baseProjected[index],
          ...baseProjected[nextIndex],
          ...topProjected[nextIndex],
          ...topProjected[index],
        ];
        return isSeen ? (
          <Line
            lineJoin="round"
            key={index}
            points={points}
            closed={true}
            fill={faceColor}
            stroke={index % 2 === 0 ? color : (secondaryColor ?? color)}
            strokeWidth={strokeWidth}
          />
        ) : null;
      })}
      {/* Main side edges */}
      {mainPoints.map((point, index) => (
        <Line
          key={index}
          points={[point[0], point[1], mainProjected[index][0], mainProjected[index][1]]}
          stroke={color}
          strokeWidth={strokeWidth}
        />
      ))}
      {/* Top face */}
      <Line
        points={topProjected.flat()}
        closed={true}
        fill={faceColor}
        stroke={color}
        strokeWidth={strokeWidth}
      />
      {/* Union */}
      <Line
        points={unionPoints}
        closed={true}
        stroke={color}
        strokeWidth={thickerStrokeWidth}
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
    </Group>
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

function vectorProduct(ax: number, ay: number, bx: number, by: number): number {
  return ax * by - ay * bx;
}

function unionPolygons(polygon1: number[][], polygon2: number[][]): number[][] {
  if (polygon1.length === 0) {
    return polygon2
  }
  if (polygon2.length === 0) {
    return polygon1
  }
  polygon1 = [...polygon1, polygon1[0]];
  polygon2 = [...polygon2, polygon2[0]];
  try {
    var poly1 = polygon([polygon1]);
    var poly2 = polygon([polygon2]);
  } catch (e) {
    return []
  }

  let result = union(featureCollection([poly1, poly2]))?.geometry.coordinates as any
  if (result == null) {
    return []
  }
  while (typeof result[0][0] !== 'number') {
    result = result[0]
  }
  return result
}