import React from "react";
import { Circle, Group, Image } from "react-konva";
import { GraphEdge, GraphNode } from "../types";
import { getIntersection } from "../utils/geometry";
import { FaRoadBarrier } from "react-icons/fa6";
import useReactIcon from "../hooks/useReactIcon";

interface BarriersProps {
  edges: GraphEdge[];
  nodes: Map<string, GraphNode>;
}

export const Barriers: React.FC<BarriersProps> = ({ edges, nodes }) => {
  const intersections: { x: number, y: number }[] = [];
  for (const edge of edges) {
    if (edge.type !== 'fence') continue;
    const fromNode = nodes.get(edge.from);
    const toNode = nodes.get(edge.to);
    if (!fromNode || !toNode) continue;
    for (const otherEdge of edges) {
      if (otherEdge.type !== 'road') continue;
      if (edge.from === otherEdge.from || edge.from === otherEdge.to || edge.to === otherEdge.from || edge.to === otherEdge.to) continue;
      const otherFromNode = nodes.get(otherEdge.from);
      const otherToNode = nodes.get(otherEdge.to);
      if (otherFromNode && otherToNode) {
        const intersection = getIntersection(fromNode, toNode, otherFromNode, otherToNode);
        if (intersection) {
          intersections.push(intersection);
        }
      }
    }
  }
  const icon = useReactIcon(FaRoadBarrier, 'gray');

  return icon ? (
    <>
      {intersections.map((intersection, index) => (
        <Group
          key={index}
          x={intersection.x}
          y={intersection.y}
        >
          <Image image={icon} width={12} height={12} x={-6} y={-6} />
        </Group>
      ))}
    </>
  ) : null;
};
