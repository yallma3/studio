import React, { useState, useCallback } from "react";
import { Task, TaskConnection } from "../types/types";
import { Edit } from "lucide-react";
import { useTranslation } from "react-i18next";

interface TaskNodeProps {
  task: Task;
  connections?: TaskConnection[];
  onPositionChange?: (
    taskId: string,
    position: { x: number; y: number }
  ) => void;
  onSocketMouseDown?: (
    socketId: number,
    position: { x: number; y: number },
    isOutput: boolean
  ) => void;
  onSocketMouseUp?: (socketId: number, isInput: boolean) => void;
  onEdit?: (task: Task) => void;
  onDelete?: (taskId: string) => void;
}

const TaskNode: React.FC<TaskNodeProps> = ({
  task,
  connections = [],
  onPositionChange,
  onSocketMouseDown,
  onSocketMouseUp,
  onEdit,
}) => {
  const { t } = useTranslation();
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [initialPosition, setInitialPosition] = useState({ x: 0, y: 0 });

  const inputSockets = task.sockets.filter((socket) => socket.type === "input");
  const outputSockets = task.sockets.filter(
    (socket) => socket.type === "output"
  );

  // Determine which sockets are connected
  const connectedInputSocketIds = new Set(
    connections
      .filter((c) => typeof c.toSocket === "number")
      .map((c) => c.toSocket)
  );
  const connectedOutputSocketIds = new Set(
    connections
      .filter((c) => typeof c.fromSocket === "number")
      .map((c) => c.fromSocket)
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      // Only start dragging if clicking on the main content area, not sockets
      if ((e.target as HTMLElement).closest(".socket")) return;

      e.stopPropagation(); // Prevent canvas panning
      setIsDragging(true);

      // Store the mouse position when drag starts
      setDragStart({
        x: e.clientX,
        y: e.clientY,
      });

      // Store the current task position
      setInitialPosition({
        x: task.position.x,
        y: task.position.y,
      });
    },
    [task.position]
  );

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging || !onPositionChange) return;

      e.preventDefault();

      // Calculate the delta from the initial drag position
      const deltaX = e.clientX - dragStart.x;
      const deltaY = e.clientY - dragStart.y;

      // Get current viewport state from the canvas
      const canvas = document.querySelector("[data-canvas-container]");
      if (!canvas) return;

      // Get the zoom level from the transform container
      const transformContainer = document.querySelector(
        "[data-transform-container]"
      );
      if (!transformContainer) return;

      const transform = window.getComputedStyle(transformContainer).transform;
      let zoom = 1;

      if (transform && transform !== "none") {
        const matrix = transform.match(/matrix\(([^)]+)\)/);
        if (matrix) {
          const values = matrix[1].split(",").map(parseFloat);
          zoom = values[0]; // scaleX value
        }
      }

      // Calculate new position accounting for zoom
      const newX = initialPosition.x + deltaX / zoom;
      const newY = initialPosition.y + deltaY / zoom;

      onPositionChange(task.id, { x: newX, y: newY });
    },
    [isDragging, dragStart, initialPosition, task.id, onPositionChange]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Add global mouse event listeners when dragging
  React.useEffect(() => {
    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);

      return () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  const handleSocketMouseDown = useCallback(
    (e: React.MouseEvent, socketId: number, isOutput: boolean) => {
      e.stopPropagation();

      if (onSocketMouseDown) {
        // Get socket position relative to the transform container
        const transformContainer = document.querySelector(
          "[data-transform-container]"
        );
        if (transformContainer) {
          const containerRect = transformContainer.getBoundingClientRect();
          const socketRect = (
            e.currentTarget as HTMLElement
          ).getBoundingClientRect();

          // Calculate position relative to the transform container
          const position = {
            x: socketRect.left + socketRect.width / 2 - containerRect.left,
            y: socketRect.top + socketRect.height / 2 - containerRect.top,
          };

          // Get current zoom level
          const transform =
            window.getComputedStyle(transformContainer).transform;
          let zoom = 1;
          if (transform && transform !== "none") {
            const matrix = transform.match(/matrix\(([^)]+)\)/);
            if (matrix) {
              const values = matrix[1].split(",").map(parseFloat);
              zoom = values[0];
            }
          }

          // Adjust position for zoom
          const adjustedPosition = {
            x: position.x / zoom,
            y: position.y / zoom,
          };

          onSocketMouseDown(socketId, adjustedPosition, isOutput);
        }
      }
    },
    [onSocketMouseDown]
  );

  const handleSocketMouseUp = useCallback(
    (e: React.MouseEvent, socketId: number, isInput: boolean) => {
      e.stopPropagation();
      onSocketMouseUp?.(socketId, isInput);
    },
    [onSocketMouseUp]
  );

  return (
    <div
      className={`flex flex-col text-white rounded-md bg-black hover:bg-[#111] relative border transition-colors duration-200 w-104 h-70 ${
        task.selected
          ? "border-[#FFC72C] shadow-[0_0_10px_rgba(255,199,44,0.6)]"
          : "border-gray-600"
      } ${isDragging ? "cursor-grabbing" : "cursor-grab"} select-none group`}
      onMouseDown={handleMouseDown}
    >
      {/* Input Sockets - Left Side */}
      <div className="absolute left-0 top-0 h-full flex flex-col justify-center space-y-3 -ml-2">
        {inputSockets.map((socket) => (
          <div
            key={socket.id}
            data-socket-id={socket.id}
            className={`socket w-4 h-4 bg-[#111] rounded-full border-2 shadow-sm relative cursor-pointer ${
              connectedInputSocketIds.has(socket.id)
                ? "border-[#FFC72C] bg-[#FFC72C]"
                : "border-[#FFB30088] hover:border-[#FFB300]"
            }`}
            title={socket.title}
            onMouseDown={(e) => handleSocketMouseDown(e, socket.id, false)}
            onMouseUp={(e) => handleSocketMouseUp(e, socket.id, true)}
          />
        ))}
      </div>

      {/* Output Sockets - Right Side */}
      <div className="absolute right-0 top-0 h-full flex flex-col justify-center space-y-3 -mr-2">
        {outputSockets.map((socket) => (
          <div
            key={socket.id}
            data-socket-id={socket.id}
            className={`socket w-4 h-4 bg-[#111] rounded-full border-2 shadow-sm relative cursor-pointer ${
              connectedOutputSocketIds.has(socket.id)
                ? "border-[#FFC72C] bg-[#FFC72C]"
                : "border-[#FFB30088] hover:border-[#FFB300]"
            }`}
            title={socket.title}
            onMouseDown={(e) => handleSocketMouseDown(e, socket.id, true)}
            onMouseUp={(e) => handleSocketMouseUp(e, socket.id, false)}
          />
        ))}
      </div>

      {/* Header */}
      <div
        className={`${
          task.selected ? "bg-[#FFC72C]/30" : "bg-[#FFC72C]/20"
        } border-b border-[#FFC72C]/30 rounded-t-md px-4 py-3`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div
              className={`w-2.5 h-2.5 rounded-full bg-[#FFC72C] ${
                task.selected
                  ? "shadow-[0_0_15px_rgba(255,199,44,0.9)]"
                  : "shadow-[0_0_10px_rgba(255,199,44,0.7)]"
              }`}
            />
            <h3 className="font-bold text-sm text-white leading-tight">
              {task.title}
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-[#FFC72C]/80 uppercase font-mono">
              {task.type}
            </span>
            <button
              onMouseDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                if (typeof onEdit === "function") {
                  onEdit(task);
                }
              }}
              title={t("taskNode.editTask", "Edit Task")}
            >
              <Edit className="w-4 text-[#FFC72C]/80 hover:text-[#FFC72C] cursor-pointer" />
            </button>
          </div>
        </div>
      </div>

      {/* Task Content */}
      <div className="p-4">
        {/* Description */}
        {task.description && (
          <div className="mb-3">
            <p className="text-sm text-[#FFC72C] font-mono bg-[#FFC72C11] p-2 rounded leading-relaxed">
              {task.description.slice(0, 120)}
              {task.description.length > 120 ? "..." : ""}
            </p>
          </div>
        )}

        {/* Expected Output */}
        {task.expectedOutput && (
          <div className="mb-2">
            <h4 className="text-xs font-medium text-[#FFC72C]/80 mb-1">
              {t("taskNode.expectedOutput", "Expected Output")}:
            </h4>
            <p className="text-sm text-[#FFC72C] font-mono bg-[#FFC72C11] p-2 rounded border border-[#FFC72C33] line-clamp-1">
              {task.expectedOutput.slice(0, 75)}
              {task.expectedOutput.length > 75 ? "..." : ""}
            </p>
          </div>
        )}

        {/* Executor Info */}
        {task.executorId && (
          <div className="text-xs text-[#FFC72C66] font-mono">
            {t("taskNode.executor", "Executor")}: {task.executorId}
          </div>
        )}
      </div>
    </div>
  );
};

export default TaskNode;
