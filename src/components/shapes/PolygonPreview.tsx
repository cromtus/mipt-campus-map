import React, { useCallback, useContext, useEffect, useRef, useState } from 'react';
import { Line, Circle, Text } from 'react-konva';
import { Polygon, Tool } from '../../types';
import PreviewPoint from './PreviewPoint';
import { MousePositionContext, ClickListenersContext } from '../../contexts/mouse';
import { useDispatch } from '../../store';
import { addPolygon } from '../../store/polygonsSlice';
import usePointsForSnapping from '../../hooks/usePointsForSnapping';
import { renderSnapLines, snapPosition } from '../../utils/snapPosition';

interface PolygonPreviewProps {
  tool: Tool;
}

function useRendersPerSecond() {
  const timestamps = useRef<number[]>([]);
  const now = Date.now();
  timestamps.current.push(now);
  while (timestamps.current.length > 0 && timestamps.current[0] < now - 1000) {
    timestamps.current.shift();
  }
  return timestamps.current.length;
}

const PolygonPreview: React.FC<PolygonPreviewProps> = ({ tool }) => {
  let mousePosition = useContext(MousePositionContext);
  const clickListeners = useContext(ClickListenersContext);
  const dispatch = useDispatch();
  const [points, setPoints] = useState<number[][]>([]);
  const snappingPoints = usePointsForSnapping(null, null, points);
  const { snapped, snapLines } = snapPosition(mousePosition, snappingPoints) ?? {};
  mousePosition = snapped ?? mousePosition;
  const rendersPerSecond = useRendersPerSecond();

  const isHoveringFirstNode = 
    points.length > 2 && 
    mousePosition &&
    Math.abs(points[0][0] - mousePosition.x) < 10 &&
    Math.abs(points[0][1] - mousePosition.y) < 10;

  if (isHoveringFirstNode) {
    mousePosition = { x: points[0][0], y: points[0][1] };
  }

  const handlePolygonClose = () => {
    if (points.length > 1) {
      let newPolygon: Polygon;
      switch (tool) {
        case 'building':
          newPolygon = {
            points: points, 
            type: 'building', 
            height: 100, 
            color: '#000000',
            entries: [],
          };
          break;
        case 'pavement':
          newPolygon = {
            points: points, 
            type: 'pavement' 
          };
          break;
        default:
          return;
      }
      dispatch(addPolygon(newPolygon));
      setPoints([]);
    }
  };

  const handleNodeAdd = useCallback(() => {
    const newPoint = [mousePosition!.x, mousePosition!.y];
    setPoints([...points, newPoint]);
  }, [mousePosition]);

  useEffect(() => {
    clickListeners.current.push(handleNodeAdd);
    return () => {
      clickListeners.current = clickListeners.current.filter(listener => listener !== handleNodeAdd);
    };
  }, [mousePosition]);

  return (
    <>
      <Text text={`${rendersPerSecond} FPS`} />
      {mousePosition && <PreviewPoint x={mousePosition.x} y={mousePosition.y} />}
      <Line
        points={points.flat()}
        stroke="black"
        strokeWidth={2}
        closed={false}
      />
      {mousePosition && points.length > 0 && (
        <Line
          points={[...points[points.length - 1], mousePosition.x, mousePosition.y]}
          stroke="gray"
          strokeWidth={1}
        />
      )}
      {points.map((point, index) => (
        <Circle key={index} x={point[0]} y={point[1]} radius={4} fill="black" />
      ))}
      {isHoveringFirstNode && (
        <Circle
          x={points[0][0]}
          y={points[0][1]}
          radius={10}
          fill="yellow"
          opacity={0.5}
          onClick={e => {
            e.cancelBubble = true;
            handlePolygonClose();
          }}
        />
      )}
      {snapLines && renderSnapLines(snapLines)}
    </>
  );
};

export default PolygonPreview;
