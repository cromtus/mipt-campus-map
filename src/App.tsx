import React, { useState, useRef, useMemo, useCallback } from 'react';
import { Stage, Layer, Group, Line, Rect as Rectangle, Text } from 'react-konva';
import { useGesture } from '@use-gesture/react';
import ToolPanel from './components/ToolPanel';
import PolygonComponent from './components/Polygon';
import PreviewPolygon from './components/PreviewPolygon';
import PropertiesPanel from './components/PropertiesPanel';
import { Tool, Graph, GraphNode, GraphEdge, Polygon, Rect as RectType } from './types';
import { snapPosition } from './utils/snapPosition';
import GraphEdgeComponent from './components/GraphEdge';
import GraphNodeComponent from './components/GraphNode';
import EdgePropertiesPanel from './components/EdgePropertiesPanel';
import PreviewEdge from './components/PreviewEdge';
import PreviewPoint from './components/PreviewPoint';
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

  const [polygons, setPolygons] = useLocalStorage<Polygon[]>('polygons', []);
  const [currentPolygon, setCurrentPolygon] = useState<number[][]>([]);
  const [draggingPolygonNode, setDraggingPolygonNode] = useState<{ polygonIndex: number, nodeIndex: number } | null>(null);
  const [selectedPolygonIndex, setSelectedPolygonIndex] = useState<number | null>(null);
  const handlePolygonChange = (updatedPolygon: Polygon) => {
    if (selectedPolygonIndex !== null) {
      setPolygons(prevPolygons => {
        prevPolygons[selectedPolygonIndex] = updatedPolygon;
      });
    }
  };
  const handlePolygonDrag = (polygonIndex: number, newPositions: number[][]) => {
    setPolygons(draft => {
      draft[polygonIndex].points = newPositions;
    });
  };
  const handleDeletePolygon = useCallback(() => {
    if (selectedPolygonIndex !== null) {
      setPolygons(prevPolygons => prevPolygons.filter((_, index) => index !== selectedPolygonIndex));
      setSelectedPolygonIndex(null);
    }
  }, [selectedPolygonIndex]);
  const handlePolygonClose = () => {
    if (currentPolygon.length > 1) {
      let newPolygon: Polygon;
      switch (tool) {
        case 'building':
          newPolygon = {
            points: currentPolygon, 
            type: 'building', 
            height: 100, 
            color: '#000000',
            entries: [],
          };
          break;
        case 'pavement':
          newPolygon = {
            points: currentPolygon, 
            type: 'pavement' 
          };
          break;
        default:
          return;
      }
      setPolygons(draft => {
        draft.push(newPolygon);
      });
      setCurrentPolygon([]);
    }
  };
  const handleDescriptionDrag = (polygonIndex: number, newOffset: { offsetX: number; offsetY: number }) => {
    setPolygons(draft => {
      const polygon = draft[polygonIndex];
      if (polygon.type === 'building' && polygon.description) {
        polygon.description.offsetX = newOffset.offsetX;
        polygon.description.offsetY = newOffset.offsetY;
      }
    });
  };
  const handleNodeDrag = (polygonIndex: number, nodeIndex: number) => {
    if (!snappedMousePosition) return;
    
    setPolygons(draft => {
      draft[polygonIndex].points[nodeIndex] = [snappedMousePosition.x, snappedMousePosition.y];
    });
    
    return [snappedMousePosition.x, snappedMousePosition.y];
  };

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
    handleDeletePolygon();
    handleDeleteEdge();
    handleDeleteRect();
  }, [handleDeletePolygon, handleDeleteEdge, handleDeleteRect]);

  const handleCancelEdge = useCallback(() => {
    setIsDrawingEdge(false);
    setPreviewEdge(null);
  }, []);

  const { isCtrlPressed } = useKeyboard({
    onDelete: handleDelete,
    onCancelEdge: handleCancelEdge,
  });

  const allPoints = useMemo(() => {
    if (tool === 'building' || tool === 'pavement') {
      return getAllPolygonPoints(polygons).concat(currentPolygon);
    } else if (tool === 'pathwalk' || tool === 'road' || tool === 'fence') {
      return getAllGraphPoints(graph.nodes)
    } else {
      if (draggingPolygonNode) {
        return getAllPolygonPoints(polygons, draggingPolygonNode.polygonIndex, draggingPolygonNode.nodeIndex)
      }
      if (draggingGraphNode) {
        return getAllGraphPoints(graph.nodes, draggingGraphNode.id)
      }
    }
    return emptyList
  }, [polygons, graph, currentPolygon, draggingGraphNode, draggingPolygonNode, tool])
  const snappedInfo = snapPosition(mousePosition, isCtrlPressed, allPoints);
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
    if (tool === 'building' || tool === 'pavement') {
      const newPoint = [snappedMousePosition!.x, snappedMousePosition!.y];
  
      if (currentPolygon.length > 2 && 
        Math.abs(currentPolygon[0][0] - newPoint[0]) < 10 &&
        Math.abs(currentPolygon[0][1] - newPoint[1]) < 10) {
        // Close the polygon for building and pavement
        handlePolygonClose();
      } else {
        setCurrentPolygon([...currentPolygon, newPoint]);
      }

    } else if (tool === 'select') {
      setSelectedPolygonIndex(null)
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
      setSelectedPolygonIndex(null);
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

  const renderPreviewPoint = () => {
    if ((tool !== 'select' && tool !== 'pan') && snappedMousePosition) {
      return (
        <PreviewPoint
          x={snappedMousePosition.x}
          y={snappedMousePosition.y}
        />
      );
    }
    return null;
  };

  const nodeById = useMemo(() => graph.nodes.reduce((acc, node) => {
    acc.set(node.id, node);
    return acc;
  }, new Map<string, GraphNode>()), [graph.nodes]);

  const selectedEdge = selectedEdgeId != null ? graph.edges.find(e => e.id === selectedEdgeId) : null
  return (
    <div className="app">
      <div 
        className={`canvas-container ${tool === 'building' ? 'polygon-tool' : ''} ${tool === 'select' ? 'select-tool' : ''}`}
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
          <Layer>
            <Group>
              <Rectangle x={-5000} y={-5000} width={10000} height={10000} fill="#e8f7e8" />
              {renderPreviewPoint()}
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
              {[...polygons.map((poly, index) => ({ ...poly, index }))].sort(polygonsCompareFn(centerDot)).map(poly => (
                <PolygonComponent
                  key={poly.index}
                  polygon={poly}
                  centerDot={centerDot}
                  interactive={tool === 'select'}
                  isSelected={poly.index === selectedPolygonIndex}
                  onSelect={() => setSelectedPolygonIndex(poly.index)}
                  onNodeDrag={(nodeIndex) => handleNodeDrag(poly.index, nodeIndex)}
                  onPolygonDrag={(newPositions) => handlePolygonDrag(poly.index, newPositions)}
                  onDescriptionDrag={(newOffset) => handleDescriptionDrag(poly.index, newOffset)}
                  onDragStart={(nodeIndex) => setDraggingPolygonNode({ polygonIndex: poly.index, nodeIndex })}
                  onDragEnd={() => setDraggingPolygonNode(null)}
                />
              ))}
              {(tool === 'building' || tool === 'pavement') && (
                <PreviewPolygon 
                  points={currentPolygon} 
                  mousePosition={snappedMousePosition}
                  onClose={handlePolygonClose}
                />
              )}
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
        </Stage>
      </div>
      <ToolPanel activeTool={tool} onToolChange={handleToolChange} />
      {selectedPolygonIndex !== null && (
        <>
          {polygons[selectedPolygonIndex].type === 'building' && (
            <PropertiesPanel
              selectedPolygon={polygons[selectedPolygonIndex]}
              onPolygonChange={handlePolygonChange}
            />
          )}
        </>
      )}
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
    </div>
  );
};

