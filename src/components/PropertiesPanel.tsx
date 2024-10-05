import React, { useState, useEffect } from 'react';
import './PropertiesPanel.css';
import type { Polygon, TextAlignment } from '../types';

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
    const updatedPolygon: Polygon = {
      ...selectedPolygon,
      description: selectedPolygon.description 
        ? { ...selectedPolygon.description, text } 
        : { text, offsetX: 0, offsetY: 0, alignment: 'center' } // Default coordinates
    };
    onPolygonChange(updatedPolygon);
  };

  const toggleDescription = () => {
    if (!showDescription) {
      const updatedPolygon: Polygon = {
        ...selectedPolygon,
        description: { text: '', offsetX: 0, offsetY: 0, alignment: 'center' }
      };
      onPolygonChange(updatedPolygon);
    } else {
      const { description, ...rest } = selectedPolygon;
      onPolygonChange(rest as Polygon);
    }
    setShowDescription(!showDescription);
  };

  const handleAlignmentChange = (alignment: TextAlignment) => {
    if (selectedPolygon.type === 'building' && selectedPolygon.description) {
      const updatedPolygon = {
        ...selectedPolygon,
        description: { ...selectedPolygon.description, alignment }
      };
      onPolygonChange(updatedPolygon);
    }
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
      {showDescription && selectedPolygon.type === 'building' && selectedPolygon.description && (
        <>
          <textarea
            value={selectedPolygon.description.text}
            onChange={(e) => handleDescriptionChange(e.target.value)}
            placeholder="Enter description..."
          />
          <div className="alignment-buttons">
            <button
              onClick={() => handleAlignmentChange('left')}
              className={selectedPolygon.description.alignment === 'left' ? 'active' : ''}
            >
              Left
            </button>
            <button
              onClick={() => handleAlignmentChange('center')}
              className={selectedPolygon.description.alignment === 'center' ? 'active' : ''}
            >
              Center
            </button>
            <button
              onClick={() => handleAlignmentChange('right')}
              className={selectedPolygon.description.alignment === 'right' ? 'active' : ''}
            >
              Right
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default PropertiesPanel;