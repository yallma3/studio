/*
* yaLLMa3 - Framework for building AI agents that are capable of learning from their environment and interacting with it.
 
 * Copyright (C) 2025 yaLLMa3
 
 * This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0.
   If a copy of the MPL was not distributed with this file, You can obtain one at https://www.mozilla.org/MPL/2.0/.
 
 * This software is distributed on an "AS IS" basis,
   WITHOUT WARRANTY OF ANY KIND, either express or implied.
   See the Mozilla Public License for the specific language governing rights and limitations under the License.
*/

import { useState, useRef } from 'react';
import { NodeType, Connection } from '../types/NodeTypes';

/**
 * Custom hook for managing canvas state
 */
export const useCanvasState = (initialNodes?: NodeType[], initialConnections?: Connection[]) => {
  // Default initial nodes and connections
  const defaultNodes: NodeType[] = [];

  const defaultConnections: Connection[] = [];

  // Initialize state with provided values or defaults
  const [nodes, setNodes] = useState<NodeType[]>(initialNodes || defaultNodes);
  const [connections, setConnections] = useState<Connection[]>(initialConnections || defaultConnections);
  
  // Track next node ID to ensure uniqueness
  const nextNodeId = useRef(nodes.length > 0 ? Math.max(...nodes.map(n => n.id)) + 1 : 1);
  
  // Add a new node
  const addNode = (node: NodeType) => {
    const id = nextNodeId.current++;
    setNodes(prevNodes => [...prevNodes, { ...node, id }]);
    return id;
  };
  
  // Update a node
  const updateNode = (updatedNode: NodeType) => {
    setNodes(prevNodes => 
      prevNodes.map(node => node.id === updatedNode.id ? updatedNode : node)
    );
  };
  
  // Remove a node and its connections
  const removeNode = (nodeId: number) => {
    // Find the node to get its sockets
    const nodeToRemove = nodes.find(n => n.id === nodeId);
    if (!nodeToRemove) return;
    
    // Get all socket ids for this node
    const socketIds = nodeToRemove.sockets.map(s => s.id);
    
    // Remove connections involving this node
    setConnections(prevConnections => 
      prevConnections.filter(conn => 
        !socketIds.includes(conn.fromSocket) && !socketIds.includes(conn.toSocket)
      )
    );
    
    // Remove the node
    setNodes(prevNodes => prevNodes.filter(n => n.id !== nodeId));
  };
  
   // Add a connection
   const addConnection = (fromSocketId: number, toSocketId: number) => {
     setConnections(prevConnections => {
       // Check if connection already exists in current state
       const connectionExists = prevConnections.some(
         conn => conn.fromSocket === fromSocketId && conn.toSocket === toSocketId
       );

       if (connectionExists) return prevConnections;

       return [
         ...prevConnections,
         { fromSocket: fromSocketId, toSocket: toSocketId }
       ];
     });
   };
  
  // Remove a connection
  const removeConnection = (fromSocketId: number, toSocketId: number) => {
    setConnections(prevConnections => 
      prevConnections.filter(
        conn => !(conn.fromSocket === fromSocketId && conn.toSocket === toSocketId)
      )
    );
  };
  
  return {
    nodes,
    setNodes,
    connections,
    setConnections,
    nextNodeId,
    addNode,
    updateNode,
    removeNode,
    addConnection,
    removeConnection
  };
}; 