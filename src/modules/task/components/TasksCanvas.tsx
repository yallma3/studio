import React, { useRef, useState, useCallback, useEffect } from "react";
import { Task, Trigger } from "../types/types";
import TaskNode from "./TaskNode";
import TriggerNode from "./trigger/TriggerNode";
import ContextMenu, { type ContextMenuItem } from "./ContextMenu";
import {
  MinusIcon,
  Edit,
  Fullscreen,
  Maximize2Icon,
  Plus,
  Trash2,
  Power
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { TaskConnection } from "../types/types";

interface TasksCanvasProps {
  tasks?: Task[];
  connections?: TaskConnection[];
  trigger?: Trigger | null;
  triggerPosition?: { x: number; y: number };
  onTriggerPositionChange?: (position: { x: number; y: number }) => void;
  onTriggerEdit?: () => void;
  onTriggerDelete?: () => void; 
  onTriggerToggle?: (enabled: boolean) => void; 
  onTaskPositionChange?: (
    taskId: string,
    position: { x: number; y: number }
  ) => void;
  onConnectionCreate?: (connection: TaskConnection) => void;
  onConnectionRemove?: (connection: TaskConnection) => void;
  onTaskEdit?: (task: Task) => void;
  onTaskDelete?: (taskId: string) => void;
  onTaskAdd?: (position: { x: number; y: number }) => void;
  onAddTaskButtonClick?: () => void;
}

interface ViewportState {
  x: number;
  y: number;
  zoom: number;
}

const TasksCanvas: React.FC<TasksCanvasProps> = ({
  tasks = [],
  connections = [],
  trigger,
  triggerPosition = { x: 100, y: 100 },
  onTriggerPositionChange,
  onTriggerEdit,
  onTriggerDelete, 
  onTriggerToggle, 
  onTaskPositionChange,
  onConnectionCreate,
  onConnectionRemove,
  onTaskEdit,
  onTaskDelete,
  onTaskAdd,
  onAddTaskButtonClick,
}) => {
  const { t } = useTranslation();
  const canvasRef = useRef<HTMLDivElement>(null);
  const [viewport, setViewport] = useState<ViewportState>({
    x: 50, // Start with a small offset to show tasks
    y: 50,
    zoom: 1,
  });

  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionStart, setConnectionStart] = useState<{
    socketId: number;
    position: { x: number; y: number };
    isOutput: boolean;
  } | null>(null);
  const [tempConnectionEnd, setTempConnectionEnd] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [isProcessingConnection, setIsProcessingConnection] = useState(false);

  // Context menu state
  const [isContextMenuOpen, setIsContextMenuOpen] = useState(false);
  const [contextMenuPosition, setContextMenuPosition] = useState({
    x: 0,
    y: 0,
  });
  const [contextMenuItems, setContextMenuItems] = useState<ContextMenuItem[]>(
    []
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      // Only start canvas dragging if clicking directly on the canvas background
      // Check if we're not clicking on a task node
      const target = e.target as HTMLElement;
      const isTaskNode = target.closest("[data-task-node]");

      if (
        !isTaskNode &&
        (e.target === canvasRef.current ||
          target.closest("[data-canvas-container]"))
      ) {
        setIsDragging(true);
        setDragStart({ x: e.clientX - viewport.x, y: e.clientY - viewport.y });
      }
    },
    [viewport]
  );

  const handleTaskPositionChange = useCallback(
    (taskId: string, position: { x: number; y: number }) => {
       // Position is already in the correct coordinate space (relative to transform container)
      onTaskPositionChange?.(taskId, position);
    },
    [onTaskPositionChange]
  );
  const getSocketPosition = useCallback(
  (socketId: number): { x: number; y: number } | null => {
    const SOCKET_Y_OFFSET = 140;
    if (socketId === 9999 && triggerPosition && trigger) {
      let SOCKET_Y_OFFSET_Trigger = 115;   
      if (trigger.type === 'webhook') {
        if (trigger.config.webhookUrl) {
          SOCKET_Y_OFFSET_Trigger = 150; 
        } else {
          SOCKET_Y_OFFSET_Trigger = 115; 
        }
      } else if (trigger.type === 'manual') {
        SOCKET_Y_OFFSET_Trigger = 100; 
      } else if (trigger.type === 'scheduled') {
        SOCKET_Y_OFFSET_Trigger = 100; 
      }
      return {
        x: triggerPosition.x + 416,
        y: triggerPosition.y + SOCKET_Y_OFFSET_Trigger,
      };
    }
    const task = tasks.find((t) => t.sockets.some((s) => s.id === socketId));
    if (!task) return null;

    const socket = task.sockets.find((s) => s.id === socketId);
    if (!socket) return null;

          // Calculate socket position based on task position and socket type
    const taskX = task.position.x;
    const taskY = task.position.y;


    if (socket.type === "input") {
      return { x: taskX, y: taskY + SOCKET_Y_OFFSET };
    } else {
      return { x: taskX + 416, y: taskY + SOCKET_Y_OFFSET };
    }
  },
  [tasks, triggerPosition, trigger]
);

  const handleSocketMouseDown = useCallback(
    (
      socketId: number,
      position: { x: number; y: number },
      isOutput: boolean
    ) => {
      if (isOutput) {
        // Starting connection from output socket
        setIsConnecting(true);
        setConnectionStart({ socketId, position, isOutput: true });
        setTempConnectionEnd(position);
      } else {
                // Starting from input socket - check if there's an existing connection
        const existingConn = connections.find(
          (conn) => conn.toSocket === socketId
        );

        if (existingConn) {
          // Remove the existing connection and start a new one from the original output
          const outputSocketPos = getSocketPosition(existingConn.fromSocket);

          if (outputSocketPos && onConnectionRemove) {
            onConnectionRemove(existingConn);
            setIsConnecting(true);
            setConnectionStart({
              socketId: existingConn.fromSocket,
              position: outputSocketPos,
              isOutput: true,
            });
            setTempConnectionEnd(position);
          }
        }
      }
    },
    [connections, getSocketPosition, onConnectionRemove]
  );

  const handleSocketMouseUp = useCallback(
    (socketId: number, isInput: boolean) => {
      if (isConnecting && connectionStart) {
        setIsProcessingConnection(true);

        if (isInput && connectionStart.isOutput) {
           // Create connection from output to input
          const connection: TaskConnection = {
            fromSocket: connectionStart.socketId,
            toSocket: socketId,
          };
          const alreadyExists = connections.some(
            (c) =>
              c.fromSocket === connection.fromSocket &&
              c.toSocket === connection.toSocket
          );
          if (!alreadyExists) {
            onConnectionCreate?.(connection);
          }
        } else if (!isInput && !connectionStart.isOutput) {
          // Reconnecting from input to output (reverse direction)
          const connection: TaskConnection = {
            fromSocket: socketId,
            toSocket: connectionStart.socketId,
          };
          const alreadyExists = connections.some(
            (c) =>
              c.fromSocket === connection.fromSocket &&
              c.toSocket === connection.toSocket
          );
          if (!alreadyExists) {
            onConnectionCreate?.(connection);
          }
        }

         // Reset connection state
        setIsConnecting(false);
        setConnectionStart(null);
        setTempConnectionEnd(null);

          // Reset processing flag after a brief delay
        setTimeout(() => setIsProcessingConnection(false), 50);
      }
    },
    [isConnecting, connectionStart, onConnectionCreate, connections]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (isDragging) {
        setViewport((prev) => ({
          ...prev,
          x: e.clientX - dragStart.x,
          y: e.clientY - dragStart.y,
        }));
      } else if (isConnecting && connectionStart) {
         // Update temporary connection end position
        const transformContainer = document.querySelector(
          "[data-transform-container]"
        );
        if (transformContainer) {
          const containerRect = transformContainer.getBoundingClientRect();
          setTempConnectionEnd({
            x: (e.clientX - containerRect.left) / viewport.zoom,
            y: (e.clientY - containerRect.top) / viewport.zoom,
          });
        }
      }
    },
    [isDragging, dragStart, isConnecting, connectionStart, viewport.zoom]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);

    // Cancel connection if we're connecting but didn't hit a valid target
    // Don't cancel if we're currently processing a socket connection
    if (isConnecting && !isProcessingConnection) {
    // Use a small timeout to allow socket mouseUp to fire first
      setTimeout(() => {
    // Double-check we're still connecting and not processing
        if (isConnecting && !isProcessingConnection) {
          // If we were reconnecting from an input and didn't connect to anything,
          // don't restore the original connection - just remove it
          // (The connection was already removed when we started dragging)

          setIsConnecting(false);
          setConnectionStart(null);
          setTempConnectionEnd(null);
          // connection cancelled; nothing else to reset here
        }
      }, 10);
    }
  }, [isConnecting, isProcessingConnection]);

  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      e.preventDefault();

      const delta = e.deltaY > 0 ? 0.9 : 1.1;
      const newZoom = Math.max(0.1, Math.min(3, viewport.zoom * delta));

      if (newZoom === viewport.zoom) return; // No change needed

            // Get mouse position relative to canvas
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;

      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

            // Calculate zoom center point
      const zoomFactor = newZoom / viewport.zoom;
      const newX = mouseX - (mouseX - viewport.x) * zoomFactor;
      const newY = mouseY - (mouseY - viewport.y) * zoomFactor;

      setViewport({
        x: newX,
        y: newY,
        zoom: newZoom,
      });
    },
    [viewport]
  );

  const renderConnection = useCallback(
    (
      start: { x: number; y: number },
      end: { x: number; y: number },
      isTemp = false,
      key?: string
    ) => {
      const dx = end.x - start.x;

         // Create a curved path using cubic bezier
      const controlPointOffset = Math.max(Math.abs(dx) * 0.5, 100);
      const cp1x = start.x + controlPointOffset;
      const cp1y = start.y;
      const cp2x = end.x - controlPointOffset;
      const cp2y = end.y;

      const pathData = `M ${start.x} ${start.y} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${end.x} ${end.y}`;

      return (
        <path
          key={key || (isTemp ? "temp" : `${start.x}-${start.y}-${end.x}-${end.y}`)}
          d={pathData}
          stroke={isTemp ? "#FFC72C88" : "#FFC72C"}
          strokeWidth="2"
          fill="none"
          strokeDasharray={isTemp ? "5,5" : "none"}
          opacity={isTemp ? 0.7 : 1}
        />
      );
    },
    []
  );

  const fitToView = useCallback(() => {
    const positions = tasks.map((task) => task.position);
    if (triggerPosition && trigger) {
      positions.push(triggerPosition);
    }

    if (positions.length === 0) return;

    const minX = Math.min(...positions.map((p) => p.x)) - 100;
    const maxX = Math.max(...positions.map((p) => p.x)) + 550;
    const minY = Math.min(...positions.map((p) => p.y)) - 100;
    const maxY = Math.max(...positions.map((p) => p.y)) + 450;

    const contentWidth = maxX - minX;
    const contentHeight = maxY - minY;

        // Get canvas dimensions
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

        // Calculate zoom to fit content with some padding
    const zoomX = (rect.width * 0.9) / contentWidth;
    const zoomY = (rect.height * 0.9) / contentHeight;
    const fitZoom = Math.min(zoomX, zoomY, 1);// Don't zoom in beyond 100%

        // Center the content
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;
    const viewportCenterX = rect.width / 2;
    const viewportCenterY = rect.height / 2;

    setViewport({
      x: viewportCenterX - centerX * fitZoom,
      y: viewportCenterY - centerY * fitZoom,
      zoom: fitZoom,
    });
  }, [tasks, triggerPosition, trigger]);

