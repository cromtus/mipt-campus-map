import React, { useState, useRef, useEffect } from 'react';
import { Stage, Layer, Group, Circle, Image as Img, Line } from 'react-konva';
import { useGesture } from '@use-gesture/react';
import ToolPanel from './components/ToolPanel';
import Polygon from './components/Polygon';
import PreviewPolygon from './components/PreviewPolygon';
import PropertiesPanel from './components/PropertiesPanel';
import { Tool } from './types';
import { snapPosition } from './utils/snapPosition';
import Prism from './components/Prism';
import LayersPanel from './components/LayersPanel';

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
      if (e.key === 'Delete' && selectedPolygonIndex !== null) {
        handleDeletePolygon();
      }
      if (e.key === 'c' && currentPolygon.length > 1) {
        handlePolygonClose();
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
  }, [selectedPolygonIndex, currentPolygon]);

  useEffect(() => {
    if (mousePosition && currentPolygon.length > 0) {
      const allPoints = getAllPoints(polygons).concat(currentPolygon);
      const snappedInfo = snapPosition(mousePosition, isCtrlPressed, allPoints);
      setSnappedInfo(snappedInfo);
      setSnappedMousePosition(snappedInfo.snapped);
    } else {
      setSnappedInfo(null);
      setSnappedMousePosition(mousePosition);
    }
  }, [mousePosition, currentPolygon, isCtrlPressed, polygons]);

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
    const stage = e.target.getStage();
    const point = stage.getPointerPosition();
    const scaledPoint = {
      x: (point.x - position.x) / scale,
      y: (point.y - position.y) / scale,
    };
  
    if (tool === 'building' || tool === 'pavement') {
      let newPoint;
      if (currentPolygon.length > 0) {
        newPoint = [snappedMousePosition!.x, snappedMousePosition!.y];
      } else {
        newPoint = [scaledPoint.x, scaledPoint.y];
      }
  
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
    }
  };

  const handleNodeDrag = (polygonIndex: number, nodeIndex: number, newPosition: number[]) => {
    const allPoints = getAllPoints(polygons);
    const { snapped, snapLines } = snapPosition({ x: newPosition[0], y: newPosition[1] }, isCtrlPressed, allPoints);

    setPolygons(prevPolygons => {
      const updatedPolygons = [...prevPolygons];
      updatedPolygons[polygonIndex] = {
        ...updatedPolygons[polygonIndex],
        points: updatedPolygons[polygonIndex].points.map((point, i) => 
          i === nodeIndex ? [snapped.x, snapped.y] : point
        )
      };
      return updatedPolygons;
    });

    setSnappedInfo({ snapped, snapLines });
  };

  const handlePolygonDrag = (polygonIndex: number, newPositions: number[][]) => {
    const allPoints = getAllPoints(polygons.filter((_, index) => index !== polygonIndex));
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
    }
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
    }
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
  };

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
          scaleX={scale}
          scaleY={scale}
          x={position.x}
          y={position.y}
        >
          <Layer>
            <Group>
              {/* <Img image={imageElement} /> */}
              {polygons.sort(polygonsCompareFn(centerDot)).map((poly, index) => {
                const polygon = (
                  <Polygon
                    type={poly.type}
                    points={poly.points}
                    isSelected={selectedPolygonIndex === index}
                    isHovered={hoveredPolygonIndex === index && tool === 'select'}
                    isEditing={tool === 'select' && selectedPolygonIndex === index}
                    onNodeDrag={(nodeIndex, newPosition) => handleNodeDrag(index, nodeIndex, newPosition)}
                    onPolygonDrag={(newPositions) => handlePolygonDrag(index, newPositions)}
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
      <LayersPanel 
        polygons={polygons}
        selectedPolygonIndex={selectedPolygonIndex}
        onSelectPolygon={handleSelectPolygon}
      />
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

function getAllPoints(polygons: Polygon[]): number[][] {
  return polygons.flatMap(polygon => polygon.points);
};