import React from 'react';
import './LayersPanel.css';

interface LayersPanelProps {
  polygons: Array<{ type: string; }>;
  selectedPolygonIndex: number | null;
  onSelectPolygon: (index: number) => void;
}

const LayersPanel: React.FC<LayersPanelProps> = ({ polygons, selectedPolygonIndex, onSelectPolygon }) => {
  return (
    <div className="layers-panel">
      <h3>Layers</h3>
      <ul>
        {polygons.map((polygon, index) => (
          <li 
            key={index} 
            className={selectedPolygonIndex === index ? 'selected' : ''}
            onClick={() => onSelectPolygon(index)}
          >
            {polygon.type} {index + 1}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default LayersPanel;