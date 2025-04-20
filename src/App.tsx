import React, { useState, useRef, useMemo, useCallback, } from 'react';
import { Stage, Layer, Group, Line, Rect as Rectangle, Text } from 'react-konva';
import { useGesture } from '@use-gesture/react';
import ToolPanel from './components/ToolPanel';
import PropertiesPanel from './components/properties/PolygonPropertiesPanel';
import { Tool, GraphNode, Rect as RectType } from './types';
import YouAreHere from './components/YouAreHere';
import Rect from './components/Rect';
import RectPropertiesPanel from './components/RectPropertiesPanel';
import { useLocalStorage } from './hooks/useLocalStorage';
import { exportJSON, exportPDF } from './utils/export';
import { useKeyboard } from './hooks/useKeyboard';
import useWindowSize from './hooks/useWindowSize';
import { MousePositionContext, ClickListenersContext } from './contexts/mouse';
import PolygonsLayer from './components/layers/PolygonsLayer';
import { Provider } from 'react-redux';
import { store } from './store';
import GraphLayer from './components/layers/GraphLayer';

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
    handleDeleteRect();
  }, [handleDeleteRect]);

  useKeyboard({
    onDelete: handleDelete,
  });

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
      setSelectedRectIndex(null);
    } else if (tool === 'pathwalk' || tool === 'road' || tool === 'fence') {
    }
  };

  const handleToolChange = (newTool: Tool) => {
    setTool(newTool);
    if (newTool !== 'select') {
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
              <GraphLayer tool={tool} />
              {/* <Barriers edges={graph.edges} nodes={nodeById} /> */}
              {/* <TwoDegreeNodes nodes={graph.nodes} edges={graph.edges} /> */}
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
              <PolygonsLayer centerDot={centerDot} tool={tool} />
              {drawingRect && mousePosition && (
                <Rectangle
                  x={drawingRect.x}
                  y={drawingRect.y}
                  width={mousePosition.x - drawingRect.x}
                  height={mousePosition.y - drawingRect.y}
                  fill="rgba(0, 0, 0, 0.2)"
                />
              )}
            </Group>
            <YouAreHere x={centerDot.x} y={centerDot.y} handleDotDrag={handleDotDrag} />
          </Layer>
        </MousePositionContext.Provider>
        </ClickListenersContext.Provider>
        </Stage>
      </div>
      <ToolPanel activeTool={tool} onToolChange={handleToolChange} />
      <PropertiesPanel />
      {/* {selectedEdge?.type === 'road' && (
        <EdgePropertiesPanel
          edgeWidth={selectedEdge.width}
          onEdgeWidthChange={(newWidth) => {
            setGraph(prevGraph => ({
              ...prevGraph,
              edges: prevGraph.edges.map(e => e.id === selectedEdgeId ? { ...e, width: newWidth } : e),
            }));
          }}
        />
      )} */}
      {selectedRectIndex !== null && (
        <RectPropertiesPanel
          rect={rects[selectedRectIndex]}
          onChange={(updatedRect) => handleRectChange(selectedRectIndex, updatedRect)}
        />
      )}
      <div className="export-buttons">
        <button className="download-button" onClick={() => exportPDF(stageRef.current)}>Download PDF</button>
        {/* <button className="download-button" onClick={() => exportJSON()}>Export JSON</button> */}
      </div>
      </Provider>
    </div>
  );
};

export default App;

function getAllGraphPoints(nodes: GraphNode[], excludeNodeId: string | null = null): number[][] {
  return nodes.filter(node => node.id !== excludeNodeId).map(node => [node.x, node.y]);
};


