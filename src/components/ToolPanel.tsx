import React from 'react';
import { Tool } from '../types';

interface ToolPanelProps {
  activeTool: Tool;
  onToolChange: (tool: Tool) => void;
}

const ToolPanel: React.FC<ToolPanelProps> = ({ activeTool, onToolChange }) => {
  return (
    <div className="tool-panel">
      <button
        className={activeTool === 'pan' ? 'active' : ''}
        onClick={() => onToolChange('pan')}
      >
        Pan
      </button>
      <button
        className={activeTool === 'building' ? 'active' : ''}
        onClick={() => onToolChange('building')}
      >
        Building
      </button>
      <button
        className={activeTool === 'grass' ? 'active' : ''}
        onClick={() => onToolChange('grass')}
      >
        Grass
      </button>
      <button
        className={activeTool === 'footpath' ? 'active' : ''}
        onClick={() => onToolChange('footpath')}
      >
        Footpath
      </button>
      <button
        className={activeTool === 'pavement' ? 'active' : ''}
        onClick={() => onToolChange('pavement')}
      >
        Pavement
      </button>
      <button
        className={activeTool === 'select' ? 'active' : ''}
        onClick={() => onToolChange('select')}
      >
        Select
      </button>
    </div>
  );
};

export default ToolPanel;