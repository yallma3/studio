import React, { useState, useEffect } from "react";
import { Task, TaskSocket } from "../types/types";
import { Agent, Workflow } from "../../workspace/types/Types";

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (task: Omit<Task, "id" | "position" | "selected">) => void;
  task?: Task | null; // For editing existing task
  title?: string;
  tasksCount: number;
  agents: Agent[];
  workflows: Workflow[];
}

const TaskModal: React.FC<TaskModalProps> = ({
  isOpen,
  onClose,
  onSave,
  task,
  title = "Add Task",
  tasksCount,
  agents,
  workflows,
}) => {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    expectedOutput: "",
    type: "agentic",
    executorId: null as string | null,
    sockets: [] as TaskSocket[],
  });

  // Reset form when modal opens/closes or task changes
  useEffect(() => {
    if (isOpen) {
      if (task) {
        setFormData({
          title: task.title,
          description: task.description,
          expectedOutput: task.expectedOutput,
          type: task.type,
          executorId: task.executorId,
          sockets: [...task.sockets],
        });
        // Preserve sockets as-is when editing
      } else {
        setFormData({
          title: "",
          description: "",
          expectedOutput: "",
          type: "agentic",
          executorId: null,
          sockets: [],
        });
      }
    }
  }, [isOpen, task]);

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value === "" && name === "executorId" ? null : value,
      // Clear executorId when type is set to "agentic"
      ...(name === "type" && value === "agentic" ? { executorId: null } : {}),
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Ensure exactly two sockets for new tasks with unique IDs based on tasksCount
    if (!task) {
      const base = (tasksCount + 1) * 100;
      const generatedSockets: TaskSocket[] = [
        { id: base + 1, title: "Input", type: "input" },
        { id: base + 2, title: "Output", type: "output" },
      ];
      onSave({ ...formData, sockets: generatedSockets });
    } else {
      // Preserve existing sockets when editing
      onSave(formData);
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-[#2A2A2A] bg-[#171717]">
        <div className="px-6 pt-5 pb-4 border-b border-[#FFC72C]/25 bg-[#FFC72C]/15 rounded-t-lg">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-100">
              {task ? "Edit Task" : title}
            </h2>
            <button
              onClick={onClose}
              className="text-[#FFC72Caa] hover:text-[#FFC72C] text-2xl leading-none"
              title="Close"
            >
              ×
            </button>
          </div>
        </div>

        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <div>
                <label
                  htmlFor="title"
                  className="block text-xs font-medium text-[#FFC72C]/90 mb-1"
                >
                  Title *
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 rounded-md bg-[#1f1f1f] text-gray-100 border border-[#333] focus:outline-none focus:ring-2 focus:ring-[#FFC72C] focus:border-transparent placeholder:text-gray-400"
                  placeholder="Enter task title"
                />
              </div>

              <div>
                <label
                  htmlFor="description"
                  className="block text-xs font-medium text-[#FFC72C]/90 mb-1"
                >
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-3 py-2 rounded-md bg-[#1f1f1f] text-gray-100 border border-[#333] focus:outline-none focus:ring-2 focus:ring-[#FFC72C] focus:border-transparent placeholder:text-gray-400"
                  placeholder="Describe what this task does"
                />
              </div>

              <div>
                <label
                  htmlFor="expectedOutput"
                  className="block text-xs font-medium text-[#FFC72C]/90 mb-1"
                >
                  Expected Output
                </label>
                <textarea
                  id="expectedOutput"
                  name="expectedOutput"
                  value={formData.expectedOutput}
                  onChange={handleInputChange}
                  rows={2}
                  className="w-full px-3 py-2 rounded-md bg-[#1f1f1f] text-gray-100 border border-[#333] focus:outline-none focus:ring-2 focus:ring-[#FFC72C] focus:border-transparent placeholder:text-gray-400"
                  placeholder="Describe the expected output"
                />
              </div>
              <div>
                <label
                  htmlFor="type"
                  className="block text-xs font-medium text-[#FFC72C]/90 mb-1"
                >
                  Type
                </label>
                <select
                  id="type"
                  name="type"
                  value={formData.type}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 rounded-md bg-[#1f1f1f] text-gray-100 border border-[#333] focus:outline-none focus:ring-2 focus:ring-[#FFC72C] focus:border-transparent"
                >
                  <option value="agentic">Agentic (Auto)</option>
                  <option value="specific-agent">Specific Agent</option>
                  <option value="workflow">Workflow</option>
                  <option value="MCP">MCP</option>
                </select>
              </div>
              {formData.type === "specific-agent" ||
              formData.type === "workflow" ? (
                <div>
                  <label
                    htmlFor="executorId"
                    className="block text-xs font-medium text-[#FFC72C]/90 mb-1"
                  >
                    {formData.type === "specific-agent" ? "Agent" : "Workflow"}
                  </label>
                  <select
                    id="executorId"
                    name="executorId"
                    value={formData.executorId || ""}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 rounded-md bg-[#1f1f1f] text-gray-100 border border-[#333] focus:outline-none focus:ring-2 focus:ring-[#FFC72C] focus:border-transparent"
                  >
                    <option value="">None</option>
                    {formData.type === "specific-agent"
                      ? agents.map((agent) => (
                          <option key={agent.id} value={agent.id}>
                            {agent.name}
                          </option>
                        ))
                      : workflows.map((wf) => (
                          <option key={wf.id} value={wf.id}>
                            {wf.name}
                          </option>
                        ))}
                  </select>
                </div>
              ) : (
                ""
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-3 pt-6 border-t border-[#FFC72C]/20">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm text-zinc-300 hover:text-white transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-[#FFC72C] text-black rounded-md hover:bg-[#FFB300] transition-colors border border-[#FFB300] cursor-pointer"
              >
                {task ? "Update Task" : "Create Task"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default TaskModal;
