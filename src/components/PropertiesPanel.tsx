import React, { useState, useEffect } from 'react';
import './PropertiesPanel.css';

interface PropertiesPanelProps {
  height: number;
  color: string;
  secondaryColor?: string;
  onHeightChange: (newHeight: number) => void;
  onColorChange: (newColor: string) => void;
  onSecondaryColorChange: (newColor: string | undefined) => void;
  edgeWidth?: number;
  onEdgeWidthChange?: (width: number) => void;
}

const PropertiesPanel: React.FC<PropertiesPanelProps> = ({ 
  height, 
  color, 
  secondaryColor, 
  onHeightChange, 
  onColorChange, 
  onSecondaryColorChange, 
  edgeWidth, 
  onEdgeWidthChange 
}) => {
  const [useSecondaryColor, setUseSecondaryColor] = useState(!!secondaryColor);
  const [localSecondaryColor, setLocalSecondaryColor] = useState(secondaryColor || '#FFFFFF');
  const [showDescription, setShowDescription] = useState(false);

  useEffect(() => {
    setUseSecondaryColor(!!secondaryColor);
    setLocalSecondaryColor(secondaryColor || '#FFFFFF');
  }, [secondaryColor]);

  const handleSecondaryColorChange = (newColor: string) => {
    setLocalSecondaryColor(newColor);
    if (useSecondaryColor) {
      onSecondaryColorChange(newColor);
    }
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUseSecondaryColor(e.target.checked);
    if (e.target.checked) {
      onSecondaryColorChange(localSecondaryColor);
    } else {
      onSecondaryColorChange(undefined);
    }
  };

  return (
    <div className="properties-panel">
      <h3>Building Properties</h3>
      <label>
        Height:
        <input
          type="number"
          value={height}
          onChange={(e) => onHeightChange(Number(e.target.value))}
          min="1"
        />
      </label>
      <label>
        Primary Color:
        <input
          type="color"
          value={color}
          onChange={(e) => onColorChange(e.target.value)}
        />
      </label>
      <label>
        <input
          type="checkbox"
          checked={useSecondaryColor}
          onChange={handleCheckboxChange}
        />
        Use Secondary Color
      </label>
      {useSecondaryColor && (
        <label>
          Secondary Color:
          <input
            type="color"
            value={localSecondaryColor}
            onChange={(e) => handleSecondaryColorChange(e.target.value)}
          />
        </label>
      )}
      {edgeWidth !== undefined && onEdgeWidthChange && (
        <label>
          Edge Width:
          <input
            type="number"
            value={edgeWidth}
            onChange={(e) => onEdgeWidthChange(Number(e.target.value))}
            min="1"
          />
        </label>
      )}
    </div>
  );
};

export default PropertiesPanel;