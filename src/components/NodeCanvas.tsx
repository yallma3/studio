import React, { useRef, useState, MouseEvent, useEffect, WheelEvent, useCallback } from "react";
import { NodeComponent } from "./NodeComponent.tsx";
import { Node, Socket, Connection, createTextNode, createNumberNode, createChatNode, createBooleanNode, createImageNode, createAddNode, createJoinNode, NodeValue } from "../types/NodeTypes";
import { SOCKET_SPACING } from "./vars";
import CanvasContextMenu from "./CanvasContextMenu";
import NodeContextMenu from "./NodeContextMenu";
import NodeEditPanel from "./NodeEditPanel";
import { executeNode } from "../types/NodeProcessor";
import { Play } from "lucide-react";

const NodeCanvas: React.FC = () => {
  // Added transform state for zoom and pan
  const [transform, setTransform] = useState({
    scale: 1,
    translateX: 0,
    translateY: 0
  });
  
  // Added state to track if the canvas is being panned
  const isPanning = useRef(false);
  const panStartPos = useRef({ x: 0, y: 0 });
  
  // Added state for selected nodes
  const [selectedNodeIds, setSelectedNodeIds] = useState<number[]>([]);

  // State for context menu
  const [contextMenu, setContextMenu] = useState<{
    visible: boolean;
    x: number;
    y: number;
    subMenu: string | null;
    targetNodeId?: number; // New property to track which node was right-clicked
  }>({
    visible: false,
    x: 0,
    y: 0,
    subMenu: null,
  });
  
  // Node being edited
  const [editingNode, setEditingNode] = useState<Node | null>(null);
  
  // Track when panel is animating out
  const [isPanelClosing, setIsPanelClosing] = useState<boolean>(false);
  
  // Store canvas position for adding nodes
  const contextMenuCanvasPosition = useRef({ x: 0, y: 0 });
  
  const [nodes, setNodes] = useState<Node[]>([
    createTextNode(1, { x: 100, y: 100 }, "Sci-Fi"),
    createTextNode(2, { x: 100, y: 400 }, "You are an expert Book Recommender. You are given a genre you should recommend 5 books in that genre. Just reply with the titles of the books."),
    createChatNode(3, { x: 600, y: 350 }, "llama-3.1-8b-instant"),
    createTextNode(4, {x: 600, y: 100}, "You are given a list of Books in the following genre {{input}}.You select the best title based on review and ratings. Make the answer very concise with a brief explaination in 5 words or less."),
    createChatNode(5, { x: 1100, y: 200 }, "llama-3.1-8b-instant"),
    createTextNode(6, {x: 1000, y: 500}, "Recommendations: {{input}}")
  ]);

  const [connections, setConnections] = useState<Connection[]>([
    { fromSocket: 100 + 2, toSocket: 300 + 1 },  // Connect first text node's output to chat input
    { fromSocket: 200 + 2, toSocket: 300 + 2 },  // Connect second text node's output to chat system prompt
    { fromSocket: 100 + 2, toSocket: 400 + 1 },  // Connect chat output to text node input
    { fromSocket: 300 + 3, toSocket: 500 + 1 },  // Connect chat output to text node input
    { fromSocket: 400 + 2, toSocket: 500 + 2 },  // Connect chat output to text node input
    { fromSocket: 300 + 3, toSocket: 600 + 1 }   // Connect chat output to text node input
  ]);

  // For dragging nodes
  const draggingNode = useRef<number | null>(null);
  const offset = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  
  // For dragging connections
  const [dragConnection, setDragConnection] = useState<{
    fromSocket: number;
    fromX: number;
    fromY: number;
    toX: number;
    toY: number;
    isRemoving: boolean; // Flag to indicate if this is a removal drag
  } | null>(null);
  
  // Track mouse position for connection dragging
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  
  // Track next node ID to ensure uniqueness
  const nextNodeId = useRef(nodes.length > 0 ? Math.max(...nodes.map(n => n.id)) + 1 : 1);
  
  // State for execution status
  const [executionStatus, setExecutionStatus] = useState<{
    isExecuting: boolean;
    progress: number;
    total: number;
  }>({
    isExecuting: false,
    progress: 0,
    total: 0
  });

  // Update mouse position on mouse move
  useEffect(() => {
    const handleMouseMove = (e: globalThis.MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  // Add keyboard event listener for Esc key to clear selection and close context menu
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        // Close edit panel if open
        if (editingNode) {
          handleCloseEditPanel();
          return; // Skip other actions if we closed the panel
        }
        
        // Clear all selections
        setSelectedNodeIds([]);
        setNodes(nodes => nodes.map(node => ({ ...node, selected: false })));
        // Close context menu if open
        setContextMenu(prev => ({ ...prev, visible: false, subMenu: null }));
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [editingNode]);

  // Add click listener to close context menu when clicking outside
  useEffect(() => {
    const handleGlobalClick = () => {
      if (contextMenu.visible) {
        setContextMenu(prev => ({ ...prev, visible: false, subMenu: null }));
      }
    };
    
    window.addEventListener('click', handleGlobalClick);
    
    return () => {
      window.removeEventListener('click', handleGlobalClick);
    };
  }, [contextMenu.visible]);

  // Convert screen coordinates to canvas coordinates (considering zoom and pan)
  const screenToCanvas = (screenX: number, screenY: number) => {
    return {
      x: (screenX - transform.translateX) / transform.scale,
      y: (screenY - transform.translateY) / transform.scale
    };
  };

  // Convert canvas coordinates to screen coordinates (considering zoom and pan)
  const canvasToScreen = (canvasX: number, canvasY: number) => {
    return {
      x: canvasX * transform.scale + transform.translateX,
      y: canvasY * transform.scale + transform.translateY
    };
  };

  const handleMouseDown = (e: MouseEvent<HTMLDivElement>, id: number) => {
    // Since we stop propagation in NodeComponent, this will only be called when clicking on nodes
    draggingNode.current = id;
    const node = nodes.find((n) => n.id === id);
    if (node) {
      // Handle node selection logic with shift key for multiselect
      if (e.shiftKey) {
        // Add or remove from selection with shift key
        if (selectedNodeIds.includes(id)) {
          // Remove from selection if already selected
          setSelectedNodeIds(selectedNodeIds.filter(nodeId => nodeId !== id));
          setNodes(nodes.map(n => n.id === id ? { ...n, selected: false } : n));
        } else {
          // Add to selection
          setSelectedNodeIds([...selectedNodeIds, id]);
          setNodes(nodes.map(n => n.id === id ? { ...n, selected: true } : n));
        }
      } else if (!selectedNodeIds.includes(id)) {
        // Clear selection and select only this node if not already selected
        setSelectedNodeIds([id]);
        setNodes(nodes.map(n => ({ ...n, selected: n.id === id })));
      }
      
      // Calculate offset for dragging
      const canvasCoords = screenToCanvas(e.clientX, e.clientY);
      offset.current = {
        x: canvasCoords.x - node.x,
        y: canvasCoords.y - node.y,
      };
    }
  };

  // Handle node-specific context menu
  const handleNodeContextMenu = (e: MouseEvent<HTMLDivElement>, nodeId: number) => {
    e.preventDefault();
    // Select the right-clicked node if not already selected
    if (!selectedNodeIds.includes(nodeId)) {
      setSelectedNodeIds([nodeId]);
      setNodes(nodes.map(n => ({ ...n, selected: n.id === nodeId })));
    }
    
    // Show context menu at mouse position with node-specific options
    setContextMenu({
      visible: true,
      x: e.clientX,
      y: e.clientY,
      subMenu: null,
      targetNodeId: nodeId
    });
  };

  // Handle right-click context menu on canvas
  const handleContextMenu = (e: MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    // Store the canvas position for node creation
    const canvasPos = screenToCanvas(e.clientX, e.clientY);
    contextMenuCanvasPosition.current = canvasPos;
    
    // Show context menu at mouse position for canvas options
    setContextMenu({
      visible: true,
      x: e.clientX,
      y: e.clientY,
      subMenu: null,
    });
  };

  // Handle context menu item clicks
  const handleContextMenuClick = (action: string, e: MouseEvent) => {
    e.stopPropagation(); // Prevent the menu from closing immediately
    
    switch (action) {
      case "addNode":
        setContextMenu(prev => ({ ...prev, subMenu: "addNode" }));
        break;
      case "settings":
        setContextMenu(prev => ({ ...prev, subMenu: "settings" }));
        break;
      case "clearView":
        // Clear all nodes and connections
        setNodes([]);
        setConnections([]);
        setContextMenu(prev => ({ ...prev, visible: false, subMenu: null }));
        break;
      case "copyNode":
        handleCopyNode();
        setContextMenu(prev => ({ ...prev, visible: false, subMenu: null }));
        break;
      case "editNode":
        handleEditNode();
        setContextMenu(prev => ({ ...prev, visible: false, subMenu: null }));
        break;
      case "duplicateNode":
        handleDuplicateNode();
        setContextMenu(prev => ({ ...prev, visible: false, subMenu: null }));
        break;
      case "deleteNode":
        handleDeleteNode();
        setContextMenu(prev => ({ ...prev, visible: false, subMenu: null }));
        break;
      default:
        setContextMenu(prev => ({ ...prev, visible: false, subMenu: null }));
        break;
    }
  };

  // Handle node operations
  const handleCopyNode = () => {
    if (!contextMenu.targetNodeId) return;
    
    const nodeToCopy = nodes.find(n => n.id === contextMenu.targetNodeId);
    if (nodeToCopy) {
      // Create a simple string representation of the node for clipboard
      const nodeData = JSON.stringify({
        type: nodeToCopy.nodeType,
        value: nodeToCopy.value,
      });
      
      // Copy to clipboard
      navigator.clipboard.writeText(nodeData)
        .catch(err => console.error('Failed to copy node to clipboard:', err));
    }
  };

  // Handle Edit Node
  const handleEditNode = () => {
    if (!contextMenu.targetNodeId) return;
    
    // Find the node to edit
    const nodeToEdit = nodes.find(n => n.id === contextMenu.targetNodeId);
    if (nodeToEdit) {
      setEditingNode(nodeToEdit);
    }
  };

  const handleDuplicateNode = () => {
    if (!contextMenu.targetNodeId) return;
    
    // Find the node to duplicate - ensure we check for editing state first
    let nodeToDuplicate = nodes.find(n => n.id === contextMenu.targetNodeId);
    
    // If we're duplicating the node that's currently being edited
    if (nodeToDuplicate && editingNode && editingNode.id === nodeToDuplicate.id) {
      // Use the current values from the edit panel rather than the stored node
      // This ensures we get the latest changes even if they haven't been saved yet
      
      // Create a copy of the node
      nodeToDuplicate = { ...nodeToDuplicate };
      
      // Get the values from the specific inputs based on node type
      const titleInput = document.getElementById('node-title-input') as HTMLInputElement;
      if (titleInput) {
        nodeToDuplicate.title = titleInput.value;
      }
      
      // Declare variables for all potential form elements
      let textArea: HTMLTextAreaElement | null = null;
      let numberInput: HTMLInputElement | null = null;
      let checkboxInput: HTMLInputElement | null = null;
      let imageInput: HTMLInputElement | null = null;
      let textInput: HTMLInputElement | null = null;
      
      // Update the value based on node type
      switch (nodeToDuplicate.nodeType) {
        case "Text":
        case "Chat":
          textArea = document.getElementById('node-value-textarea') as HTMLTextAreaElement;
          if (textArea) {
            nodeToDuplicate.value = textArea.value;
          }
          break;
        case "Number":
          numberInput = document.getElementById('node-value-number') as HTMLInputElement;
          if (numberInput) {
            nodeToDuplicate.value = Number(numberInput.value);
          }
          break;
        case "Boolean":
          checkboxInput = document.getElementById('node-value-checkbox') as HTMLInputElement;
          if (checkboxInput) {
            nodeToDuplicate.value = checkboxInput.checked;
          }
          break;
        case "Image":
          imageInput = document.getElementById('node-value-image') as HTMLInputElement;
          if (imageInput) {
            nodeToDuplicate.value = imageInput.value;
          }
          break;
        default:
          textInput = document.getElementById('node-value-text') as HTMLInputElement;
          if (textInput) {
            nodeToDuplicate.value = textInput.value;
          }
      }
    }
    
    if (nodeToDuplicate) {
      const newId = nextNodeId.current++;
      
      // Create a new node based on the type and properties of the original
      let newNode: Node;
      const offsetPosition = { x: nodeToDuplicate.x + 30, y: nodeToDuplicate.y + 30 };
      
      switch(nodeToDuplicate.nodeType) {
        case "Text":
          newNode = createTextNode(newId, offsetPosition, String(nodeToDuplicate.value));
          // Preserve the custom title
          newNode.title = nodeToDuplicate.title;
          break;
        case "Number":
          newNode = createNumberNode(newId, offsetPosition, Number(nodeToDuplicate.value));
          // Preserve the custom title
          newNode.title = nodeToDuplicate.title;
          break;
        case "Chat":
          newNode = createChatNode(newId, offsetPosition, String(nodeToDuplicate.value));
          // Preserve the custom title
          newNode.title = nodeToDuplicate.title;
          break;
        case "Boolean":
          newNode = createBooleanNode(newId, offsetPosition, Boolean(nodeToDuplicate.value));
          // Preserve the custom title
          newNode.title = nodeToDuplicate.title;
          break;
        case "Image":
          newNode = createImageNode(newId, offsetPosition, String(nodeToDuplicate.value));
          // Preserve the custom title
          newNode.title = nodeToDuplicate.title;
          break;
        default:
          newNode = createTextNode(newId, offsetPosition, String(nodeToDuplicate.value));
          // Preserve the custom title
          newNode.title = nodeToDuplicate.title;
      }
      
      // Add the duplicated node
      setNodes(prev => [...prev, newNode]);
      
      // Select the new node
      setSelectedNodeIds([newId]);
      setNodes(prev => prev.map(n => ({ ...n, selected: n.id === newId })));
    }
  };

  const handleDeleteNode = () => {
    if (!contextMenu.targetNodeId) return;
    
    // Find all connections involving this node
    const nodeToDelete = nodes.find(n => n.id === contextMenu.targetNodeId);
    if (nodeToDelete) {
      const socketIds = nodeToDelete.sockets.map(s => s.id);
      
      // Remove all connections involving the node's sockets
      setConnections(prev => 
        prev.filter(conn => 
          !socketIds.includes(conn.fromSocket) && !socketIds.includes(conn.toSocket)
        )
      );
      
      // Remove the node
      setNodes(prev => prev.filter(n => n.id !== contextMenu.targetNodeId));
      
      // Update selection
      setSelectedNodeIds(prev => prev.filter(id => id !== contextMenu.targetNodeId));
    }
  };

  // Handle adding a node from the context menu
  const handleAddNodeFromContextMenu = (nodeType: "Text" | "Number" | "Chat" | "Boolean" | "Image" | "Add" | "Join", e: MouseEvent) => {
    e.stopPropagation(); // Prevent the menu from closing immediately
    
    // Get the next unique node ID
    const id = nextNodeId.current++;
    
    // Create the node based on type at the stored canvas position
    let newNode: Node;
    
    switch(nodeType) {
      case "Text":
        newNode = createTextNode(id, contextMenuCanvasPosition.current, "{{input}}");
        break;
      case "Number":
        newNode = createNumberNode(id, contextMenuCanvasPosition.current, 0);
        break;
      case "Chat":
        newNode = createChatNode(id, contextMenuCanvasPosition.current, "llama-3.1-8b-instant");
        break;
      case "Boolean":
        newNode = createBooleanNode(id, contextMenuCanvasPosition.current, false);
        break;
      case "Image":
        newNode = createImageNode(id, contextMenuCanvasPosition.current);
        break;
      case "Add":
        newNode = createAddNode(id, contextMenuCanvasPosition.current);
        break;
      case "Join":
        newNode = createJoinNode(id, contextMenuCanvasPosition.current, " ");
        break;
      default:
        newNode = createTextNode(id, contextMenuCanvasPosition.current, "{{input}}");
    }
    
    // Add the new node and select it
    setNodes(prev => [...prev, { ...newNode, selected: true }]);
    setSelectedNodeIds([id]);
    
    // Close context menu
    setContextMenu(prev => ({ ...prev, visible: false, subMenu: null }));
  };

  // Add handlers for canvas panning
  const [isPanningActive, setIsPanningActive] = useState(false);
  const handleCanvasMouseDown = (e: MouseEvent<HTMLDivElement>) => {
    // With stopPropagation on nodes, this will only fire when clicking on the canvas itself
    if (e.button === 0) { // Left mouse button
      // Clear node selection when clicking on empty canvas
      if (!e.shiftKey && selectedNodeIds.length > 0) {
        setSelectedNodeIds([]);
        setNodes(nodes.map(node => ({ ...node, selected: false })));
      }
      
      isPanning.current = true;
      setIsPanningActive(true);
      panStartPos.current = { x: e.clientX, y: e.clientY };
      e.preventDefault();
    }
  };

  // Render context menu
  const renderContextMenu = () => {
    if (!contextMenu.visible) return null;
    
    // If right-clicked on a node, show node-specific context menu
    if (contextMenu.targetNodeId !== undefined) {
      return (
        <NodeContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          onContextMenuAction={handleContextMenuClick}
        />
      );
    }

    // Use the CanvasContextMenu component for canvas context menu
    return (
      <CanvasContextMenu 
        contextMenu={contextMenu}
        onAddNode={handleAddNodeFromContextMenu}
        onContextMenuAction={handleCanvasContextMenuAction}
      />
    );
  };

  // New handler for canvas context menu actions from the extracted component
  const handleCanvasContextMenuAction = (action: string, e: MouseEvent) => {
    e.stopPropagation();
    
    switch (action) {
      case "showAddNodeSubmenu":
        setContextMenu(prev => ({ ...prev, subMenu: "addNode" }));
        break;
      case "showSettingsSubmenu":
        setContextMenu(prev => ({ ...prev, subMenu: "settings" }));
        break;
      case "addNode":
        setContextMenu(prev => ({ ...prev, subMenu: "addNode" }));
        break;
      case "settings":
        setContextMenu(prev => ({ ...prev, subMenu: "settings" }));
        break;
      case "clearView":
        // Clear all nodes and connections
        setNodes([]);
        setConnections([]);
        setContextMenu(prev => ({ ...prev, visible: false, subMenu: null }));
        break;
      default:
        setContextMenu(prev => ({ ...prev, visible: false, subMenu: null }));
        break;
    }
  };

  // Handle canvas mouse up
  const handleCanvasMouseUp = () => {
    // Handle panning end
    isPanning.current = false;
    setIsPanningActive(false);
    
    // Handle node drag end
    draggingNode.current = null;
    
    // If we were dragging a connection
    if (dragConnection) {
      if (dragConnection.isRemoving) {
        // For removal drags (from input sockets), we're modifying an existing connection
        const targetSocket = findSocketUnderMouse(mousePosition.x, mousePosition.y);
        
        // Find the existing connection to this input socket
        const existingConnectionIndex = connections.findIndex(conn => conn.toSocket === dragConnection.fromSocket);
        
        if (existingConnectionIndex !== -1) {
          // We found the connection we're working with
          const existingConnection = connections[existingConnectionIndex];
          
          if (!targetSocket) {
            // Released in empty space - remove the connection
            setConnections(connections.filter((_, index) => index !== existingConnectionIndex));
          } else if (targetSocket.position === "input" && targetSocket.id !== dragConnection.fromSocket) {
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
        const targetSocket = findSocketUnderMouse(mousePosition.x, mousePosition.y);
        
        if (targetSocket && targetSocket.position === "input") {
          // Create a connection if it's a valid combination (output to input from different nodes)
          const sourceSocketId = dragConnection.fromSocket;
          const sourceNode = getNodeBySocketId(sourceSocketId);
          const targetNode = getNodeBySocketId(targetSocket.id);
          
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
              
              // If this is a Join node, add a new input socket
              if (targetNode.nodeType === "Join") {
                // Check if this was the last available input socket
                const inputSockets = targetNode.sockets.filter(s => s.position === "input");
                const allInputsConnected = inputSockets.every(socket => 
                  connections.some(conn => conn.toSocket === socket.id) || socket.id === targetSocket.id
                );
                
                if (allInputsConnected) {
                  // Add a new socket to the Join node
                  setNodes(nodes.map(node => 
                    node.id === targetNode.id ? addSocketToJoinNode(node) : node
                  ));
                }
              }
            }
          }
        }
      }
      
      // Reset drag connection state
      setDragConnection(null);
    }
  };

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    // Handle panning if active
    if (isPanning.current) {
      const dx = e.clientX - panStartPos.current.x;
      const dy = e.clientY - panStartPos.current.y;
      panStartPos.current = { x: e.clientX, y: e.clientY };
      
      setTransform(prevTransform => ({
        ...prevTransform,
        translateX: prevTransform.translateX + dx,
        translateY: prevTransform.translateY + dy
      }));
      return;
    }

    if (draggingNode.current === null) return;

    // Convert screen coordinates to canvas coordinates considering zoom and pan
    const canvasCoords = screenToCanvas(e.clientX, e.clientY);
    
    // Calculate the delta movement for the dragged node
    const draggedNode = nodes.find(n => n.id === draggingNode.current);
    if (!draggedNode) return;
    
    const deltaX = canvasCoords.x - offset.current.x - draggedNode.x;
    const deltaY = canvasCoords.y - offset.current.y - draggedNode.y;

    // Move all selected nodes if the dragged node is part of a selection
    const newNodes = nodes.map((n) => {
      // If node is selected or is the one being dragged, move it
      if ((selectedNodeIds.includes(n.id)) || n.id === draggingNode.current) {
        return {
          ...n,
          x: n.x + deltaX,
          y: n.y + deltaY,
        };
      }
      return n;
    });

    setNodes(newNodes);
  };

  // Handle zoom with mouse wheel
  const handleWheel = (e: WheelEvent<HTMLDivElement>) => {
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
  
  // Socket positioning helper function
  const getSocketPosition = (node: Node, socket: Socket) => {
    // Constants
     // Keep in sync with NodeComponent
    
    // Get all sockets of the same type (input/output)
    const sockets = node.sockets.filter(s => s.position === socket.position);
    const socketIndex = sockets.findIndex(s => s.id === socket.id);
    
    if (socketIndex === -1) return { x: 0, y: 0 }; // Fallback
    
    const x = node.x + (socket.position === "output" ? node.width : 0);
    
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
    const screenCoords = canvasToScreen(x, y);
    return screenCoords;
  };

  // Start dragging a connection from a socket
  const handleSocketDragStart = (e: MouseEvent<HTMLDivElement>, socketId: number, isRemovingConnection = false) => {
    e.stopPropagation(); // Prevent node dragging and canvas panning
    
    const socket = findSocketById(socketId);
    if (!socket) return;
    
    // For creating connections (from output sockets)
    if (!isRemovingConnection && socket.position === "output") {
      // Outputs can connect to multiple inputs, so we always allow starting a connection
      const node = getNodeBySocketId(socketId);
      if (!node) return;
      
      // Calculate start position of the connection using socket's position
      const { x: fromX, y: fromY } = getSocketPosition(node, socket);
      
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
    if (isRemovingConnection && socket.position === "input") {
      // Check if this input has a connection
      const connection = connections.find(conn => conn.toSocket === socketId);
      
      if (connection) {
        const node = getNodeBySocketId(socketId);
        const sourceSocket = findSocketById(connection.fromSocket);
        const sourceNode = getNodeBySocketId(connection.fromSocket);
        
        if (!node || !sourceNode || !sourceSocket) return;
        
        // Calculate start position of the connection from the output socket
        const { x: fromX, y: fromY } = getSocketPosition(sourceNode, sourceSocket);
        
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
  const handleSocketDragMove = (e: MouseEvent<HTMLDivElement>) => {
    if (dragConnection) {
      setDragConnection({
        ...dragConnection,
        toX: e.clientX,
        toY: e.clientY
      });
    }
  };
  
  // Find a socket under the mouse position
  const findSocketUnderMouse = (x: number, y: number): Socket | undefined => {
    // Check all sockets to see if mouse is within its bounds
    for (const node of nodes) {
      for (const socket of node.sockets) {
        // Calculate socket position
        const socketPos = getSocketPosition(node, socket);
        
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

  // Helper function to find a socket by ID
  const findSocketById = (socketId: number): Socket | undefined => {
    for (const node of nodes) {
      const socket = node.sockets.find((s: Socket) => s.id === socketId);
      if (socket) return socket;
    }
    return undefined;
  };

  // Get node by socket ID
  const getNodeBySocketId = (socketId: number): Node | undefined => {
    return nodes.find(node => 
      node.sockets.some((socket: Socket) => socket.id === socketId)
    );
  };

  // Draw lines between connected sockets
  const drawConnection = (connection: Connection) => {
    const fromSocket = findSocketById(connection.fromSocket);
    const toSocket = findSocketById(connection.toSocket);
    const fromNode = getNodeBySocketId(connection.fromSocket);
    const toNode = getNodeBySocketId(connection.toSocket);
    
    if (!fromNode || !toNode || !fromSocket || !toSocket) return null;

    // Calculate socket positions using their specific positions in the nodes
    const { x: fromX, y: fromY } = getSocketPosition(fromNode, fromSocket);
    const { x: toX, y: toY } = getSocketPosition(toNode, toSocket);
    
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
    const path = `M ${fromX} ${fromY} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${toX} ${toY}`;
    
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

  // Reset canvas transform to default (100% zoom, centered)
  const resetView = () => {
    setTransform({
      scale: 1,
      translateX: 0,
      translateY: 0
    });
  };

  // Zoom controls
  const zoomIn = () => {
    setTransform(prev => ({
      ...prev,
      scale: Math.min(2, prev.scale + 0.1)
    }));
  };

  const zoomOut = () => {
    setTransform(prev => ({
      ...prev,
      scale: Math.max(0.1, prev.scale - 0.1)
    }));
  };

  // Handle Edit Node directly from the settings button
  const handleEditNodeFromComponent = (nodeId: number) => {
    // Find the node to edit
    const nodeToEdit = nodes.find(n => n.id === nodeId);
    if (nodeToEdit) {
      setEditingNode(nodeToEdit);
    }
  };

  // Handle closing the edit panel with animation
  const handleCloseEditPanel = useCallback(() => {
    setIsPanelClosing(true);
    setTimeout(() => {
      setEditingNode(null);
      setIsPanelClosing(false);
    }, 300); // Match with transition duration in NodeEditPanel
  }, []);

  // Create a new function to add a socket to a Join node
  const addSocketToJoinNode = (node: Node): Node => {
    if (node.nodeType !== "Join") return node;
    
    // Count current input sockets
    const inputSockets = node.sockets.filter(s => s.position === "input");
    const inputCount = inputSockets.length;
    
    // Create a new input socket with the next number
    const newSocket: Socket = {
      id: node.id * 100 + (inputCount + 1),
      title: `Input ${inputCount + 1}`,
      position: "input",
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

  // Helper function to build a graph of node dependencies for execution tracking
  const buildExecutionGraph = (nodes: Node[], connections: Connection[]): [number, number][] => {
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

  return (
    <>
      <div
        className="bg-black/98"
        style={{
          width: "100vw",
          height: "100vh",
          position: "relative",
          overflow: "hidden", // Prevent scrollbars during panning
          cursor: isPanningActive ? "grabbing" : "grab", // Show grab cursor to indicate panning is available
          pointerEvents: editingNode || isPanelClosing ? "none" : "auto" // Disable pointer events when editing to allow edit panel to receive events
        }}
        onMouseMove={(e) => {
          if (editingNode || isPanelClosing) return; // Skip event handling when editing
          handleMouseMove(e);
          handleSocketDragMove(e);
        }}
        onMouseDown={(e) => {
          if (editingNode || isPanelClosing) return; // Skip event handling when editing
          handleCanvasMouseDown(e);
        }}
        onMouseUp={() => {
          if (editingNode || isPanelClosing) return; // Skip event handling when editing
          handleCanvasMouseUp();
        }}
        onWheel={(e) => {
          if (editingNode || isPanelClosing) return; // Skip event handling when editing
          handleWheel(e);
        }}
        onContextMenu={(e) => {
          if (editingNode || isPanelClosing) return; // Skip event handling when editing
          handleContextMenu(e);
        }}
      >
        {/* Canvas content */}
        <div 
            style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.2) 1px, transparent 1px)',
            backgroundSize: `${20 * transform.scale}px ${20 * transform.scale}px`,
            backgroundPosition: `${transform.translateX}px ${transform.translateY}px`,
            backgroundAttachment: 'local',
            pointerEvents: 'none'
            }}
        />
        
        {/* Run button */}
        <button 
          className={`absolute top-5 right-5 ${executionStatus.isExecuting ? 'bg-gray-400 cursor-not-allowed' : 'bg-[#FFC72C] hover:bg-[#FFB300] cursor-pointer'} transition-colors duration-200 text-black font-medium p-2 rounded-md flex items-center justify-center z-20`}
          onClick={async () => {
            if (executionStatus.isExecuting) return;

            try {
              // Set execution status to running
              setExecutionStatus({
                isExecuting: true,
                progress: 0,
                total: 0
              });

              // Create a promise-based cache to store calculated node results and prevent redundant calculations
              const nodeResultCache = new Map<number, Promise<NodeValue>>();
              
              // Find end nodes (nodes with no outgoing connections)
              const endNodes = nodes.filter(node => {
                return node.sockets
                  .filter(socket => socket.position === "output")
                  .every(socket => 
                    !connections.some(conn => conn.fromSocket === socket.id)
                  );
              });
              
              console.log(`Found ${endNodes.length} end nodes to execute`);
              
              if (endNodes.length === 0) {
                alert("No end nodes found. Your flow needs at least one node with unused outputs.");
                setExecutionStatus({
                  isExecuting: false,
                  progress: 0,
                  total: 0
                });
                return;
              }

              // Create a counter to track execution progress
              let completedNodes = 0;
              
              // Override the map set method to track progress
              const originalSet = nodeResultCache.set.bind(nodeResultCache);
              nodeResultCache.set = (key: number, value: Promise<NodeValue>) => {
                // Count the total number of nodes in the execution graph
                if (nodeResultCache.size === 0) {
                  // First node being executed, estimate total nodes
                  const graph = buildExecutionGraph(nodes, connections);
                  const totalNodes = new Set(graph.flatMap(([from, to]) => [from, to])).size;
                  setExecutionStatus(prev => ({
                    ...prev,
                    total: totalNodes
                  }));
                }
                
                // Track when the promise completes to update progress
                value.then(() => {
                  completedNodes++;
                  setExecutionStatus(prev => ({
                    ...prev,
                    progress: completedNodes
                  }));
                }).catch(() => {
                  // Still count failed nodes in progress
                  completedNodes++;
                  setExecutionStatus(prev => ({
                    ...prev,
                    progress: completedNodes
                  }));
                });
                
                return originalSet(key, value);
              };
              
              // Execute only the end nodes - the dependency tracing will handle executing
              // all required upstream nodes in the correct order
              const results = await Promise.all(
                endNodes.map(async (node) => {
                  try {
                    // Execute the node and its dependencies
                    node.processing = true;
                    const result = await executeNode(node, nodes, connections, nodeResultCache);
                    return { nodeId: node.id, title: node.title, result };
                  } catch (error) {
                    console.error(`Error executing node ${node.id}:`, error);
                    return { nodeId: node.id, title: node.title, error: error instanceof Error ? error.message : String(error) };
                  } finally {
                    node.processing = false;
                  }
                })
              );
              
              // Format results for display
              const resultText = results
                .map(r => {
                  if ('error' in r) {
                    return `Node ${r.title} (ID: ${r.nodeId}): Error - ${r.error}`;
                  }
                  return `Node ${r.title} (ID: ${r.nodeId}): ${JSON.stringify(r.result)}`;
                })
                .join('\n\n');
              
              // Reset execution status
              setExecutionStatus({
                isExecuting: false,
                progress: 0,
                total: 0
              });
              
              alert(`Execution Results:\n\n${resultText}`);
            } catch (error) {
              console.error("Error during graph execution:", error);
              
              // Reset execution status on error
              setExecutionStatus({
                isExecuting: false,
                progress: 0,
                total: 0
              });
              
              alert(`Error during execution: ${error instanceof Error ? error.message : String(error)}`);
            }
          }}
        >
          <Play size={18} className="mr-2" />
          {executionStatus.isExecuting 
            ? `Running (${executionStatus.progress}/${executionStatus.total || '?'})` 
            : 'Run Flow'}
        </button>
        
        {/* Context menu */}
        {renderContextMenu()}
        
        <svg 
          className="z-10" 
          style={{ 
            position: "absolute", 
            top: 0, 
            left: 0, 
            pointerEvents: "none", 
            width: "100%", 
            height: "100%",
            overflow: "visible" // Allow drawing outside the SVG bounds
          }}
        >
          {/* Existing connections */}
          {connections.map((connection) => drawConnection(connection))}
          
          {/* Connection being dragged */}
          {dragConnection && (
            (() => {
              // Calculate control points for the bezier curve
              const distance = Math.abs(dragConnection.toX - dragConnection.fromX);
              const curvature = Math.min(distance * 0.5, 150); // Limit max curvature
              
              // Control points extend horizontally from the connection points
              const cp1x = dragConnection.fromX + curvature;
              const cp1y = dragConnection.fromY;
              const cp2x = dragConnection.toX - curvature;
              const cp2y = dragConnection.toY;
              
              // Create a bezier path
              const path = `M ${dragConnection.fromX} ${dragConnection.fromY} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${dragConnection.toX} ${dragConnection.toY}`;
              
              return (
                <path
                  d={path}
                  fill="none"
                  stroke="#FFC72C88"
                  strokeWidth="2"
                  strokeDasharray="5,5"
                />
              );
            })()
          )}
        </svg>
        
        {/* Render nodes using the separate NodeComponent */}
        <div style={{
          transform: `translate(${transform.translateX}px, ${transform.translateY}px) scale(${transform.scale})`,
          transformOrigin: "0 0",
          width: "100%",
          height: "100%",
          position: "absolute"
        }}>
          {nodes.map((node) => (
            <NodeComponent
              key={node.id}
              node={node}
              connections={connections}
              onMouseDown={handleMouseDown}
              onSocketDragStart={handleSocketDragStart}
              onNodeContextMenu={handleNodeContextMenu}
              onEditNode={handleEditNodeFromComponent}
              isBeingEdited={editingNode?.id === node.id}
            />
          ))}
        </div>

        {/* Zoom Controls UI */}
        <div className="absolute bottom-5 right-5 flex flex-col gap-2 bg-[#111] p-2 rounded-md backdrop-blur-sm border border-[#FFB30055]">
          <button 
            className="bg-[#FFC72C33] hover:bg-[#FFB300AA] transition-colors duration-200 text-white p-2 rounded-md flex items-center justify-center w-10 h-10"
            onClick={zoomIn}
            title="Zoom In"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              <line x1="11" y1="8" x2="11" y2="14"></line>
              <line x1="8" y1="11" x2="14" y2="11"></line>
            </svg>
          </button>
          <button 
            className="bg-[#FFC72C33] hover:bg-[#FFB300AA] transition-colors duration-200 text-white p-2 rounded-md flex items-center justify-center w-10 h-10"
            onClick={zoomOut}
            title="Zoom Out"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              <line x1="8" y1="11" x2="14" y2="11"></line>
            </svg>
          </button>
          <button 
            className="bg-[#FFC72C33] hover:bg-[#FFB300AA] transition-colors duration-200 text-white p-2 rounded-md flex items-center justify-center w-10 h-10"
            onClick={resetView}
            title="Reset View"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
            </svg>
          </button>
        </div>

        {/* Scale indicator */}
        <div className="absolute bottom-5 left-5 text-white text-xs bg-[#FFC72C33] px-2 py-1 rounded backdrop-blur-sm">
          {Math.round(transform.scale * 100)}%
        </div>
      </div>
      
      {/* Node Edit Panel - outside the canvas div for complete isolation */}
      {(editingNode || isPanelClosing) && (
        <NodeEditPanel
          node={editingNode}
          onClose={handleCloseEditPanel}
          onSave={(updatedNode) => {
            setIsPanelClosing(true);
            setTimeout(() => {
              setNodes(nodes.map(node => 
                node.id === editingNode?.id 
                  ? { ...node, ...updatedNode } 
                  : node
              ));
              setEditingNode(null);
              setIsPanelClosing(false);
            }, 300); // Match with transition duration in NodeEditPanel
          }}
        />
      )}
    </>
  );
};

export default NodeCanvas;
