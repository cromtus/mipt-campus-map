import React from 'react';
import { Rect } from '../types';

interface RectPropertiesPanelProps {
  rect: Rect;
  onChange: (updatedRect: Rect) => void;
}

const RectPropertiesPanel: React.FC<RectPropertiesPanelProps> = ({ rect, onChange }) => {
  const handleChange = (property: keyof Rect, value: number) => {
    onChange({ ...rect, [property]: value });
  };

  return (
    <div className="properties-panel">
      <h3>Rectangle Properties</h3>
      <label>
        Corner Radius:
        <input
          type="number"
          min="0"
          value={rect.cornerRadius}
          onChange={(e) => handleChange('cornerRadius', Number(e.target.value))}
        />
      </label>
    </div>
  );
};

export default RectPropertiesPanel;