export default App;

const polygonsCompareFn = (centerDot: { x: number; y: number }) => (a: Polygon, b: Polygon) => {
  if (a.type === 'pavement') return -1;
  if (b.type === 'pavement') return 1;
  // Sort buildings by distance from centerDot to the nearest polygon node
  if (a.type === 'building' && b.type === 'building') {
    const aDistance = Math.min(...a.points.map(point => 
      Math.sqrt(Math.pow(point[0] - centerDot.x, 2) + Math.pow(point[1] - centerDot.y, 2))
    ));
    const bDistance = Math.min(...b.points.map(point => 
      Math.sqrt(Math.pow(point[0] - centerDot.x, 2) + Math.pow(point[1] - centerDot.y, 2))
    ));
    return bDistance - aDistance; // Sort in descending order (furthest first)
  }
  return 0;
}

const edgesCompareFn = (a: GraphEdge, b: GraphEdge) => {
  if (a.type === 'road') return 1;
  if (b.type === 'road') return -1;
  if (a.type === 'pathwalk') return 1;
  if (b.type === 'pathwalk') return -1;
  return 0;
}

function getAllPolygonPoints(polygons: Polygon[], excludePolygonIndex: number | null = null, excludeNodeIndex: number | null = null): number[][] {
  return polygons.flatMap((polygon, index) => polygon.points.filter((_, nodeIndex) => 
    index !== excludePolygonIndex || nodeIndex !== excludeNodeIndex
  ));
};

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
