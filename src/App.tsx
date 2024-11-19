import React, { useState, useRef, useMemo, useCallback, } from 'react';
import { Stage, Layer, Group, Line, Rect as Rectangle, Text } from 'react-konva';
import { useGesture } from '@use-gesture/react';
import ToolPanel from './components/ToolPanel';
import PropertiesPanel from './components/PropertiesPanel';
import { Tool, Graph, GraphNode, GraphEdge, Rect as RectType } from './types';
import { snapPosition } from './utils/snapPosition';
import GraphEdgeComponent from './components/GraphEdge';
import GraphNodeComponent from './components/GraphNode';
import EdgePropertiesPanel from './components/EdgePropertiesPanel';
import PreviewEdge from './components/PreviewEdge';
import TwoDegreeNodes from './components/TwoDegreeNodes';
import { Barriers } from './components/Barriers';
import YouAreHere from './components/YouAreHere';
import Rect from './components/Rect';
import RectPropertiesPanel from './components/RectPropertiesPanel';
import { useLocalStorage } from './hooks/useLocalStorage';
import { exportJSON, exportPDF } from './utils/export';
import { useKeyboard } from './hooks/useKeyboard';
import { emptyList } from './utils/constants';
import useWindowSize from './hooks/useWindowSize';
import { MousePositionContext, ClickListenersContext } from './contexts/mouse';
import Polygons from './components/Polygons';
import { Provider } from 'react-redux';
import { store } from './store';

