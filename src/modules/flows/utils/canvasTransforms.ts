// Utility functions for canvas coordinate transformations

/**
 * Convert screen coordinates to canvas coordinates (accounting for zoom and pan)
 */
export const screenToCanvas = (
  screenX: number, 
  screenY: number, 
  transform: { scale: number; translateX: number; translateY: number }
) => {
  return {
    x: (screenX - transform.translateX) / transform.scale,
    y: (screenY - transform.translateY) / transform.scale
  };
};

/**
 * Convert canvas coordinates to screen coordinates (accounting for zoom and pan)
 */
export const canvasToScreen = (
  canvasX: number, 
  canvasY: number, 
  transform: { scale: number; translateX: number; translateY: number }
) => {
  return {
    x: canvasX * transform.scale + transform.translateX,
    y: canvasY * transform.scale + transform.translateY
  };
};

/**
 * Reset canvas transform to default (100% zoom, centered)
 */
export const resetTransform = () => {
  return {
    scale: 1,
    translateX: 0,
    translateY: 0
  };
};

/**
 * Zoom in on the canvas
 */
export const zoomIn = (transform: { scale: number; translateX: number; translateY: number }) => {
  return {
    ...transform,
    scale: Math.min(2, transform.scale + 0.1)
  };
};

/**
 * Zoom out on the canvas
 */
export const zoomOut = (transform: { scale: number; translateX: number; translateY: number }) => {
  return {
    ...transform,
    scale: Math.max(0.1, transform.scale - 0.1)
  };
}; 