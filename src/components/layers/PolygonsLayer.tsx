import React, { memo } from "react";
import { Polygon, Tool } from "../../types";
import PolygonComponent from "../shapes/Polygon";
import PolygonAnchors from "../shapes/PolygonAnchors";
import PolygonPreview from "../shapes/PolygonPreview";
import { useSelector } from "../../store";


interface PolygonsProps {
  centerDot: { x: number; y: number },
  tool: Tool
}

const PolygonsLayer: React.FC<PolygonsProps> = memo(({ centerDot, tool }) => {
  const polygons = useSelector(state => state.polygons.polygons);

  return (
    <>
      {[...polygons.map((poly, index) => ({ ...poly, index }))].sort(polygonsCompareFn(centerDot)).map(poly => (
        <PolygonComponent
          key={poly.index}
          polygon={poly}
          index={poly.index}
          centerDot={centerDot}
          hoverable={tool === 'select'}
        />
      ))}
      <PolygonAnchors />
      {(tool === 'building' || tool === 'pavement') && (
        <PolygonPreview tool={tool} />
      )}
    </>
  )
})

const polygonsCompareFn = (centerDot: { x: number; y: number }) => (a: Polygon, b: Polygon) => {
  if (a.type === 'pavement') return -1;
  if (b.type === 'pavement') return 1;
  // Sort buildings by distance from centerDot to the nearest polygon node
  if (a.type === 'building' && b.type === 'building') {
    const aDistance = Math.min(...a.points.map(point => 
      Math.sqrt(Math.pow(point[0] - centerDot.x, 2) + Math.pow(point[1] - centerDot.y, 2))
    ));
    const bDistance = Math.min(...b.points.map(point => 
      Math.sqrt(Math.pow(point[0] - centerDot.x, 2) + Math.pow(point[1] - centerDot.y, 2))
    ));
    return bDistance - aDistance; // Sort in descending order (furthest first)
  }
  return 0;
}

export default memo(PolygonsLayer);
