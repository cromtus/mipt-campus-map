import React from 'react';
import { Rect as KonvaRect, Circle, Image } from 'react-konva';
import { Rect as RectType } from '../types';
import { FaPersonRunning } from 'react-icons/fa6';
import useReactIcon from '../hooks/useReactIcon';

interface RectProps {
  rect: RectType;
  isSelected: boolean;
  onHoverUpdate: (hovered: boolean) => void;
  onChange: (updatedRect: RectType) => void;
}

const Rect: React.FC<RectProps> = ({ rect, isSelected, onHoverUpdate, onChange }) => {
  const handleDragMove = (e: any) => {
    onChange({ ...rect, x: e.target.x(), y: e.target.y() });
  };

  const handleCornerDragMove = (corner: 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight', e: any) => {
    const newX = corner === 'topLeft' || corner === 'bottomLeft' ? e.target.x() : rect.x;
    const newY = corner === 'topLeft' || corner === 'topRight' ? e.target.y() : rect.y;
    const newWidth = corner === 'topRight' || corner === 'bottomRight' ? e.target.x() - rect.x : rect.x + rect.width - newX;
    const newHeight = corner === 'bottomLeft' || corner === 'bottomRight' ? e.target.y() - rect.y : rect.y + rect.height - newY;

    onChange({ ...rect, x: newX, y: newY, width: newWidth, height: newHeight });
  };
  const centerX = rect.x + rect.width / 2;
  const centerY = rect.y + rect.height / 2;
  const x = rect.width < 0 ? rect.x + rect.width : rect.x;
  const y = rect.height < 0 ? rect.y + rect.height : rect.y;

  const icon = useReactIcon(FaPersonRunning, 'rgba(0, 128, 0, 0.2)');

  return (
    <>
      <KonvaRect
        x={x}
        y={y}
        width={Math.abs(rect.width)}
        height={Math.abs(rect.height)}
        cornerRadius={rect.cornerRadius}
        fill="rgba(0, 128, 0, 0.1)"
        stroke={isSelected ? 'blue' : 'rgba(0, 72, 0, 0.1)'}
        strokeWidth={isSelected ? 2 : 1}
        onMouseEnter={() => onHoverUpdate(true)}
        onMouseLeave={() => onHoverUpdate(false)}
        draggable
        onDragMove={handleDragMove}
      />
      {!isSelected && icon && (
        <Image
          image={icon}
          x={centerX - 8}
          y={centerY - 8}
          width={16}
          height={16}
        />
      )}
      {isSelected && (
        <>
          <Circle
            x={rect.x}
            y={rect.y}
            radius={5}
            fill="blue"
            draggable
            onDragMove={(e) => handleCornerDragMove('topLeft', e)}
          />
          <Circle
            x={rect.x + rect.width}
            y={rect.y}
            radius={5}
            fill="blue"
            draggable
            onDragMove={(e) => handleCornerDragMove('topRight', e)}
          />
          <Circle
            x={rect.x}
            y={rect.y + rect.height}
            radius={5}
            fill="blue"
            draggable
            onDragMove={(e) => handleCornerDragMove('bottomLeft', e)}
          />
          <Circle
            x={rect.x + rect.width}
            y={rect.y + rect.height}
            radius={5}
            fill="blue"
            draggable
            onDragMove={(e) => handleCornerDragMove('bottomRight', e)}
          />
        </>
      )}
    </>
  );
};

export default Rect;
