import React, { useMemo } from 'react';
import { Arrow, Group, Line } from 'react-konva';

interface EntryMarkerProps {
  points: number[][];
  entry: number;
}

const EntryMarker: React.FC<EntryMarkerProps> = ({ points, entry }) => {
  const totalLength = points.reduce((acc, point, index) => {
    const nextPoint = points[(index + 1) % points.length];
    return acc + Math.sqrt(
      Math.pow(nextPoint[0] - point[0], 2) + Math.pow(nextPoint[1] - point[1], 2)
    );
  }, 0);
  const orientedArea = points.reduce((acc, point, index) => {
    const nextPoint = points[(index + 1) % points.length];
    return acc + (point[0] * nextPoint[1] - nextPoint[0] * point[1]);
  }, 0);

  let currentLength = 0;
  let markerPosition: number[] | null = null;
  let markerAngle = 0;

  for (let i = 0; i < points.length; i++) {
    const point = points[i];
    const nextPoint = points[(i + 1) % points.length];
    const segmentLength = Math.sqrt(
      Math.pow(nextPoint[0] - point[0], 2) + Math.pow(nextPoint[1] - point[1], 2)
    );

    if (currentLength / totalLength <= entry && (currentLength + segmentLength) / totalLength > entry) {
      const t = (entry - currentLength / totalLength) / (segmentLength / totalLength);
      markerPosition = [
        point[0] + t * (nextPoint[0] - point[0]),
        point[1] + t * (nextPoint[1] - point[1])
      ];
      markerAngle = Math.atan2(nextPoint[1] - point[1], nextPoint[0] - point[0]) - Math.PI / 2 * Math.sign(orientedArea);
      break;
    }

    currentLength += segmentLength;
  }

  if (!markerPosition) return null;

  const size = 4;
  const markerPoints = useMemo(() => [
    0, 0,
    size, -size,
    size + size / 2, -size + size / 2,
    size, 0,
    size + size / 2, size - size / 2,
    size, size
  ], [size]);

  return (
    <Group
      x={markerPosition[0]}
      y={markerPosition[1]}
      rotation={markerAngle * 180 / Math.PI}
    >
      <Line
        points={markerPoints}
        fill="rgb(0, 150, 0)"
        // stroke="rgba(255, 255, 255, 0.5)"
        // fillAfterStrokeEnabled
        // strokeWidth={2}
        closed
      />
    </Group>
  );
};

export default EntryMarker;