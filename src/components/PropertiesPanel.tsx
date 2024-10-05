import React, { useState, useEffect } from 'react';
import './PropertiesPanel.css';
import type { Polygon } from '../types';


interface PropertiesPanelProps {
  selectedPolygon: Polygon | null;
  onPolygonChange: (updatedPolygon: Polygon) => void;
}

const PropertiesPanel: React.FC<PropertiesPanelProps> = ({ selectedPolygon, onPolygonChange }) => {
  const [showDescription, setShowDescription] = useState(false);

  useEffect(() => {
    if (selectedPolygon && selectedPolygon.type === 'building') {
      setShowDescription(!!selectedPolygon.description);
    } else {
      setShowDescription(false);
    }
  }, [selectedPolygon]);

  if (!selectedPolygon || selectedPolygon.type !== 'building') return null;

  const handleDescriptionChange = (text: string) => {
    const updatedPolygon = {
      ...selectedPolygon,
      description: selectedPolygon.description 
        ? { ...selectedPolygon.description, text } 
        : { text, x: 0, y: 0 } // Default coordinates
    };
    onPolygonChange(updatedPolygon);
  };

  const toggleDescription = () => {
    if (!showDescription) {
      // Calculate center of the polygon
      const centerX = selectedPolygon.points.reduce((sum, point) => sum + point[0], 0) / selectedPolygon.points.length;
      const centerY = selectedPolygon.points.reduce((sum, point) => sum + point[1], 0) / selectedPolygon.points.length;
      
      const updatedPolygon = {
        ...selectedPolygon,
        description: { text: '', x: centerX, y: centerY }
      };
      onPolygonChange(updatedPolygon);
    } else {
      const { description, ...rest } = selectedPolygon;
      onPolygonChange(rest as Polygon);
    }
    setShowDescription(!showDescription);
  };

  return (
    <div className="properties-panel">
      <h3>Building Properties</h3>
      <label>
        Height:
        <input
          type="number"
          value={selectedPolygon.height}
          onChange={(e) => onPolygonChange({ ...selectedPolygon, height: Number(e.target.value) })}
        />
      </label>
      <label>
        Primary Color:
        <input
          type="color"
          value={selectedPolygon.color}
          onChange={(e) => onPolygonChange({ ...selectedPolygon, color: e.target.value })}
        />
      </label>
      <label>
        <input
          type="checkbox"
          checked={selectedPolygon.secondaryColor != null}
          onChange={(e) => onPolygonChange({ ...selectedPolygon, secondaryColor: e.target.checked ? '#000000' : undefined })}
        />
        Use Secondary Color
      </label>
      {selectedPolygon.secondaryColor && (
        <label>
          Secondary Color:
          <input
            type="color"
            value={selectedPolygon.secondaryColor}
            onChange={(e) => onPolygonChange({ ...selectedPolygon, secondaryColor: e.target.value })}
          />
        </label>
      )}
      <label>
        <input
          type="checkbox"
          checked={showDescription}
          onChange={toggleDescription}
        />
        Show Description
      </label>
      {showDescription && (
        <textarea
          value={selectedPolygon.description?.text || ''}
          onChange={(e) => handleDescriptionChange(e.target.value)}
          placeholder="Enter description..."
        />
      )}
    </div>
  );
};

export default PropertiesPanel;