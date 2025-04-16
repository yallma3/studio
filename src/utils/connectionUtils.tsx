import React from "react";
import { Connection, NodeType } from "../types/NodeTypes";
import { findSocketById, getNodeBySocketId, getSocketPosition } from "./socketUtils";

/**
 * Generate SVG path for a connection
 */
export const generateConnectionPath = (
  fromX: number, 
  fromY: number, 
  toX: number, 
  toY: number
): string => {
  // Calculate control points for the bezier curve
  // Distance between nodes affects the curve intensity
  const distance = Math.abs(toX - fromX);
  const curvature = Math.min(distance * 0.5, 150); // Limit max curvature
  
  // Control points extend horizontally from the connection points
  const cp1x = fromX + curvature;
  const cp1y = fromY;
  const cp2x = toX - curvature;
  const cp2y = toY;
  
  // Create a bezier path
  return `M ${fromX} ${fromY} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${toX} ${toY}`;
};

/**
 * Create a React SVG path component for a connection
 */
export const drawConnection = (
  connection: Connection, 
  nodes: NodeType[], 
  transform: { scale: number; translateX: number; translateY: number }
): React.ReactElement | null => {
  const fromSocket = findSocketById(nodes, connection.fromSocket);
  const toSocket = findSocketById(nodes, connection.toSocket);
  const fromNode = getNodeBySocketId(nodes, connection.fromSocket);
  const toNode = getNodeBySocketId(nodes, connection.toSocket);
  
  if (!fromNode || !toNode || !fromSocket || !toSocket) return null;

  // Calculate socket positions using their specific positions in the nodes
  const { x: fromX, y: fromY } = getSocketPosition(fromNode, fromSocket, transform);
  const { x: toX, y: toY } = getSocketPosition(toNode, toSocket, transform);
  
  // Generate the path
  const path = generateConnectionPath(fromX, fromY, toX, toY);
  
  return (
    <path
      key={`connection-${connection.fromSocket}-${connection.toSocket}`}
      d={path}
      fill="none"
      stroke="#FFC72C"
      strokeWidth="2"
    />
  );
};

/**
 * Create a React SVG path component for a dragged connection
 */
export const drawDragConnection = (
  dragConnection: {
    fromSocket: number;
    fromX: number;
    fromY: number;
    toX: number;
    toY: number;
    isRemoving: boolean;
  }
): React.ReactElement => {
  // Generate the path
  const path = generateConnectionPath(
    dragConnection.fromX, 
    dragConnection.fromY, 
    dragConnection.toX, 
    dragConnection.toY
  );
  
  return (
    <path
      d={path}
      fill="none"
      stroke="#FFC72C88"
      strokeWidth="2"
      strokeDasharray="5,5"
    />
  );
}; 