// Fit to view on mount and when tasks change
useEffect(() => {
  if (tasks.length > 0 || trigger) {
    fitToView();
  }
}, [tasks.length, trigger, fitToView]);

  const handleCanvasContextMenu = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      const target = e.target as HTMLElement;
      if (target.closest("[data-task-node]")) return;

      const addTask = () => {
        const transformContainer = document.querySelector(
          "[data-transform-container]"
        ) as HTMLElement | null;
        if (!transformContainer) return;
        const rect = transformContainer.getBoundingClientRect();
        const x = (e.clientX - rect.left) / viewport.zoom;
        const y = (e.clientY - rect.top) / viewport.zoom;
        onTaskAdd?.({ x, y });
      };

      const items: ContextMenuItem[] = [
        {
          label: t("tasksCanvas.addTask", "Add Task"),
          onClick: addTask,
          icon: <Plus size={16} className="text-[#FFC72C]" />,
        },
        {
          label: t("tasksCanvas.fitToView", "Fit To View"),
          onClick: () => fitToView(),
          icon: <Fullscreen size={16} className="text-[#FFC72C]" />,
        },
      ];

      setContextMenuItems(items);
      setContextMenuPosition({ x: e.clientX, y: e.clientY });
      setIsContextMenuOpen(true);
    },
    [fitToView, onTaskAdd, viewport.zoom, t]
  );
  const handleTriggerContextMenu = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();

      const items: ContextMenuItem[] = [
        {
          label: t("common.edit", "Edit Trigger"),
          onClick: () => onTriggerEdit?.(),
          icon: <Edit size={16} className="text-[#FFC72C]" />,
        },
      ];

      // ✅ Add toggle option if handler exists
      if (onTriggerToggle && trigger) {
        items.push({
          label: trigger.enabled 
            ? t("trigger.disable", "Disable Trigger")
            : t("trigger.enable", "Enable Trigger"),
          onClick: () => onTriggerToggle?.(!trigger.enabled),
          icon: <Power size={16} className={trigger.enabled ? "text-orange-400" : "text-green-400"} />,
        });
      }

      if (onTriggerDelete) {
        items.push({
          label: t("common.delete", "Delete Trigger"),
          onClick: () => {
            if (window.confirm(t("trigger.confirmDelete", "Are you sure you want to delete this trigger?"))) {
              onTriggerDelete?.();
            }
          },
          icon: <Trash2 size={16} className="text-[#FF6B6B]" />,
        });
      }

      setContextMenuItems(items);
      setContextMenuPosition({ x: e.clientX, y: e.clientY });
      setIsContextMenuOpen(true);
    },
    [trigger, onTriggerEdit, onTriggerToggle, onTriggerDelete, t]
  );

  return (
    <div className="relative w-full h-full overflow-hidden bg-black/98">
      {/* Dotted Background */}
      <div
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage: `radial-gradient(circle, #9ca3af 1px, transparent 1px)`,
          backgroundSize: `${30 * viewport.zoom}px ${30 * viewport.zoom}px`,
          backgroundPosition: `${viewport.x}px ${viewport.y}px`,
        }}
      />

      {/* Canvas Container */}
      <div
        ref={canvasRef}
        data-canvas-container
        className="absolute inset-0 cursor-grab active:cursor-grabbing"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        onContextMenu={handleCanvasContextMenu}
        style={{
          cursor: isDragging ? "grabbing" : "grab",
        }}
      >
        {/* Connections SVG Layer - Outside transform container to avoid clipping */}
        <svg
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            pointerEvents: "none",
            zIndex: 5,
          }}
        >
          <g
            style={{
              transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})`,
              transformOrigin: "0 0",
            }}
          >
            {/* Render all connections */}
            {connections.map((connection) => {
              const startPos = getSocketPosition(connection.fromSocket);
              const endPos = getSocketPosition(connection.toSocket);

              if (startPos && endPos) {
                return renderConnection(
                  startPos,
                  endPos,
                  false,
                  `conn-${connection.fromSocket}-${connection.toSocket}`
                );
              }
              return null;
            })}

            {/* Render temporary connection while dragging */}
            {isConnecting &&
              connectionStart &&
              tempConnectionEnd &&
              renderConnection(
                connectionStart.isOutput
                  ? connectionStart.position
                  : tempConnectionEnd,
                connectionStart.isOutput
                  ? tempConnectionEnd
                  : connectionStart.position,
                true
              )}
          </g>
        </svg>

        {/* Viewport Transform Container */}
        <div
          data-transform-container
          style={{
            transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})`,
            transformOrigin: "0 0",
            position: "absolute",
            width: "100%",
            height: "100%",
          }}
        >
          {/* Trigger Node */}
          {trigger && (
            <div
              data-task-node
              className="absolute pointer-events-auto"
              style={{
                left: triggerPosition.x,
                top: triggerPosition.y,
                zIndex: 20,
              }}
              onContextMenu={handleTriggerContextMenu}
            >
              <TriggerNode
                trigger={trigger}
                position={triggerPosition}
                onEdit={() => onTriggerEdit?.()}
                onPositionChange={onTriggerPositionChange || (() => {})}
                onSocketMouseDown={handleSocketMouseDown}
                onSocketMouseUp={handleSocketMouseUp}
              />
            </div>
          )}

          {/* Task Nodes */}
          {tasks.map((task) => {
          const x = task.position.x || 0; 
          const y = task.position.y || 0; 

            return (
              <div
                key={task.id}
                data-task-node
                className="absolute"
                style={{
                  left: x,
                  top: y,
                  pointerEvents: "auto",
                  zIndex: 10,
                }}
                onContextMenu={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  const items: ContextMenuItem[] = [
                    {
                      label: t("common.edit", "Edit"),
                      onClick: () => onTaskEdit?.(task),
                      icon: <Edit size={16} className="text-[#FFC72C]" />,
                    },
                    {
                      label: t("common.delete", "Delete"),
                      onClick: () => onTaskDelete?.(task.id),
                      icon: <Trash2 size={16} className="text-[#FF6B6B]" />,
                    },
                  ];
                  setContextMenuItems(items);
                  setContextMenuPosition({ x: e.clientX, y: e.clientY });
                  setIsContextMenuOpen(true);
                }}
              >
                <TaskNode
                  task={task}
                  connections={connections}
                  onPositionChange={handleTaskPositionChange}
                  onSocketMouseDown={handleSocketMouseDown}
                  onSocketMouseUp={handleSocketMouseUp}
                  onEdit={onTaskEdit}
                  onDelete={onTaskDelete}
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* Add Task Button */}
      <div className="fixed top-32 right-6 ">
        <button
          className="flex gap-1 items-center rounded-lg bg-yellow-500/90 px-4 py-2 text-sm font-medium text-black transition-colors hover:bg-yellow-500"
          onClick={onAddTaskButtonClick}
        >
          <Plus className="w-4" /> Add Task
        </button>
      </div>
      {/* Zoom Controls */}
      <div className="fixed bottom-6 left-6 flex items-center gap-2">
        <button
          id="tasks-canvas-zoom-out-button"
          onClick={() =>
            setViewport((prev) => ({
              ...prev,
              zoom: Math.max(0.1, prev.zoom * 0.8),
            }))
          }
          className="flex h-10 w-10 items-center justify-center rounded-lg border border-yellow-600/30 bg-zinc-900/90 text-yellow-500 backdrop-blur-sm transition-all hover:border-yellow-500/50 hover:bg-zinc-800"
          aria-label="Zoom out"
        >
          <MinusIcon className="h-4 w-4" />
        </button>
        <button
          id="tasks-canvas-zoom-in-button"
          onClick={() =>
            setViewport((prev) => ({
              ...prev,
              zoom: Math.min(3, prev.zoom * 1.2),
            }))
          }
          className="flex h-10 w-10 items-center justify-center rounded-lg border border-yellow-600/30 bg-zinc-900/90 text-yellow-500 backdrop-blur-sm transition-all hover:border-yellow-500/50 hover:bg-zinc-800"
          aria-label="Zoom in"
        >
          <Plus className="h-4 w-4" />
        </button>
        <button
          id="tasks-canvas-fit-to-view-button"
          onClick={fitToView}
          className="flex h-10 w-10 items-center justify-center rounded-lg border border-yellow-600/30 bg-zinc-900/90 text-yellow-500 backdrop-blur-sm transition-all hover:border-yellow-500/50 hover:bg-zinc-800"
          aria-label="Fit to screen"
        >
          <Maximize2Icon className="h-4 w-4" />
        </button>
      </div>

      {/* Zoom Indicator */}
      <div className="fixed bottom-6 right-6 rounded-lg border border-yellow-600/30 bg-zinc-900/90 px-4 py-2 text-sm font-medium text-yellow-500/90 backdrop-blur-sm">
        {t("tasksCanvas.zoom", "Zoom")}: {Math.round(viewport.zoom * 100)}%
      </div>

      {/* Context Menu */}
      <ContextMenu
        isOpen={isContextMenuOpen}
        position={contextMenuPosition}
        items={contextMenuItems}
        onClose={() => setIsContextMenuOpen(false)}
      />
    </div>
  );
};

export default TasksCanvas;
