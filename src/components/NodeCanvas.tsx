import React, { useState, useRef, MouseEvent, useEffect, useCallback } from "react";
import { NodeComponent } from "./NodeComponent";
import { Node, NodeValue } from "../types/NodeTypes";
import CanvasContextMenu from "./CanvasContextMenu";
import NodeContextMenu from "./NodeContextMenu";
import NodeEditPanel from "./NodeEditPanel";
import { executeNode } from "../types/NodeProcessor";
import { Play, Save, Globe, ArrowLeft, Menu } from "lucide-react";
import { exportFlowRunner } from "../utils/exportFlowRunner";
import { useTranslation } from "react-i18next";

// Import utilities
import { screenToCanvas } from "../utils/canvasTransforms";
import { 
  findSocketById, 
  getNodeBySocketId, 
  getSocketPosition, 
  buildExecutionGraph 
} from "../utils/socketUtils";
import { saveCanvasState,CanvasState } from "../utils/storageUtils";
import { generateConnectionPath } from "../utils/connectionUtils";
import { duplicateNode } from "../utils/nodeOperations";
// Import hooks
import { useCanvasState } from "../hooks/useCanvasState";
import { useCanvasTransform } from "../hooks/useCanvasTransform";
import { useConnectionDrag } from "../hooks/useConnectionDrag";
import { useContextMenu } from "../hooks/useContextMenu";

