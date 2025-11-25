/*
* yaLLMa3 - Framework for building AI agents that are capable of learning from their environment and interacting with it.
 
 * Copyright (C) 2025 yaLLMa3
 
 * This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0.
   If a copy of the MPL was not distributed with this file, You can obtain one at https://www.mozilla.org/MPL/2.0/.
 
 * This software is distributed on an "AS IS" basis,
   WITHOUT WARRANTY OF ANY KIND, either express or implied.
   See the Mozilla Public License for the specific language governing rights and limitations under the License.
*/

import React, { useState, useCallback, useEffect, useRef } from "react";
import { WorkspaceData } from "../types/Types";
import TasksCanvas from "../../task/components/TasksCanvas";
import TaskModal from "../../task/components/TaskModal";
// import { ContextMenuItem } from "../../task/components/ContextMenu";
import { Task, TaskConnection } from "../../task/types/types";
import { useTranslation } from "react-i18next";
import { Plus } from "lucide-react";

interface TasksTabProps {
  workspaceData: WorkspaceData;
  onTabChanges?: () => void;
  onChange?: (data: { tasks: Task[]; connections: TaskConnection[] }) => void;
}

const TasksTab: React.FC<TasksTabProps> = ({ workspaceData, onChange }) => {
  const { t } = useTranslation();
  const [tasks, setTasks] = useState<Task[]>(() => workspaceData.tasks);
  const [connections, setConnections] = useState<TaskConnection[]>(
    () => workspaceData.connections
  );
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [pendingNewTaskPosition, setPendingNewTaskPosition] = useState<{
    x: number;
    y: number;
  } | null>(null);
  // Context menu state reserved for future use

  const handleTaskPositionChange = useCallback(
    (taskId: string, position: { x: number; y: number }) => {
      setTasks((prevTasks) =>
        prevTasks.map((task) =>
          task.id === taskId ? { ...task, position } : task
        )
      );
    },
    []
  );

  const handleConnectionCreate = useCallback((connection: TaskConnection) => {
    setConnections((prevConnections) => [...prevConnections, connection]);
  }, []);

  const handleConnectionRemove = useCallback((connection: TaskConnection) => {
    setConnections((prevConnections) =>
      prevConnections.filter(
        (conn) =>
          !(
            conn.fromSocket === connection.fromSocket &&
            conn.toSocket === connection.toSocket
          )
      )
    );
  }, []);

  const handleCanvasAddTask = useCallback(
    (position: { x: number; y: number }) => {
      setEditingTask(null);
      setPendingNewTaskPosition(position);
      setIsModalOpen(true);
    },
    []
  );

  const handleAddTask = useCallback(() => {
    setEditingTask(null);
    setPendingNewTaskPosition({ x: 100, y: 100 });
    setIsModalOpen(true);
  }, []);

  const handleEditTask = useCallback((task: Task) => {
    setEditingTask(task);
    setIsModalOpen(true);
  }, []);

  const handleSaveTask = useCallback(
    (taskData: Omit<Task, "id" | "position" | "selected">) => {
      if (editingTask) {
        // Update existing task
        setTasks((prevTasks) =>
          prevTasks.map((task) =>
            task.id === editingTask.id ? { ...task, ...taskData } : task
          )
        );
      } else {
        // Create new task
        const newTask: Task = {
          ...taskData,
          id: `task-${Date.now()}`,
          position: pendingNewTaskPosition ?? { x: 100, y: 100 },
          selected: false,
        };
        setTasks((prevTasks) => [...prevTasks, newTask]);
      }
      setPendingNewTaskPosition(null);
    },
    [editingTask, pendingNewTaskPosition]
  );

  const handleDeleteTask = useCallback(
    (taskId: string) => {
      // Remove task
      setTasks((prevTasks) => prevTasks.filter((task) => task.id !== taskId));

      // Remove connections involving this task's sockets
      const taskToDelete = tasks.find((task) => task.id === taskId);
      if (taskToDelete) {
        const socketIds = taskToDelete.sockets.map((socket) => socket.id);
        setConnections((prevConnections) =>
          prevConnections.filter(
            (conn) =>
              !socketIds.includes(conn.fromSocket) &&
              !socketIds.includes(conn.toSocket)
          )
        );
      }
    },
    [tasks]
  );

  // Notify parent whenever tasks or connections actually change (skip initial mount)
  const hasMountedRef = useRef(false);
  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);
  useEffect(() => {
    if (!hasMountedRef.current) {
      hasMountedRef.current = true;
      return;
    }
    if (onChangeRef.current) {
      onChangeRef.current({ tasks, connections });
    }
  }, [tasks, connections]);

  return (
    <div className="space-y-6">
      <div className="bg-[#121212] rounded-md">
        <div className="relative w-full h-[calc(100vh)]">
          <TasksCanvas
            tasks={tasks}
            connections={connections}
            onTaskPositionChange={handleTaskPositionChange}
            onConnectionCreate={handleConnectionCreate}
            onConnectionRemove={handleConnectionRemove}
            onTaskEdit={handleEditTask}
            onTaskDelete={handleDeleteTask}
            onTaskAdd={handleCanvasAddTask}
            onAddTaskButtonClick={handleAddTask}
          />
        </div>
      </div>

      <TaskModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveTask}
        task={editingTask}
        title={
          editingTask
            ? t("tasksTab.editTask", "Edit Task")
            : t("tasksTab.addNewTask", "Add New Task")
        }
        tasksCount={tasks.length}
        agents={workspaceData.agents}
        workflows={workspaceData.workflows}
      />
    </div>
  );
};

export default TasksTab;
