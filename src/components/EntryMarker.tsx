import React from 'react';
import { Arrow } from 'react-konva';

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
      markerAngle = Math.atan2(nextPoint[1] - point[1], nextPoint[0] - point[0]) - Math.PI / 2;
      break;
    }

    currentLength += segmentLength;
  }

  if (!markerPosition) return null;

  const arrowLength = 10;
  const arrowAngle = Math.PI / 6;

  return (
    <Arrow
      points={[
        markerPosition[0] + arrowLength * Math.cos(markerAngle + Math.PI),
        markerPosition[1] + arrowLength * Math.sin(markerAngle + Math.PI),
        markerPosition[0],
        markerPosition[1]
      ]}
      pointerLength={5}
      pointerWidth={5}
      fill="gray"
      stroke="gray"
      strokeWidth={2}
    />
  );
};

export default EntryMarker;