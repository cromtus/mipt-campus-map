import React from 'react';
import { GraphEdge } from '../types';
import './GraphComponents.css';

interface EdgesListProps {
  edges: GraphEdge[];
  selectedEdge: GraphEdge | null;
  onSelectEdge: (edge: GraphEdge) => void;
  title: string;
}

const EdgesList: React.FC<EdgesListProps> = ({ edges, selectedEdge, onSelectEdge, title }) => {
  return (
    <div className="edges-list">
      <h3>{title}</h3>
      <ul>
        {edges.map(edge => (
          <li
            key={edge.id}
            onClick={() => onSelectEdge(edge)}
            className={selectedEdge?.id === edge.id ? 'selected' : ''}
          >
            Edge {edge.id}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default EdgesList;