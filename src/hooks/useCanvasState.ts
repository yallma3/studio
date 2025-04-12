import { useState, useRef } from 'react';
import { Node, Connection } from '../types/NodeTypes';

/**
 * Custom hook for managing canvas state
 */
export const useCanvasState = (initialNodes?: Node[], initialConnections?: Connection[]) => {
  // Default initial nodes and connections
  const defaultNodes: Node[] = [];

  const defaultConnections: Connection[] = [];

  // Initialize state with provided values or defaults
  const [nodes, setNodes] = useState<Node[]>(initialNodes || defaultNodes);
  const [connections, setConnections] = useState<Connection[]>(initialConnections || defaultConnections);
  
  // Track next node ID to ensure uniqueness
  const nextNodeId = useRef(nodes.length > 0 ? Math.max(...nodes.map(n => n.id)) + 1 : 1);
  
  // Add a new node
  const addNode = (node: Node) => {
    const id = nextNodeId.current++;
    setNodes(prevNodes => [...prevNodes, { ...node, id }]);
    return id;
  };
  
  // Update a node
  const updateNode = (updatedNode: Node) => {
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
    // Check if connection already exists
    const connectionExists = connections.some(
      conn => conn.fromSocket === fromSocketId && conn.toSocket === toSocketId
    );
    
    if (connectionExists) return;
    
    setConnections(prevConnections => [
      ...prevConnections,
      { fromSocket: fromSocketId, toSocket: toSocketId }
    ]);
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