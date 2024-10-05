import React from 'react';
import { Group, Text } from 'react-konva';

interface DescriptionTextProps {
  description: { text: string; x: number; y: number };
  isSelected: boolean;
  onDragMove: (newPos: { x: number; y: number }) => void;
}

const DescriptionText: React.FC<DescriptionTextProps> = ({ description, isSelected, onDragMove }) => {
  const lines = description.text.split('\n');
  return (
    <Group
      x={description.x}
      y={description.y}
      draggable={!isSelected}
      onDragMove={(e) => onDragMove({ x: e.target.x(), y: e.target.y() })}
    >
      <Text
        text={lines[0]}
        fontSize={24}
        // fontStyle='bold'
        fill="black"
      />
      <Text
        text={lines.slice(1).join('\n')}
        y={24}
        fontSize={12}
        // fontStyle='bold'
        fill="black"
      />
    </Group>
  );
};

export default DescriptionText;