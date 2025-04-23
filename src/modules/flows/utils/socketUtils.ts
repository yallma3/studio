import { BaseNode, Socket, Connection } from "../types/NodeTypes";
import { SOCKET_SPACING } from "../vars";
import { canvasToScreen } from "./canvasTransforms";

/**
 * Get socket position in screen coordinates
 */
export const getSocketPosition = (
  node: BaseNode, 
  socket: Socket, 
  transform: { scale: number; translateX: number; translateY: number }
) => {
  // Get all sockets of the same type (input/output)
  const sockets = node.sockets.filter(s => s.type === socket.type);
  const socketIndex = sockets.findIndex(s => s.id === socket.id);
  
  if (socketIndex === -1) return { x: 0, y: 0 }; // Fallback
  
  const x = node.x + (socket.type === "output" ? node.width : 0);
  
  // Calculate y position
  let y;
  if (sockets.length === 1) {
    // If only one socket, position at 80% of height
    y = node.y + (node.height * 0.8);
  } else {
    // For multiple sockets, calculate vertical offset
    const totalSpacing = SOCKET_SPACING * (sockets.length - 1);
    const startY = node.y + (node.height - totalSpacing) / 2;
    // Add node.height * 0.2 to match the change in NodeComponent.tsx
    y = startY + (socketIndex * SOCKET_SPACING) + node.height * 0.2;
  }
  
  // Convert canvas coordinates to screen coordinates for rendering
  return canvasToScreen(x, y, transform);
};

/**
 * Find a socket by ID
 */
export const findSocketById = (nodes: BaseNode[], socketId: number): Socket | undefined => {
  for (const node of nodes) {
    const socket = node.sockets.find((s: Socket) => s.id === socketId);
    if (socket) return socket;
  }
  return undefined;
};

/**
 * Get node by socket ID
 */
export const getNodeBySocketId = (nodes: BaseNode[], socketId: number): BaseNode | undefined => {
  return nodes.find(node => 
    node.sockets.some((socket: Socket) => socket.id === socketId)
  );
};

/**
 * Find a socket under the mouse position
 */
export const findSocketUnderMouse = (
  x: number, 
  y: number, 
  nodes: BaseNode[], 
  transform: { scale: number; translateX: number; translateY: number }
): Socket | undefined => {
  // Check all sockets to see if mouse is within its bounds
  for (const node of nodes) {
    for (const socket of node.sockets) {
      // Calculate socket position
      const socketPos = getSocketPosition(node, socket, transform);
      
      // Check if mouse is within socket bounds (20px diameter)
      const distance = Math.sqrt(
        Math.pow(socketPos.x - x, 2) + Math.pow(socketPos.y - y, 2)
      );
      
      // If mouse is within 15px of socket center, consider it a hit
      if (distance < 15) {
        return socket;
      }
    }
  }
  
  return undefined;
};

/**
 * Add a socket to a Join node
 */
export const addSocketToJoinNode = (node: BaseNode): BaseNode => {
  if (node.nodeType !== "Join") return node;
  
  // Count current input sockets
  const inputSockets = node.sockets.filter(s => s.type === "input");
  const inputCount = inputSockets.length;
  
  // Create a new input socket with the next number
  const newSocket: Socket = {
    id: node.id * 100 + (inputCount + 1),
    title: `Input ${inputCount + 1}`,
    type: "input",
    nodeId: node.id,
    dataType: "unknown"
  };
  
  // Calculate new height based on number of sockets
  // Start with base height and add extra height for each socket beyond the initial two
  const baseHeight = 230; // Match initial height from createJoinNode
  const heightPerExtraSocket = 50; // Add this height for each additional socket
  const newHeight = baseHeight + Math.max(0, inputCount - 1) * heightPerExtraSocket;
  
  // Add the new socket to the node and update height
  return {
    ...node,
    sockets: [...node.sockets, newSocket],
    height: newHeight
  };
};

/**
 * Build a graph of node dependencies for execution tracking
 */
export const buildExecutionGraph = (nodes: BaseNode[], connections: Connection[]): [number, number][] => {
  const graph: [number, number][] = [];
  
  // Build edges from connections
  connections.forEach(conn => {
    // Find source and target nodes for this connection
    const fromSocket = nodes.flatMap(n => n.sockets).find(s => s.id === conn.fromSocket);
    const toSocket = nodes.flatMap(n => n.sockets).find(s => s.id === conn.toSocket);
    
    if (fromSocket && toSocket) {
      const sourceNodeId = fromSocket.nodeId;
      const targetNodeId = toSocket.nodeId;
      
      graph.push([sourceNodeId, targetNodeId]);
    }
  });
  
  return graph;
}; 