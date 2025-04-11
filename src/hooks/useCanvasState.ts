import { useState, useRef } from 'react';
import { Node, Connection, createTextNode, createChatNode } from '../types/NodeTypes';

/**
 * Custom hook for managing canvas state
 */
export const useCanvasState = (initialNodes?: Node[], initialConnections?: Connection[]) => {
  // Default initial nodes and connections
  const defaultNodes: Node[] = [
    createTextNode(1, { x: 100, y: 100 }, "Sci-Fi"),
    createTextNode(2, { x: 100, y: 400 }, "You are an expert Book Recommender. You are given a genre you should recommend 5 books in that genre. Just reply with the titles of the books."),
    createChatNode(3, { x: 600, y: 350 }, "llama-3.1-8b-instant"),
    createTextNode(4, {x: 600, y: 100}, "You are given a list of Books in the following genre {{input}}.You select the best title based on review and ratings. Make the answer very concise with a brief explaination in 5 words or less."),
    createChatNode(5, { x: 1100, y: 200 }, "llama-3.1-8b-instant"),
    createTextNode(6, {x: 1000, y: 500}, "Recommendations: {{input}}")
  ];

  const defaultConnections: Connection[] = [
    { fromSocket: 100 + 2, toSocket: 300 + 1 },  // Connect first text node's output to chat input
    { fromSocket: 200 + 2, toSocket: 300 + 2 },  // Connect second text node's output to chat system prompt
    { fromSocket: 100 + 2, toSocket: 400 + 1 },  // Connect chat output to text node input
    { fromSocket: 300 + 3, toSocket: 500 + 1 },  // Connect chat output to text node input
    { fromSocket: 400 + 2, toSocket: 500 + 2 },  // Connect chat output to text node input
    { fromSocket: 300 + 3, toSocket: 600 + 1 }   // Connect chat output to text node input
  ];

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