/*
* yaLLMa3 - Framework for building AI agents that are capable of learning from their environment and interacting with it.
 
 * Copyright (C) 2025 yaLLMa3
 
 * This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0.
   If a copy of the MPL was not distributed with this file, You can obtain one at https://www.mozilla.org/MPL/2.0/.
 
 * This software is distributed on an "AS IS" basis,
   WITHOUT WARRANTY OF ANY KIND, either express or implied.
   See the Mozilla Public License for the specific language governing rights and limitations under the License.
*/

import React, { useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { ArrowLeft, ArrowRight, X } from "lucide-react";
import { Button } from "./ui/button";
import {
  loadAllWorkflowsFromFiles,
  type WorkflowFile,
} from "../../modules/workspace/utils/workflowStorageUtils";
import { Tool, Workflow } from "../../modules/workspace/types/Types";

export interface ToolSelectionPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onAddTool: (tool: Tool) => void;
  handleImportWorkflow: (workflow: Workflow) => void;
  availableTools: Tool[];
  existingTools: Tool[];
  editingTool?: Tool | null;
}

const ToolSelectionPopup: React.FC<ToolSelectionPopupProps> = ({
  isOpen,
  onClose,
  onAddTool,
  handleImportWorkflow,
  availableTools,
  existingTools,
  editingTool,
}) => {
  const { t } = useTranslation();
  const popupRef = useRef<HTMLDivElement>(null);
  const [toolPickerStep, setToolPickerStep] = React.useState<
    "root" | "workflow"
  >("root");
  const [workflowTab, setWorkflowTab] = React.useState<"workspace" | "all">(
    "workspace"
  );
  const [allWorkflows, setAllWorkflows] = React.useState<WorkflowFile[]>([]);
  const [isLoadingAll, setIsLoadingAll] = React.useState<boolean>(false);
  const hasRequestedAllRef = React.useRef<boolean>(false);

  // Helper function to transform workflow name to tool name
  const transformWorkflowName = (name: string): string => {
    return name
      .toLowerCase()
      .replace(/\s+/g, "_")
      .replace(/[^a-z0-9_\-.:]/g, "")
      .replace(/^[^a-z_]+/, "");
  };

  // Reset state when popup opens/closes
  useEffect(() => {
    if (isOpen) {
      setToolPickerStep("root");
      setWorkflowTab("workspace");
      setAllWorkflows([]);
      setIsLoadingAll(false);
      hasRequestedAllRef.current = false;
      // Lock background scroll when popup opens
      const previousOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = previousOverflow;
      };
    }
  }, [isOpen]);

  // Handle click outside to close popup
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (popupRef.current && !popupRef.current.contains(target)) {
        onClose();
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  // Load all workflows when switching to the "all" tab in workflow step
  useEffect(() => {
    const fetchAll = async () => {
      try {
        if (allWorkflows.length === 0) {
          setIsLoadingAll(true);
        }
        const items = await loadAllWorkflowsFromFiles();
        setAllWorkflows(items);
      } finally {
        setIsLoadingAll(false);
      }
    };

    if (
      isOpen &&
      toolPickerStep === "workflow" &&
      workflowTab === "all" &&
      !hasRequestedAllRef.current
    ) {
      hasRequestedAllRef.current = true;
      fetchAll();
    }
  }, [isOpen, toolPickerStep, workflowTab, allWorkflows.length]);

  const handleAddWorkflowTool = (workflowId: string) => {
    const workflowTool: Tool | undefined = availableTools.find(
      (tool) => tool.type === "workflow" && tool.name === workflowId
    );
    if (!workflowTool) return;

    const toolName = transformWorkflowName(workflowTool.name);

    const tool: Tool = {
      type: "workflow",
      name: toolName,
      description:
        workflowTool.description + " -- WorkflowId: " + workflowTool.id,
    };

    onAddTool(tool);
    onClose();
  };

  const handleAddWorkflowFromAll = (workflow: WorkflowFile) => {
    const importedWorflow: Workflow = {
      id: workflow.id,
      name: workflow.name,
      description: workflow.description,
    };
    handleImportWorkflow(importedWorflow);
    const toolName = transformWorkflowName(workflow.name);
    const tool: Tool = {
      type: "workflow",
      name: toolName,
      description: workflow.description + " -- WorkflowId: " + workflow.id,
    };
    onAddTool(tool);
    onClose();
  };

  const handleAddMcpTool = () => {
    const tool: Tool = {
      type: "mcp",
      name: "MCP",
      description: "",
    };

    onAddTool(tool);
    onClose();
  };

  const workflowTools = availableTools.filter(
    (tool) => tool.type === "workflow"
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div
        ref={popupRef}
        className={`bg-zinc-900 rounded-lg p-5 border border-zinc-700 w-full shadow-xl animate-in fade-in duration-200 transition-[max-width] ${
          toolPickerStep === "workflow" ? "max-w-xl" : "max-w-md"
        }`}
      >
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-white">
            {editingTool
              ? t("workspaces.editTool", "Edit Tool")
              : t("workspaces.addTool", "Add Tool")}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        {toolPickerStep === "root" && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                {t("workspaces.selectToolType", "Select Tool Type")}
              </label>
              <div className="grid grid-cols-1 gap-2">
                <button
                  onClick={() => setToolPickerStep("workflow")}
                  className="py-3 px-4 rounded-md text-sm bg-zinc-700 text-gray-300 hover:bg-zinc-600 text-left cursor-pointer"
                >
                  <div className="font-medium flex justify-between">
                    Workflow <ArrowRight className="w-4" />
                  </div>
                </button>
                {!existingTools.some((t) => t.name === "MCP") && (
                  <button
                    onClick={handleAddMcpTool}
                    className="py-3 px-4 rounded-md text-sm bg-zinc-700 text-gray-300 hover:bg-zinc-600 text-left cursor-pointer"
                  >
                    <div className="font-medium flex justify-between">
                      MCP <ArrowRight className="w-4" />
                    </div>
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {toolPickerStep === "workflow" && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <button
                onClick={() => setToolPickerStep("root")}
                className="text-gray-400 hover:text-white cursor-pointer"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
              <h4 className="text-md font-medium text-white">
                Select Workflow
              </h4>
            </div>

            {/* Tabs */}
            <div className="flex items-center gap-2 border-b border-zinc-700">
              <button
                className={`px-3 py-2 text-sm rounded-t-md ${
                  workflowTab === "workspace"
                    ? "bg-zinc-800 text-white"
                    : "text-zinc-300 hover:text-white"
                }`}
                onClick={() => setWorkflowTab("workspace")}
              >
                In this workspace
              </button>
              <button
                className={`px-3 py-2 text-sm rounded-t-md ${
                  workflowTab === "all"
                    ? "bg-zinc-800 text-white"
                    : "text-zinc-300 hover:text-white"
                }`}
                onClick={() => setWorkflowTab("all")}
              >
                All workflows
              </button>
            </div>

            {/* Tab content: fixed height, absolute children to avoid vertical layout changes */}
            <div className="relative h-84">
              {workflowTab === "workspace" && (
                <div className="absolute inset-0 overflow-y-auto animate-in fade-in duration-150">
                  {workflowTools.length > 0 ? (
                    <div className="space-y-2">
                      {workflowTools
                        .filter((tool) => {
                          const transformedName = transformWorkflowName(
                            tool.name
                          );
                          const isAlreadyAdded = existingTools.some(
                            (t) => t.name === transformedName
                          );
                          return !isAlreadyAdded;
                        })
                        .map((tool) => (
                          <button
                            key={tool.name}
                            className="w-full text-left px-3 py-3 text-sm text-white hover:bg-zinc-800 rounded-md border border-zinc-700 cursor-pointer"
                            onClick={() => handleAddWorkflowTool(tool.name)}
                            title={tool.description}
                          >
                            <div className="font-medium">{tool.name}</div>
                            {tool.description && (
                              <div className="text-xs text-gray-400 mt-1">
                                {tool.description}
                              </div>
                            )}
                          </button>
                        ))}
                    </div>
                  ) : (
                    <div className="px-3 py-4 text-sm text-zinc-400 text-center">
                      {t("workspaces.noWorkflows", "No workflows available")}
                    </div>
                  )}
                </div>
              )}

              {workflowTab === "all" && (
                <div className="absolute inset-0 overflow-y-auto animate-in fade-in duration-150">
                  {allWorkflows.length > 0 ? (
                    <div className="space-y-2">
                      {allWorkflows
                        .filter((wf) => {
                          const transformedName = transformWorkflowName(
                            wf.name
                          );
                          const isAlreadyAdded = existingTools.some(
                            (t) => t.name === transformedName
                          );
                          return !isAlreadyAdded;
                        })
                        .map((wf) => (
                          <button
                            key={wf.id}
                            className="w-full text-left px-3 py-3 text-sm text-white hover:bg-zinc-800 rounded-md border border-zinc-700 cursor-pointer"
                            onClick={() => handleAddWorkflowFromAll(wf)}
                            title={wf.description}
                          >
                            <div className="font-medium">{wf.name}</div>
                            {wf.description && (
                              <div className="text-xs text-gray-400 mt-1">
                                {wf.description}
                              </div>
                            )}
                          </button>
                        ))}
                      {isLoadingAll && (
                        <div className="px-3 py-2 text-xs text-zinc-400 text-center">
                          Updating...
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="px-3 py-4 text-sm text-zinc-400 text-center">
                      {isLoadingAll
                        ? "Loading..."
                        : t("workspaces.noWorkflows", "No workflows available")}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        <div className="flex gap-2 justify-end mt-6">
          <Button
            onClick={onClose}
            className="bg-zinc-700 hover:bg-zinc-600 text-white font-medium border-0"
          >
            {t("common.cancel", "Cancel")}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ToolSelectionPopup;