const App: React.FC = () => {
  const [tool, setTool] = useState<Tool>('pan');

  // map state
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [scale, setScale] = useState(1);
  const [mousePosition, setMousePosition] = useState<{ x: number; y: number } | null>(null);
  const stageRef = useRef<any>(null);
  useWindowSize(() => {
    stageRef.current?.width(window.innerWidth);
    stageRef.current?.height(window.innerHeight);
  })
  const clickListeners = useRef<(() => void)[]>([]);

  const [graph, setGraph] = useLocalStorage<Graph>('graph', { nodes: [], edges: [] });
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [lastClickedNode, setLastClickedNode] = useState<GraphNode | null>(null);
  const [isDrawingEdge, setIsDrawingEdge] = useState(true);
  const [previewEdge, setPreviewEdge] = useState<{ from: GraphNode } | null>(null);
  const [draggingGraphNode, setDraggingGraphNode] = useState<GraphNode | null>(null);
  const handleGraphNodeDrag = (node: GraphNode) => {
    if (!snappedMousePosition) return node;
    setGraph(draft => {
      const nodeToUpdate = draft.nodes.find(n => n.id === node.id);
      if (nodeToUpdate) {
        nodeToUpdate.x = snappedMousePosition.x;
        nodeToUpdate.y = snappedMousePosition.y;
      }
    });
    return { ...node, ...snappedMousePosition };
  }
  const handleDeleteEdge = useCallback(() => {
    if (selectedEdgeId !== null) {
      setGraph(prevGraph => removeEdge(prevGraph, selectedEdgeId));
      setSelectedEdgeId(null);
      setSelectedNodeId(null);
    }
  }, [selectedEdgeId]);

  const [rects, setRects] = useLocalStorage<RectType[]>('rects', []);
  const [selectedRectIndex, setSelectedRectIndex] = useState<number | null>(null);
  const [drawingRect, setDrawingRect] = useState<{ x: number; y: number } | null>(null);
  const handleRectChange = (index: number, updatedRect: RectType) => {
    setRects(draft => {
      draft[index] = updatedRect;
    });
  };
  const handleDeleteRect = useCallback(() => {
    if (selectedRectIndex !== null) {
      setRects(prevRects => prevRects.filter((_, index) => index !== selectedRectIndex));
      setSelectedRectIndex(null);
    }
  }, [selectedRectIndex]);

  const [centerDot, setCenterDot] = useLocalStorage<{ x: number; y: number }>('centerDot', { x: window.innerWidth / 2, y: window.innerHeight / 2 });
  const handleDotDrag = (e: any) => {
    if (tool === 'select') {
      setCenterDot({
        x: e.target.x(),
        y: e.target.y()
      });
    } else {
      e.target.position(centerDot)
    }
  };

  const handleDelete = useCallback(() => {
    handleDeleteEdge();
    handleDeleteRect();
  }, [handleDeleteEdge, handleDeleteRect]);

  const handleCancelEdge = useCallback(() => {
    setIsDrawingEdge(false);
    setPreviewEdge(null);
  }, []);

  const { isCtrlPressed } = useKeyboard({
    onDelete: handleDelete,
    onCancel: handleCancelEdge,
  });

  const allPoints = useMemo(() => {
    if (tool === 'building' || tool === 'pavement') {
      // return getAllPolygonPoints(polygons)//.concat(currentPolygon);
    } else if (tool === 'pathwalk' || tool === 'road' || tool === 'fence') {
      return getAllGraphPoints(graph.nodes)
    } else {
      // if (draggingPolygonNode) {
      //   return getAllPolygonPoints(polygons, draggingPolygonNode.polygonIndex, draggingPolygonNode.nodeIndex)
      // }
      if (draggingGraphNode) {
        return getAllGraphPoints(graph.nodes, draggingGraphNode.id)
      }
    }
    return emptyList
  }, [/*polygons, */graph, /*currentPolygon,*/ draggingGraphNode, tool])
  const snappedInfo = snapPosition(mousePosition, allPoints);
  const snappedMousePosition = snappedInfo?.snapped

  // Map state
  const handleZoom = (e: WheelEvent, stage: any) => {
    e.preventDefault();
    const scaleBy = 1.1;
    const oldScale = stage.scaleX();

    const pointer = stage.getPointerPosition();
    const mousePointTo = {
      x: (pointer.x - stage.x()) / oldScale,
      y: (pointer.y - stage.y()) / oldScale,
    };

    const newScale = e.deltaY < 0 ? oldScale * scaleBy : oldScale / scaleBy;

    stage.scale({ x: newScale, y: newScale });

    const newPos = {
      x: pointer.x - mousePointTo.x * newScale,
      y: pointer.y - mousePointTo.y * newScale,
    };
    stage.position(newPos);
    stage.batchDraw();

    setScale(newScale);
    setPosition(newPos);
  };

  // Map state
  const bind = useGesture({
    onDrag: ({ delta: [dx, dy] }) => {
      if (tool === 'pan') {
        setPosition(prev => ({
          x: prev.x + dx,
          y: prev.y + dy
        }));
      }
    },
    onWheel: ({ event }) => {
      if (stageRef.current) {
        handleZoom(event as WheelEvent, stageRef.current);
      }
    },
  });

  const handleStageClick = (e: any) => {
    clickListeners.current.forEach(listener => listener());
    if (tool === 'building' || tool === 'pavement') {
    } else if (tool === 'select') {
      setSelectedEdgeId(null)
      setSelectedNodeId(null)
      setSelectedRectIndex(null);
    } else if (tool === 'pathwalk' || tool === 'road' || tool === 'fence') {
      const newNode: GraphNode = {
        id: Date.now().toString(),
        x: snappedMousePosition!.x,
        y: snappedMousePosition!.y,
        edges: [],
      };

      const hoveredNode = null//graph.nodes.find(node => node.id === hoveredNodeId)
      const nextNode = hoveredNode ?? newNode

      setGraph(prevGraph => {
        if (nextNode.id === newNode.id) {
          prevGraph = addNode(prevGraph, newNode)
        }
        if (lastClickedNode && isDrawingEdge) {
          const newEdge: GraphEdge = {
            id: Date.now().toString(),
            from: lastClickedNode.id,
            to: nextNode.id,
            ...(tool === 'road' ? (
              { type: 'road', width: 10 }
             ) : (
              tool === 'fence' ? (
                { type: 'fence' }
               ) : (
                { type: 'pathwalk' }
              )
            )),
          };
          return addEdge(prevGraph, newEdge)
        } else {
          return prevGraph
        }
      })
      setPreviewEdge({ from: nextNode });
      setLastClickedNode(nextNode);
      setIsDrawingEdge(true);
    }
  };

  const handleToolChange = (newTool: Tool) => {
    setTool(newTool);
    if (newTool !== 'select') {
      setSelectedEdgeId(null);
      setSelectedNodeId(null);
      setSelectedRectIndex(null);
    }
    setPreviewEdge(null);
  };

  const handleStageMouseDown = (e: any) => {
    if (tool === 'rect' && mousePosition) {
      setDrawingRect({ ...mousePosition });
    }
  };

  const handleStageMouseUp = () => {
    if (tool === 'rect' && drawingRect && mousePosition) {
      setDrawingRect(null);
      setRects(draft => {
        draft.push({
          x: drawingRect.x,
          y: drawingRect.y,
          width: mousePosition.x - drawingRect.x,
          height: mousePosition.y - drawingRect.y,
          cornerRadius: 0,
        });
      });
    }
  };

  const handleMouseMove = (e: any) => {
    const stage = e.target.getStage();
    const point = stage.getPointerPosition();
    const scaledPoint = {
      x: (point.x - position.x) / scale,
      y: (point.y - position.y) / scale,
    };
    setMousePosition(scaledPoint);
  };

  const handleMouseLeave = () => {
    setMousePosition(null);
    setDrawingRect(null);
  };

  const nodeById = useMemo(() => graph.nodes.reduce((acc, node) => {
    acc.set(node.id, node);
    return acc;
  }, new Map<string, GraphNode>()), [graph.nodes]);

  const selectedEdge = selectedEdgeId != null ? graph.edges.find(e => e.id === selectedEdgeId) : null

  const canvasPointerClass = (
    tool === 'pan' ? 'pan-tool' :
    tool === 'select' ? 'select-tool' :
    'drawing-tool'
  )
  return (
    <div className="app">
      <Provider store={store}>
      <div 
        className={`canvas-container ${canvasPointerClass}`}
        {...bind()}
      >
        <Stage
          width={window.innerWidth}
          height={window.innerHeight}
          ref={stageRef}
          onClick={handleStageClick}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          onMouseDown={handleStageMouseDown}
          onMouseUp={handleStageMouseUp}
          scaleX={scale}
          scaleY={scale}
          x={position.x}
          y={position.y}
        >
          <ClickListenersContext.Provider value={clickListeners}>
          <MousePositionContext.Provider value={mousePosition}>
          <Layer>
            <Group>
              <Rectangle x={-5000} y={-5000} width={10000} height={10000} fill="#e8f7e8" />
              {[...graph.edges].sort(edgesCompareFn).map(edge => (
                <GraphEdgeComponent
                  key={edge.id}
                  edge={edge}
                  edges={graph.edges}
                  nodes={nodeById}
                  interactive={tool === 'select'}
                  isSelected={selectedEdgeId === edge.id}
                  onSelect={() => setSelectedEdgeId(edge.id)}
                />
              ))}
              <Barriers edges={graph.edges} nodes={nodeById} />
              <TwoDegreeNodes nodes={graph.nodes} edges={graph.edges} />
              <Text text="Первомайская улица" x={300} y={620} fontSize={20} fill="rgba(0, 0, 0, 0.2)" />
              <Text text="Институтский переулок" x={979} y={280} fontSize={20} fill="rgba(0, 0, 0, 0.2)" rotationDeg={90}/>
              {rects.map((rect, index) => (
                <Rect
                  key={index}
                  rect={rect}
                  isSelected={selectedRectIndex === index}
                  interactive={tool === 'select'}
                  onSelect={() => setSelectedRectIndex(index)}
                  onChange={(updatedRect) => handleRectChange(index, updatedRect)}
                />
              ))}
              <Polygons centerDot={centerDot} tool={tool} />
              {previewEdge && snappedMousePosition && (tool === 'pathwalk' || tool === 'road' || tool === 'fence') && (
                <PreviewEdge
                  from={previewEdge.from}
                  to={snappedMousePosition}
                  kind={tool}
                />
              )}
              {drawingRect && mousePosition && (
                <Rectangle
                  x={drawingRect.x}
                  y={drawingRect.y}
                  width={mousePosition.x - drawingRect.x}
                  height={mousePosition.y - drawingRect.y}
                  fill="rgba(0, 0, 0, 0.2)"
                />
              )}
              {graph.nodes.map(node => (
                <GraphNodeComponent
                  key={node.id}
                  node={node}
                  interactive={tool === 'select' || tool === 'pathwalk' || tool === 'road' || tool === 'fence'}
                  isSelected={selectedNodeId === node.id}
                  onSelect={() => setSelectedNodeId(node.id)}
                  onDragMove={handleGraphNodeDrag}
                  onDragStart={node => setDraggingGraphNode(node)}
                  onDragEnd={() => setDraggingGraphNode(null)}
                />
              ))}
              {snappedInfo && snappedInfo.snapLines.map((snapLine, index) => (
                <Line
                  key={index}
                  points={[
                    snapLine.from.x,
                    snapLine.from.y,
                    snapLine.to.x,
                    snapLine.to.y
                  ]}
                  dash={[2, 2]}
                  stroke="red"
                  strokeWidth={1}
                />
              ))}
            </Group>
            <YouAreHere x={centerDot.x} y={centerDot.y} handleDotDrag={handleDotDrag} />
          </Layer>
        </MousePositionContext.Provider>
        </ClickListenersContext.Provider>
        </Stage>
      </div>
      <ToolPanel activeTool={tool} onToolChange={handleToolChange} />
      <PropertiesPanel />
      {selectedEdge?.type === 'road' && (
        <EdgePropertiesPanel
          edgeWidth={selectedEdge.width}
          onEdgeWidthChange={(newWidth) => {
            setGraph(prevGraph => ({
              ...prevGraph,
              edges: prevGraph.edges.map(e => e.id === selectedEdgeId ? { ...e, width: newWidth } : e),
            }));
          }}
        />
      )}
      {selectedRectIndex !== null && (
        <RectPropertiesPanel
          rect={rects[selectedRectIndex]}
          onChange={(updatedRect) => handleRectChange(selectedRectIndex, updatedRect)}
        />
      )}
      <div className="export-buttons">
        <button className="download-button" onClick={() => exportPDF(stageRef.current)}>Download PDF</button>
        <button className="download-button" onClick={() => exportJSON()}>Export JSON</button>
      </div>
      </Provider>
    </div>
  );
};

