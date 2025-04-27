import { useState, useRef } from 'react';
import { resetTransform as resetCanvasTransform, zoomIn as zoomCanvasIn, zoomOut as zoomCanvasOut } from '../utils/canvasTransforms';

export interface CanvasTransform {
  scale: number;
  translateX: number;
  translateY: number;
}

/**
 * Custom hook for managing canvas transform (zoom and pan)
 */
export const useCanvasTransform = () => {
  // Transform state for zoom and pan
  const [transform, setTransform] = useState<CanvasTransform>({
    scale: 1,
    translateX: 0,
    translateY: 0
  });

  // State and refs for panning
  const [isPanningActive, setIsPanningActive] = useState(false);
  const isPanning = useRef(false);
  const panStartPos = useRef({ x: 0, y: 0 });

  // Reset transform to default
  const resetView = () => {
    setTransform(resetCanvasTransform());
  };

  // Zoom controls
  const zoomIn = () => {
    setTransform(prev => zoomCanvasIn(prev));
  };

  const zoomOut = () => {
    setTransform(prev => zoomCanvasOut(prev));
  };

  // Handle wheel zoom
  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    
    const zoomFactor = 0.05;
    const delta = e.deltaY > 0 ? -zoomFactor : zoomFactor;
    
    // Calculate new scale, with limits
    const newScale = Math.max(0.1, Math.min(2, transform.scale + delta));
    
    // Get mouse position relative to canvas
    const rect = e.currentTarget.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    // Calculate new translate values to zoom toward mouse position
    const newTranslateX = mouseX - (mouseX - transform.translateX) * (newScale / transform.scale);
    const newTranslateY = mouseY - (mouseY - transform.translateY) * (newScale / transform.scale);
    
    setTransform({
      scale: newScale,
      translateX: newTranslateX,
      translateY: newTranslateY
    });
  };

  // Start panning
  const startPanning = (e: React.MouseEvent<HTMLDivElement>) => {
    isPanning.current = true;
    setIsPanningActive(true);
    panStartPos.current = { x: e.clientX, y: e.clientY };
  };

  // Update panning
  const updatePanning = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isPanning.current) return;
    
    const dx = e.clientX - panStartPos.current.x;
    const dy = e.clientY - panStartPos.current.y;
    panStartPos.current = { x: e.clientX, y: e.clientY };
    
    setTransform(prevTransform => ({
      ...prevTransform,
      translateX: prevTransform.translateX + dx,
      translateY: prevTransform.translateY + dy
    }));
  };

  // End panning
  const endPanning = () => {
    isPanning.current = false;
    setIsPanningActive(false);
  };

  return {
    transform,
    setTransform,
    isPanningActive,
    startPanning,
    updatePanning,
    endPanning,
    handleWheel,
    resetView,
    zoomIn,
    zoomOut
  };
}; 