import { useMemo } from "react";
import { useSelector } from "../store";
import { Polygon } from "../types";
import { useKeyboard } from "./useKeyboard";;

export default function usePointsForSnapping(
  excludePolygonIndex: number | null = null,
  excludeNodeIndex: number | null = null,
  additionalPoints: number[][] = [],
) {
  const polygons = useSelector(state => state.polygons.polygons);
  let allPoints = useMemo(() => (
    getAllPolygonPoints(polygons, excludePolygonIndex, excludeNodeIndex)
  ), [polygons, excludePolygonIndex, excludeNodeIndex]);
  if (additionalPoints.length > 0) {
    allPoints = [...allPoints, ...additionalPoints];
  }
  const { isCtrlPressed } = useKeyboard();
  if (isCtrlPressed) {
    return allPoints;
  }
  return [];
}

function getAllPolygonPoints(polygons: Polygon[], excludePolygonIndex: number | null = null, excludeNodeIndex: number | null = null): number[][] {
  return polygons.flatMap((polygon, index) => polygon.points.filter((_, nodeIndex) => 
    index !== excludePolygonIndex || nodeIndex !== excludeNodeIndex
  ));
};