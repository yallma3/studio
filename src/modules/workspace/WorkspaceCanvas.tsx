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
import { GroqChatRunner, parseLLMResponse, executeTasksSequentially, convertToSequentialSteps } from "./utils/runtimeUtils";


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
  const initEvents: ConsoleEvent[] = [];

  const [events, setEvents] = useState<ConsoleEvent[]>(initEvents);

  const addEvent = (newEvent: ConsoleEvent) => {
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
  const prompt = `
  You are an expert AI project planner. Given the following project metadata, return a structured execution plan in **valid JSON**.
  
  ---
  
  Project Info:
  {
    "name": "${workspaceData.name}",
    "description": "${workspaceData.description}"
  }
  
  Agents:
  ${JSON.stringify(
    workspaceData.agents.map(agent => ({
      id: agent.id,
      name: agent.name,
      role: agent.role,
      objective: agent.objective,
      background: agent.background,
      capabilities: agent.capabilities,
      tools: agent.tools?.map(t => t.name) || [],
      llmId: agent.llmId
    })),
    null,
    2
  )}
  
  Tasks:
  ${JSON.stringify(
    workspaceData.tasks.map(task => ({
      id: task.id,
      name: task.name,
      description: task.description,
      expectedOutput: task.expectedOutput,
      type: task.executeWorkflow ? "workflow" : "agentic",
      workflow: task.executeWorkflow && task.workflowId
        ? {
            id: task.workflowId,
            name: task.workflowName || "Unnamed Workflow"
          }
        : null,
      assignedAgent: task.executeWorkflow
        ? null
        : (task.assignedAgent
            ? {
                name: workspaceData.agents.find(a => a.id === task.assignedAgent)?.name || "Unknown",
                fixed: true
              }
            : {
                name: null,
                fixed: false
              })
    })),
    null,
    2
  )}
  
  Workflows:
  ${JSON.stringify(
    workspaceData.workflows.map(wf => ({
      id: wf.id,
      name: wf.name,
      description: wf.description
    })),
    null,
    2
  )}
  
  ---
  
  Instructions:
  Based on the above context, return a project execution plan as valid JSON only.
  
  ### JSON Format to Return:
  
  {
    "project": {
      "name": "string",
      "objective": "string"
    },
    "steps": [
      {
        "step": 1,
        "task": "string = task id",
        "type": "agentic" | "workflow",
        "agent": "string (if type is agentic and assignedAgent.fixed is true, use it; if fixed is false, choose the most suitable agent based on the agent's background, role, capabilities, and tools) = agent id,",
        "workflow": "string (if type is workflow) = workflow id",
        "description": "string",
        "inputs": ["string"],
        "outputs": ["string"],
        "toolsUsed": ["string"],
        "dependsOn": [stepNumber]
      }
    ],
    "collaboration": {
      "notes": "string",
      "pairings": [
        {
          "agents": ["string", "string"],
          "purpose": "string"
        }
      ]
    },
    "workflowRecommendations": [
      {
        "name": "string",
        "action": "use" | "ignore" | "move_to_separate_project",
        "notes": "string"
      }
    ]
  }
  
  Notes:
  - Each step must have either an "agent" (for agentic tasks) or a "workflow" (for automated tasks), never both.
  - For steps where "type" is "agentic":
    - If the task includes a pre-assigned agent, use their name in the "agent" field.
    - If the agent is not pre-assigned, choose the most suitable agent based on role, tools, and capabilities.
  - For steps where "type" is "workflow", provide the "workflow" field with the workflow name and omit the "agent".
  - Fill in "toolsUsed" only if relevant tools are needed from the agent’s toolset.
  - Use "dependsOn" to specify step order or prerequisites if necessary.
  - Output a clean and valid JSON object only — no markdown or extra explanation.
  
  Only return the JSON object — no additional text, markdown, or explanation.
  No Notes at the end.
  `;
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

    // Main workspace LLM
    const runner = new GroqChatRunner(
      nodeRegistry,
      workspaceData.apiKey,
      (event: ConsoleEvent) => console.log(event),
    );
    const result = await runner.run("", prompt)
    
    if (result) {
      const parsed = parseLLMResponse(result);

      // Consosle Events for Project Plan
      if (parsed) {
        console.log("✅ Parsed result:", parsed);

        addEvent({
          id: crypto.randomUUID(),
          type: "success",
          message: `Project Plan Generated`,
          timestamp: Date.now(),
        });

      }else{
        console.log("⚠️ No parsed result");
        addEvent({
          id: crypto.randomUUID(), // Generate a unique ID for the event
          type: "error",
          message: `Error generating project plan`,
          timestamp: Date.now(),
        });
      }

      // Run steps sequentially using the reusable function
      if (parsed?.steps && parsed.steps.length > 0) {

        // Tasks are executed sequentially ( For now ) will be replaced with Tasks graph
        // Task graph of tasks that are executed in parallel or sequentially
        // will be implemented in the future
        const sequentialSteps = convertToSequentialSteps(parsed);
        
        
        const results = await executeTasksSequentially({
          nodeRegistry,
          workspaceData: workspaceData,
          steps: sequentialSteps,
          onStepStart: (step, stepNumber) => {
            addEvent({
              id: crypto.randomUUID(), // Generate a unique ID for the event
              type: "info",
              message: `🚀 Starting step ${stepNumber}: ${step.description}`,
              timestamp: Date.now(),
            });
          },
          onStepComplete: (result) => {
            addEvent({
              id: crypto.randomUUID(), // Generate a unique ID for the event
              type: "success",
              message: `✅ Step ${result.stepNumber} completed successfully`,
              timestamp: Date.now(),
            });
          },
          onError: (error, stepNumber) => {
            addEvent({
              id: crypto.randomUUID(), // Generate a unique ID for the event
              type: "error",
              message: `❌ Step ${stepNumber} failed: ${error}`,
              timestamp: Date.now(),
            });
          },
          onComplete: (results) => {
            const successfulSteps = results.filter(r => r.success).length;
            addEvent({
              id: crypto.randomUUID(), // Generate a unique ID for the event
              type: "success",
              message: `🎉 Execution completed: ${successfulSteps}/${results.length} steps successful`,
              timestamp: Date.now(),
            });
          }
        });
        
        console.log("📊 Execution Summary:", results);
      } else {
        console.log("⚠️ No steps found in parsed result");
      }
      
     
    }

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
