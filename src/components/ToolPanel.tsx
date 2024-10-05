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
        className={activeTool === 'select' ? 'active' : ''}
        onClick={() => onToolChange('select')}
      >
        Select
      </button>
      <button
        className={activeTool === 'building' ? 'active' : ''}
        onClick={() => onToolChange('building')}
      >
        Building
      </button>
      <button
        className={activeTool === 'pavement' ? 'active' : ''}
        onClick={() => onToolChange('pavement')}
      >
        Pavement
      </button>
      <button
        className={activeTool === 'pathwalk' ? 'active' : ''}
        onClick={() => onToolChange('pathwalk')}
      >
        Pathwalk
      </button>
      <button
        className={activeTool === 'road' ? 'active' : ''}
        onClick={() => onToolChange('road')}
      >
        Road
      </button>
      <button
        className={activeTool === 'fence' ? 'active' : ''}
        onClick={() => onToolChange('fence')}
      >
        Fence
      </button>
    </div>
  );
};

export default ToolPanel;