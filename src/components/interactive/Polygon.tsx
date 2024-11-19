import React from "react";
import { Circle } from "react-konva";
import { useKeyboard } from "../../hooks/useKeyboard";
import { useDispatch, useSelector } from "../../store";
import { deletePolygon, updateNode, selectCurrentPolygon } from "../../store/polygonsSlice";

const Polygon: React.FC = () => {
  const polygon = useSelector(selectCurrentPolygon);
  const dispatch = useDispatch();
  useKeyboard({ onDelete: () => dispatch(deletePolygon()) });

  if (!polygon) return null;

  const handleNodeDragMove = (nodeIndex: number) => (e: any) => {
    const node = e.target;
    dispatch(updateNode({ nodeIndex, x: node.x(), y: node.y() }));
  };

  return (
    <>
      {polygon.points.map((point, index) => (
        <Circle
          key={index}
          x={point[0]}
          y={point[1]}
          radius={6}
          fill="red"
          draggable
          onDragMove={handleNodeDragMove(index)}
        />
      ))}
    </>
  )
}

export default Polygon;