export default App;

const edgesCompareFn = (a: GraphEdge, b: GraphEdge) => {
  if (a.type === 'road') return 1;
  if (b.type === 'road') return -1;
  if (a.type === 'pathwalk') return 1;
  if (b.type === 'pathwalk') return -1;
  return 0;
}

function getAllGraphPoints(nodes: GraphNode[], excludeNodeId: string | null = null): number[][] {
  return nodes.filter(node => node.id !== excludeNodeId).map(node => [node.x, node.y]);
};

function addNode(graph: Graph, newNode: GraphNode): Graph {
  return {
    ...graph,
    nodes: [...graph.nodes, { ...newNode, edges: [] }],
  };
};

function addEdge(graph: Graph, newEdge: GraphEdge): Graph {
  const updatedNodes = graph.nodes.map(node => {
    if (node.id === newEdge.from || node.id === newEdge.to) {
      return { ...node, edges: [...node.edges, newEdge.id] };
    }
    return node;
  });

  return {
    nodes: updatedNodes,
    edges: [...graph.edges, newEdge],
  };
};

const removeEdge = (graph: Graph, edgeId: string): Graph => {
  const updatedNodes = graph.nodes.map(node => ({
    ...node,
    edges: node.edges.filter(id => id !== edgeId),
  }));

  return {
    nodes: updatedNodes.filter(node => node.edges.length > 0),
    edges: graph.edges.filter(edge => edge.id !== edgeId),
  };
};
