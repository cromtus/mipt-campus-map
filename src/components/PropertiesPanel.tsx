import React from 'react';
import './PropertiesPanel.css';
import { useDispatch, useSelector } from '../store';
import { addEntry, removeEntry, selectCurrentPolygon, toggleDescription, updateColor, updateDescriptionAlignment, updateDescriptionReversed, updateDescriptionText, updateEntry, updateHeight, updateSecondaryColor } from '../store/polygonsSlice';


const PropertiesPanel: React.FC = () => {
  const polygon = useSelector(selectCurrentPolygon)
  const dispatch = useDispatch()

  if (!polygon || polygon.type !== 'building') return null;

  return (
    <div className="properties-panel">
      <h3>Building Properties</h3>
      <label>
        Height:
        <input
          type="number"
          value={polygon.height}
          onChange={(e) => dispatch(updateHeight(Number(e.target.value)))}
        />
      </label>
      <label>
        Primary Color:
        <input
          type="color"
          value={polygon.color}
          onChange={(e) => dispatch(updateColor(e.target.value))}
        />
      </label>
      <label>
        <input
          type="checkbox"
          checked={polygon.secondaryColor != null}
          onChange={(e) => dispatch(updateSecondaryColor(e.target.checked ? '#000000' : undefined))}
        />
        Use Secondary Color
      </label>
      {polygon.secondaryColor && (
        <label>
          Secondary Color:
          <input
            type="color"
            value={polygon.secondaryColor}
            onChange={(e) => dispatch(updateSecondaryColor(e.target.value))}
          />
        </label>
      )}
      <label>
        <input
          type="checkbox"
          checked={polygon.description != null}
          onChange={() => dispatch(toggleDescription())}
        />
        Show Description
      </label>
      {polygon.description && (
        <>
          <textarea
            value={polygon.description.text}
            onChange={(e) => dispatch(updateDescriptionText(e.target.value))}
            placeholder="Enter description..."
          />
          <div className="alignment-buttons">
            <button
              onClick={() => dispatch(updateDescriptionAlignment('left'))}
              className={polygon.description.alignment === 'left' ? 'active' : ''}
            >
              Left
            </button>
            <button
              onClick={() => dispatch(updateDescriptionAlignment('center'))}
              className={polygon.description.alignment === 'center' ? 'active' : ''}
            >
              Center
            </button>
            <button
              onClick={() => dispatch(updateDescriptionAlignment('right'))}
              className={polygon.description.alignment === 'right' ? 'active' : ''}
            >
              Right
            </button>
          </div>
          <label>
            <input
              type="checkbox"
              checked={polygon.description.reversed}
              onChange={(e) => dispatch(updateDescriptionReversed(e.target.checked))}
            />
            Reversed
          </label>
        </>
      )}
      {polygon.entries && (
        <>
          <h3>Entries</h3>
          <button onClick={() => dispatch(addEntry())}>Add Entry</button>
          {polygon.entries.map(entry => (
            <div key={entry.id} className="entry-item">
              <input
                type="range"
                min="0"
                max="1"
                step="0.001"
                value={entry.position}
                onChange={(e) => dispatch(updateEntry(entry.id, parseFloat(e.target.value)))}
              />
              <span>{entry.position.toFixed(2)}</span>
              <button onClick={() => dispatch(removeEntry(entry.id))}>Remove</button>
            </div>
          ))}
        </>
      )}
    </div>
  );
};

export default PropertiesPanel;