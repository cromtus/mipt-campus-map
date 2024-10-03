import React from 'react';
import { GraphEdge } from '../types';
import './GraphComponents.css';

interface EdgesListProps {
  edges: GraphEdge[];
  selectedEdgeId: string | null;
  onSelectEdge: (edgeId: string | null) => void;
  title: string;
  className?: string;
}

const EdgesList: React.FC<EdgesListProps> = ({ edges, selectedEdgeId, onSelectEdge, title, className }) => {
  return (
    <div className={`edges-list ${className || ''}`}>
      <h3>{title}</h3>
      <ul>
        {edges.map(edge => (
          <li
            key={edge.id}
            onClick={() => onSelectEdge(edge.id)}
            className={selectedEdgeId === edge.id ? 'selected' : ''}
          >
            Edge {edge.id}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default EdgesList;