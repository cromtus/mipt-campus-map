import React from 'react';
import { Line } from 'react-konva';
import { GraphNode } from '../types';

interface PreviewEdgeProps {
  from: GraphNode;
  to: { x: number; y: number };
  kind: 'pathwalk' | 'road' | 'fence';
}

const PreviewEdge: React.FC<PreviewEdgeProps> = ({ from, to, kind }) => {
  return (
    <Line
      points={[from.x, from.y, to.x, to.y]}
      stroke={kind === 'pathwalk' ? 'green' : kind === 'road' ? 'white' : 'black'}
      strokeWidth={kind === 'pathwalk' ? 2 : kind === 'road' ? 10 : 1}
      dash={kind === 'pathwalk' ? [5, 5] : undefined}
      opacity={0.5}
    />
  );
};

export default PreviewEdge;
