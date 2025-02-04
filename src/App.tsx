import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Stage, Layer, Group, Image, Line, Rect as Rectangle, Text } from 'react-konva';
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
import EdgesList from './components/EdgesList';
import EdgePropertiesPanel from './components/EdgePropertiesPanel';
import PreviewEdge from './components/PreviewEdge';
import PreviewPoint from './components/PreviewPoint';
import TwoDegreeNodes from './components/TwoDegreeNodes';
import { Barriers } from './components/Barriers';
import YouAreHere from './components/YouAreHere';
import Rect from './components/Rect';
import RectPropertiesPanel from './components/RectPropertiesPanel';
import { useLocalStorage } from './hooks/useLocalStorage';
import { exportJSON, exportPDF, exportSVG } from './utils/export';
import ImportButton from './components/ImportButton';

const prismHeight = 100;

const App: React.FC = () => {
  const [tool, setTool] = useState<Tool>('pan');
  const [polygons, setPolygons] = useLocalStorage<Polygon[]>('polygons', []);
  const [currentPolygon, setCurrentPolygon] = useState<number[][]>([]);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [scale, setScale] = useState(1);
  const [mousePosition, setMousePosition] = useState<{ x: number; y: number } | null>(null);
  const [isCtrlPressed, setIsCtrlPressed] = useState(false);
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
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Control') setIsCtrlPressed(true);
      if (e.key === 'Delete') {
        handleDeletePolygon();
        handleDeleteEdge();
        handleDeleteRect();
      }
      if (e.key === 'c') {
        setIsDrawingEdge(false);
        setPreviewEdge(null);
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Control') setIsCtrlPressed(false);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [selectedPolygonIndex, selectedEdgeId]);

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
    setPolygons(prevPolygons => {
      const updatedPolygons = [...prevPolygons];
      updatedPolygons[polygonIndex] = {
        ...updatedPolygons[polygonIndex],
        points: updatedPolygons[polygonIndex].points.map((point, i) => 
          i === nodeIndex ? (
            snappedMousePosition ? [snappedMousePosition.x, snappedMousePosition.y] : point
          ) : point
        )
      };
      return updatedPolygons;
    });
    return snappedMousePosition ? [snappedMousePosition.x, snappedMousePosition.y] : undefined;
  };
  
  const handleGraphNodeDrag = (node: GraphNode) => {
    // Update node position in the appropriate graph
    setGraph(prevGraph => ({
      ...prevGraph,
      nodes: prevGraph.nodes.map(n => n.id === node.id ? { ...n, ...snappedMousePosition } : n),
    }));
    return { ...node, ...snappedMousePosition };
  }

  const handlePolygonDrag = (polygonIndex: number, newPositions: number[][]) => {
    const allPoints = getAllPolygonPoints(polygons.filter((_, index) => index !== polygonIndex));
    const snappedPositions = newPositions.map(position => {
      const { snapped } = snapPosition({ x: position[0], y: position[1] }, isCtrlPressed, allPoints);
      return [snapped.x, snapped.y];
    });

    setPolygons(prevPolygons => {
      const updatedPolygons = [...prevPolygons];
      updatedPolygons[polygonIndex] = { ...updatedPolygons[polygonIndex], points: snappedPositions };
      return updatedPolygons;
    });

    // We're not setting snappedInfo here because it might be confusing to show snap lines for all points
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
      setPolygons([...polygons, newPolygon]);
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
      setRects([...rects, {
        x: drawingRect.x,
        y: drawingRect.y,
        width: mousePosition.x - drawingRect.x,
        height: mousePosition.y - drawingRect.y,
        cornerRadius: 0,
      }])
    }
  };

  const [imageElement, setImageElement] = useState<HTMLImageElement | undefined>(undefined);

  useEffect(() => {
    const img = new window.Image();
    img.src = 'https://sun9-6.userapi.com/impg/_M4edCzdl94fuqja0uk2VHE3-GLb_Egh7Aq14Q/-lT4MRcHlsA.jpg?size=1036x914&quality=95&sign=ad46c6dad161b86db77d83eb3e8af862&type=album';
    img.onload = () => setImageElement(img);
  }, []);

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
    setPolygons(prevPolygons => {
      const newPolygons = [...prevPolygons];
      const selectedPolygon = newPolygons[polygonIndex];
      if (selectedPolygon.type === 'building' && selectedPolygon.description) {
        selectedPolygon.description = {
          ...selectedPolygon.description,
          ...newOffset
        };
      }
      return newPolygons;
    });
  };

  const handleSelectPolygon = (index: number) => {
    setTool('select');
    setSelectedPolygonIndex(index);
    setSelectedEdgeId(null);
    setSelectedNodeId(null);
  };

  const handleRectChange = (index: number, updatedRect: RectType) => {
    setRects(rects.map((r, i) => i === index ? updatedRect : r));
  };

  const handleSelectEdge = (edgeId: string | null) => {
    setSelectedEdgeId(edgeId);
    setSelectedPolygonIndex(null);
    setSelectedNodeId(null);
  };

  const handleMouseMove = (e: any) => {
    const stage = e.target.getStage();
    const point = stage.getPointerPosition();
    const scaledPoint = {
      x: (point.x - position.x) / scale,
      y: (point.y - position.y) / scale,
    };

    const sortedPolygons = [...polygons].sort(polygonsCompareFn(scaledPoint)).reverse();
    const hoveredPoly = sortedPolygons.find((poly) =>
      isPointInPolygon(scaledPoint, poly.points)
    );
    const hoveredIndex = hoveredPoly ? polygons.indexOf(hoveredPoly) : null;

    setHoveredPolygonIndex(hoveredIndex !== -1 ? hoveredIndex : null);

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
              {/* <Img image={imageElement} opacity={0.5} /> */}
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
                    type={poly.type}
                    points={poly.points}
                    isSelected={selectedPolygonIndex === index}
                    isHovered={hoveredPolygonIndex === index && tool === 'select'}
                    isEditing={tool === 'select' && selectedPolygonIndex === index}
                    onNodeDrag={(nodeIndex) => handleNodeDrag(index, nodeIndex)}
                    onPolygonDrag={(newPositions) => handlePolygonDrag(index, newPositions)}
                    onDragStart={(nodeIndex) => setDraggingPolygonNode({ polygonIndex: index, nodeIndex })}
                    onDragEnd={() => setDraggingPolygonNode(null)}
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
      {/* {selectedPolygonIndex != null && (
        <LayersPanel 
          polygons={polygons}
          selectedPolygonIndex={selectedPolygonIndex}
          onSelectPolygon={handleSelectPolygon}
        />
      )} */}
      {selectedEdge?.type === 'road' && (
        <EdgesList
          edges={graph.edges.filter(e => e.type === 'road')}
          selectedEdgeId={selectedEdgeId}
          onSelectEdge={handleSelectEdge}
          title="Road Edges"
          className="road-edges-list"
        />
      )}
      {/* {selectedEdge?.type === 'pathwalk' && (
        <EdgesList
          edges={graph.edges.filter(e => e.type === 'pathwalk')}
          selectedEdgeId={selectedEdgeId}
          onSelectEdge={handleSelectEdge}
          title="Pathwalk Edges"
          className="pathwalk-edges-list"
        />
      )} */}
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
        {/* <button className="download-button" onClick={() => exportSVG(stageRef.current)}>Download SVG</button> */}
        <button className="download-button" onClick={() => exportPDF(stageRef.current)}>Download PDF</button>
        <button className="download-button" onClick={() => exportJSON()}>Export JSON</button>
        {/* <ImportButton className="download-button" /> */}
      </div>
    </div>
  );
};

// Helper function to check if a point is inside a polygon
function isPointInPolygon(point: { x: number; y: number }, polygon: number[][]) {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i][0], yi = polygon[i][1];
    const xj = polygon[j][0], yj = polygon[j][1];
    const intersect = ((yi > point.y) !== (yj > point.y))
        && (point.x < (xj - xi) * (point.y - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

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
