/*
* yaLLMa3 - Framework for building AI agents that are capable of learning from their environment and interacting with it.
 
 * Copyright (C) 2025 yaLLMa3
 
 * This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0.
   If a copy of the MPL was not distributed with this file, You can obtain one at https://www.mozilla.org/MPL/2.0/.
 
 * This software is distributed on an "AS IS" basis,
   WITHOUT WARRANTY OF ANY KIND, either express or implied.
   See the Mozilla Public License for the specific language governing rights and limitations under the License.
*/
import React, { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { WorkspaceData, Tool } from "../types/Types";
import NodeCanvas from "../../flow/NodeCanvas";
import { CanvasState } from "../../flow/utils/storageUtils";
import {
  Plus,
  ArrowRight,
  Trash2,
  X,
  Download,
  Upload,
  FolderOpen,
  Edit,
  Wrench,
} from "lucide-react";
import {
  WorkflowFile,
  loadAllWorkflowsFromFiles,
  createNewWorkflow,
  deleteWorkflowFile,
  updateWorkflowFile,
  saveWorkflowToFile,
  generateWorkflowId,
} from "../utils/workflowStorageUtils";
import {
  McpToolFile,
  loadAllMcpToolsFromFiles,
  createNewMcpTool,
  deleteMcpToolFile,
  toolToMcpToolFile,
} from "../utils/mcpStorageUtils";
import { saveWorkspaceToDefaultLocation } from "../utils/storageUtils";
import AddToolOrWorkflowDialog from "../../../shared/components/AddToolOrWorkflowDialog";
import { McpWorkflowImportDialog } from "../components/McpWorkflowImportDialog";
import { DeleteConfirmationDialog } from "../../../shared/components/DeleteConfirmationDialog";

interface AiFlowsTabProps {
  workspaceData: WorkspaceData;
  onTabChanges?: () => void;
}

// Workflow Edit Dialog Component
const WorkflowEditDialog: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string, description: string) => void;
  workflow: WorkflowFile | null;
}> = ({ isOpen, onClose, onSave, workflow }) => {
  const { t } = useTranslation();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize form when dialog opens or workflow changes
  useEffect(() => {
    if (isOpen && workflow) {
      setName(workflow.name || "");
      setDescription(workflow.description || "");
      setIsSubmitting(false);
    }
  }, [isOpen, workflow]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    onSave(name.trim(), description.trim());
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      onClose();
    }
  };

  if (!isOpen || !workflow) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 backdrop-blur-sm">
      <div className="bg-gradient-to-br from-[#1a1a1a] to-[#151515] rounded-xl shadow-2xl border border-zinc-800/50 p-6 max-w-md w-full mx-4">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-600/20 to-blue-700/20 border border-blue-600/30 flex items-center justify-center">
              <Edit size={16} className="text-blue-400" />
            </div>
            <h3 className="text-xl font-bold text-white">
              {t("workspaces.editWorkflow", "Edit Workflow")}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white transition-colors p-1"
            disabled={isSubmitting}
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="edit-workflow-name"
              className="block text-sm font-medium text-zinc-300 mb-2"
            >
              {t("workspaces.workflowName", "Workflow Name")} *
            </label>
            <input
              id="edit-workflow-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={t(
                "workspaces.enterWorkflowName",
                "Enter workflow name..."
              )}
              className="w-full px-3 py-2 bg-[#0a0a0a] border border-zinc-700 rounded-md text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
              disabled={isSubmitting}
              autoFocus
            />
          </div>

          <div>
            <label
              htmlFor="edit-workflow-description"
              className="block text-sm font-medium text-zinc-300 mb-2"
            >
              {t("workspaces.workflowDescription", "Description")}
            </label>
            <textarea
              id="edit-workflow-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={t(
                "workspaces.enterWorkflowDescription",
                "Enter workflow description..."
              )}
              className="w-full px-3 py-2 bg-[#0a0a0a] border border-zinc-700 rounded-md text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              rows={3}
              disabled={isSubmitting}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-zinc-300 hover:text-white transition-colors"
              disabled={isSubmitting}
            >
              {t("common.cancel", "Cancel")}
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={!name.trim() || isSubmitting}
            >
              {isSubmitting
                ? t("common.saving", "Saving...")
                : t("common.save", "Save")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Generate clean, short random string
const generateCleanId = (length: number = 6): string => {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

// Generate unique graph ID - updated format
const generateGraphId = (): string => {
  const shortDate = Date.now().toString().slice(-6);
  const randomPart = generateCleanId(3);
  return `gf-${shortDate}${randomPart}`;
};

const AiFlowsTab: React.FC<AiFlowsTabProps> = ({
  workspaceData,
  onTabChanges,
}) => {
  const { t } = useTranslation();
  const [selectedWorkflow, setSelectedWorkflow] = useState<CanvasState | null>(
    null
  );
  const [selectedWorkflowMeta, setSelectedWorkflowMeta] =
    useState<WorkflowFile | null>(null);
  const [showCanvas, setShowCanvas] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(
    null
  );
  const [showDeleteMcpConfirm, setShowDeleteMcpConfirm] = useState<
    string | null
  >(null);
  const [deleteCompletely, setDeleteCompletely] = useState(false);
  const [deleteMcpCompletely, setDeleteMcpCompletely] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingWorkflow, setEditingWorkflow] = useState<WorkflowFile | null>(
    null
  );
  const [workflows, setWorkflows] = useState<WorkflowFile[]>([]);
  const [mcpTools, setMcpTools] = useState<McpToolFile[]>([]);
  const [loading, setLoading] = useState(true);

  // Load workflows and MCP tools from file system on component mount
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);

        // Load workflows
        if (!workspaceData.workflows || workspaceData.workflows.length === 0) {
          setWorkflows([]);
        } else {
          // Load all workflows from file system
          const allWorkflows = await loadAllWorkflowsFromFiles();

          // Filter to only include workflows that are referenced in this workspace
          const workspaceWorkflowIds = workspaceData.workflows.map((w) => w.id);
          const filteredWorkflows = allWorkflows.filter((workflow) =>
            workspaceWorkflowIds.includes(workflow.id)
          );

          setWorkflows(filteredWorkflows);
        }
        // Load workflows
        if (!workspaceData.mcpTools || workspaceData.mcpTools.length === 0) {
          setMcpTools([]);
        } else {
          // Load all workflows from file system
          const allMcps = await loadAllMcpToolsFromFiles();

          // Filter to only include workflows that are referenced in this workspace
          const workspaceMcpIds = workspaceData.mcpTools.map((w) => w.id);
          const filteredMcps = allMcps.filter((mcp) =>
            workspaceMcpIds.includes(mcp.id)
          );

          setMcpTools(filteredMcps);
        }
      } catch (error) {
        console.error("Error loading data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [workspaceData.workflows, workspaceData.mcpTools]);

  // Update workspace data with workflow references
  const updateWorkspaceWorkflows = async (updatedWorkflows: WorkflowFile[]) => {
    try {
      // Update workspace data workflows array to reference the saved workflows
      workspaceData.workflows = updatedWorkflows.map((workflow) => ({
        id: workflow.id,
        name: workflow.name,
        description: workflow.description,
      }));
      // Update Agent tool that uses a workflow

      // Save the updated workspace data
      await saveWorkspaceToDefaultLocation(workspaceData);

      // Signal that tab has changes
      onTabChanges?.();
    } catch (error) {
      console.error("Error updating workspace workflows:", error);
    }
  };

  const updateWorkspaceMcpTools = async (updatedMcpTools: McpToolFile[]) => {
    try {
      // Update workspace data mcpTools array to reference the saved MCP tools
      workspaceData.mcpTools = updatedMcpTools.map((mcp) => ({
        id: mcp.id,
        type: "mcp",
        name: mcp.name,
        description: mcp.description,
        parameters: mcp.parameters,
      }));

      // Save the updated workspace data
      await saveWorkspaceToDefaultLocation(workspaceData);

      // Signal that tab has changes
      onTabChanges?.();
    } catch (error) {
      console.error("Error updating workspace MCP tools:", error);
    }
  };

  // Format date for display
  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString();
  };

  const handleCreateNewFlow = () => {
    setShowCreateDialog(true);
  };

  const handleImportFlow = () => {
    setShowImportDialog(true);
  };

  const handleImportWorkflows = async (workflowsToImport: WorkflowFile[]) => {
    try {
      // Add to current workflows
      const merged = [...workflows, ...workflowsToImport];
      const seen = new Set<string>();
      const updatedWorkflows = merged.filter((w) => {
        if (seen.has(w.id)) return false;
        seen.add(w.id);
        return true;
      });
      setWorkflows(updatedWorkflows);

      // Update workspace data
      await updateWorkspaceWorkflows(updatedWorkflows);

      // Close dialog
      setShowImportDialog(false);
    } catch (error) {
      console.error("Error importing workflows:", error);
    }
  };

  const handleImportMcps = async (mcpsToImport: McpToolFile[]) => {
    try {
      // Add to current MCP tools
      const merged = [...mcpTools, ...mcpsToImport];
      const seen = new Set<string>();
      const updatedMcpTools = merged.filter((mcp) => {
        if (seen.has(mcp.id)) return false;
        seen.add(mcp.id);
        return true;
      });
      setMcpTools(updatedMcpTools);

      // Update workspace data
      await updateWorkspaceMcpTools(updatedMcpTools);

      // Close dialog
      setShowImportDialog(false);
    } catch (error) {
      console.error("Error importing MCP tools:", error);
    }
  };

  const handleCreateWorkflow = async (name: string, description: string) => {
    try {
      const newGraphId = generateGraphId();

      const canvasState: CanvasState = {
        graphId: newGraphId,
        graphName: name,
        nodes: [],
        connections: [],
        nextNodeId: 0,
      };

      // Create new workflow file
      const newWorkflow = await createNewWorkflow(
        name,
        description,
        canvasState
      );

      // Update local state
      const updatedWorkflows = [newWorkflow, ...workflows];
      setWorkflows(updatedWorkflows);

      // Update workspace data
      await updateWorkspaceWorkflows(updatedWorkflows);

      // Close dialog
      setShowCreateDialog(false);

      // Open the canvas with the new workflow
      setSelectedWorkflow(canvasState);
      setSelectedWorkflowMeta(newWorkflow);
      setShowCanvas(true);
    } catch (error) {
      console.error("Error creating new workflow:", error);
      // Keep dialog open on error so user can retry
    }
  };

  const handleSaveMcpTool = async (tool: Tool) => {
    try {
      // Convert Tool to McpToolFile and save it
      const mcpToolFile = toolToMcpToolFile(tool);
      const toolParams = {
        type: mcpToolFile.type,
        ...(mcpToolFile.type === "STDIO"
          ? {
              command: mcpToolFile.parameters.command,
              args: mcpToolFile.parameters.args,
            }
          : {
              url: mcpToolFile.parameters.url,
              headers: mcpToolFile.parameters.headers,
            }),
      };

      const savedMcpTool = await createNewMcpTool(
        mcpToolFile.name,
        mcpToolFile.description,
        mcpToolFile.type,
        toolParams
      );

      // Update local state
      const updatedMcpTools = [savedMcpTool, ...mcpTools];
      setMcpTools(updatedMcpTools);

      // Update workspace data
      await updateWorkspaceMcpTools(updatedMcpTools);

      // Close dialog
      setShowCreateDialog(false);
    } catch (error) {
      console.error("Error creating MCP tool:", error);
      // Keep dialog open on error so user can retry
    }
  };

  const editWorkflowMeta = (workflow: WorkflowFile) => {
    setEditingWorkflow(workflow);
    setShowEditDialog(true);
  };

  const handleEditWorkflow = async (name: string, description: string) => {
    if (!editingWorkflow) return;

    try {
      // Update workflow file with new metadata
      const updatedWorkflow = await updateWorkflowFile(editingWorkflow.id, {
        name,
        description,
      });

      if (updatedWorkflow) {
        // Update local state
        const updatedWorkflows = workflows.map((w) =>
          w.id === updatedWorkflow.id ? updatedWorkflow : w
        );
        setWorkflows(updatedWorkflows);

        // Update workspace data
        await updateWorkspaceWorkflows(updatedWorkflows);

        // Close dialog
        setShowEditDialog(false);
        setEditingWorkflow(null);
      }
    } catch (error) {
      console.error("Error editing workflow:", error);
      // Keep dialog open on error so user can retry
    }
  };

  const handleCloseEditDialog = () => {
    setShowEditDialog(false);
    setEditingWorkflow(null);
  };
  const handleEditFlow = (workflow: WorkflowFile) => {
    setSelectedWorkflow(workflow.canvasState);
    setSelectedWorkflowMeta(workflow);
    setShowCanvas(true);
  };

  const handleDeleteFlow = (workflowId: string) => {
    setShowDeleteConfirm(workflowId);
  };

  const handleDeleteMcpTool = (mcpToolId: string) => {
    setShowDeleteMcpConfirm(mcpToolId);
  };

  const confirmDeleteFlow = async (workflowId: string) => {
    try {
      if (deleteCompletely) {
        // Delete workflow file completely
        await deleteWorkflowFile(workflowId);
      }

      // Remove workflow from workspace (always done, regardless of deleteCompletely)
      const updatedWorkflows = workflows.filter((w) => w.id !== workflowId);
      setWorkflows(updatedWorkflows);

      // Update workspace data
      await updateWorkspaceWorkflows(updatedWorkflows);

      setDeleteCompletely(false);
    } catch (error) {
      console.error("Error deleting workflow:", error);
    }

    // Signal that tab has changes
    onTabChanges?.();

    // Close confirmation dialog
    setShowDeleteConfirm(null);
  };

  const cancelDeleteFlow = () => {
    setShowDeleteConfirm(null);
    setDeleteCompletely(false);
  };

  const confirmDeleteMcpTool = async (mcpToolId: string) => {
    try {
      if (deleteMcpCompletely) {
        // Delete MCP tool file completely
        await deleteMcpToolFile(mcpToolId);
      }

      // Remove MCP tool from workspace (always done, regardless of deleteMcpCompletely)
      const updatedMcpTools = mcpTools.filter((tool) => tool.id !== mcpToolId);
      setMcpTools(updatedMcpTools);

      // Update workspace data
      await updateWorkspaceMcpTools(updatedMcpTools);

      setDeleteMcpCompletely(false);
    } catch (error) {
      console.error("Error deleting MCP tool:", error);
    }

    // Signal that tab has changes
    onTabChanges?.();

    // Close confirmation dialog
    setShowDeleteMcpConfirm(null);
  };

  const cancelDeleteMcpTool = () => {
    setShowDeleteMcpConfirm(null);
    setDeleteMcpCompletely(false);
  };

  const handleReturnToList = async (updatedCanvasState?: CanvasState) => {
    // If canvas state was updated, save it
    if (updatedCanvasState && selectedWorkflowMeta) {
      try {
        const updatedWorkflow = await updateWorkflowFile(
          selectedWorkflowMeta.id,
          {
            canvasState: updatedCanvasState,
            name: updatedCanvasState.graphName || selectedWorkflowMeta.name,
          }
        );

        if (updatedWorkflow) {
          // Update local state
          const updatedWorkflows = workflows.map((w) =>
            w.id === updatedWorkflow.id ? updatedWorkflow : w
          );
          setWorkflows(updatedWorkflows);

          // Update workspace data
          await updateWorkspaceWorkflows(updatedWorkflows);
        }
      } catch (error) {
        console.error("Error updating workflow:", error);
      }
    }

    setShowCanvas(false);
    setSelectedWorkflow(null);
    setSelectedWorkflowMeta(null);
  };

  if (showCanvas) {
    return (
      <div className="fixed inset-0 z-50">
        <NodeCanvas
          graph={selectedWorkflow}
          onReturnToHome={handleReturnToList}
          workflowMeta={selectedWorkflowMeta}
        />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-zinc-400">{t("common.loading", "Loading...")}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-[#121212] rounded-md">
        <div className="flex justify-between items-center p-6 border-b border-[#FFC72C]/50">
          <div className="flex items-center">
            <h2 className="text-xl font-bold text-white">
              {t("workspaces.aiFlows", "Tools & AI Workflows")}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleImportFlow}
              className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm flex items-center gap-1"
            >
              <Download size={16} />
              {t("workspaces.importFlow", "Import")}
            </button>
            <button
              onClick={handleCreateNewFlow}
              className="bg-[#FFC72C] hover:bg-[#E6B428] text-black px-3 py-1 rounded text-sm flex items-center gap-1"
            >
              <Plus size={16} />
              {t("workspaces.addNew", "Add New")}
            </button>
          </div>
        </div>

        {(workflows && workflows.length > 0) ||
        (mcpTools && mcpTools.length > 0) ? (
          <div className="overflow-y-auto h-[calc(100vh-200px)]">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6">
              {workflows.map((workflow: WorkflowFile) => (
                <div
                  key={workflow.id}
                  className="group bg-gradient-to-br from-[#1a1a1a] to-[#151515] rounded-xl border border-zinc-800/50 hover:border-zinc-700/70 transition-all duration-200 hover:shadow-lg hover:shadow-black/20 p-6 relative overflow-hidden"
                >
                  {/* Subtle background pattern */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.01] to-transparent opacity-50"></div>

                  {/* Header with title and actions */}
                  <div className="flex justify-between items-start mb-4 relative z-10">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        {/* Workflow icon */}
                        <div className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center bg-gradient-to-br from-purple-600/20 to-purple-700/20 border border-purple-600/30">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="text-purple-400"
                          >
                            <rect width="18" height="18" x="3" y="3" rx="2" />
                            <path d="M9 9h6v6H9z" />
                            <path d="m9 12 2 2 4-4" />
                          </svg>
                        </div>

                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-white text-xl leading-tight truncate group-hover:text-purple-400 transition-colors duration-200">
                            {workflow.name}
                          </h3>
                          <p className="text-zinc-400 text-sm mt-1">
                            {t("workspaces.lastUpdated", "Last updated")}:{" "}
                            {formatDate(workflow.updatedAt)}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex gap-1 ml-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <button
                        onClick={() => editWorkflowMeta(workflow)}
                        className="flex items-center justify-center w-8 h-8 text-blue-400 hover:text-blue-300 hover:bg-blue-400/10 rounded-lg transition-all duration-200"
                        title={t("workspaces.editFlow", "Edit Flow")}
                      >
                        <Edit size={14} />
                      </button>
                      <button
                        onClick={() => handleEditFlow(workflow)}
                        className="flex items-center justify-center w-8 h-8 text-purple-400 hover:text-purple-300 hover:bg-purple-400/10 rounded-lg transition-all duration-200"
                        title={t("workspaces.editFlow", "Edit Flow")}
                      >
                        <ArrowRight size={14} />
                      </button>
                      <button
                        onClick={() => handleDeleteFlow(workflow.id)}
                        className="flex items-center justify-center w-8 h-8 text-red-400 hover:text-red-300 hover:bg-red-400/10 rounded-lg transition-all duration-200"
                        title={t("workspaces.deleteFlow", "Delete Flow")}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Description */}
                  <div className="bg-[#0a0a0a]/50 rounded-lg p-4 border border-zinc-800/50 relative z-10">
                    <div className="flex items-center gap-2 mb-2">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="text-zinc-400"
                      >
                        <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                        <polyline points="14,2 14,8 20,8" />
                      </svg>
                      <span className="text-zinc-400 text-xs font-medium uppercase tracking-wide">
                        {t("workspaces.description", "Description")}
                      </span>
                    </div>
                    <p
                      className={`text-sm leading-relaxed ${
                        workflow.description
                          ? "text-zinc-200"
                          : "text-zinc-500 italic"
                      }`}
                    >
                      {workflow.description ||
                        t(
                          "workspaces.noDescriptionProvided",
                          "No description provided"
                        )}
                    </p>
                  </div>

                  {/* Workflow Stats */}
                  <div className="mt-4 flex items-center gap-4 text-xs text-zinc-500 relative z-10">
                    <div className="flex items-center gap-1">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <rect width="18" height="18" x="3" y="3" rx="2" />
                        <path d="M9 9h6v6H9z" />
                      </svg>
                      <span>{workflow.canvasState.nodes.length} nodes</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                        <polyline points="7.5,4.21 12,6.81 16.5,4.21" />
                        <polyline points="7.5,19.79 7.5,14.6 3,12" />
                        <polyline points="21,12 16.5,14.6 16.5,19.79" />
                      </svg>
                      <span>
                        {workflow.canvasState.connections.length} connections
                      </span>
                    </div>
                  </div>
                </div>
              ))}

              {/* MCP Tools */}
              {mcpTools.map((mcpTool: McpToolFile) => (
                <div
                  key={mcpTool.id}
                  className="group bg-gradient-to-br from-[#1a1a1a] to-[#151515] rounded-xl border border-zinc-800/50 hover:border-zinc-700/70 transition-all duration-200 hover:shadow-lg hover:shadow-black/20 p-6 relative overflow-hidden"
                >
                  {/* Subtle background pattern */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.01] to-transparent opacity-50"></div>

                  {/* Header with title and actions */}
                  <div className="flex justify-between items-start mb-4 relative z-10">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        {/* MCP Tool icon */}
                        <div className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center bg-gradient-to-br from-blue-600/20 to-blue-700/20 border border-blue-600/30">
                          <Wrench size={14} className="text-blue-400" />
                        </div>

                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-white text-xl leading-tight truncate group-hover:text-blue-400 transition-colors duration-200">
                            {mcpTool.name}
                          </h3>
                          <p className="text-zinc-400 text-sm mt-1">
                            {t("workspaces.lastUpdated", "Last updated")}:{" "}
                            {formatDate(mcpTool.updatedAt)}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex gap-1 ml-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <button
                        onClick={() => handleDeleteMcpTool(mcpTool.id)}
                        className="flex items-center justify-center w-8 h-8 text-red-400 hover:text-red-300 hover:bg-red-400/10 rounded-lg transition-all duration-200"
                        title={t("workspaces.deleteMcpTool", "Delete MCP Tool")}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Description */}
                  <div className="bg-[#0a0a0a]/50 rounded-lg p-4 border border-zinc-800/50 relative z-10">
                    <div className="flex items-center gap-2 mb-2">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="text-zinc-400"
                      >
                        <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                        <polyline points="14,2 14,8 20,8" />
                      </svg>
                      <span className="text-zinc-400 text-xs font-medium uppercase tracking-wide">
                        {t("workspaces.description", "Description")}
                      </span>
                    </div>
                    <p
                      className={`text-sm leading-relaxed ${
                        mcpTool.description
                          ? "text-zinc-200"
                          : "text-zinc-500 italic"
                      }`}
                    >
                      {mcpTool.description ||
                        t(
                          "workspaces.noDescriptionProvided",
                          "No description provided"
                        )}
                    </p>
                  </div>

                  {/* MCP Tool Stats */}
                  <div className="mt-4 flex items-center gap-4 text-xs text-zinc-500 relative z-10">
                    <div className="flex items-center gap-1">
                      <Wrench size={12} />
                      <span>{mcpTool.type}</span>
                    </div>
                    {mcpTool.type === "STDIO" && mcpTool.parameters.command && (
                      <div className="flex items-center gap-1">
                        <span>Command: {mcpTool.parameters.command}</span>
                      </div>
                    )}
                    {mcpTool.type === "HTTP" && mcpTool.parameters.url && (
                      <div className="flex items-center gap-1">
                        <span>URL: {mcpTool.parameters.url}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-zinc-400 py-8 text-center">
            {t(
              "workspaces.noFlows",
              "No workflows or MCP tools have been added to this workspace yet"
            )}
          </div>
        )}
      </div>

      {/* Add Tool or Workflow Dialog */}
      <AddToolOrWorkflowDialog
        isOpen={showCreateDialog}
        onClose={() => setShowCreateDialog(false)}
        onSaveWorkflow={handleCreateWorkflow}
        onSaveMcpTool={handleSaveMcpTool}
      />

      {/* Workflow Edit Dialog */}
      <WorkflowEditDialog
        isOpen={showEditDialog}
        onClose={handleCloseEditDialog}
        onSave={handleEditWorkflow}
        workflow={editingWorkflow}
      />

      {/* MCP & Workflow Import Dialog */}
      <McpWorkflowImportDialog
        isOpen={showImportDialog}
        onClose={() => setShowImportDialog(false)}
        onImportMcps={handleImportMcps}
        onImportWorkflows={handleImportWorkflows}
        currentWorkspaceMcps={workspaceData.mcpTools?.map((m) => m.id ?? "")}
        currentWorkspaceWorkflows={
          workspaceData.workflows?.map((w) => w.id) || []
        }
      />

      {/* Delete confirmation dialog */}
      <DeleteConfirmationDialog
        isOpen={!!showDeleteConfirm}
        itemName={
          workflows.find((w) => w.id === showDeleteConfirm)?.name ||
          "Unknown Workflow"
        }
        itemType="workflow"
        deleteCompletely={deleteCompletely}
        onDeleteCompletelyChange={setDeleteCompletely}
        onCancel={cancelDeleteFlow}
        onConfirm={() =>
          showDeleteConfirm && confirmDeleteFlow(showDeleteConfirm)
        }
      />

      {/* MCP Tool Delete confirmation dialog */}
      <DeleteConfirmationDialog
        isOpen={!!showDeleteMcpConfirm}
        itemName={
          mcpTools.find((t) => t.id === showDeleteMcpConfirm)?.name ||
          "Unknown MCP Tool"
        }
        itemType="mcpTool"
        deleteCompletely={deleteMcpCompletely}
        onDeleteCompletelyChange={setDeleteMcpCompletely}
        onCancel={cancelDeleteMcpTool}
        onConfirm={() =>
          showDeleteMcpConfirm && confirmDeleteMcpTool(showDeleteMcpConfirm)
        }
      />
    </div>
  );
};

export default AiFlowsTab;
