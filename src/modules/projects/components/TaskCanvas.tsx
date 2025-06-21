/*
* yaLLMa3 - Framework for building AI agents that are capable of learning from their environment and interacting with it.
 
 * Copyright (C) 2025 yaLLMa3
 
 * This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0.
   If a copy of the MPL was not distributed with this file, You can obtain one at https://www.mozilla.org/MPL/2.0/.
 
 * This software is distributed on an "AS IS" basis,
   WITHOUT WARRANTY OF ANY KIND, either express or implied.
   See the Mozilla Public License for the specific language governing rights and limitations under the License.
*/

import React, { useState, useRef, useEffect, CSSProperties } from "react";
import { Task } from "../types/Types";
import { useTranslation } from "react-i18next";
import { TASK_NODE_WIDTH, TASK_NODE_HEIGHT, SOCKET_SIZE } from "./TaskCanvasVars";

// Types for task canvas
interface TaskSocket {
  id: string;
  taskId: string;
  type: 'input' | 'output';
}

interface TaskNode extends Task {
  x: number;
  y: number;
  selected: boolean;
  inputSocket: TaskSocket;
  outputSocket: TaskSocket;
}

interface TaskConnection {
  fromSocketId: string;
  toSocketId: string;
}

interface TaskCanvasProps {
  tasks: Task[];
  onTaskEdit?: (taskId: string) => void;
  onTaskDelete?: (taskId: string) => void;
  onshowTaskDialog?: () => void;
  projectData?: {
    agents: { id: string; name: string }[];
    workflows?: { id: string; name: string; description: string }[];
  };
}

interface CanvasTransform {
  scale: number;
  translateX: number;
  translateY: number;
}

interface ContextMenuState {
  visible: boolean;
  x: number;
  y: number;
  taskId: string | null;
}

// Helper function to generate a connection path
const generateConnectionPath = (x1: number, y1: number, x2: number, y2: number): string => {
  // Calculate control points for a cubic bezier curve
  // Use a more natural curve by setting the control points at a distance proportional to the horizontal distance
  const dx = Math.abs(x2 - x1) * 0.5;
  
  // Create a cubic bezier curve path
  return `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`;
};

// Screen to canvas coordinate conversion
const screenToCanvas = (
  screenX: number,
  screenY: number,
  transform: CanvasTransform
): { x: number; y: number } => {
  return {
    x: (screenX - transform.translateX) / transform.scale,
    y: (screenY - transform.translateY) / transform.scale,
  };
};

