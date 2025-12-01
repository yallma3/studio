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
import {
  ArrowLeft,
  Save,
  AlertCircle,
  CheckCircle,
  Share,
  Play,
  MoreVertical,
  Download,
  ArrowRight,
  StopCircleIcon,
} from "lucide-react";
import {
  saveWorkspaceToDefaultLocation,
  workspaceFileExists,
  saveWorkspaceState,
} from "./utils/storageUtils";
import { sidecarClient, SidecarCommand } from "../api/SidecarClient";
import { useTranslation } from "react-i18next";

import { WorkspaceData, ConsoleEvent, Workflow } from "./types/Types";

import { WorkspaceTab, TasksTab, AgentsTab, AiFlowsTab } from "./tabs";

import { getWorkflow } from "./utils/runtimeUtils";
import { createJson } from "../flow/utils/flowRuntime";

// Toast notification component
interface ToastProps {
  message: string;
  type: "success" | "error";
  onClose: () => void;
  isClosing?: boolean;
}
// Toast notification component
const Toast: React.FC<ToastProps> = ({
  message,
  type,
  onClose,
  isClosing = false,
}) => {
  React.useEffect(() => {
    if (!isClosing) {
      // Auto-hide toast after a delay if not manually closing
      const autoHideTimer = setTimeout(() => {
        onClose();
      }, 2000); // Show for 2 seconds

      return () => clearTimeout(autoHideTimer);
    }
  }, [onClose, isClosing]);

  return (
    <div
      className={`
        fixed bottom-8 left-1/2 transform -translate-x-1/2 
        py-2 px-4 rounded-md shadow-lg flex items-center gap-2 z-50
        transition-all duration-200 ease-out
        ${isClosing ? "opacity-0 translate-y-3" : "opacity-100 translate-y-0"}
        ${
          type === "success"
            ? "bg-[#27272A] text-[#FFC72C]"
            : "bg-[#272724] text-red-400"
        }
      `}
    >
      {type === "success" ? (
        <CheckCircle size={18} className="text-green-400" />
      ) : (
        <AlertCircle size={18} className="text-red-400" />
      )}
      <span>{message}</span>
    </div>
  );
};

type WorkspaceTabSelector = "workspace" | "tasks" | "agents" | "aiflows";

interface WorkspaceCanvasProps {
  workspaceData: WorkspaceData;
  onReturnToHome: () => void;
}

