import React, { useState, useEffect, useCallback } from "react";
import {
  X,
  Download,
  FileText,
  Settings,
  Upload,
  FolderOpen,
} from "lucide-react";
import {
  loadAllMcpToolsFromFiles,
  McpToolFile,
} from "../utils/mcpStorageUtils";
import {
  loadAllWorkflowsFromFiles,
  WorkflowFile,
  saveWorkflowToFile,
  generateWorkflowId,
} from "../utils/workflowStorageUtils";
import { open } from "@tauri-apps/plugin-dialog";
import { readTextFile } from "@tauri-apps/plugin-fs";

interface McpWorkflowImportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onImportMcps: (mcps: McpToolFile[]) => void;
  onImportWorkflows: (workflows: WorkflowFile[]) => void;
  currentWorkspaceMcps: string[];
  currentWorkspaceWorkflows: string[];
}

type ImportType = "mcps" | "workflows";

export const McpWorkflowImportDialog: React.FC<
  McpWorkflowImportDialogProps
> = ({
  isOpen,
  onClose,
  onImportMcps,
  onImportWorkflows,
  currentWorkspaceMcps,
  currentWorkspaceWorkflows,
}) => {
  const [activeTab, setActiveTab] = useState<ImportType>("mcps");
  const [availableMcps, setAvailableMcps] = useState<McpToolFile[]>([]);
  const [availableWorkflows, setAvailableWorkflows] = useState<WorkflowFile[]>(
    []
  );
  const [selectedMcps, setSelectedMcps] = useState<string[]>([]);
  const [selectedWorkflows, setSelectedWorkflows] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadAvailableMcps = useCallback(async () => {
    try {
      setIsLoading(true);
      const allMcps = await loadAllMcpToolsFromFiles();
      // Filter out MCPs already in the current workspace
      const filteredMcps = allMcps.filter(
        (mcp) => !currentWorkspaceMcps.includes(mcp.id)
      );
      setAvailableMcps(filteredMcps);
    } catch (error) {
      console.error("Error loading available MCPs:", error);
    } finally {
      setIsLoading(false);
    }
  }, [currentWorkspaceMcps]);

  const loadAvailableWorkflows = useCallback(async () => {
    try {
      setIsLoading(true);
      const allWorkflows = await loadAllWorkflowsFromFiles();
      // Filter out workflows already in the current workspace
      const filteredWorkflows = allWorkflows.filter(
        (workflow) => !currentWorkspaceWorkflows.includes(workflow.id)
      );
      setAvailableWorkflows(filteredWorkflows);
    } catch (error) {
      console.error("Error loading available workflows:", error);
    } finally {
      setIsLoading(false);
    }
  }, [currentWorkspaceWorkflows]);

  useEffect(() => {
    if (isOpen) {
      // Load both MCPs and workflows when dialog opens
      loadAvailableMcps();
      loadAvailableWorkflows();
      // Reset selections
      setSelectedMcps([]);
      setSelectedWorkflows([]);
    }
  }, [isOpen, loadAvailableMcps, loadAvailableWorkflows]);

  const handleMcpToggle = (mcpId: string) => {
    setSelectedMcps((prev) =>
      prev.includes(mcpId)
        ? prev.filter((id) => id !== mcpId)
        : [...prev, mcpId]
    );
  };

  const handleWorkflowToggle = (workflowId: string) => {
    setSelectedWorkflows((prev) =>
      prev.includes(workflowId)
        ? prev.filter((id) => id !== workflowId)
        : [...prev, workflowId]
    );
  };

  const handleImportFromDevice = async () => {
    try {
      const filePath = await open({
        title: "Import Workflow",
        multiple: false,
        filters: [
          {
            name: "JSON Files",
            extensions: ["json"],
          },
        ],
      });

      if (!filePath || typeof filePath !== "string") return;

      const fileContent = await readTextFile(filePath);
      const originalWorkflowData = JSON.parse(fileContent) as WorkflowFile;

      // Validate the workflow data - must be WorkflowFile format
      if (
        !originalWorkflowData.id ||
        !originalWorkflowData.name ||
        !originalWorkflowData.canvasState
      ) {
        alert("Invalid workflow file format.");
        return;
      }

      // Generate new unique ID for the imported workflow
      const newWorkflowId = generateWorkflowId();

      // Create new workflow with new ID and updated timestamps
      const newWorkflowData: WorkflowFile = {
        ...originalWorkflowData,
        id: newWorkflowId,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      // Save the workflow to flows directory with new ID
      await saveWorkflowToFile(newWorkflowData);

      // Import the new workflow
      onImportWorkflows([newWorkflowData]);
      onClose();
    } catch (error) {
      console.error("Error importing workflow from device:", error);
      alert("Error importing workflow file. Please check the file format.");
    }
  };

  const handleImport = () => {
    if (activeTab === "mcps") {
      const mcpsToImport = availableMcps.filter((mcp) =>
        selectedMcps.includes(mcp.id)
      );
      onImportMcps(mcpsToImport);
    } else {
      const workflowsToImport = availableWorkflows.filter((workflow) =>
        selectedWorkflows.includes(workflow.id)
      );
      onImportWorkflows(workflowsToImport);
    }
    onClose();
  };

  const handleSelectAll = () => {
    if (activeTab === "mcps") {
      setSelectedMcps(availableMcps.map((mcp) => mcp.id));
    } else {
      setSelectedWorkflows(availableWorkflows.map((workflow) => workflow.id));
    }
  };

  const handleDeselectAll = () => {
    if (activeTab === "mcps") {
      setSelectedMcps([]);
    } else {
      setSelectedWorkflows([]);
    }
  };

  if (!isOpen) return null;

  const currentItems =
    activeTab === "mcps" ? availableMcps : availableWorkflows;
  const selectedItems = activeTab === "mcps" ? selectedMcps : selectedWorkflows;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 backdrop-blur-sm">
      <div className="bg-gradient-to-br from-[#1c1c1c] to-[#161616] rounded-2xl shadow-2xl border border-zinc-700/50 p-6 max-w-2xl w-full mx-4 h-[600px] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-600/10 border border-blue-600/20 flex items-center justify-center">
              <Download size={14} className="text-blue-400" />
            </div>
            <h3 className="text-lg font-semibold text-white">
              Import MCPs & Workflows
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white transition-colors p-1"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-zinc-800/50 mb-4">
          <button
            onClick={() => setActiveTab("mcps")}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "mcps"
                ? "border-blue-500 text-blue-400"
                : "border-transparent text-zinc-400 hover:text-zinc-300"
            }`}
          >
            <Settings className="inline-block w-4 h-4 mr-2" />
            MCPs ({availableMcps.length})
          </button>
          <button
            onClick={() => setActiveTab("workflows")}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "workflows"
                ? "border-blue-500 text-blue-400"
                : "border-transparent text-zinc-400 hover:text-zinc-300"
            }`}
          >
            <FileText className="inline-block w-4 h-4 mr-2" />
            Workflows ({availableWorkflows.length})
          </button>
        </div>

        {/* Import from Device (Workflows only) */}
        {activeTab === "workflows" && (
          <div className="mb-4">
            <button
              onClick={handleImportFromDevice}
              className="w-full flex items-center gap-3 p-3 bg-zinc-900/20 rounded-lg border border-zinc-800/40 hover:border-zinc-700/60 hover:bg-zinc-900/30 transition-all duration-200 text-left"
            >
              <div className="w-8 h-8 rounded-md bg-zinc-800/50 border border-zinc-700/50 flex items-center justify-center">
                <Upload size={14} className="text-zinc-400" />
              </div>
              <div>
                <div className="text-zinc-200 font-medium text-sm">
                  Import from Device
                </div>
                <div className="text-xs text-zinc-500">
                  Browse and select a workflow file from your computer
                </div>
              </div>
            </button>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {/* Selection Controls */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <FolderOpen size={14} className="text-zinc-500" />
              <span className="text-sm text-zinc-300">
                Available {activeTab === "mcps" ? "MCPs" : "Workflows"}
              </span>
              <span className="text-xs text-zinc-500">
                ({currentItems.length} available)
              </span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleSelectAll}
                className="text-xs text-blue-400 hover:text-blue-300"
              >
                Select All
              </button>
              <button
                onClick={handleDeselectAll}
                className="text-xs text-zinc-400 hover:text-zinc-300"
              >
                Deselect All
              </button>
            </div>
          </div>

          {/* Items List */}
          <div className="flex-1 overflow-y-auto pr-2 space-y-1.5">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-zinc-500 text-sm">Loading...</div>
              </div>
            ) : currentItems.length === 0 ? (
              <div className="text-center py-8 text-zinc-500 text-sm">
                No {activeTab} available to import
              </div>
            ) : (
              currentItems.map((item) => (
                <label
                  key={item.id}
                  className="flex items-start gap-2.5 p-2.5 bg-zinc-900/20 rounded-md border border-zinc-800/30 hover:border-zinc-700/50 hover:bg-zinc-900/30 cursor-pointer transition-colors group"
                >
                  <input
                    type="checkbox"
                    checked={selectedItems.includes(item.id)}
                    onChange={() =>
                      activeTab === "mcps"
                        ? handleMcpToggle(item.id)
                        : handleWorkflowToggle(item.id)
                    }
                    className="w-3.5 h-3.5 mt-0.5 text-blue-600 bg-zinc-800 border-zinc-600 rounded focus:ring-blue-500 focus:ring-1"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      {activeTab === "mcps" ? (
                        <Settings className="w-4 h-4 text-zinc-400" />
                      ) : (
                        <FileText className="w-4 h-4 text-zinc-400" />
                      )}
                      <h5 className="font-medium text-zinc-200 text-sm truncate group-hover:text-white transition-colors">
                        {item.name}
                      </h5>
                      {activeTab === "mcps" && (
                        <span className="text-xs px-2 py-1 bg-zinc-800/50 text-zinc-400 rounded">
                          {(item as McpToolFile).type}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-zinc-500 mb-1.5 line-clamp-1">
                      {item.description || "No description provided"}
                    </p>
                    <div className="flex items-center gap-3 text-xs text-zinc-600">
                      <span>
                        Updated: {new Date(item.updatedAt).toLocaleDateString()}
                      </span>
                      {activeTab === "workflows" && (
                        <>
                          <span>
                            {(item as WorkflowFile).canvasState.nodes.length}{" "}
                            nodes
                          </span>
                          <span>
                            {
                              (item as WorkflowFile).canvasState.connections
                                .length
                            }{" "}
                            connections
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </label>
              ))
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center pt-4 border-t border-zinc-800/50 mt-4">
          <div className="text-xs text-zinc-500">
            {selectedItems.length > 0 && (
              <span>
                {selectedItems.length} {activeTab} selected
              </span>
            )}
          </div>
          <div className="flex gap-2.5">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50 rounded-md transition-colors duration-200 border border-zinc-700/50 hover:border-zinc-600/50"
            >
              Cancel
            </button>
            <button
              onClick={handleImport}
              disabled={selectedItems.length === 0}
              className="px-4 py-2 text-xs font-medium bg-blue-600/10 text-blue-400 border border-blue-600/30 hover:bg-blue-600/20 hover:border-blue-500/40 hover:text-blue-300 rounded-md transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Download size={14} />
              Import {selectedItems.length} {activeTab}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
