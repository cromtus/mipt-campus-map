import React from 'react';
import { Line } from 'react-konva';
import { GraphNode } from '../types';

interface PreviewEdgeProps {
  from: GraphNode;
  to: { x: number; y: number };
  isPathwalk: boolean;
}

const PreviewEdge: React.FC<PreviewEdgeProps> = ({ from, to, isPathwalk }) => {
  return (
    <Line
      points={[from.x, from.y, to.x, to.y]}
      stroke={isPathwalk ? 'green' : 'white'}
      strokeWidth={isPathwalk ? 2 : 10}
      dash={isPathwalk ? [5, 5] : undefined}
      opacity={0.5}
    />
  );
};

export default PreviewEdge;