const TaskCanvas: React.FC<TaskCanvasProps> = ({ tasks, onTaskEdit, onTaskDelete, projectData }) => {
  const { t } = useTranslation();
  const [taskNodes, setTaskNodes] = useState<TaskNode[]>([]);
  const [connections, setConnections] = useState<TaskConnection[]>([]);
  const [selectedNodeIds, setSelectedNodeIds] = useState<string[]>([]);
  
  // Canvas transform state
  const [transform, setTransform] = useState<CanvasTransform>({
    scale: 1,
    translateX: 0,
    translateY: 0,
  });
  
  // Panning state
  const [isPanningActive, setIsPanningActive] = useState(false);
  const lastMousePos = useRef<{ x: number; y: number } | null>(null);
  
  // Dragging state
  const draggingNode = useRef<string | null>(null);
  const offset = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Context menu state
  const [contextMenu, setContextMenu] = useState<ContextMenuState>({
    visible: false,
    x: 0,
    y: 0,
    taskId: null
  });

  

  // Keep track of the previous tasks to detect new ones
  const prevTasksRef = useRef<Task[]>([]);
  // Store node positions to preserve them across re-renders
  const nodePositionsRef = useRef<Map<string, {x: number, y: number}>>(new Map());

  // Initialize task nodes when tasks change
  useEffect(() => {
    if (tasks && tasks.length > 0) {
      // Convert tasks to task nodes with positions and sockets
      const nodes = tasks.map((task) => {
        // Create unique socket IDs for each task
        const inputSocketId = `input-${task.id}`;
        const outputSocketId = `output-${task.id}`;
        
        // Check if we have a stored position for this node
        const storedPosition = nodePositionsRef.current.get(task.id);
        
        // Use stored position if available, otherwise calculate new position only for truly new tasks
        let position;
        if (storedPosition) {
          position = storedPosition;
        } else {
          // This is a new task, find the next available grid position
          // Count how many tasks already have positions stored
          const existingPositionsCount = Array.from(nodePositionsRef.current.keys()).length;
          const gridIndex = existingPositionsCount;
          position = {
            x: 100 + (gridIndex % 3) * 420, // Use count of existing positions, not current index
            y: 100 + Math.floor(gridIndex / 3) * 250
          };
          // Store this position immediately so it's preserved
          nodePositionsRef.current.set(task.id, position);
        }
        
        return {
          ...task,
          x: position.x,
          y: position.y,
          selected: false,
          inputSocket: {
            id: inputSocketId,
            taskId: task.id,
            type: 'input' as const
          },
          outputSocket: {
            id: outputSocketId,
            taskId: task.id,
            type: 'output' as const
          }
        };
      });
      
      setTaskNodes(nodes);
      
      // Check for deleted tasks and clean up their connections
      if (prevTasksRef.current.length > 0) {
        const currentTaskIds = new Set(tasks.map(task => task.id));
        const deletedTaskIds = prevTasksRef.current
          .filter(prevTask => !currentTaskIds.has(prevTask.id))
          .map(deletedTask => deletedTask.id);
        
        if (deletedTaskIds.length > 0) {
          // Remove connections involving deleted tasks
          setConnections(prevConnections => 
            prevConnections.filter(connection => {
              // Check if this connection involves any deleted task
              const fromTask = taskNodes.find(n => n.outputSocket.id === connection.fromSocketId);
              const toTask = taskNodes.find(n => n.inputSocket.id === connection.toSocketId);
              
              // Keep connection only if both tasks still exist
              return fromTask && toTask && 
                     !deletedTaskIds.includes(fromTask.id) && 
                     !deletedTaskIds.includes(toTask.id);
            })
          );
          
          // Also clean up stored positions for deleted tasks
          deletedTaskIds.forEach(taskId => {
            nodePositionsRef.current.delete(taskId);
          });
        }
      }
      
      // Only create initial connections if this is the first time loading tasks
      if (prevTasksRef.current.length === 0 && tasks.length > 1) {
        // Create sequential connections between tasks for the initial set
        const newConnections: TaskConnection[] = [];
        for (let i = 0; i < nodes.length - 1; i++) {
          newConnections.push({
            fromSocketId: nodes[i].outputSocket.id,
            toSocketId: nodes[i + 1].inputSocket.id,
          });
        }
        
        setConnections(newConnections);
      }
      
      // Update the previous tasks reference
      prevTasksRef.current = tasks;
    }
  }, [tasks]);

  // Handle wheel event for zooming
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    
    const zoomIntensity = 0.1;
    const delta = e.deltaY < 0 ? zoomIntensity : -zoomIntensity;
    const newScale = Math.max(0.1, Math.min(2, transform.scale + delta));
    
    // Calculate zoom point in canvas coordinates
    const point = screenToCanvas(e.clientX, e.clientY, transform);
    
    // Calculate new transform
    const newTranslateX = e.clientX - point.x * newScale;
    const newTranslateY = e.clientY - point.y * newScale;
    
    setTransform({
      scale: newScale,
      translateX: newTranslateX,
      translateY: newTranslateY,
    });
  };

  // Handle panning
  const startPanning = (e: React.MouseEvent<HTMLDivElement>) => {
    setIsPanningActive(true);
    lastMousePos.current = { x: e.clientX, y: e.clientY };
  };

  const updatePanning = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isPanningActive && lastMousePos.current) {
      const deltaX = e.clientX - lastMousePos.current.x;
      const deltaY = e.clientY - lastMousePos.current.y;
      
      setTransform(prev => ({
        ...prev,
        translateX: prev.translateX + deltaX,
        translateY: prev.translateY + deltaY,
      }));
      
      lastMousePos.current = { x: e.clientX, y: e.clientY };
    }
  };

  const endPanning = () => {
    setIsPanningActive(false);
    lastMousePos.current = null;
  };

  // Handle mouse down on a node
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>, id: string) => {
    e.stopPropagation();
    draggingNode.current = id;
    const node = taskNodes.find((n) => n.id === id);
    
    if (node) {
      // Handle node selection logic with shift key for multiselect
      if (e.shiftKey) {
        // Add or remove from selection with shift key
        if (selectedNodeIds.includes(id)) {
          // Remove from selection if already selected
          setSelectedNodeIds(selectedNodeIds.filter(nodeId => nodeId !== id));
          setTaskNodes(taskNodes.map(n => n.id === id ? { ...n, selected: false } : n));
        } else {
          // Add to selection
          setSelectedNodeIds([...selectedNodeIds, id]);
          setTaskNodes(taskNodes.map(n => n.id === id ? { ...n, selected: true } : n));
        }
      } else if (!selectedNodeIds.includes(id)) {
        // Clear selection and select only this node if not already selected
        setSelectedNodeIds([id]);
        setTaskNodes(taskNodes.map(n => ({ ...n, selected: n.id === id })));
      }
      
      // Calculate offset for dragging
      const canvasCoords = screenToCanvas(e.clientX, e.clientY, transform);
      offset.current = {
        x: canvasCoords.x - node.x,
        y: canvasCoords.y - node.y,
      };
    }
  };

  // Handle mouse move for dragging nodes
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    // Handle panning if active
    updatePanning(e);
    
    // Handle node dragging
    if (draggingNode.current === null) return;
    
    // Convert screen coordinates to canvas coordinates considering zoom and pan
    const canvasCoords = screenToCanvas(e.clientX, e.clientY, transform);
    
    // Calculate the delta movement for the dragged node
    const draggedNode = taskNodes.find(n => n.id === draggingNode.current);
    if (!draggedNode) return;
    
    const deltaX = canvasCoords.x - offset.current.x - draggedNode.x;
    const deltaY = canvasCoords.y - offset.current.y - draggedNode.y;
    
    // Move all selected nodes if the dragged node is part of a selection
    const newNodes = taskNodes.map((n) => {
      // If node is selected or is the one being dragged, move it
      if ((selectedNodeIds.includes(n.id)) || n.id === draggingNode.current) {
        const newX = n.x + deltaX;
        const newY = n.y + deltaY;
        
        // Update the stored position for this node
        nodePositionsRef.current.set(n.id, { x: newX, y: newY });
        
        return {
          ...n,
          x: newX,
          y: newY,
        };
      }
      return n;
    });
    
    setTaskNodes(newNodes);
  };

  // Handle canvas mouse down event
  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.button === 0) { // Left mouse button
      // Clear node selection when clicking on empty canvas
      if (!e.shiftKey && selectedNodeIds.length > 0) {
        setSelectedNodeIds([]);
        setTaskNodes(taskNodes.map(node => ({ ...node, selected: false })));
      }
      
      startPanning(e);
      e.preventDefault();
    }
  };

  // Handle canvas mouse up
  const handleCanvasMouseUp = () => {
    // Handle panning end
    endPanning();
    
    // Handle node drag end
    draggingNode.current = null;
  };

  // Handle right-click on a task node to show context menu
  const handleContextMenu = (e: React.MouseEvent, taskId: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    setContextMenu({
      visible: true,
      x: e.clientX,
      y: e.clientY,
      taskId
    });
  };

  // Socket dragging state
  const [dragConnection, setDragConnection] = useState<{
    fromX: number;
    fromY: number;
    toX: number;
    toY: number;
    fromSocketId: string;
  } | null>(null);

  // Handle socket drag start
  const handleSocketDragStart = (e: React.MouseEvent, socketId: string, socketType: 'input' | 'output') => {
    e.stopPropagation();
    
    // Only allow dragging from output sockets or disconnecting from input sockets
    if (socketType !== 'output') {
      // For input sockets, find the connection and remove it
      const connection = connections.find(conn => conn.toSocketId === socketId);
      if (connection) {
        setConnections(connections.filter(conn => conn.toSocketId !== socketId));
      }
      return;
    }
    
    // Find the socket's position
    const task = taskNodes.find(t => t.outputSocket.id === socketId);
    if (!task) return;
    
    // Calculate socket position in canvas coordinates
    const socketX = task.x + TASK_NODE_WIDTH;
    const socketY = task.y + TASK_NODE_HEIGHT * 0.5;
    
    // Convert to screen coordinates with transform applied
    const screenX = socketX * transform.scale + transform.translateX;
    const screenY = socketY * transform.scale + transform.translateY;
    
    // Get canvas element for proper coordinate calculation
    const canvasElement = document.getElementById('task-canvas');
    if (!canvasElement) return;
    const canvasRect = canvasElement.getBoundingClientRect();
    
    // Set the initial drag connection state with proper offset calculation
    setDragConnection({
      fromX: screenX,
      fromY: screenY,
      toX: e.clientX - canvasRect.left,
      toY: e.clientY - canvasRect.top,
      fromSocketId: socketId
    });
  };

  // Handle socket drag move
  const handleSocketDragMove = (e: React.MouseEvent) => {
    if (!dragConnection) return;
    
    // Get canvas element for proper coordinate calculation
    const canvasElement = document.getElementById('task-canvas');
    if (!canvasElement) return;
    const canvasRect = canvasElement.getBoundingClientRect();
    
    // Update the connection end point to follow the mouse cursor with proper offset
    setDragConnection({
      ...dragConnection,
      toX: e.clientX - canvasRect.left,
      toY: e.clientY - canvasRect.top
    });
  };

  // Handle socket drag end
  const handleSocketDragEnd = (event: React.MouseEvent, socketId: string, socketType: 'input' | 'output') => {
    // Use event to prevent default behavior if needed
    event.stopPropagation();
    
    if (!dragConnection || socketType !== 'input') {
      setDragConnection(null);
      return;
    }
    
    // Check if we're connecting to an input socket
    const fromSocketId = dragConnection.fromSocketId;
    const toSocketId = socketId;
    
    // Don't connect a socket to itself or to a socket on the same task
    const fromTask = taskNodes.find(t => t.outputSocket.id === fromSocketId);
    const toTask = taskNodes.find(t => t.inputSocket.id === toSocketId);
    
    if (fromTask && toTask && fromTask.id !== toTask.id) {
      // Check if connection already exists
      const connectionExists = connections.some(
        conn => conn.fromSocketId === fromSocketId && conn.toSocketId === toSocketId
      );
      
      if (!connectionExists) {
        setConnections([...connections, { fromSocketId, toSocketId }]);
      }
    }
    
    setDragConnection(null);
  };

  // Handle connection creation from context menu
  const handleCreateConnection = (fromTaskId: string, toTaskId: string) => {
    // Find the tasks
    const fromTask = taskNodes.find(t => t.id === fromTaskId);
    const toTask = taskNodes.find(t => t.id === toTaskId);
    
    if (!fromTask || !toTask) return;
    
    // Check if connection already exists
    const connectionExists = connections.some(
      conn => conn.fromSocketId === fromTask.outputSocket.id && conn.toSocketId === toTask.inputSocket.id
    );
    
    if (!connectionExists) {
      setConnections([...connections, { 
        fromSocketId: fromTask.outputSocket.id, 
        toSocketId: toTask.inputSocket.id 
      }]);
    }
    
    // Close the context menu
    setContextMenu({ ...contextMenu, visible: false });
  };

  // Handle connection deletion
  const handleDeleteConnection = (fromTaskId: string, toTaskId: string) => {
    // Find the tasks
    const fromTask = taskNodes.find(t => t.id === fromTaskId);
    const toTask = taskNodes.find(t => t.id === toTaskId);
    
    if (!fromTask || !toTask) return;
    
    setConnections(
      connections.filter(
        conn => !(conn.fromSocketId === fromTask.outputSocket.id && conn.toSocketId === toTask.inputSocket.id)
      )
    );
    
    // Close the context menu
    setContextMenu({ ...contextMenu, visible: false });
  };

  // Reset view to center
  const resetView = () => {
    setTransform({
      scale: 1,
      translateX: 0,
      translateY: 0,
    });
  };

  // Zoom in
  const zoomIn = () => {
    setTransform(prev => ({
      ...prev,
      scale: Math.min(2, prev.scale + 0.1),
    }));
  };

  // Zoom out
  const zoomOut = () => {
    setTransform(prev => ({
      ...prev,
      scale: Math.max(0.1, prev.scale - 0.1),
    }));
  };

  // Create node style
  const getNodeStyle = (task: TaskNode): CSSProperties => {
    return {
      position: 'absolute',
      left: `${task.x}px`,
      top: `${task.y}px`,
      width: '300px',
      zIndex: task.selected ? 10 : 1
    };
  };

  // Create transform style
  const getTransformStyle = (): CSSProperties => {
    return {
      position: 'absolute',
      width: '100%',
      height: '100%',
      transform: `translate(${transform.translateX}px, ${transform.translateY}px) scale(${transform.scale})`,
      transformOrigin: '0 0'
    };
  };

  return (
    <div
      id="task-canvas"
      className="bg-[#121212] rounded-md h-[calc(100vh-190px)]"
      style={{
        width: "100%",
        position: "relative",
        overflow: "hidden",
        cursor: isPanningActive ? "grabbing" : "grab",
      }}
      onMouseMove={(event) => {
        // Handle both node dragging and socket connection dragging
        handleMouseMove(event);
        handleSocketDragMove(event);
      }}
      onMouseDown={handleCanvasMouseDown}
      onMouseUp={handleCanvasMouseUp}
      onWheel={handleWheel}
    >
      {/* Canvas grid background */}
      <div 
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.1) 1px, transparent 1px)',
          backgroundSize: `${20 * transform.scale}px ${20 * transform.scale}px`,
          backgroundPosition: `${transform.translateX}px ${transform.translateY}px`,
          backgroundAttachment: 'local',
          pointerEvents: 'none'
        }}
      />
      
      {/* SVG layer for connections */}
      <svg 
        id="connections-svg"
        className="absolute top-0 left-0 w-full h-full pointer-events-none"
        style={{ 
          zIndex: 5,
          overflow: "visible"
        }}
      >
        {/* Connections between tasks */}
        {connections.map(connection => {
          const fromTask = taskNodes.find(n => n.outputSocket.id === connection.fromSocketId);
          const toTask = taskNodes.find(n => n.inputSocket.id === connection.toSocketId);
          
          if (!fromTask || !toTask) return null;
          
          // Calculate socket positions
          const fromX = (fromTask.x + TASK_NODE_WIDTH) * transform.scale + transform.translateX; // Output socket (right side)
          const fromY = (fromTask.y + TASK_NODE_HEIGHT * 0.5) * transform.scale + transform.translateY; // Middle of node
          const toX = toTask.x * transform.scale + transform.translateX; // Input socket (left side)
          const toY = (toTask.y + TASK_NODE_HEIGHT * 0.5) * transform.scale + transform.translateY; // Middle of node
          
          // Generate path
          const path = generateConnectionPath(fromX, fromY, toX, toY);
          
          const isSelected = selectedNodeIds.includes(fromTask.id) || selectedNodeIds.includes(toTask.id);
          
          return (
            <path
              key={`connection-${connection.fromSocketId}-${connection.toSocketId}`}
              d={path}
              fill="none"
              stroke="#FFC72C"
              strokeWidth={isSelected ? "3" : "2"}
              
              className="transition-all duration-200"
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
            stroke="#FFC72C"
            strokeWidth="2"
            strokeDasharray="5,5"
            className="animate-pulse"
          />
        )}
      </svg>
      
      {/* Nodes container with transform */}
      <div 
        className="absolute w-full h-full"
        style={getTransformStyle()}
      >
        {taskNodes.map((task) => (
          <div
            key={task.id}
            className={`absolute bg-[#1d1d1d] rounded border ${task.selected ? 'border-[#FFC72C]' : 'border-[#FFC72C]/20'} p-4 shadow-lg cursor-move`}
            style={{
              ...getNodeStyle(task),
              width: TASK_NODE_WIDTH,
              height: 'auto'
            }}
            onMouseDown={(e) => handleMouseDown(e, task.id)}
            onContextMenu={(e) => handleContextMenu(e, task.id)}
          >
            {/* Input socket (left side) */}
            <div
              className={`absolute bg-[#1d1d1d] border-2 ${connections.some(conn => conn.toSocketId === task.inputSocket.id) ? 'border-[#FFC72C] bg-[#FFC72C]' : 'border-[#FFC72C]/50 hover:border-[#FFC72C]'}`}
              style={{
                position: 'absolute',
                width: SOCKET_SIZE,
                height: SOCKET_SIZE,
                borderRadius: '50%',
                left: 0,
                top: TASK_NODE_HEIGHT * 0.5,
                transform: 'translate(-50%, -50%)',
                cursor: connections.some(conn => conn.toSocketId === task.inputSocket.id) ? 'grab' : 'pointer',
                zIndex: 20
              } as CSSProperties}
              onMouseUp={(event) => {
                handleSocketDragEnd(event, task.inputSocket.id, 'input');
              }}
              onMouseDown={(event) => {
                handleSocketDragStart(event, task.inputSocket.id, 'input');
                event.stopPropagation();
                event.preventDefault();
              }}
            />
            
            {/* Output socket (right side) */}
            <div
              className={`absolute bg-[#1d1d1d] border-2 ${connections.some(conn => conn.fromSocketId === task.outputSocket.id) ? 'border-[#FFC72C] bg-[#FFC72C]' : 'border-[#FFC72C]/50 hover:border-[#FFC72C]'}`}
              style={{
                position: 'absolute',
                width: SOCKET_SIZE,
                height: SOCKET_SIZE,
                borderRadius: '50%',
                right: 0,
                top: TASK_NODE_HEIGHT * 0.5,
                transform: 'translate(50%, -50%)',
                cursor: 'pointer',
                zIndex: 20
              } as CSSProperties}
              onMouseDown={(event) => {
                handleSocketDragStart(event, task.outputSocket.id, 'output');
                event.stopPropagation();
                event.preventDefault();
              }}
            />
            <div className="flex justify-between items-start mb-2">
              <div className="flex flex-col">
                <div className="flex items-center justify-start gap-2">
                  <h3 className="font-medium text-white text-lg truncate">{task.name}</h3>
                  {task.executeWorkflow ? (
                    <span className="bg-purple-600/20 text-purple-400 text-xs px-2 py-0.5 rounded-full border border-purple-600/30">
                      {t('projects.workflow', 'Workflow')}
                    </span>
                  ) : (
                    <span className="bg-[#FFC72C]/20 text-[#FFC72C] text-xs px-2 mx-1 py-0.5 rounded-full border border-[#FFC72C]/30">
                      {t('projects.agent', 'Agent')}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                <button 
                  className="text-[#FFC72C] hover:text-[#FFD666] p-1"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onTaskEdit) onTaskEdit(task.id);
                  }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>
                </button>
                <button 
                  className="text-red-400 hover:text-red-300 p-1"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onTaskDelete) onTaskDelete(task.id);
                  }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  </svg>
                </button>
              </div>
            </div>
            <p className="text-gray-300 mb-3 line-clamp-2">{task.description}</p>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-400 block">{t('projects.expectedOutput', 'Expected Output')}:</span>
                <span className="text-gray-300 line-clamp-1">{task.expectedOutput || t('projects.none', 'None')}</span>
              </div>
              <div>
                {task.executeWorkflow ? (
                  <>
                    <span className="text-gray-400 block">{t('projects.workflow', 'Workflow')}:</span>
                    <span className="text-purple-400 line-clamp-1">
                      {task.workflowName || 
                       (projectData?.workflows && projectData.workflows.find(w => w.id === task.workflowId)?.name) ||
                       t('projects.unknownWorkflow', 'Unknown workflow')}
                    </span>
                  </>
                ) : (
                  <>
                    <span className="text-gray-400 block">{t('projects.assignedAgent', 'Assigned Agent')}:</span>
                    <span className="text-[#FFC72C] line-clamp-1">
                      {task.assignedAgent ? 
                        (projectData?.agents.find(a => a.id === task.assignedAgent)?.name || task.assignedAgent) : 
                        t('projects.autoAssign', 'Auto-assign')}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {/* Zoom Controls UI */}
      <div className="absolute bottom-5 right-5 flex flex-col gap-2 bg-[#111] p-2 rounded-md backdrop-blur-sm border border-gray-800">
        <button 
          className="bg-[#FFC72C]/30 hover:bg-[#FFC72C]/50 transition-colors duration-200 text-white p-2 rounded-md flex items-center justify-center w-10 h-10"
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
          className="bg-[#FFC72C]/30 hover:bg-[#FFC72C]/50 transition-colors duration-200 text-white p-2 rounded-md flex items-center justify-center w-10 h-10"
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
          className="bg-[#FFC72C]/30 hover:bg-[#FFC72C]/50 transition-colors duration-200 text-white p-2 rounded-md flex items-center justify-center w-10 h-10"
          onClick={resetView}
          title="Reset View"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
          </svg>
        </button>
      </div>
      
      {/* Scale indicator */}
      <div className="absolute bottom-5 left-5 text-white text-xs bg-[#FFC72C]/30 px-2 py-1 rounded backdrop-blur-sm">
        {Math.round(transform.scale * 100)}%
      </div>
      
      {/* Context menu for connections */}
      {contextMenu.visible && contextMenu.taskId && (
        <div 
          className="fixed bg-[#1d1d1d] border border-gray-800 rounded-md shadow-lg z-50 py-1 w-48"
          style={{
            position: 'fixed',
            left: `${contextMenu.x}px`,
            top: `${contextMenu.y}px`
          } as CSSProperties}
        >
          <div className="px-3 py-1 text-xs text-gray-400 border-b border-gray-800">
            {t('projects.connectToTask', 'Connect to task')}
          </div>
          {taskNodes
            .filter(node => node.id !== contextMenu.taskId) // Don't show the current task
            .map(task => (
              <button
                key={task.id}
                className="w-full text-left px-3 py-2 text-sm text-white hover:bg-[#FFC72C]/30 transition-colors"
                onClick={() => handleCreateConnection(contextMenu.taskId || '', task.id)}
              >
                {task.name}
              </button>
            ))}
          
          {/* Show existing connections that can be deleted */}
          {connections.filter(conn => {
            const fromTask = taskNodes.find(t => t.outputSocket.id === conn.fromSocketId);
            const toTask = taskNodes.find(t => t.inputSocket.id === conn.toSocketId);
            return (fromTask?.id === contextMenu.taskId || toTask?.id === contextMenu.taskId);
          }).length > 0 && (
            <>
              <div className="border-t border-gray-800 my-1"></div>
              <div className="px-3 py-1 text-xs text-gray-400 border-b border-gray-800">
                {t('projects.removeConnection', 'Remove connection')}
              </div>
              {connections
                .filter(conn => {
                  const fromTask = taskNodes.find(t => t.outputSocket.id === conn.fromSocketId);
                  const toTask = taskNodes.find(t => t.inputSocket.id === conn.toSocketId);
                  return (fromTask?.id === contextMenu.taskId || toTask?.id === contextMenu.taskId);
                })
                .map(conn => {
                  const fromTask = taskNodes.find(t => t.outputSocket.id === conn.fromSocketId);
                  const toTask = taskNodes.find(t => t.inputSocket.id === conn.toSocketId);
                  
                  const connectedTaskId = fromTask?.id === contextMenu.taskId ? toTask?.id : fromTask?.id;
                  const connectedTask = taskNodes.find(n => n.id === connectedTaskId);
                  
                  return (
                    <button
                      key={`${conn.fromSocketId}-${conn.toSocketId}`}
                      className="w-full text-left px-3 py-2 text-sm text-white hover:bg-red-600/30 transition-colors flex items-center"
                      onClick={() => {
                        if (fromTask && toTask) {
                          handleDeleteConnection(fromTask.id, toTask.id);
                        }
                      }}
                    >
                      <span className="text-red-400 mr-2">×</span>
                      {connectedTask?.name || 'Unknown task'}
                    </button>
                  );
                })}
            </>
          )}
          
          {/* Close button */}
          <div className="border-t border-gray-800 my-1"></div>
          <button
            className="w-full text-left px-3 py-2 text-sm text-gray-400 hover:bg-gray-800 transition-colors"
            onClick={() => setContextMenu({ ...contextMenu, visible: false })}
          >
            {t('common.cancel', 'Cancel')}
          </button>
        </div>
      )}
      
      {/* Click outside to close context menu */}
      {contextMenu.visible && (
        <div 
          className="fixed inset-0 z-40"
          onClick={() => setContextMenu({ ...contextMenu, visible: false })}
        />
      )}
      
      
    </div>
  );
};

export default TaskCanvas;
