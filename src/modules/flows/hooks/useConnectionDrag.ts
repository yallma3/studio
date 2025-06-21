/*
* yaLLMa3 - Framework for building AI agents that are capable of learning from their environment and interacting with it.
 
 * Copyright (C) 2025 yaLLMa3
 
 * This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0.
   If a copy of the MPL was not distributed with this file, You can obtain one at https://www.mozilla.org/MPL/2.0/.
 
 * This software is distributed on an "AS IS" basis,
   WITHOUT WARRANTY OF ANY KIND, either express or implied.
   See the Mozilla Public License for the specific language governing rights and limitations under the License.
*/

import { useState } from 'react';
import { Connection, NodeType } from '../types/NodeTypes';
import { findSocketById, getNodeBySocketId, getSocketPosition, findSocketUnderMouse } from '../utils/socketUtils';
import { CanvasTransform } from './useCanvasTransform';

/**
 * Interface for drag connection state
 */
export interface DragConnection {
  fromSocket: number;
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  isRemoving: boolean; // Flag to indicate if this is a removal drag
}

/**
 * Custom hook for managing connection dragging
 */
export const useConnectionDrag = (
  nodes: NodeType[],
  connections: Connection[],
  setConnections: React.Dispatch<React.SetStateAction<Connection[]>>,
  transform: CanvasTransform,
  mousePosition: { x: number, y: number }
) => {
  // State for dragging connections
  const [dragConnection, setDragConnection] = useState<DragConnection | null>(null);

  // Start dragging a connection from a socket
  const handleSocketDragStart = (
    e: React.MouseEvent<HTMLDivElement>,
    socketId: number,
    isRemovingConnection = false
  ) => {
    e.stopPropagation(); // Prevent node dragging and canvas panning
    
    const socket = findSocketById(nodes, socketId);
    if (!socket) return;
    
    // For creating connections (from output sockets)
    if (!isRemovingConnection && socket.type === "output") {
      // Outputs can connect to multiple inputs, so we always allow starting a connection
      const node = getNodeBySocketId(nodes, socketId);
      if (!node) return;
      
      // Calculate start position of the connection using socket's position
      const { x: fromX, y: fromY } = getSocketPosition(node, socket, transform);
      
      setDragConnection({
        fromSocket: socketId,
        fromX,
        fromY,
        toX: e.clientX,
        toY: e.clientY,
        isRemoving: false
      });
    }
    
    // For removing/moving connections (from input sockets)
    if (isRemovingConnection && socket.type === "input") {
      // Check if this input has a connection
      const connection = connections.find(conn => conn.toSocket === socketId);
      
      if (connection) {
        const node = getNodeBySocketId(nodes, socketId);
        const sourceSocket = findSocketById(nodes, connection.fromSocket);
        const sourceNode = getNodeBySocketId(nodes, connection.fromSocket);
        
        if (!node || !sourceNode || !sourceSocket) return;
        
        // Calculate start position of the connection from the output socket
        const { x: fromX, y: fromY } = getSocketPosition(sourceNode, sourceSocket, transform);
        
        setDragConnection({
          fromSocket: socketId, // Store the input socket ID so we know which connection to modify
          fromX,
          fromY,
          toX: e.clientX,
          toY: e.clientY,
          isRemoving: true
        });
      }
    }
  };
  
  // Update connection drag position
  const handleSocketDragMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (dragConnection) {
      setDragConnection({
        ...dragConnection,
        toX: e.clientX,
        toY: e.clientY
      });
    }
  };
  
  // Handle connection drag end
  const handleSocketDragEnd = () => {
    if (!dragConnection) return;
    
    if (dragConnection.isRemoving) {
      // For removal drags (from input sockets), we're modifying an existing connection
      const targetSocket = findSocketUnderMouse(mousePosition.x, mousePosition.y, nodes, transform);
      
      // Find the existing connection to this input socket
      const existingConnectionIndex = connections.findIndex(conn => conn.toSocket === dragConnection.fromSocket);
      
      if (existingConnectionIndex !== -1) {
        // We found the connection we're working with
        const existingConnection = connections[existingConnectionIndex];
        
        if (!targetSocket) {
          // Released in empty space - remove the connection
          setConnections(connections.filter((_, index) => index !== existingConnectionIndex));
        } else if (targetSocket.type === "input" && targetSocket.id !== dragConnection.fromSocket) {
          // Released on another input socket - move the connection
          // First check if the target input already has a connection
          const targetConnectionIndex = connections.findIndex(conn => conn.toSocket === targetSocket.id);
          
          if (targetConnectionIndex !== -1) {
            // Target already has a connection, replace it
            const newConnections = [...connections];
            newConnections[targetConnectionIndex] = {
              fromSocket: existingConnection.fromSocket,
              toSocket: targetSocket.id
            };
            // Remove the original connection
            newConnections.splice(existingConnectionIndex, 1);
            setConnections(newConnections);
          } else {
            // Target doesn't have a connection, just update the existing one
            const newConnections = [...connections];
            newConnections[existingConnectionIndex] = {
              fromSocket: existingConnection.fromSocket,
              toSocket: targetSocket.id
            };
            setConnections(newConnections);
          }
        }
        // If released on an output or the same input, do nothing
      }
    } else {
      // For creation drags (from output sockets)
      const targetSocket = findSocketUnderMouse(mousePosition.x, mousePosition.y, nodes, transform);
      
      if (targetSocket && targetSocket.type === "input") {
        // Create a connection if it's a valid combination (output to input from different nodes)
        const sourceSocketId = dragConnection.fromSocket;
        const sourceNode = getNodeBySocketId(nodes, sourceSocketId);
        const targetNode = getNodeBySocketId(nodes, targetSocket.id);
        
        if (sourceNode && targetNode && sourceNode.id !== targetNode.id) {
          // Check if input socket already has a connection
          const existingConnectionIndex = connections.findIndex(conn => conn.toSocket === targetSocket.id);
          
          if (existingConnectionIndex !== -1) {
            // Replace the existing connection
            const newConnections = [...connections];
            newConnections[existingConnectionIndex] = { 
              fromSocket: sourceSocketId, 
              toSocket: targetSocket.id 
            };
            setConnections(newConnections);
          } else {
            // Create a new connection
            setConnections([
              ...connections,
              { fromSocket: sourceSocketId, toSocket: targetSocket.id }
            ]);
          }
        }
      }
    }
    
    // Reset drag connection state
    setDragConnection(null);
  };

  return {
    dragConnection,
    handleSocketDragStart,
    handleSocketDragMove,
    handleSocketDragEnd
  };
}; 