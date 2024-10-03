import React from 'react';

interface EdgePropertiesPanelProps {
  edgeWidth: number;
  onEdgeWidthChange: (newWidth: number) => void;
}

const EdgePropertiesPanel: React.FC<EdgePropertiesPanelProps> = ({ edgeWidth, onEdgeWidthChange }) => {
  return (
    <div className="edge-properties-panel">
      <h3>Edge Properties</h3>
      <label>
        Width:
        <input
          type="number"
          value={edgeWidth}
          onChange={(e) => onEdgeWidthChange(Number(e.target.value))}
          min="1"
        />
      </label>
    </div>
  );
};

export default EdgePropertiesPanel;