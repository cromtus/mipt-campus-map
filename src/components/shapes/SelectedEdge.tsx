import React, { useCallback } from "react";
import { useDispatch, useSelector } from "../../store";
import { deleteEdge, selectCurrentEdge, setSelectedEdge, updateEdgeWidth } from "../../store/graphSlice";
import { useKeyboard } from "../../hooks/useKeyboard";
import { useOutsideClickListener } from "../../contexts/mouse";
import EdgePropertiesPanel from "../EdgePropertiesPanel";

const SelectedEdge: React.FC = () => {
  const dispatch = useDispatch();
  const edge = useSelector(selectCurrentEdge);
  
  useKeyboard({ 
    onDelete: () => edge && dispatch(deleteEdge(edge.id)) 
  });

  const handleOutsideClick = useCallback(() => {
    dispatch(setSelectedEdge(null));
  }, [dispatch]);
  useOutsideClickListener(handleOutsideClick);

  if (!edge) return null;

  // Only show properties panel for road-type edges
  if (edge.type !== 'road') return null;

  return (
    <EdgePropertiesPanel
      edgeWidth={edge.width}
      onEdgeWidthChange={(newWidth) => {
        dispatch(updateEdgeWidth({ id: edge.id, width: newWidth }));
      }}
    />
  );
};

export default SelectedEdge;