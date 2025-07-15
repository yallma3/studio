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
  Download,
  Play,
  MoreVertical,
} from "lucide-react";
import {
  saveWorkspaceToDefaultLocation,
  workspaceFileExists,
  saveWorkspaceState,
} from "./utils/storageUtils";
import { useTranslation } from "react-i18next";

import { WorkspaceData, ConsoleEvent } from "./types/Types";

import { WorkspaceTab, TasksTab, AgentsTab, AiFlowsTab } from "./tabs";

//get access to singltone nodeRegistry
import { nodeRegistry } from "../flow/types/NodeRegistry";

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
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<WorkspaceTabSelector>("workspace");
  const initEvents: ConsoleEvent[] = [
    {
      id: "1",
      timestamp: Date.now() - 30000,
      type: "info",
      message: "Workspace initialized successfully",
      details: "All components loaded and ready",
    },
    {
      id: "2",
      timestamp: Date.now() - 20000,
      type: "success",
      message: "LLM connection established",
      details: "Connected to gpt-3.5-turbo",
    },
    {
      id: "3",
      timestamp: Date.now() - 10000,
      type: "info",
      message: "Auto-save enabled",
      details: "Workspace will be saved every 5 minutes",
    },
  ];

  const [events, setEvents] = useState<ConsoleEvent[]>(initEvents);

  const addEvent = (newEvent: ConsoleEvent) => {
    console.log("Adding event:", newEvent);
    setEvents((prev) => [...prev, newEvent]);
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
  }, [workspaceData.id]); // Only run when workspace ID changes

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
  const handleExportWorkspace = async () => {
    if (!workspaceData) return;

    try {
      const updatedWorkspace = {
        ...workspaceData,
        updatedAt: Date.now(),
      };

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

  // Handle running workspace (placeholder for future implementation)
  const handleRunWorkspace = async () => {
    if (!workspaceData) return;
    // Post a new ConsoleEvent to the events in WorkspaceTab component
    addEvent({
      id: crypto.randomUUID(), // Generate a unique ID for the event
      type: "info",
      message: t("workspaces.runStarted", "Running workspace..."),
      timestamp: Date.now(),
    });

    // instance of main LLM
    const mainLLM = nodeRegistry.createNode("GroqChatNode", 0, { x: 0, y: 0 });
    if (!mainLLM) {
      console.error("Failed to create main LLM node");
      return;
    } else {
      if (mainLLM.setConfigParameter)
        mainLLM.setConfigParameter("API Key", workspaceData.apiKey || "");
      console.log("Main LLM node created successfully:", mainLLM);
    }
    //mainLLM.sockets.

    // workspaceData.tasks.forEach((task) => {
    //   const agent = task.assignedAgent;
    //   console.log("Running task:", task.name, "with agent:", agent);
    // });
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
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </button>
            <div>
              <h1 className="text-xl font-semibold text-white">
                {workspaceData.name ||
                  t("workspaces.untitled", "Untitled Workspace")}
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-4">
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
                  <div className="absolute right-0 mt-2 w-48 bg-zinc-800 border border-zinc-700 rounded-md shadow-lg z-50">
                    <div className="py-1">
                      <button
                        className="w-full text-left px-4 py-2 text-sm text-white hover:bg-zinc-700 flex items-center gap-2"
                        onClick={handleExportWorkspace}
                      >
                        <Download className="h-4 w-4" />
                        Export Workspace
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
              { key: "tasks", label: t("workspaces.tasks", "Tasks") },
              { key: "agents", label: t("workspaces.agents", "Agents") },
              {
                key: "aiflows",
                label: t("workspaces.aiFlows", "AI Workflows"),
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
      <div className="flex-1 bg-[#0a0a0a] overflow-hidden">
        <div className="w-full h-full overflow-auto">
          {/* Render the appropriate tab component based on activeTab */}
          {activeTab === "workspace" && (
            <WorkspaceTab
              workspaceData={workspaceData}
              onUpdateWorkspace={handleUpdateWorkspace}
              events={events}
            />
          )}
          {activeTab === "tasks" && (
            <TasksTab
              workspaceData={workspaceData}
              onTabChanges={handleTabChanges}
            />
          )}
          {activeTab === "agents" && (
            <AgentsTab
              workspaceData={workspaceData}
              onTabChanges={handleTabChanges}
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
