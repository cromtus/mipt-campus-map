import { GraphNode } from "../types";
import { focalLength } from "./constants";

export const getIntersection = (
    node1: GraphNode,
    node2: GraphNode,
    node3: GraphNode,
    node4: GraphNode
): { x: number, y: number } | null => {
    const { x: x1, y: y1 } = node1;
    const { x: x2, y: y2 } = node2;
    const { x: x3, y: y3 } = node3;
    const { x: x4, y: y4 } = node4;

    const denom = (y4 - y3) * (x2 - x1) - (x4 - x3) * (y2 - y1);
    if (denom === 0) return null; // Lines are parallel

    const ua = ((x4 - x3) * (y1 - y3) - (y4 - y3) * (x1 - x3)) / denom;
    const ub = ((x2 - x1) * (y1 - y3) - (y2 - y1) * (x1 - x3)) / denom;

    if (ua < 0 || ua > 1 || ub < 0 || ub > 1) return null; // Intersection point is outside of both line segments

    const x = x1 + ua * (x2 - x1);
    const y = y1 + ua * (y2 - y1);

    return { x, y };
};

export const projectPoint = (x: number, y: number, z: number, centerX: number, centerY: number): [number, number] => {
    const adjustedX = x - centerX;
    const adjustedY = y - centerY;
    
    const projectedX = (adjustedX * focalLength) / (focalLength - z);
    const projectedY = (adjustedY * focalLength) / (focalLength - z);
    
    return [projectedX + centerX, projectedY + centerY];
};