const WorkspaceCanvas: React.FC<WorkspaceCanvasProps> = ({
  workspaceData: initialWorkspaceData,
  onReturnToHome,
}) => {
  const { t, i18n } = useTranslation();
  const [activeTab, setActiveTab] = useState<WorkspaceTabSelector>("workspace");
  const initEvents: ConsoleEvent[] = [];

  const [events, setEvents] = useState<ConsoleEvent[]>(initEvents);

  const addEvent = (newEvent: ConsoleEvent) => {
    try {
      setEvents((prev) => [...prev, newEvent]);
    } catch (error) {
      console.error("Failed to add console event:", error);
    }
  };

  // Maintain workspace data in state
  const [workspaceData, setWorkspaceData] =
    useState<WorkspaceData>(initialWorkspaceData);

  // Track if there are unsaved changes
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false);

  // Toast notification state
  const [toast, setToast] = useState<{
    visible: boolean;
    message: string;
    type: "success" | "error";
    isClosing: boolean;
  }>({
    visible: false,
    message: "",
    type: "success",
    isClosing: false,
  });

  // Dropdown menu state
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Sidecar connection status
  const [sidecarStatus, setSidecarStatus] = useState<string>("disconnected");

  // Expose a stable run handler used by effects and UI controls
  const handleRunWorkspace = React.useCallback(async () => {
    if (!workspaceData) return;

    const message: SidecarCommand = {
      id: crypto.randomUUID(),
      type: "run_workspace",
      workspaceId: workspaceData.id,
      data: JSON.stringify(workspaceData),
      timestamp: new Date().toISOString(),
    };

    sidecarClient.sendMessage(message);
  }, [workspaceData]);

  const handleAbortWorkspace = React.useCallback(async () => {
    const message: SidecarCommand = {
      id: crypto.randomUUID(),
      type: "abort_workspace",
      timestamp: new Date().toISOString(),
    };

    sidecarClient.sendMessage(message);
  }, []);

  // Check if workspace is imported (doesn't exist locally) and set unsaved flag
  useEffect(() => {
    const checkWorkspaceExists = async () => {
      try {
        const exists = await workspaceFileExists(workspaceData);
        if (!exists) {
          // Workspace doesn't exist locally, likely imported - mark as unsaved
          setHasUnsavedChanges(true);
        }
      } catch (error) {
        console.error("Error checking workspace existence:", error);
        // On error, assume it's imported and mark as unsaved
        setHasUnsavedChanges(true);
      }
    };

    checkWorkspaceExists();
  }, [workspaceData]);

  // Set up sidecar client command listener and status listener
  useEffect(() => {
    const handleSidecarCommand = async (command: SidecarCommand) => {
      try {
        if (
          command.type === "console_prompt" ||
          command.type === "console_input"
        ) {
          if (command.data && typeof command.data === "object") {
            const event = command.data as ConsoleEvent;
            // Add to console display
            addEvent(event);
          }
        }

        // Handle resolved console input
        if (command.type === "console_input_resolved") {
          if (command.data && typeof command.data === "object") {
            const { promptId, message } = command.data as {
              promptId: string;
              message: string;
            };
            console.log(
              `Console input resolved for prompt ${promptId}: ${message}`
            );
            // The event is already added to console, just log confirmation
          }
        }

        if (command.type == "message") {
          if (command.data && typeof command.data === "object") {
            addEvent(command.data as ConsoleEvent);
          }
        }

        if (command.type == "run_workflow") {
          console.log("Running Workflow", command.data);
          if (typeof command.data == "string") {
            const workflowData = await getWorkflow(command.data);
            if (workflowData?.canvasState) {
              const workflow = createJson(
                workflowData,
                workflowData?.canvasState.nodes,
                workflowData?.canvasState.connections
              );
              const workflowString = JSON.stringify(workflow, null, 2);

              const message: SidecarCommand = {
                id: command.id,
                type: "workflow_json",
                workspaceId: workspaceData.id,
                data: { data: workflowString },
                timestamp: new Date().toISOString(),
              };
              sidecarClient.sendMessage(message);
            }
          } else {
            console.error(
              "Workflow not found or invalid canvas state:",
              command.data
            );
            addEvent({
              id: crypto.randomUUID(),
              type: "error",
              message: `Failed to load workflow: ${command.data}`,
              timestamp: Date.now(),
            });
          }
        }

        if (command.type === "ping") {
          console.log("Ping command:", command);
        }

        if (command.type === "pong") {
          console.log("Pong command:", command);
        }
      } catch (error) {
        console.error("Error handling sidecar command:", error);
        addEvent({
          id: crypto.randomUUID(),
          type: "error",
          message: `Command handler error: ${
            error instanceof Error ? error.message : String(error)
          }`,
          timestamp: Date.now(),
        });
      }
    };

    const handleStatusChange = (status: string) => {
      setSidecarStatus(status);
    };

    const handleConsoleEvent = (event: ConsoleEvent) => {
      console.log("Received workflow output event:", event);
      addEvent(event);
    };

    sidecarClient.onCommand(handleSidecarCommand);
    sidecarClient.onStatusChange(handleStatusChange);

    sidecarClient.onConsoleEvent((event: ConsoleEvent) => {
      console.log("Received workflow output event:", event);
      addEvent(event);
    });
    // Set initial status
    setSidecarStatus(sidecarClient.getConnectionStatus());

    return () => {
      // Clean up listeners to prevent duplicates
      sidecarClient.offCommand(handleSidecarCommand);
      sidecarClient.offStatusChange(handleStatusChange);
      sidecarClient.offConsoleEvent(handleConsoleEvent);
    };
  }, [workspaceData.id, handleRunWorkspace]);

  // Handle clicks outside dropdown to close it
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Show toast notification
  const showToast = (message: string, type: "success" | "error") => {
    setToast({
      visible: true,
      message,
      type,
      isClosing: false,
    });
  };

  // Hide toast notification with fade-out animation
  const hideToast = useCallback(() => {
    setToast((prev) => ({ ...prev, isClosing: true }));
    setTimeout(() => {
      setToast((prev) => ({ ...prev, visible: false }));
    }, 200); // Match with transition duration in Toast component
  }, []);

  // Handle saving workspace state - simplified to just save directly
  const handleSaveWorkspace = async () => {
    if (!workspaceData) return;

    try {
      const updatedWorkspace = {
        ...workspaceData,
        updatedAt: Date.now(),
      };

      // Update state
      setWorkspaceData(updatedWorkspace);

      // Save to storage using workspace ID
      await saveWorkspaceToDefaultLocation(updatedWorkspace);

      // Clear unsaved changes flag
      setHasUnsavedChanges(false);

      showToast(
        t("workspaces.saved", "Workspace saved successfully"),
        "success"
      );
    } catch (error) {
      console.error("Error saving workspace:", error);
      showToast(t("workspaces.saveError", "Failed to save workspace"), "error");
    }
  };

  // Handle exporting workspace to file
  const handleShareWorkspace = async () => {
    if (!workspaceData) return;

    try {
      const updatedWorkspace = {
        ...workspaceData,
        updatedAt: Date.now(),
      };

      console.log("STATE:", updatedWorkspace);

      // Update state
      setWorkspaceData(updatedWorkspace);

      // Export to file with workspace name as default filename
      await saveWorkspaceState(updatedWorkspace);

      showToast(
        t("workspaces.exported", "Workspace exported successfully"),
        "success"
      );
      setIsDropdownOpen(false); // Close dropdown after export
    } catch (error) {
      console.error("Error exporting workspace:", error);
      showToast(
        t("workspaces.exportError", "Failed to export workspace"),
        "error"
      );
    }
  };

  const handleExportWorkspace = async () => {
    console.log("Exporting workspace...");
    // TODO: Implement new export pipeline - exportWorkspaceAsJs is deprecated
    showToast(
      "Export functionality is temporarily disabled. Use save instead.",
      "error"
    );
  };

  // Handle updating workspace data - only update state, don't save to file
  const handleUpdateWorkspace = async (updatedData: Partial<WorkspaceData>) => {
    if (!workspaceData) return;

    try {
      const updatedWorkspace = {
        ...workspaceData,
        ...updatedData,
        updatedAt: Date.now(),
      };

      // Update state to reflect changes immediately in UI
      setWorkspaceData(updatedWorkspace);

      // Mark that there are unsaved changes
      setHasUnsavedChanges(true);
    } catch (error) {
      console.error("Error updating workspace:", error);
      showToast(
        t("workspaces.updateError", "Failed to update workspace"),
        "error"
      );
    }
  };

  // Simple callback for tabs to signal they have changes (without updating workspace data)
  const handleTabChanges = () => {
    setHasUnsavedChanges(true);
  };

  const handleImportWorkflow = (workflow: Workflow) => {
    const exist = workspaceData.workflows.find((w) => w.id == workflow.id);
    if (exist) return;
    const newWorkflows = [...workspaceData.workflows, workflow];
    setWorkspaceData({ ...workspaceData, workflows: newWorkflows });
  };
  const isRTL = i18n.language === "ar";

  return (
    <div className="w-full h-screen bg-black overflow-hidden flex flex-col">
      {/* Header */}
      <div className="border-b border-zinc-800 bg-zinc-900/50 backdrop-blur-sm relative z-10">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <button
              className="text-zinc-400 hover:text-white p-2 rounded flex items-center"
              onClick={onReturnToHome}
            >
              {isRTL ? (
                <ArrowRight className="h-4 w-4 mr-2" />
              ) : (
                <ArrowLeft className="h-4 w-4 mr-2" />
              )}
              {t("common.back", "Back")}
            </button>

            <div>
              <h1 className="text-xl font-semibold text-white">
                {workspaceData.name ||
                  t("workspaces.untitled", "Untitled Workspace")}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div
                className={`w-2 h-2 rounded-full ${
                  sidecarStatus === "connected"
                    ? "bg-green-500"
                    : sidecarStatus === "connecting"
                    ? "bg-yellow-500"
                    : "bg-red-500"
                }`}
              />

              <span className="text-zinc-400 text-xs">
                {t("workspaces.api", "API")}{" "}
                {sidecarStatus === "connected"
                  ? t("workspaces.connected", "Connected")
                  : sidecarStatus === "connecting"
                  ? t("workspaces.connecting", "Connecting")
                  : t("workspaces.disconnected", "Disconnected")}
              </span>
            </div>

            {hasUnsavedChanges && (
              <div className="text-zinc-500 text-sm font-medium">
                {t("workspaces.unsavedChanges", "Unsaved changes")}
              </div>
            )}
            <div className="flex items-center gap-2">
              <button
                className="bg-green-600 hover:bg-green-500 text-white font-medium px-4 py-2 rounded flex items-center gap-2 transition-colors"
                onClick={handleRunWorkspace}
              >
                <Play className="h-4 w-4" />
              </button>
              <button
                className="bg-red-600 hover:bg-red-500 text-white font-medium px-4 py-2 rounded flex items-center gap-2 transition-colors"
                onClick={handleAbortWorkspace}
              >
                <StopCircleIcon className="h-4 w-4" />
              </button>
              <button
                className="bg-[#FFC72C] hover:bg-[#FFD700] text-black font-medium px-4 py-2 rounded flex items-center gap-2 transition-colors"
                onClick={handleSaveWorkspace}
              >
                <Save className="h-4 w-4" />
              </button>
              {/* Dropdown Menu */}
              <div className="relative" ref={dropdownRef}>
                <button
                  className="bg-zinc-700 hover:bg-zinc-600 text-white font-medium p-2 rounded flex items-center transition-colors"
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                >
                  <MoreVertical className="h-4 w-4" />
                </button>

                {isDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-68 bg-zinc-800 border border-zinc-700 rounded-md shadow-lg z-50">
                    <div className="py-1">
                      <button
                        className="w-full text-left px-4 py-2 text-sm text-white hover:bg-zinc-700 flex items-center gap-2"
                        onClick={handleShareWorkspace}
                      >
                        <Share className="h-4 w-4" />
                        {t("workspaces.shareWorkspace", "Share Workspace")}
                      </button>
                      <button
                        className="w-full text-left px-4 py-2 text-sm text-white hover:bg-zinc-700 flex items-center gap-2"
                        onClick={handleExportWorkspace}
                      >
                        <Download className="h-4 w-4" />
                        {t(
                          "workspaces.exportExecutable",
                          "Export Executable Workspace"
                        )}
                      </button>
                      {/* Future options can be added here */}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="px-6">
          <div className="flex gap-6">
            {[
              {
                key: "workspace",
                label: t("workspaces.workspace", "Workspace"),
              },
              {
                key: "tasks",
                label: t("workspaces.tasks", "Tasks"),
              },
              {
                key: "agents",
                label: t("workspaces.subAgents", "Sub Agents"),
              },
              {
                key: "aiflows",
                label: t(
                  "workspaces.toolsAndWorkflows",
                  "Tools & AI Workflows"
                ),
              },
            ].map((tab) => (
              <button
                key={tab.key}
                className={`pb-4 px-1 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.key
                    ? "border-[#FFC72C] text-[#FFC72C]"
                    : "border-transparent text-zinc-400 hover:text-white hover:border-zinc-600"
                }`}
                onClick={() => setActiveTab(tab.key as WorkspaceTabSelector)}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main canvas area */}
      <div className="bg-[#0a0a0a]">
        <div className="w-full h-full overflow-hidden">
          {/* Render the appropriate tab component based on activeTab */}
          {activeTab === "workspace" && (
            <WorkspaceTab
              workspaceData={workspaceData}
              onUpdateWorkspace={handleUpdateWorkspace}
              events={events}
              onClearEvents={() => setEvents([])}
              onAddEvent={addEvent}
              onSendConsoleInput={(event: ConsoleEvent) => {
                // Send console input via WebSocket
                const message: SidecarCommand = {
                  id: crypto.randomUUID(),
                  type: "console_input",
                  workspaceId: workspaceData.id,
                  data: event,
                  timestamp: new Date().toISOString(),
                };
                sidecarClient.sendMessage(message);
              }}
            />
          )}
          {activeTab === "tasks" && (
            <TasksTab
              workspaceData={workspaceData}
              onTabChanges={handleTabChanges}
              onChange={({ tasks, connections }) =>
                handleUpdateWorkspace({ tasks, connections })
              }
            />
          )}
          {activeTab === "agents" && (
            <AgentsTab
              workspaceData={workspaceData}
              onTabChanges={handleTabChanges}
              handleImportWorkflow={handleImportWorkflow}
            />
          )}
          {activeTab === "aiflows" && (
            <AiFlowsTab
              workspaceData={workspaceData}
              onTabChanges={handleTabChanges}
            />
          )}
        </div>
      </div>

      {/* Toast notification */}
      {toast.visible && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={hideToast}
          isClosing={toast.isClosing}
        />
      )}
    </div>
  );
};

export default WorkspaceCanvas;
