import React, { useEffect, useRef, useState } from 'react';
import { Circle, Group, Text } from 'react-konva';
import { TextAlignment } from '../types';
import Konva from 'konva';

interface DescriptionTextProps {
  description: { text: string; offsetX: number; offsetY: number; alignment: TextAlignment };
  centerX: number;
  centerY: number;
  onDragMove: (newOffset: { offsetX: number; offsetY: number }) => void;
}

const DescriptionText: React.FC<DescriptionTextProps> = ({ 
  description, 
  centerX, 
  centerY, 
  onDragMove
}) => {
  const { text, offsetX, offsetY, alignment } = description;
  const lines = text.split('\n');

  return (
    <Group
      x={centerX + offsetX}
      y={centerY + offsetY}
      draggable={true}
      onDragMove={(e) => {
        const newOffsetX = e.target.x() - centerX;
        const newOffsetY = e.target.y() - centerY;
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
          y={index === 0 ? 0 : index * 12 + 12}
        />
      ))}
    </Group>
  );
};

export default DescriptionText;

type AlignedTextProps = {
  text: string;
  alignment: TextAlignment;
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
      fill="black"
      fillAfterStrokeEnabled={true}
      stroke="rgba(255, 255, 255, 0.5)"
      strokeWidth={4}
      align={alignment}
      offsetX={anchorX}
      width={textWidth}
      y={y}
      ref={ref}
    />
  )
}