import { Node, Connection } from "../types/NodeTypes";

interface CanvasState {
  nodes: Node[];
  connections: Connection[];
  nextNodeId: number;
}

/**
 * Save canvas state to localStorage
 */
export const saveCanvasState = (nodes: Node[], connections: Connection[], nextNodeId: number): void => {
  // Create a state object with nodes and connections
  const canvasState: CanvasState = {
    nodes,
    connections,
    nextNodeId
  };
  
  // Convert to JSON string
  const stateJson = JSON.stringify(canvasState);
  
  // Save to localStorage
  localStorage.setItem('nodeCanvasState', stateJson);
};

/**
 * Load canvas state from localStorage
 * Returns the canvas state if found, null otherwise
 */
export const loadCanvasState = (): CanvasState | null => {
  // Retrieve from localStorage
  const savedState = localStorage.getItem('nodeCanvasState');
  
  if (savedState) {
    try {
      // Parse the JSON string
      const canvasState = JSON.parse(savedState);
      return canvasState;
    } catch (error) {
      console.error('Failed to parse saved canvas state:', error);
      return null;
    }
  }
  
  return null;
}; 