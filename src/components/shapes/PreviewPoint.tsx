import React from 'react';
import { Circle } from 'react-konva';

interface PreviewPointProps {
  x: number;
  y: number;
}

const PreviewPoint: React.FC<PreviewPointProps> = ({ x, y }) => {
  return (
    <Circle
      x={x}
      y={y}
      radius={4}
      fill="rgba(0, 0, 0, 0.3)"
    />
  );
};

export default PreviewPoint;
