import React, { useState, useRef, useEffect } from 'react';
import { Stage, Layer, Group, Circle, Image as Img, Line } from 'react-konva';
import { useGesture } from '@use-gesture/react';
import ToolPanel from './components/ToolPanel';
import Polygon from './components/Polygon';
import PreviewPolygon from './components/PreviewPolygon';
import PropertiesPanel from './components/PropertiesPanel';
import { Tool, Graph, GraphNode, GraphEdge } from './types';
import { snapPosition } from './utils/snapPosition';
import Prism from './components/Prism';
import LayersPanel from './components/LayersPanel';
import GraphEdgeComponent from './components/GraphEdge';
import GraphNodeComponent from './components/GraphNode';
import EdgesList from './components/EdgesList';
import EdgePropertiesPanel from './components/EdgePropertiesPanel';
import PreviewEdge from './components/PreviewEdge';
import PreviewPoint from './components/PreviewPoint';

type Polygon = {
  points: number[][];
} & (
  | { type: 'building', height: number, color: string, secondaryColor?: string }
  | { type: 'pavement' }
)

const prismHeight = 100;

const App: React.FC = () => {
  const [tool, setTool] = useState<Tool>('pan');
  const [polygons, setPolygons] = useState<Polygon[]>(() => {
    const savedPolygons = localStorage.getItem('polygons');
    return savedPolygons ? JSON.parse(savedPolygons) : [];
  });
  const [currentPolygon, setCurrentPolygon] = useState<number[][]>([]);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [scale, setScale] = useState(1);
  const [mousePosition, setMousePosition] = useState<{ x: number; y: number } | null>(null);
  const [isCtrlPressed, setIsCtrlPressed] = useState(false);
  const [snappedMousePosition, setSnappedMousePosition] = useState<{ x: number; y: number } | null>(null);
  const [selectedPolygonIndex, setSelectedPolygonIndex] = useState<number | null>(null);
  const [hoveredPolygonIndex, setHoveredPolygonIndex] = useState<number | null>(null);
  const [centerDot, setCenterDot] = useState(() => {
    const savedCenterDot = localStorage.getItem('centerDot');
    return savedCenterDot 
      ? JSON.parse(savedCenterDot) 
      : { x: window.innerWidth / 2, y: window.innerHeight / 2 };
  });
  const stageRef = useRef<any>(null);
  const [snappedInfo, setSnappedInfo] = useState<{
    snapped: { x: number; y: number };
    snapLines: { from: { x: number; y: number }, to: { x: number; y: number } }[];
  } | null>(null);
  const [pathwalkGraph, setPathwalkGraph] = useState<Graph>({ nodes: [], edges: [] });
  const [roadGraph, setRoadGraph] = useState<Graph>({ nodes: [], edges: [] });
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [lastClickedNode, setLastClickedNode] = useState<GraphNode | null>(null);
  const [isDrawingEdge, setIsDrawingEdge] = useState(true);
  const [hoveredEdgeId, setHoveredEdgeId] = useState<string | null>(null);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [previewEdge, setPreviewEdge] = useState<{ from: GraphNode; to: { x: number; y: number } } | null>(null);
  const [draggingPolygonNode, setDraggingPolygonNode] = useState<{ polygonIndex: number, nodeIndex: number } | null>(null);
  const [draggingGraphNode, setDraggingGraphNode] = useState<GraphNode | null>(null);

  useEffect(() => {
    localStorage.setItem('polygons', JSON.stringify(polygons));
  }, [polygons]);

  useEffect(() => {
    localStorage.setItem('centerDot', JSON.stringify(centerDot));
  }, [centerDot]);

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
      } else if (tool === 'pathwalk' || tool === 'road') {
        allPoints = getAllGraphPoints(pathwalkGraph.nodes).concat(getAllGraphPoints(roadGraph.nodes))
      } else {
        if (draggingPolygonNode) {
          allPoints = getAllPolygonPoints(polygons, draggingPolygonNode.polygonIndex, draggingPolygonNode.nodeIndex)
        }
        if (draggingGraphNode) {
          allPoints = getAllGraphPoints(pathwalkGraph.nodes, draggingGraphNode.id).concat(getAllGraphPoints(roadGraph.nodes, draggingGraphNode.id))
        }
      }
      const snappedInfo = snapPosition(mousePosition, isCtrlPressed, allPoints);
      setSnappedInfo(snappedInfo);
      setSnappedMousePosition(snappedInfo.snapped);
    } else {
      setSnappedInfo(null);
      setSnappedMousePosition(mousePosition);
    }
  }, [mousePosition, currentPolygon, isCtrlPressed, polygons, pathwalkGraph, roadGraph]);

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
        setMousePosition({
          x: (point.x - position.x) / scale,
          y: (point.y - position.y) / scale,
        });
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
    } else if (tool === 'pathwalk' || tool === 'road') {
      const newNode: GraphNode = {
        id: Date.now().toString(),
        x: snappedMousePosition!.x,
        y: snappedMousePosition!.y,
      };

      const graph = tool === 'pathwalk' ? pathwalkGraph : roadGraph;
      const setGraph = tool === 'pathwalk' ? setPathwalkGraph : setRoadGraph;

      const existingNode = graph.nodes.find(node => 
        Math.abs(node.x - newNode.x) < 10 && Math.abs(node.y - newNode.y) < 10
      );

      if (!existingNode) {
        setGraph(prevGraph => ({
          ...prevGraph,
          nodes: [...prevGraph.nodes, newNode],
        }));
      }

      if (lastClickedNode && isDrawingEdge) {
        const newEdge: GraphEdge = {
          id: Date.now().toString(),
          from: lastClickedNode.id,
          to: existingNode ? existingNode.id : newNode.id,
          width: tool === 'road' ? 10 : undefined,
        };

        setGraph(prevGraph => ({
          ...prevGraph,
          edges: [...prevGraph.edges, newEdge],
        }));
      }
      setPreviewEdge({
        from: existingNode || newNode,
        to: { x: newNode.x, y: newNode.y },
      });
      setLastClickedNode(existingNode || newNode);
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
    const updateGraph = (prevGraph: Graph) => ({
      ...prevGraph,
      nodes: prevGraph.nodes.map(n => n.id === node.id ? { ...n, ...snappedMousePosition } : n),
    });
    if (pathwalkGraph.nodes.some(n => n.id === node.id)) {
      setPathwalkGraph(updateGraph);
    } else {
      setRoadGraph(updateGraph);
    }
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
            color: '#000000'
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
      const edge = roadGraph.edges.find(e => e.id === selectedEdgeId) || pathwalkGraph.edges.find(e => e.id === selectedEdgeId);
      if (edge) {
        // Delete nodes with only one incident edge
        const nodeIds = [edge.from, edge.to];
        for (const nodeId of nodeIds) {
          const incidentEdges = roadGraph.edges.filter(e => e.from === nodeId || e.to === nodeId)
            .concat(pathwalkGraph.edges.filter(e => e.from === nodeId || e.to === nodeId));
          if (incidentEdges.length === 1) {
            deleteNode(nodeId);
          }
        }
      }
      setRoadGraph(prevGraph => ({
        ...prevGraph,
        edges: prevGraph.edges.filter(e => e.id !== selectedEdgeId),
      }));
      setPathwalkGraph(prevGraph => ({
        ...prevGraph,
        edges: prevGraph.edges.filter(e => e.id !== selectedEdgeId),
      }));
      setSelectedEdgeId(null);
      setHoveredEdgeId(null);
      setSelectedNodeId(null);
      setHoveredNodeId(null);
    }
  };

  const deleteNode = (nodeId: string) => {
    setRoadGraph(prevGraph => ({
      ...prevGraph,
      nodes: prevGraph.nodes.filter(n => n.id !== nodeId),
    }));
    setPathwalkGraph(prevGraph => ({
      ...prevGraph,
      nodes: prevGraph.nodes.filter(n => n.id !== nodeId),
    }));
  };

  const [imageElement, setImageElement] = useState<HTMLImageElement | undefined>(undefined);

  useEffect(() => {
    const img = new Image();
    img.src = 'https://sun9-6.userapi.com/impg/_M4edCzdl94fuqja0uk2VHE3-GLb_Egh7Aq14Q/-lT4MRcHlsA.jpg?size=1036x914&quality=95&sign=ad46c6dad161b86db77d83eb3e8af862&type=album';
    img.onload = () => setImageElement(img);
  }, []);

  const handleHeightChange = (newHeight: number) => {
    if (selectedPolygonIndex !== null) {
      setPolygons(prevPolygons => {
        const updatedPolygons = [...prevPolygons];
        let newPolygon = updatedPolygons[selectedPolygonIndex]
        if (newPolygon.type === 'building') {
          updatedPolygons[selectedPolygonIndex] = {
            ...newPolygon,
            height: newHeight
          };
        }
        return updatedPolygons;
      });
    }
  };

  const handleColorChange = (newColor: string) => {
    if (selectedPolygonIndex !== null) {
      setPolygons(prevPolygons => {
        const updatedPolygons = [...prevPolygons];
        let newPolygon = updatedPolygons[selectedPolygonIndex]
        if (newPolygon.type === 'building') {
          updatedPolygons[selectedPolygonIndex] = {
            ...newPolygon,
            color: newColor
          };
        }
        return updatedPolygons;
      });
    }
  };

  const handleSecondaryColorChange = (newColor: string | undefined) => {
    if (selectedPolygonIndex !== null) {
      setPolygons(prevPolygons => {
        const updatedPolygons = [...prevPolygons];
        let newPolygon = updatedPolygons[selectedPolygonIndex]
        if (newPolygon.type === 'building') {
          updatedPolygons[selectedPolygonIndex] = {
            ...newPolygon,
            secondaryColor: newColor
          };
        }
        return updatedPolygons;
      });
    }
  };

  const handleSelectPolygon = (index: number) => {
    setTool('select');
    setSelectedPolygonIndex(index);
    setSelectedEdgeId(null);
    setSelectedNodeId(null);
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

  const selectedEdgeType = selectedEdgeId != null ? (roadGraph.edges.some(e => e.id === selectedEdgeId) ? 'road' : 'pathwalk') : null;
  const selectedEdge = selectedEdgeId != null ? (roadGraph.edges.find(e => e.id === selectedEdgeId) || pathwalkGraph.edges.find(e => e.id === selectedEdgeId)) : null;
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
          scaleX={scale}
          scaleY={scale}
          x={position.x}
          y={position.y}
        >
          <Layer>
            <Group>
              {/* <Img image={imageElement} /> */}
              {renderPreviewPoint()}
              {pathwalkGraph.edges.map(edge => (
                <GraphEdgeComponent
                  key={edge.id}
                  edge={edge}
                  nodes={pathwalkGraph.nodes}
                  isPathwalk={true}
                  isSelected={selectedEdgeId === edge.id}
                  isHovered={hoveredEdgeId === edge.id}
                  onHover={(edgeId) => tool === 'select' && setHoveredEdgeId(edgeId)}
                />
              ))}
              {roadGraph.edges.map(edge => (
                <GraphEdgeComponent
                  key={edge.id}
                  edge={edge}
                  nodes={roadGraph.nodes}
                  isPathwalk={false}
                  isSelected={selectedEdgeId === edge.id}
                  isHovered={hoveredEdgeId === edge.id}
                  onHover={(edgeId) => tool === 'select' && setHoveredEdgeId(edgeId)}
                />
              ))}
              {polygons.sort(polygonsCompareFn(centerDot)).map((poly, index) => {
                const polygon = (
                  <Polygon
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
                    canvasWidth={window.innerWidth}
                    canvasHeight={window.innerHeight}
                    stageX={centerDot.x}
                    stageY={centerDot.y}
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
              {previewEdge && (
                <PreviewEdge
                  from={previewEdge.from}
                  to={previewEdge.to}
                  isPathwalk={tool === 'pathwalk'}
                />
              )}
              {[...pathwalkGraph.nodes, ...roadGraph.nodes].map(node => (
                <GraphNodeComponent
                  key={node.id}
                  node={node}
                  isSelected={selectedNodeId === node.id}
                  isHovered={hoveredNodeId === node.id}
                  onHover={(nodeId) => (tool === 'select' || tool === 'pathwalk' || tool === 'road') && setHoveredNodeId(nodeId)}
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
            <Circle
              x={centerDot.x}
              y={centerDot.y}
              radius={5}
              fill="red"
              draggable
              onDragMove={handleDotDrag}
            />
          </Layer>
        </Stage>
      </div>
      <ToolPanel activeTool={tool} onToolChange={handleToolChange} />
      {selectedPolygonIndex !== null && (
        <>
          {polygons[selectedPolygonIndex].type === 'building' && (
            <PropertiesPanel
              height={polygons[selectedPolygonIndex].height}
              color={polygons[selectedPolygonIndex].color}
              secondaryColor={polygons[selectedPolygonIndex].secondaryColor}
              onHeightChange={handleHeightChange}
              onColorChange={handleColorChange}
              onSecondaryColorChange={handleSecondaryColorChange}
            />
          )}
        </>
      )}
      {selectedPolygonIndex != null && (
        <LayersPanel 
          polygons={polygons}
          selectedPolygonIndex={selectedPolygonIndex}
          onSelectPolygon={handleSelectPolygon}
        />
      )}
      {selectedEdgeId != null && selectedEdgeType === 'road' && (
        <EdgesList
          edges={roadGraph.edges}
          selectedEdgeId={selectedEdgeId}
          onSelectEdge={handleSelectEdge}
          title="Road Edges"
          className="road-edges-list"
        />
      )}
      {selectedEdgeId != null && selectedEdgeType === 'pathwalk' && (
        <EdgesList
          edges={pathwalkGraph.edges}
          selectedEdgeId={selectedEdgeId}
          onSelectEdge={handleSelectEdge}
          title="Pathwalk Edges"
          className="pathwalk-edges-list"
        />
      )}
      {selectedEdge?.width != null && (
        <EdgePropertiesPanel
          edgeWidth={selectedEdge.width}
          onEdgeWidthChange={(newWidth) => {
            setRoadGraph(prevGraph => ({
              ...prevGraph,
              edges: prevGraph.edges.map(e => e.id === selectedEdgeId ? { ...e, width: newWidth } : e),
            }));
          }}
        />
      )}
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
