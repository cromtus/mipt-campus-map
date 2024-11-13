import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { Stage, Layer, Group, Line, Rect as Rectangle, Text } from 'react-konva';
import { useGesture } from '@use-gesture/react';
import ToolPanel from './components/ToolPanel';
import PolygonComponent from './components/Polygon';
import PreviewPolygon from './components/PreviewPolygon';
import PropertiesPanel from './components/PropertiesPanel';
import { Tool, Graph, GraphNode, GraphEdge, Polygon, Rect as RectType } from './types';
import { snapPosition } from './utils/snapPosition';
import Prism from './components/Prism';
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

const prismHeight = 100;

const App: React.FC = () => {
  const [tool, setTool] = useState<Tool>('pan');
  const [polygons, setPolygons] = useLocalStorage<Polygon[]>('polygons', []);
  const [currentPolygon, setCurrentPolygon] = useState<number[][]>([]);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [scale, setScale] = useState(1);
  const [mousePosition, setMousePosition] = useState<{ x: number; y: number } | null>(null);
  const [snappedMousePosition, setSnappedMousePosition] = useState<{ x: number; y: number } | null>(null);
  const [selectedPolygonIndex, setSelectedPolygonIndex] = useState<number | null>(null);
  const [hoveredPolygonIndex, setHoveredPolygonIndex] = useState<number | null>(null);
  const [centerDot, setCenterDot] = useLocalStorage<{ x: number; y: number }>('centerDot', { x: window.innerWidth / 2, y: window.innerHeight / 2 });
  const stageRef = useRef<any>(null);
  const [snappedInfo, setSnappedInfo] = useState<{
    snapped: { x: number; y: number };
    snapLines: { from: { x: number; y: number }, to: { x: number; y: number } }[];
  } | null>(null);
  const [graph, setGraph] = useLocalStorage<Graph>('graph', { nodes: [], edges: [] });
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [lastClickedNode, setLastClickedNode] = useState<GraphNode | null>(null);
  const [isDrawingEdge, setIsDrawingEdge] = useState(true);
  const [hoveredEdgeId, setHoveredEdgeId] = useState<string | null>(null);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [previewEdge, setPreviewEdge] = useState<{ from: GraphNode; to: { x: number; y: number } } | null>(null);
  const [draggingPolygonNode, setDraggingPolygonNode] = useState<{ polygonIndex: number, nodeIndex: number } | null>(null);
  const [draggingGraphNode, setDraggingGraphNode] = useState<GraphNode | null>(null);

  const [rects, setRects] = useLocalStorage<RectType[]>('rects', []);
  const [selectedRectIndex, setSelectedRectIndex] = useState<number | null>(null);
  const [hoveredRectIndex, setHoveredRectIndex] = useState<number | null>(null);
  const [drawingRect, setDrawingRect] = useState<{ x: number; y: number } | null>(null);

  const handleDelete = useCallback(() => {
    handleDeletePolygon();
    handleDeleteEdge();
    handleDeleteRect();
  }, [selectedPolygonIndex, selectedEdgeId, selectedRectIndex]);

  const handleCancelEdge = useCallback(() => {
    setIsDrawingEdge(false);
    setPreviewEdge(null);
  }, []);

  const { isCtrlPressed } = useKeyboard({
    onDelete: handleDelete,
    onCancelEdge: handleCancelEdge,
  });

  useEffect(() => {
    const handleResize = () => {
      if (stageRef.current) {
        stageRef.current.width(window.innerWidth);
        stageRef.current.height(window.innerHeight);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (mousePosition) {
      let allPoints: number[][] = []
      if (tool === 'building' || tool === 'pavement') {
        allPoints = getAllPolygonPoints(polygons).concat(currentPolygon);
      } else if (tool === 'pathwalk' || tool === 'road' || tool === 'fence') {
        allPoints = getAllGraphPoints(graph.nodes)
      } else {
        if (draggingPolygonNode) {
          allPoints = getAllPolygonPoints(polygons, draggingPolygonNode.polygonIndex, draggingPolygonNode.nodeIndex)
        }
        if (draggingGraphNode) {
          allPoints = getAllGraphPoints(graph.nodes, draggingGraphNode.id)
        }
      }
      const snappedInfo = snapPosition(mousePosition, isCtrlPressed, allPoints);
      setSnappedInfo(snappedInfo);
      setSnappedMousePosition(snappedInfo.snapped);
    } else {
      setSnappedInfo(null);
      setSnappedMousePosition(mousePosition);
    }
  }, [mousePosition, currentPolygon, isCtrlPressed, polygons, graph]);

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
    onMove: ({ event }) => {
      const stage = stageRef.current;
      if (stage) {
        const point = stage.getPointerPosition();
        if (point) {
          setMousePosition({
            x: (point.x - position.x) / scale,
            y: (point.y - position.y) / scale,
          });
        }
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
      setSelectedPolygonIndex(hoveredPolygonIndex);
      setSelectedEdgeId(hoveredEdgeId)
      setSelectedNodeId(hoveredNodeId)
      setSelectedRectIndex(hoveredRectIndex);
    } else if (tool === 'pathwalk' || tool === 'road' || tool === 'fence') {
      const newNode: GraphNode = {
        id: Date.now().toString(),
        x: snappedMousePosition!.x,
        y: snappedMousePosition!.y,
        edges: [],
      };

      const hoveredNode = graph.nodes.find(node => node.id === hoveredNodeId)
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
      setPreviewEdge({
        from: nextNode,
        to: { x: nextNode.x, y: nextNode.y },
      });
      setLastClickedNode(nextNode);
      setIsDrawingEdge(true);
    }
  };

  const handleNodeDrag = (polygonIndex: number, nodeIndex: number) => {
    if (!snappedMousePosition) return;
    
    setPolygons(draft => {
      draft[polygonIndex].points[nodeIndex] = [snappedMousePosition.x, snappedMousePosition.y];
    });
    
    return [snappedMousePosition.x, snappedMousePosition.y];
  };
  
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

  const handlePolygonDrag = (polygonIndex: number, newPositions: number[][]) => {
    const allPoints = getAllPolygonPoints(polygons.filter((_, index) => index !== polygonIndex));
    const snappedPositions = newPositions.map(position => {
      const { snapped } = snapPosition({ x: position[0], y: position[1] }, isCtrlPressed, allPoints);
      return [snapped.x, snapped.y];
    });

    setPolygons(draft => {
      draft[polygonIndex].points = snappedPositions;
    });
  };

  const handleToolChange = (newTool: Tool) => {
    setTool(newTool);
    // if (newTool === 'pan' && currentPolygon.length > 0) {
    //   setPolygons([...polygons, { points: currentPolygon }]);
    //   setCurrentPolygon([]);
    // }
    if (newTool !== 'select') {
      setSelectedPolygonIndex(null);
      setHoveredPolygonIndex(null);
      setSelectedEdgeId(null);
      setHoveredEdgeId(null);
      setSelectedNodeId(null);
      setHoveredNodeId(null);
    }
    setPreviewEdge(null);
  };

  const handlePolygonClose = () => {
    if (currentPolygon.length > 1) {
      let newPolygon: Polygon;
      switch (tool) {
        case 'building':
          newPolygon = { 
            points: currentPolygon, 
            type: 'building', 
            height: prismHeight, 
            color: '#000000',
            entries: [],
          };
          break;
        case 'pavement':
          newPolygon = { points: currentPolygon, type: 'pavement' };
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

  const handleDeletePolygon = () => {
    if (selectedPolygonIndex !== null) {
      setPolygons(prevPolygons => prevPolygons.filter((_, index) => index !== selectedPolygonIndex));
      setSelectedPolygonIndex(null);
      setHoveredPolygonIndex(null);
    }
  };

  const handleDeleteEdge = () => {
    if (selectedEdgeId !== null) {
      setGraph(prevGraph => removeEdge(prevGraph, selectedEdgeId));
      setSelectedEdgeId(null);
      setHoveredEdgeId(null);
      setSelectedNodeId(null);
      setHoveredNodeId(null);
    }
  };

  const handleDeleteRect = () => {
    if (selectedRectIndex !== null) {
      setRects(prevRects => prevRects.filter((_, index) => index !== selectedRectIndex));
      setSelectedRectIndex(null);
    }
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

  const handlePolygonChange = (updatedPolygon: Polygon) => {
    if (selectedPolygonIndex !== null) {
      setPolygons(prevPolygons => {
        const newPolygons = [...prevPolygons];
        newPolygons[selectedPolygonIndex] = updatedPolygon;
        return newPolygons;
      });
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

  const handleRectChange = (index: number, updatedRect: RectType) => {
    setRects(draft => {
      draft[index] = updatedRect;
    });
  };

  const handleMouseMove = (e: any) => {
    const stage = e.target.getStage();
    const point = stage.getPointerPosition();
    const scaledPoint = {
      x: (point.x - position.x) / scale,
      y: (point.y - position.y) / scale,
    };

    setMousePosition(scaledPoint);
    setPreviewEdge(prev => prev ? { ...prev, to: snappedMousePosition ?? prev.from } : null);
  };

  const handleMouseLeave = () => {
    setHoveredPolygonIndex(null);
    setHoveredEdgeId(null);
    setHoveredNodeId(null);
    setPreviewEdge(prev => prev ? { ...prev, to: prev.from } : null);
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
              {graph.edges.sort((a, b) => {
                if (a.type === 'road') return 1;
                if (b.type === 'road') return -1;
                if (a.type === 'pathwalk') return 1;
                if (b.type === 'pathwalk') return -1;
                return 0;
              }).map(edge => (
                <GraphEdgeComponent
                  key={edge.id}
                  edge={edge}
                  edges={graph.edges}
                  nodes={nodeById}
                  isSelected={selectedEdgeId === edge.id}
                  isHovered={hoveredEdgeId === edge.id}
                  onHover={(edgeId) => tool === 'select' && setHoveredEdgeId(edgeId)}
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
                  onHoverUpdate={(hovered) => setHoveredRectIndex(hovered ? index : null)}
                  onChange={(updatedRect) => handleRectChange(index, updatedRect)}
                />
              ))}
              {polygons.sort(polygonsCompareFn(centerDot)).map((poly, index) => {
                const polygon = (
                  <PolygonComponent
                    key={index}
                    type={poly.type}
                    points={poly.points}
                    isSelected={selectedPolygonIndex === index}
                    isHovered={hoveredPolygonIndex === index && tool === 'select'}
                    isEditing={tool === 'select' && selectedPolygonIndex === index}
                    onNodeDrag={(nodeIndex) => handleNodeDrag(index, nodeIndex)}
                    onPolygonDrag={(newPositions) => handlePolygonDrag(index, newPositions)}
                    onDragStart={(nodeIndex) => setDraggingPolygonNode({ polygonIndex: index, nodeIndex })}
                    onDragEnd={() => setDraggingPolygonNode(null)}
                    onMouseEnter={() => tool === 'select' && setHoveredPolygonIndex(index)}
                    onMouseLeave={() => setHoveredPolygonIndex(null)}
                  />
                )
                const prism = poly.type === 'building' ? (
                  <Prism
                    basePoints={poly.points}
                    height={poly.height}
                    color={poly.color}
                    secondaryColor={poly.secondaryColor}
                    description={poly.description}
                    handleDescriptionDrag={(newOffset) => handleDescriptionDrag(index, newOffset)}
                    canvasWidth={window.innerWidth}
                    canvasHeight={window.innerHeight}
                    stageX={centerDot.x}
                    stageY={centerDot.y}
                    entries={poly.entries}
                  />
                ) : null
                return (
                  <React.Fragment key={index}>
                    {selectedPolygonIndex === index ? prism : polygon}
                    {selectedPolygonIndex === index ? polygon : prism}
                  </React.Fragment>
                )
              })}
              {(tool === 'building' || tool === 'pavement') && (
                <PreviewPolygon 
                  points={currentPolygon} 
                  mousePosition={snappedMousePosition}
                  onClose={handlePolygonClose}
                />
              )}
              {previewEdge && (tool === 'pathwalk' || tool === 'road' || tool === 'fence') && (
                <PreviewEdge
                  from={previewEdge.from}
                  to={previewEdge.to}
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
                  isSelected={selectedNodeId === node.id}
                  isHovered={hoveredNodeId === node.id}
                  onHover={(nodeId) => (tool === 'select' || tool === 'pathwalk' || tool === 'road' || tool === 'fence') && setHoveredNodeId(nodeId)}
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
