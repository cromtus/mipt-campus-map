import React, { useEffect, useState } from 'react';
import { Rect as KonvaRect, Circle, Image } from 'react-konva';
import { Rect as RectType } from '../types';

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

  const [ icon, setIcon ] = useState<HTMLImageElement | null>(null)
  useEffect(() => {
    const img = new window.Image();
    img.src = 'data:image/svg+xml;base64,' + window.btoa('<svg stroke="currentColor" fill="rgba(0, 128, 0, 0.25)" stroke-width="0" viewBox="0 0 24 24" height="200px" width="200px" xmlns="http://www.w3.org/2000/svg"><path d="M9.82986 8.78986L7.99998 9.45588V13H5.99998V8.05H6.015L11.2834 6.13247C11.5274 6.03855 11.7922 5.99162 12.0648 6.0008C13.1762 6.02813 14.1522 6.75668 14.4917 7.82036C14.678 8.40431 14.848 8.79836 15.0015 9.0025C15.9138 10.2155 17.3653 11 19 11V13C16.8253 13 14.8823 12.0083 13.5984 10.4526L12.9008 14.4085L15 16.17V23H13V17.1025L10.7307 15.1984L10.003 19.3253L3.10938 18.1098L3.45667 16.1401L8.38071 17.0084L9.82986 8.78986ZM13.5 5.5C12.3954 5.5 11.5 4.60457 11.5 3.5C11.5 2.39543 12.3954 1.5 13.5 1.5C14.6046 1.5 15.5 2.39543 15.5 3.5C15.5 4.60457 14.6046 5.5 13.5 5.5Z"></path></svg>');
    img.onload = () => setIcon(img)
  }, [])

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
