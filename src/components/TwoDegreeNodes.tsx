import React from "react";
import { Circle } from "react-konva";
import { GraphEdge, GraphNode } from "../types";

const TwoDegreeNodes: React.FC<{ nodes: GraphNode[], edges: GraphEdge[] }> = ({ nodes, edges }) => {
  return (
    <React.Fragment>
      {nodes.map(node => {
        const nodeEdges = edges.filter(e => e.from === node.id || e.to === node.id)
        const twoRoads = nodeEdges.filter(e => e.type === 'road').length === 2
        const radius = Math.max(...nodeEdges.filter(e => e.type === 'road').map(e => e.width / 2))
        return twoRoads ? (
          <Circle
            key={node.id}
            x={node.x}
            y={node.y}
            radius={radius}
            fill="white"
          />
        ) : null
      })}
    </React.Fragment>
  )
}

export default TwoDegreeNodes