const NodeCanvas: React.FC<{graphId: string, graph: CanvasState | null , onReturnToHome: () => void}> = ({ graphId, graph, onReturnToHome }) => {
  const { t } = useTranslation();
  
  // Canvas state (nodes and connections)
  const {
    nodes,
    setNodes,
    connections,
    setConnections,
    nextNodeId,
    removeNode
  } = useCanvasState(graph?.nodes, graph?.connections);
  
  // Canvas transform state (zoom and pan)
  const {
    transform,
    isPanningActive,
    handleWheel,
    startPanning,
    updatePanning,
    endPanning,
    resetView,
    zoomIn,
    zoomOut
  } = useCanvasTransform();
  
  // Track mouse position for connection dragging
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  
  // Selected nodes tracking
  const [selectedNodeIds, setSelectedNodeIds] = useState<number[]>([]);
  
  // State for drag tracking
  const draggingNode = useRef<number | null>(null);
  const offset = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  
  // Node being edited
  const [editingNode, setEditingNode] = useState<Node | null>(null);
  
  // Track when panel is animating out
  const [isPanelClosing, setIsPanelClosing] = useState<boolean>(false);
  
  // Connection dragging
  const {
    dragConnection,
    handleSocketDragStart,
    handleSocketDragMove,
    handleSocketDragEnd
  } = useConnectionDrag(nodes, connections, setConnections, transform, mousePosition);
  
  // Context menu
  const {
    contextMenu,
    setContextMenu,
    handleContextMenu,
    handleNodeContextMenu,
    handleAddNodeFromContextMenu
  } = useContextMenu( setNodes, setSelectedNodeIds, transform, nextNodeId);
  
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

  // State for dropdown menu
  const [fileMenuOpen, setFileMenuOpen] = useState<boolean>(false);
  const fileMenuRef = useRef<HTMLDivElement>(null);
  
  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: globalThis.MouseEvent) => {
      if (fileMenuRef.current && !fileMenuRef.current.contains(event.target as HTMLElement)) {
        setFileMenuOpen(false);
      }
    };
    
    // Add event listener
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      // Remove event listener on cleanup
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [fileMenuRef]);
  
  // Toggle file menu
  const toggleFileMenu = () => {
    setFileMenuOpen(!fileMenuOpen);
  };

  // Handle closing the edit panel with animation
  const handleCloseEditPanel = useCallback(() => {
    setIsPanelClosing(true);
    setTimeout(() => {
      setEditingNode(null);
      setIsPanelClosing(false);
    }, 300); // Match with transition duration in NodeEditPanel
  }, []);

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
        // Close dropdown menu if open
        if (fileMenuOpen) {
          setFileMenuOpen(false);
          return; // Skip other actions if we closed the menu
        }
        
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
  }, [editingNode, setContextMenu, setNodes, handleCloseEditPanel, fileMenuOpen]);

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
      const canvasCoords = screenToCanvas(e.clientX, e.clientY, transform);
      offset.current = {
        x: canvasCoords.x - node.x,
        y: canvasCoords.y - node.y,
      };
    }
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
    
    // Find the node to duplicate
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
      const newNode = duplicateNode(nodeToDuplicate, newId);
      
      // Add the duplicated node
      setNodes(prev => [...prev, newNode]);
      
      // Select the new node
      setSelectedNodeIds([newId]);
      setNodes(prev => prev.map(n => ({ ...n, selected: n.id === newId })));
    }
  };

  const handleDeleteNode = () => {
    if (!contextMenu.targetNodeId) return;
    removeNode(contextMenu.targetNodeId);
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

  // Handle canvas mouse down event
  const handleCanvasMouseDown = (e: MouseEvent<HTMLDivElement>) => {
    // With stopPropagation on nodes, this will only fire when clicking on the canvas itself
    if (e.button === 0) { // Left mouse button
      // Clear node selection when clicking on empty canvas
      if (!e.shiftKey && selectedNodeIds.length > 0) {
        setSelectedNodeIds([]);
        setNodes(nodes.map(node => ({ ...node, selected: false })));
      }
      
      startPanning(e);
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

  // Handle mouse move events
  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    // Handle panning if active
    updatePanning(e);
    
    // Handle node dragging
    if (draggingNode.current === null) return;

    // Convert screen coordinates to canvas coordinates considering zoom and pan
    const canvasCoords = screenToCanvas(e.clientX, e.clientY, transform);
    
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

  // Handle canvas mouse up
  const handleCanvasMouseUp = () => {
    // Handle panning end
    endPanning();
    
    // Handle node drag end
    draggingNode.current = null;
    
    // Handle connection dragging end
    handleSocketDragEnd();
  };

  // Handle Edit Node directly from the settings button
  const handleEditNodeFromComponent = (nodeId: number) => {
    // Find the node to edit
    const nodeToEdit = nodes.find(n => n.id === nodeId);
    if (nodeToEdit) {
      setEditingNode(nodeToEdit);
    }
  };

  // Handle exporting the flow as a JS package
  const exportAsJSPackage = () => {
    exportFlowRunner(nodes, connections);
    setFileMenuOpen(false);
  };

  // Handle saving the canvas state
  const handleSaveCanvasState = async () => {
    try {
      await saveCanvasState(graphId, nodes, connections, nextNodeId.current);
      setFileMenuOpen(false);
    } catch (error) {
      console.error("Error saving canvas state:", error);
      alert(`Failed to save canvas state: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  // Execute the flow
  const executeFlow = async () => {
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
  };

  return (
    <>
      <div
        className="bg-black/98"
        dir="ltr" 
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
        <div className="absolute top-5 left-5 flex gap-2 z-20 items-center justify-center">
          <button 
            onClick={onReturnToHome}
            className="bg-[#FFC72C] hover:bg-[#FFB300] cursor-pointer transition-colors duration-200 text-black font-medium p-2 rounded-md flex items-center justify-center z-20"
            aria-label={t('canvas.returnToHome')}
            title={t('canvas.returnToHome')}
          >
            <ArrowLeft size={18} className="ltr-icon" />
          </button>
          <p className="text-gray-400 text-xs">{graphId}</p>
        </div>
        <div className="absolute top-5 right-5 flex gap-2 z-20">
          {/* Run button */}
          <button 
            className={` ${executionStatus.isExecuting ? 'bg-gray-400 cursor-not-allowed' : 'bg-[#FFC72C] hover:bg-[#FFB300] cursor-pointer'} px-4 transition-colors duration-200 text-black font-medium p-2 rounded-md flex items-center justify-center z-20`}
            onClick={executeFlow}
          >
            <Play size={18} className="ltr-icon mr-1" />
            {executionStatus.isExecuting 
              ? t('canvas.running', { progress: executionStatus.progress, total: executionStatus.total || '?' })
              : t('canvas.run')}
          </button>
          
          {/* File dropdown menu */}
          <div className="relative" ref={fileMenuRef}>
            <button 
              onClick={toggleFileMenu}
              className="bg-[#666] hover:bg-[#444] cursor-pointer transition-colors duration-200 text-white font-bold p-4 rounded-md flex items-center justify-center z-20"
            >
               <Menu size={18} className="font-bold" />
            </button>
            
            {fileMenuOpen && (
              <div className="absolute right-0 mt-1 w-56 rounded-md shadow-lg bg-[#111] ring-1 ring-black/50 ring-opacity-5 focus:outline-none z-30 border border-[#FFB30055] origin-top-right animate-dropdown">
                {/* File Operations Section */}
                <div className="py-1" role="menu" aria-orientation="vertical" aria-labelledby="file-menu">
                  <button
                    onClick={handleSaveCanvasState}
                    className="w-full text-left block px-4 py-2 text-sm text-white hover:bg-[#FFB30033] transition-colors"
                    role="menuitem"
                  >
                    <Save size={16} className="ltr-icon inline-block mr-2 text-[#FFC72C]" /> {t('canvas.save')}
                  </button>
                  <button
                    onClick={exportAsJSPackage}
                    className="w-full text-left block px-4 py-2 text-sm text-white hover:bg-[#FFB30033] transition-colors"
                    role="menuitem"
                  >
                    <Globe size={16} className="ltr-icon inline-block mr-2 text-[#FFC72C]" /> {t('canvas.export')}
                  </button>
                </div>
                
                {/* Divider */}
                <div className="border-t border-gray-800"></div>
                
                {/* Future Export Options Section - commented out for now */}
                {/* 
                <div className="py-1" role="menu" aria-orientation="vertical">
                  <span className="block px-4 py-1 text-xs text-gray-500">Export Options</span>
                  <button
                    className="w-full text-left block px-4 py-2 text-sm text-white hover:bg-[#FFB30033] transition-colors opacity-50"
                    role="menuitem"
                    disabled
                  >
                    <span className="inline-block mr-2 text-[#FFC72C]">→</span> Additional options coming soon
                  </button>
                </div>
                */}
              </div>
            )}
          </div>
        </div>
        
        {/* Context menu */}
        {renderContextMenu()}
        
        {/* SVG layer for connections */}
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
          {/* Manual rendering of connections for TypeScript compatibility */}
          {connections.map(connection => {
            const fromSocket = findSocketById(nodes, connection.fromSocket);
            const toSocket = findSocketById(nodes, connection.toSocket);
            const fromNode = getNodeBySocketId(nodes, connection.fromSocket);
            const toNode = getNodeBySocketId(nodes, connection.toSocket);
            
            if (!fromNode || !toNode || !fromSocket || !toSocket) return null;
            
            // Calculate socket positions
            const fromPos = getSocketPosition(fromNode, fromSocket, transform);
            const toPos = getSocketPosition(toNode, toSocket, transform);
            
            // Generate path
            const path = generateConnectionPath(fromPos.x, fromPos.y, toPos.x, toPos.y);
            
            return (
              <path
                key={`connection-${connection.fromSocket}-${connection.toSocket}`}
                d={path}
                fill="none"
                stroke="#FFC72C"
                strokeWidth="2"
              />
            );
          })}
          
          {/* Connection being dragged */}
          {dragConnection && (
            <path
              d={generateConnectionPath(
                dragConnection.fromX, 
                dragConnection.fromY, 
                dragConnection.toX, 
                dragConnection.toY
              )}
              fill="none"
              stroke="#FFC72C88"
              strokeWidth="2"
              strokeDasharray="5,5"
            />
          )}
        </svg>
        
        {/* Nodes container with transform */}
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
          onSave={(updatedNode: Partial<Node>) => {
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
