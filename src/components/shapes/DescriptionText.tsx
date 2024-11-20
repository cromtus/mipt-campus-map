import React, { useEffect, useRef, useState } from 'react';
import { Circle, Group, Text } from 'react-konva';
import { BuildingDescription } from '../../types';
import Konva from 'konva';
import { projectPoint } from '../../utils/geometry';

interface DescriptionTextProps {
  description: BuildingDescription;
  height: number;
  centerX: number;
  centerY: number;
  x: number;
  y: number;
  onDragMove: (newOffset: { offsetX: number; offsetY: number }) => void;
  draggable?: boolean;
}

const DescriptionText: React.FC<DescriptionTextProps> = ({ 
  description, 
  height,
  centerX,
  centerY,
  x: initialX,
  y: initialY,
  onDragMove,
  draggable,
}) => {
  const { text, offsetX, offsetY, alignment } = description;
  const lines = text.split('\n');
  const yMultiplier = description.reversed ? -1 : 1;
  const [x, y] = projectPoint(initialX, initialY, height, centerX, centerY);

  return (
    <Group
      x={x + offsetX}
      y={y + offsetY}
      draggable={draggable}
      onDragMove={(e) => {
        const newOffsetX = e.target.x() - x;
        const newOffsetY = e.target.y() - y;
        onDragMove({ offsetX: newOffsetX, offsetY: newOffsetY });
      }}
    >
      {lines.map((line, index) => (
        <AlignedText
          key={index}
          text={line}
          alignment={alignment}
          fontSize={index === 0 ? 24 : 12}
          fontStyle={lines.length > 2 ? (index < 2 ? 'bold' : 'normal') : (index < 1 ? 'bold' : 'normal')}
          y={(index === 0 ? 0 : index * 12 + (description.reversed ? 0 : 12)) * yMultiplier}
        />
      ))}
    </Group>
  );
};

export default DescriptionText;

type AlignedTextProps = {
  text: string;
  alignment: BuildingDescription['alignment'];
  fontSize: number;
  fontStyle?: string;
  y?: number;
}

const AlignedText: React.FC<AlignedTextProps> = ({ text, alignment, fontSize, fontStyle, y = 0 }) => {
  const ref = useRef<Konva.Text>(null);
  const maxWidth = text.length * fontSize;
  const [ textWidth, setTextWidth ] = useState(maxWidth);
  useEffect(() => {
    if (ref.current) {
      setTextWidth(ref.current.getTextWidth());
    }
  }, [text, fontSize]);
  const anchorX = alignment === 'center' ? textWidth / 2 : alignment === 'right' ? textWidth : 0;
  return (
    <Text
      text={text}
      fontSize={fontSize}
      fontStyle={fontStyle}
      fontFamily='Arial'
      lineHeight={1}
      fill="black"
      fillAfterStrokeEnabled={true}
      stroke="rgba(255, 255, 255, 0.75)"
      strokeWidth={6}
      align={alignment}
      offsetX={anchorX}
      width={textWidth}
      y={y}
      ref={ref}
    />
  )
}