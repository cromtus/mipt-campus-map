import React, { useState } from 'react';
import { Circle, Line } from 'react-konva';
import { GraphEdge as GraphEdgeType, GraphNode } from '../types';
import { getIntersection } from '../utils/geometry';

interface GraphEdgeProps {
  edge: GraphEdgeType;
  edges: GraphEdgeType[];
  nodes: Map<string, GraphNode>;
  interactive: boolean;
  isSelected: boolean;
  onSelect: () => void;
}

const GraphEdge: React.FC<GraphEdgeProps> = ({ edge, edges, nodes, interactive, isSelected, onSelect }) => {
  const [isHovered, setIsHovered] = useState(false);
  const fromNode = nodes.get(edge.from);
  const toNode = nodes.get(edge.to);

  if (!fromNode || !toNode) return null;

  let schlagbaum: { x: number, y: number } | null = null;
  if (edge.type === 'fence') {
    const fromNode = nodes.get(edge.from);
    const toNode = nodes.get(edge.to);
    if (fromNode && toNode) {
      for (const e of edges) {
        if (e.type !== 'pathwalk') continue;
        const from = nodes.get(e.from);
        const to = nodes.get(e.to);
        if (from && to) {
          const intersection = getIntersection(fromNode, toNode, from, to);
          if (intersection) {
            schlagbaum = intersection;
          }
        }
      }
    }
  }
  const stroke = edge.type === 'pathwalk' ? (
    isHovered || isSelected ? 'black' : 'rgba(0, 150, 0, 0.7)'
   ) : edge.type === 'fence' ? (
    isHovered || isSelected ? 'black' : 'gray'
   ) : (
    isHovered || isSelected ? 'gray' : 'white'
   );

  return (
    <>
      <Line
        points={[fromNode.x, fromNode.y, toNode.x, toNode.y]}
        stroke={stroke}
        strokeWidth={edge.type === 'pathwalk' ? 1 : edge.type === 'fence' ? 1 : edge.width}
        dash={edge.type === 'pathwalk' ? [3, 3] : undefined}
        onMouseEnter={() => interactive && setIsHovered(true)}
        onMouseLeave={() => interactive && setIsHovered(false)}
        onClick={e => {
          if (interactive) {
            e.cancelBubble = true;
            onSelect()
          }
        }}
      />
      {schlagbaum && (
        <Circle
          x={schlagbaum.x}
          y={schlagbaum.y}
          radius={3}
          fill="#e8f7e8"
        />
      )}
    </>
  );
};

export default GraphEdge;
