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
    if (selectedPolygon.description) {
      const updatedPolygon: Polygon = {
        ...selectedPolygon,
        description: { ...selectedPolygon.description, text }
      };
      onPolygonChange(updatedPolygon);
    }
  };

  const toggleDescription = () => {
    if (!showDescription) {
      const updatedPolygon: Polygon = {
        ...selectedPolygon,
        description: { text: '', offsetX: 0, offsetY: 0, alignment: 'center', reversed: false }
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

  const handleReversedChange = (reversed: boolean) => {
    if (selectedPolygon.type === 'building' && selectedPolygon.description) {
      const updatedPolygon = {
        ...selectedPolygon,
        description: { ...selectedPolygon.description, reversed }
      };
      onPolygonChange(updatedPolygon);
    }
  };

  const addEntry = () => {
    if (selectedPolygon && selectedPolygon.type === 'building') {
      const newEntry = {
        id: Date.now().toString(),
        position: 0
      };
      const updatedPolygon = {
        ...selectedPolygon,
        entries: [...(selectedPolygon.entries || []), newEntry]
      };
      onPolygonChange(updatedPolygon);
    }
  };

  const updateEntry = (id: string, position: number) => {
    if (selectedPolygon && selectedPolygon.type === 'building') {
      const updatedEntries = selectedPolygon.entries.map(entry =>
        entry.id === id ? { ...entry, position } : entry
      );
      const updatedPolygon = {
        ...selectedPolygon,
        entries: updatedEntries
      };
      onPolygonChange(updatedPolygon);
    }
  };

  const removeEntry = (id: string) => {
    if (selectedPolygon && selectedPolygon.type === 'building') {
      const updatedEntries = selectedPolygon.entries.filter(entry => entry.id !== id);
      const updatedPolygon = {
        ...selectedPolygon,
        entries: updatedEntries
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
          <label>
            <input
              type="checkbox"
              checked={selectedPolygon.description.reversed}
              onChange={(e) => handleReversedChange(e.target.checked)}
            />
            Reversed
          </label>
        </>
      )}
      {selectedPolygon && selectedPolygon.type === 'building' && (
        <>
          <h3>Entries</h3>
          <button onClick={addEntry}>Add Entry</button>
          {selectedPolygon.entries && selectedPolygon.entries.map(entry => (
            <div key={entry.id} className="entry-item">
              <input
                type="range"
                min="0"
                max="1"
                step="0.001"
                value={entry.position}
                onChange={(e) => updateEntry(entry.id, parseFloat(e.target.value))}
              />
              <span>{entry.position.toFixed(2)}</span>
              <button onClick={() => removeEntry(entry.id)}>Remove</button>
            </div>
          ))}
        </>
      )}
    </div>
  );
};

export default PropertiesPanel;