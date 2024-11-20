import React, { useCallback, useState } from "react";
import { Circle } from "react-konva";
import { useKeyboard } from "../../hooks/useKeyboard";
import { useDispatch, useSelector } from "../../store";
import { deletePolygon, updateNode, selectCurrentPolygon, unselect } from "../../store/polygonsSlice";
import { Polygon as PolygonType } from "../../types";
import usePointsForSnapping from "../../hooks/usePointsForSnapping";
import { renderSnapLines } from "../../utils/snapPosition";
import { snapPosition } from "../../utils/snapPosition";
import { useOutsideClickListener } from "../../contexts/mouse";

const PolygonAnchors: React.FC = () => {
  const polygon = useSelector(selectCurrentPolygon);
  const index = useSelector(state => state.polygons.selectedIndex);
  if (!polygon) return null;
  return <PolygonAnchorsInner polygon={polygon} index={index} />
}

type PolygonAnchorsInnerProps = {
  polygon: PolygonType;
  index: number;
}

const PolygonAnchorsInner: React.FC<PolygonAnchorsInnerProps> = ({ polygon, index }) => {
  const dispatch = useDispatch();
  useKeyboard({ onDelete: () => dispatch(deletePolygon()) });
  const [ draggingNodeIndex, setDraggingNodeIndex ] = useState<number | null>(null);
  const snappingPoints = usePointsForSnapping(index, draggingNodeIndex);
  const [ snapLines, setSnapLines ] = useState<any | null>(null);

  const handleOutsideClick = useCallback(() => {
    dispatch(unselect());
  }, [dispatch]);
  useOutsideClickListener(handleOutsideClick);

  const handleNodeDragMove = (nodeIndex: number) => (e: any) => {
    const node = e.target;
    let newPosition = node.position();
    if (snappingPoints.length > 0) {
      const { snapped, snapLines } = snapPosition(newPosition, snappingPoints) ?? {};
      newPosition = snapped ?? newPosition;
      setSnapLines(snapLines);
      node.position(newPosition);
    }
    dispatch(updateNode({ nodeIndex, ...newPosition }));
  };

  return (
    <>
      {polygon.points.map((point, nodeIndex) => (
        <Circle
          key={nodeIndex}
          x={point[0]}
          y={point[1]}
          radius={6}
          fill="red"
          draggable
          onDragStart={() => setDraggingNodeIndex(nodeIndex)}
          onDragEnd={() => setDraggingNodeIndex(null)}
          onDragMove={handleNodeDragMove(nodeIndex)}
        />
      ))}
      {snapLines && snappingPoints.length > 0 && renderSnapLines(snapLines)}
    </>
  )
}

export default PolygonAnchors;
