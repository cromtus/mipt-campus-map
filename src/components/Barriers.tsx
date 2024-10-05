import React from "react";
import { Circle, Group, Image } from "react-konva";
import { GraphEdge, GraphNode } from "../types";
import { getIntersection } from "../utils/geometry";
import { FaRoadBarrier } from "react-icons/fa6";

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
  const image = new window.Image();
  image.src = url;

  return (
    <>
      {intersections.map((intersection, index) => (
        <Group
          key={index}
          x={intersection.x}
          y={intersection.y}
        >
          <Image image={image} width={12} height={12} x={-6} y={-6} />
        </Group>
      ))}
    </>
  )
};

const url =  'data:image/svg+xml;base64,' + window.btoa('<svg stroke="currentColor" fill="gray" stroke-width="0" viewBox="0 0 640 512" height="200px" width="200px" xmlns="http://www.w3.org/2000/svg"><path d="M32 32C14.3 32 0 46.3 0 64V448c0 17.7 14.3 32 32 32s32-14.3 32-32V266.3L149.2 96H64V64c0-17.7-14.3-32-32-32zM405.2 96H330.8l-5.4 10.7L234.8 288h74.3l5.4-10.7L405.2 96zM362.8 288h74.3l5.4-10.7L533.2 96H458.8l-5.4 10.7L362.8 288zM202.8 96l-5.4 10.7L106.8 288h74.3l5.4-10.7L277.2 96H202.8zm288 192H576V448c0 17.7 14.3 32 32 32s32-14.3 32-32V64c0-17.7-14.3-32-32-32s-32 14.3-32 32v53.7L490.8 288z"></path></svg>');