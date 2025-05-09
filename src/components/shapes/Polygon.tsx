import React, { useState } from 'react';
import { Line } from 'react-konva';
import Prism from './Prism';
import { Polygon as PolygonType } from '../../types';
import { useDispatch } from '../../store';
import { movePolygon, setSelected, updateDescriptionOffset } from '../../store/polygonsSlice';
import DescriptionText from './DescriptionText';

interface PolygonProps {
  polygon: PolygonType;
  index: number;
  centerDot: { x: number, y: number };
  hoverable: boolean;
}

const Polygon: React.FC<PolygonProps> = ({
  polygon,
  centerDot,
  hoverable,
  index,
}) => {
  const dispatch = useDispatch();
  const [isHovered, setHovered] = useState(false);

  const handlePolygonDragEnd = (e: any) => {
    const node = e.target;
    dispatch(movePolygon({ index, dx: node.x(), dy: node.y() }));
    node.position({ x: 0, y: 0 });
  };

  const getColors = () => {
    if (polygon.type === 'pavement') {
      return {
        fill: isHovered ? 'rgb(183, 183, 168)' : 'rgb(245, 245, 224)', // Light yellow
      };
    } else {
      return {
        stroke: isHovered ? "black" : undefined,
        strokeWidth: isHovered ? 3 : 0,
        fill: isHovered ? "rgba(0, 255, 0, 0.1)" : undefined
      };
    }
  };

  const prism = polygon.type === 'building' ? (
    <Prism
      basePoints={polygon.points}
      height={polygon.height}
      color={polygon.color}
      secondaryColor={polygon.secondaryColor}
      stageX={centerDot.x}
      stageY={centerDot.y}
      entries={polygon.entries}
    />
  ) : null
  let description = null;
  if (polygon.type === 'building' && polygon.description) {
    const midpoint = polygon.points.reduce((acc, point) => {
      return [acc[0] + point[0], acc[1] + point[1]];
    }, [0, 0]).map(coord => coord / polygon.points.length) as [number, number];
    description = (
      <DescriptionText
        description={polygon.description}
        centerX={centerDot.x}
        centerY={centerDot.y}
        height={polygon.height}
        x={midpoint[0]}
        y={midpoint[1]}
        onDragMove={(newOffset) => dispatch(updateDescriptionOffset(newOffset.offsetX, newOffset.offsetY))}
        draggable={hoverable}
      />
    )
  }

  const { stroke, fill, strokeWidth } = getColors();

  return (
    <>
      {prism}
      <Line
        points={polygon.points.flat()}
        closed={true}
        stroke={stroke}
        fill={fill}
        strokeWidth={strokeWidth || (isHovered ? 3 : 2)}
        draggable={hoverable}
        onDragEnd={handlePolygonDragEnd}
        onMouseEnter={() => hoverable && setHovered(true)}
        onMouseLeave={() => hoverable && setHovered(false)}
        onClick={(e) => {
          if (hoverable) {
            e.cancelBubble = true
            dispatch(setSelected(index))
          }
        }}
      />
      {description}
    </>
  );
};

export default Polygon;