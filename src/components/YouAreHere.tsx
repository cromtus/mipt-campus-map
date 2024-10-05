import React from 'react';
import { Group, Rect, Line, Text } from 'react-konva';

type YouAreHereProps = {
  x: number;
  y: number;
  handleDotDrag: (e: any) => void;
}

const YouAreHere: React.FC<YouAreHereProps> = ({ x, y, handleDotDrag }) => {
  return (
    <Group
      x={x}
      y={y}
      draggable
      onDragMove={handleDotDrag}
    >
      <Line points={[0, 0, -5, 5, 5, 5]} fill="red" closed={true} />
      <Rect x={-5} y={-1} width={10} height={1} fill="red" />
      <Text text="Вы здесь" x={8} y={-2} fontSize={10} fill="red" />
      <Text text="You are here" x={8} y={8} fontSize={7} fill="red" />
    </Group>
  );
};

export default YouAreHere;