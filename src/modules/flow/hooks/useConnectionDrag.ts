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
  isRemoving: boolean;
}

const CHAT_LOOP_NODE_TYPES = new Set([
  "GeminiChat",
  "ClaudeChat",
  "GroqChat",
  "OpenAIChat",
  "OpenRouterChat",
]);

function isConnectionAllowed(
  fromSocketTitle: string,
  fromNodeType: string,
  toSocketTitle: string,
  toNodeType: string
): boolean {
  // "Prompt Loop" on any chat node only accepts connections from "User Input" on UserPrompt
  if (toSocketTitle === "Prompt Loop" && CHAT_LOOP_NODE_TYPES.has(toNodeType)) {
    return fromSocketTitle === "User Input" && fromNodeType === "UserPrompt";
  }
  // All other connections are freely allowed
  return true;
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
  const [dragConnection, setDragConnection] = useState<DragConnection | null>(null);

  const handleSocketDragStart = (
    e: React.MouseEvent<HTMLDivElement>,
    socketId: number,
    isRemovingConnection = false
  ) => {
    e.stopPropagation();

    const socket = findSocketById(nodes, socketId);
    if (!socket) return;

    if (!isRemovingConnection && socket.type === "output") {
      const node = getNodeBySocketId(nodes, socketId);
      if (!node) return;

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

    if (isRemovingConnection && socket.type === "input") {
      const connection = connections.find(conn => conn.toSocket === socketId);

      if (connection) {
        const node         = getNodeBySocketId(nodes, socketId);
        const sourceSocket = findSocketById(nodes, connection.fromSocket);
        const sourceNode   = getNodeBySocketId(nodes, connection.fromSocket);

        if (!node || !sourceNode || !sourceSocket) return;

        const { x: fromX, y: fromY } = getSocketPosition(sourceNode, sourceSocket, transform);

        setDragConnection({
          fromSocket: socketId,
          fromX,
          fromY,
          toX: e.clientX,
          toY: e.clientY,
          isRemoving: true
        });
      }
    }
  };

  const handleSocketDragMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (dragConnection) {
      setDragConnection({ ...dragConnection, toX: e.clientX, toY: e.clientY });
    }
  };

  const handleSocketDragEnd = () => {
    if (!dragConnection) return;

    if (dragConnection.isRemoving) {
      const targetSocket          = findSocketUnderMouse(mousePosition.x, mousePosition.y, nodes, transform);
      const existingConnectionIndex = connections.findIndex(conn => conn.toSocket === dragConnection.fromSocket);

      if (existingConnectionIndex !== -1) {
        const existingConnection = connections[existingConnectionIndex];

        if (!targetSocket) {
          // Released in empty space — remove the connection
          setConnections(connections.filter((_, index) => index !== existingConnectionIndex));
        } else if (targetSocket.type === "input" && targetSocket.id !== dragConnection.fromSocket) {
          // ADDED: validate the reconnection
          const sourceSocket = findSocketById(nodes, existingConnection.fromSocket);
          const sourceNode   = getNodeBySocketId(nodes, existingConnection.fromSocket);
          const targetNode   = getNodeBySocketId(nodes, targetSocket.id);

          if (
            sourceSocket && sourceNode && targetNode &&
            isConnectionAllowed(
              sourceSocket.title,
              sourceNode.nodeType ?? "",
              targetSocket.title,
              targetNode.nodeType ?? ""
            )
          ) {
            const targetConnectionIndex = connections.findIndex(conn => conn.toSocket === targetSocket.id);

            if (targetConnectionIndex !== -1) {
              const newConnections = [...connections];
              newConnections[targetConnectionIndex] = {
                fromSocket: existingConnection.fromSocket,
                toSocket: targetSocket.id
              };
              newConnections.splice(existingConnectionIndex, 1);
              setConnections(newConnections);
            } else {
              const newConnections = [...connections];
              newConnections[existingConnectionIndex] = {
                fromSocket: existingConnection.fromSocket,
                toSocket: targetSocket.id
              };
              setConnections(newConnections);
            }
          }
          // If not allowed, connection stays as-is (silently rejected)
        }
      }
    } else {
      const targetSocket = findSocketUnderMouse(mousePosition.x, mousePosition.y, nodes, transform);

      if (targetSocket && targetSocket.type === "input") {
        const sourceSocketId = dragConnection.fromSocket;
        const sourceNode     = getNodeBySocketId(nodes, sourceSocketId);
        const targetNode     = getNodeBySocketId(nodes, targetSocket.id);
        const sourceSocket   = findSocketById(nodes, sourceSocketId);

        if (sourceNode && targetNode && sourceNode.id !== targetNode.id && sourceSocket) {
          // ADDED: validate before creating the connection
          if (!isConnectionAllowed(
            sourceSocket.title,
            sourceNode.nodeType ?? "",
            targetSocket.title,
            targetNode.nodeType ?? ""
          )) {
            // Connection not allowed — silently reject
            setDragConnection(null);
            return;
          }

          const existingConnectionIndex = connections.findIndex(conn => conn.toSocket === targetSocket.id);

          if (existingConnectionIndex !== -1) {
            const newConnections = [...connections];
            newConnections[existingConnectionIndex] = { fromSocket: sourceSocketId, toSocket: targetSocket.id };
            setConnections(newConnections);
          } else {
            setConnections([...connections, { fromSocket: sourceSocketId, toSocket: targetSocket.id }]);
          }
        }
      }
    }

    setDragConnection(null);
  };

  return {
    dragConnection,
    handleSocketDragStart,
    handleSocketDragMove,
    handleSocketDragEnd
  };
};