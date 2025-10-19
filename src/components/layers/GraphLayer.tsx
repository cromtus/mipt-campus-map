import React, { memo, useMemo } from 'react';
import { useSelector, useDispatch } from '../../store';
import GraphEdgeComponent from '../shapes/GraphEdge';
import GraphNodeComponent from '../shapes/GraphNode';
import { Tool, GraphNode, GraphEdge } from '../../types';
import { updateNodePosition, setSelectedEdge } from '../../store/graphSlice';
import PreviewEdge from '../PreviewEdge';
import SelectedEdge from '../shapes/SelectedEdge';
import { Barriers } from '../Barriers';
import TwoDegreeNodes from '../TwoDegreeNodes';

interface GraphLayerProps {
  tool: Tool;
}

const GraphLayer: React.FC<GraphLayerProps> = ({ 
  tool,
}) => {
  const dispatch = useDispatch();
  const { nodes, edges, selectedEdgeId } = useSelector(state => state.graph);
  console.log('nodes', nodes);
  const previewEdge = tool === 'pathwalk' || tool === 'road' || tool === 'fence'

  const nodeById = useMemo(() => nodes.reduce((acc, node) => {
    acc.set(node.id, node);
    return acc;
  }, new Map<string, GraphNode>()), [nodes]);

  const handleNodeDrag = (node: GraphNode, newPosition: { x: number; y: number }) => {
    dispatch(updateNodePosition({ 
      id: node.id, 
      x: newPosition.x, 
      y: newPosition.y 
    }));
    return newPosition;
  };

  return (
    <>
      <TwoDegreeNodes nodes={nodes} edges={edges} />
      {[...edges].sort(edgesCompareFn).map(edge => (
        <GraphEdgeComponent
          key={edge.id}
          edge={edge}
          nodes={nodeById}
          interactive={tool === 'select'}
          isSelected={selectedEdgeId === edge.id}
          onSelect={(e) => {
            e.cancelBubble = true;
            dispatch(setSelectedEdge(edge.id));
          }}
        />
      ))}
      {nodes.map(node => (
        <GraphNodeComponent
          key={node.id}
          node={node}
          interactive={tool === 'select'}
          onDragMove={newPos => handleNodeDrag(node, newPos)}
        />
      ))}
      {/* {previewEdge && <PreviewEdge tool={tool} />} */}
      <SelectedEdge />
      <Barriers edges={edges} nodes={nodeById} />
    </>
  );
};

const edgesCompareFn = (a: GraphEdge, b: GraphEdge) => {
  if (a.type === 'road') return 1;
  if (b.type === 'road') return -1;
  if (a.type === 'pathwalk') return 1;
  if (b.type === 'pathwalk') return -1;
  return 0;
};

export default memo(GraphLayer);