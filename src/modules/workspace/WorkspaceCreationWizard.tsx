/*
* yaLLMa3 - Framework for building AI agents that are capable of learning from their environment and interacting with it.
 
 * Copyright (C) 2025 yaLLMa3
 
 * This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0.
   If a copy of the MPL was not distributed with this file, You can obtain one at https://www.mozilla.org/MPL/2.0/.
 
 * This software is distributed on an "AS IS" basis,
   WITHOUT WARRANTY OF ANY KIND, either express or implied.
   See the Mozilla Public License for the specific language governing rights and limitations under the License.
*/

import React, { useState, useEffect, useMemo } from "react";
import { Button } from "../../shared/components/ui/button";
import { useTranslation } from "react-i18next";
import {
  Plus,
  Trash2,
  ChevronRight,
  ChevronLeft,
  Check,
  X,
  Key,
  Edit2,
} from "lucide-react";
import { WorkspaceData, Agent, Tool, LLMOption, Workflow } from "./types/Types";
import { openUrl } from "@tauri-apps/plugin-opener";
import { TooltipHelper } from "../../shared/components/ui/tooltip-helper";
import Select from "../../shared/components/ui/select";
import { generateUniqueWorkspaceId } from "./utils/storageUtils";
import { AvailableLLMs, LLMModel } from "../../shared/LLM/config";
import { llmsRegistry } from "@/shared/LLM/LLMsRegistry";
import AgentForm from "./components/AgentForm";
import type { AgentFormValues } from "./components/AgentForm";
import { Task, TaskConnection, TaskSocket } from "../task/types/types";

interface WorkspaceCreationWizardProps {
  onClose: () => void;
  onCreateWorkspace: (workspaceData: WorkspaceData) => void;
}

// Generate clean, short random string
const generateCleanId = (length: number = 6): string => {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

const WorkspaceCreationWizard: React.FC<WorkspaceCreationWizardProps> = ({
  onClose,
  onCreateWorkspace,
}) => {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === "ar";
  const [currentStep, setCurrentStep] = useState(1);

  // workspace data state
  const [workspaceData, setWorkspaceData] = useState<WorkspaceData>({
    id: "", // Will be set when component mounts
    createdAt: Date.now(),
    updatedAt: Date.now(),
    // Step 1: workspace Basics
    name: "",
    description: "",

    // Step 2: LLM Selection
    mainLLM: {
      provider: "Groq",
      model: { name: "Llama 3.1 8B", id: "llama-3.1-8b-instant" },
    },
    apiKey: "",
    useSavedCredentials: false,

    // Step 3: Tasks
    tasks: [],
    connections: [],

    // Step 4: Agents
    agents: [],

    // Workflows
    workflows: [],
    mcpTools: [],
  });

  // Initialize unique workspace ID when component mounts
  useEffect(() => {
    const initializeWorkspaceId = async () => {
      const uniqueId = await generateUniqueWorkspaceId();
      setWorkspaceData((prev) => ({
        ...prev,
        id: uniqueId,
      }));
    };

    initializeWorkspaceId();
  }, []);

  // Generate unique task ID - updated format
  const generateTaskId = (): string => {
    const shortDate = Date.now().toString().slice(-6);
    const randomPart = generateCleanId(3);
    return `tk-${shortDate}${randomPart}`;
  };

  // Generate unique agent ID - updated format
  const generateAgentId = (): string => {
    const shortDate = Date.now().toString().slice(-6);
    const randomPart = generateCleanId(3);
    return `ag-${shortDate}${randomPart}`;
  };

  // LLM providers/models derived from AvailableLLMs
  const llmProviders = llmsRegistry.listProviders();
  const fallbackProviders = Object.keys(AvailableLLMs);
  const providerOptions =
    llmProviders.length > 0 ? llmProviders : fallbackProviders;

  const getModelsForProvider = (provider: string): LLMModel[] => {
    const models = llmsRegistry.getProviderModels(provider);
    if (models && models.length > 0) {
      return models;
    }
    return AvailableLLMs[provider] || [];
  };

  // State for selected provider
  const [selectedProvider, setSelectedProvider] =
    useState<LLMOption["provider"]>("Groq");
  // remove unused selectedModel state

  const [llmOptions, setLLMOptions] = useState<LLMModel[]>(
    getModelsForProvider("Groq")
  );

  useEffect(() => {
    setLLMOptions(getModelsForProvider(selectedProvider));
  }, [selectedProvider]);

  // Temporary state for new items
  const [newTask, setNewTask] = useState({
    id: generateTaskId(),
    title: "",
    description: "",
    expectedOutput: "",
    type: "agentic",
    executorId: null as string | null,
    sockets: [] as TaskSocket[],
  });

  const [latestOutputSocket, setLatestOutputSocket] = useState<TaskSocket>();

  // Temporary state for new agents
  type WizardAgentDraft = Omit<Agent, "id" | "tools"> & {
    id?: string;
    tools: Tool[];
  };

  const [newAgent, setNewAgent] = useState<WizardAgentDraft>({
    name: "",
    role: "",
    objective: "",
    background: "",
    capabilities: "",
    tools: [],
    llm: workspaceData.mainLLM,
    variables: {}, // Initialize empty variables object
    apiKey: "",
  });

  // Variables input state moved into AgentForm
  // State for editing agent variables
  const [editingAgentVariables, setEditingAgentVariables] = useState<
    string | null
  >(null);
  const [tempVariables, setTempVariables] = useState<Record<string, string>>(
    {}
  );

  const [taskToEdit, setTaskToEdit] = useState<Task | null>(null);

  // Track if we're in edit mode
  const [isEditingAgent, setIsEditingAgent] = useState(false);
  const [isEditingTask, setIsEditingTask] = useState(false);

  // Step navigation handlers
  const handleNextStep = () => {
    setCurrentStep((prev) => Math.min(prev + 1, 4));
  };

  const handlePrevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handleGoToStep = (step: number) => {
    setCurrentStep(step);
  };

  // Form submission handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // Call the onCreateWorkspace callback
      onCreateWorkspace(workspaceData);

      // Reset form with new unique ID
      const newUniqueId = await generateUniqueWorkspaceId();
      setWorkspaceData({
        id: newUniqueId,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        name: "",
        description: "",
        mainLLM: {
          provider: "Groq",
          model: { name: "Llama 3.1 8B", id: "llama-3.1-8b-instant" },
        },
        apiKey: "",
        useSavedCredentials: false,
        tasks: [],
        connections: [],
        agents: [],
        workflows: [],
        mcpTools: [],
      });
      setSelectedProvider("Groq");
      setCurrentStep(1);
      onClose();
    } catch (error) {
      console.error("Error saving workspace:", error);
      // You could add error handling UI here if needed
    }
  };

  // Step validation
  const isStep1Valid = workspaceData.name.trim() !== "";
  const isStep2Valid = true; // Can proceed even without tasks
  const isStep3Valid = true; // Can proceed even without agents
  const isStep4Valid = true;

  // Get current step validation status
  const getCurrentStepValidation = () => {
    switch (currentStep) {
      case 1:
        return isStep1Valid;
      case 2:
        return isStep2Valid;
      case 3:
        return isStep3Valid;
      case 4:
        return isStep4Valid;
      default:
        return false;
    }
  };

  // Handlers for workspace data changes
  const handleWorkspaceDataChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setWorkspaceData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // On press of add task to add task to workspace's task list and empty form state
  const handleAddTask = () => {
    if (newTask.title.trim()) {
      if (isEditingTask && taskToEdit) {
        // Update existing task
        setWorkspaceData((prev) => ({
          ...prev,
          tasks: prev.tasks.map((task) =>
            task.id === newTask.id ? { ...(newTask as Task) } : task
          ),
        }));
      } else {
        const base = (workspaceData.tasks.length + 1) * 100;
        const generatedSockets: TaskSocket[] = [
          { id: base + 1, title: t("taskNode.input", "Input"), type: "input" },
          {
            id: base + 2,
            title: t("taskNode.output", "Output"),
            type: "output",
          },
        ];
        // Add new task
        const task: Task = {
          id: newTask.id,
          title: newTask.title,
          description: newTask.description,
          expectedOutput: newTask.expectedOutput,
          type: newTask.type,
          executorId: newTask.executorId,
          position: {
            x: base * 5,
            y: Math.floor(Math.random() * 201) - 100,
          },
          selected: false,
          sockets: generatedSockets,
        };
        if (latestOutputSocket) {
          const newConnection: TaskConnection = {
            fromSocket: latestOutputSocket?.id,
            toSocket: generatedSockets[0].id,
          };

          setWorkspaceData((prev) => ({
            ...prev,
            tasks: [...prev.tasks, task],
            connections: [...prev.connections, newConnection],
          }));
        } else {
          setWorkspaceData((prev) => ({
            ...prev,
            tasks: [...prev.tasks, task],
          }));
        }
        setLatestOutputSocket(generatedSockets[1]);
      }

      // Reset form and always default to 'Assign to Agent'
      setNewTask({
        id: generateTaskId(),
        title: "",
        description: "",
        expectedOutput: "",
        type: "agentic",
        executorId: null as string | null,
        sockets: [] as TaskSocket[],
      });
      setTaskToEdit(null);
      setIsEditingTask(false);
    }
  };

  // Handle editing an existing task
  const handleEditTask = (id: string) => {
    const task = workspaceData.tasks.find((t) => t.id === id);
    if (!task) return;
    setTaskToEdit(task);
    setNewTask({
      ...task,
    });
    setIsEditingTask(true);
  };

  const handleRemoveTask = (id: string) => {
    setWorkspaceData((prev) => ({
      ...prev,
      tasks: prev.tasks.filter((task) => task.id !== id),
    }));
  };

  // On press of add agent to add agent to workspace's agent list and empty form state
  const handleAddAgent = () => {
    if (newAgent.name.trim()) {
      if (isEditingAgent && newAgent.id) {
        // Update existing agent
        setWorkspaceData((prev) => ({
          ...prev,
          agents: prev.agents.map((agent) =>
            agent.id === newAgent.id
              ? {
                  ...agent,
                  name: newAgent.name,
                  role: newAgent.role,
                  objective: newAgent.objective,
                  background: newAgent.background,
                  capabilities: newAgent.capabilities,
                  tools: newAgent.tools,
                  llm: newAgent.llm,
                  variables: newAgent.variables,
                  apiKey: newAgent.apiKey,
                }
              : agent
          ),
        }));
      } else {
        // Add new agent
        const agent: Agent = {
          id: generateAgentId(),
          name: newAgent.name,
          role: newAgent.role,
          objective: newAgent.objective,
          background: newAgent.background,
          capabilities: newAgent.capabilities,
          tools: newAgent.tools,
          llm: newAgent.llm,
          variables: newAgent.variables,
          apiKey: newAgent.apiKey,
        };

        setWorkspaceData((prev) => ({
          ...prev,
          agents: [...prev.agents, agent],
        }));
      }

      // Reset form
      setNewAgent({
        name: "",
        role: "",
        objective: "",
        background: "",
        capabilities: "",
        tools: [],
        llm: workspaceData.mainLLM, // Keep using workspace's main LLM as default
        variables: {},
        apiKey: "",
      });
      setIsEditingAgent(false);
    }
  };

  // Handle editing an existing agent
  const handleEditAgent = (id: string) => {
    const agentToEdit = workspaceData.agents.find((agent) => agent.id === id);
    if (agentToEdit) {
      setNewAgent({
        id: agentToEdit.id,
        name: agentToEdit.name,
        role: agentToEdit.role,
        objective: agentToEdit.objective,
        background: agentToEdit.background,
        capabilities: agentToEdit.capabilities,
        llm: agentToEdit.llm,
        apiKey: agentToEdit.apiKey,
        variables: agentToEdit.variables || {},
        tools: agentToEdit.tools,
      });
      setIsEditingAgent(true);
    }
  };

  const handleRemoveAgent = (id: string) => {
    // If we're currently editing this agent, reset the form
    if (isEditingAgent && newAgent.id === id) {
      setNewAgent({
        name: "",
        role: "",
        objective: "",
        background: "",
        capabilities: "",
        tools: [],
        llm: workspaceData.mainLLM,
        variables: {},
        apiKey: "",
      });
      setIsEditingAgent(false);
    }

    setWorkspaceData((prev) => ({
      ...prev,
      agents: prev.agents.filter((agent) => agent.id !== id),
    }));
  };

  // Tool add/remove now handled inside AgentForm

  // Function to open the variable editing dialog for an agent
  const handleOpenVariableDialog = (agentId: string) => {
    const agent = workspaceData.agents.find((a) => a.id === agentId);
    if (agent) {
      setTempVariables(agent.variables || {});
      setEditingAgentVariables(agentId);
    }
  };

  // Function to save edited variables
  const handleSaveVariables = () => {
    if (editingAgentVariables) {
      setWorkspaceData((prev) => ({
        ...prev,
        agents: prev.agents.map((agent) =>
          agent.id === editingAgentVariables
            ? { ...agent, variables: tempVariables }
            : agent
        ),
      }));
      setEditingAgentVariables(null);
    }
  };

  // Function to check if an agent has variables without values
  const hasEmptyVariables = (variables: Record<string, string> = {}) => {
    return Object.values(variables).some((value) => !value.trim());
  };

  // Function to replace variables in text with their values
  const replaceVariables = (
    text: string,
    variables: Record<string, string>
  ) => {
    if (!text) return "";
    let result = text;
    Object.entries(variables || {}).forEach(([key, value]) => {
      const regex = new RegExp(`\\{\\{${key}\\}\\}`, "g");
      result = result.replace(regex, value || `{{${key}}}`);
    });
    return result;
  };

  // Task badges helpers
  const getTaskTypeLabel = (type: string) => {
    switch (type) {
      case "agentic":
        return t("taskModal.agenticAuto", "Agentic (Auto)");
      case "specific-agent":
        return t("taskModal.specificAgent", "Specific Agent");
      case "workflow":
        return t("taskModal.workflow", "Workflow");
      case "MCP":
        return t("taskModal.mcp", "MCP");
      default:
        return type || t("workspaceTab.unknownNode", "Unknown");
    }
  };

  const getExecutorLabel = (type: string, executorId: string | null) => {
    if (!executorId) return "";
    if (type === "specific-agent") {
      const agent = workspaceData.agents.find((a) => a.id === executorId);
      return agent ? agent.name : executorId;
    }
    if (type === "workflow") {
      const wf = workspaceData.workflows.find((w) => w.id === executorId);
      return wf ? wf.name : executorId;
    }
    return executorId;
  };

  const handleImportWorkflow = (workflow: Workflow) => {
    const exist = workspaceData.workflows.find((w) => w.id == workflow.id);
    if (exist) return;
    const newWorkflows = [...workspaceData.workflows, workflow];
    setWorkspaceData({ ...workspaceData, workflows: newWorkflows });
  };

  // Background preview is handled within AgentForm

  // Note: We've removed the handleToolPropertyChange function as it's no longer needed
  // Tool properties are now set directly in the popup dialog

  //Top Step indicator component
  const renderStepIndicator = () => {
    const steps = [
      { number: 1, title: t("workspaces.workspaceBasics", "Workspace Setup") },
      { number: 2, title: t("workspaces.createAgents", "Agents") },
      { number: 3, title: t("workspaces.defineTasks", "Tasks") },
      { number: 4, title: t("workspaces.review", "Review & Confirm") },
    ];

    return (
      <div className="flex justify-between mb-10 relative">
        {/* Progress bars */}
        <div className="absolute top-6 left-0 right-0 flex justify-between z-0 px-6 mx-3">
          {steps.slice(0, -1).map((step) => (
            <div key={`progress-${step.number}`} className="flex-1 mx-0">
              <div
                className={`h-1 ${
                  currentStep > step.number ? "bg-[#FFC72C]" : "bg-zinc-700"
                } 
                transition-all duration-300 ease-in-out`}
              />
            </div>
          ))}
        </div>

        {steps.map((step) => (
          <div
            key={step.number}
            className="flex justify-center items-center relative z-10"
          >
            <div className="flex flex-col items-center">
              <div
                className={`flex items-center justify-center w-12 h-12 rounded-full border-2 ${
                  currentStep === step.number
                    ? "bg-[#FFC72C] border-[#FFC72C] text-zinc-900"
                    : currentStep > step.number
                    ? "bg-[#FFC72C] border-[#FFC72C] text-zinc-900"
                    : "bg-zinc-800 border-zinc-700 text-zinc-400"
                } font-bold text-lg transition-all duration-300 ease-in-out`}
              >
                {currentStep > step.number ? (
                  <Check className="h-6 w-6" />
                ) : (
                  step.number
                )}
              </div>
              <span
                className={`mt-2 text-sm ${
                  currentStep >= step.number ? "text-white" : "text-zinc-500"
                }`}
              >
                {step.title}
              </span>
            </div>
          </div>
        ))}
      </div>
    );
  };

  // Available tools derived from workflows (for ToolSelectionPopup)
  const availableTools = useMemo(() => {
    const workflowTools: Tool[] =
      workspaceData.workflows?.map((workflow) => ({
        type: "workflow" as const,
        name: workflow.name,
        description: `${workflow.description || ""}-- WorkflowId: ${
          workflow.id
        }`,
      })) || [];
    return workflowTools;
  }, [workspaceData.workflows]);

  const availableMcpTools = useMemo(() => {
    return workspaceData.mcpTools;
  }, [workspaceData.mcpTools]);

  return (
    <div className="flex items-center min-h-screen justify-center inset-0 z-50 bg-zinc-900 p-4">
      <div className="flex flex-col w-full max-w-6xl bg-zinc-900 border border-zinc-800 shadow-xl rounded-lg px-4 pb-24 relative">
        <div className="flex justify-between items-center p-6 border-b border-zinc-800">
          <h1 className="text-2xl font-bold text-white ">
            {t("workspaces.createNewWorkspace", "Create New Workspace")}
          </h1>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-2 ">
          {renderStepIndicator()}

          <form
            onSubmit={(e) => e.preventDefault()}
            className="w-full mx-auto px-2 max-w-7xl"
          >
            {/* Step 1: Workspace Basics and LLM Selection */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-white mb-4 ">
                    {t("workspaces.workspaceBasics", "Workspace Setup")}
                  </h2>
                </div>

                {/* Side-by-side layout */}
                <div className="flex flex-col md:flex-row gap-6 w-full">
                  {/* Workspace Info Section */}
                  <div className="bg-zinc-800/50 rounded-lg p-5 border border-zinc-700 flex-1">
                    <h3 className="text-lg font-medium text-white mb-4 ">
                      {t("workspaces.workspaceInfo", "Workspace Information")}
                    </h3>

                    <div className="space-y-4">
                      <div className="flex flex-col gap-2">
                        <label
                          htmlFor="name"
                          className="block text-sm font-medium text-gray-300 mb-1 "
                        >
                          {t("workspaces.workspaceName", "Workspace Name")}{" "}
                          <span className="text-yellow-500">*</span>
                        </label>
                        <input
                          type="text"
                          id="name"
                          name="name"
                          value={workspaceData.name}
                          onChange={handleWorkspaceDataChange}
                          className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                          placeholder={t(
                            "workspaces.enterWorkspaceName",
                            "Enter workspace name"
                          )}
                          maxLength={40}
                          required
                        />
                      </div>
                      <div className="flex flex-col gap-2">
                        <label
                          htmlFor="description"
                          className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-1 "
                        >
                          {t(
                            "workspaces.workspaceDescription",
                            "Workspace Description"
                          )}
                          <TooltipHelper
                            text={t(
                              "workspaces.workspaceDescriptionTooltip",
                              "Provide a description that helps you and others to understand the purpose of the workspace"
                            )}
                            position="bottom"
                          />
                        </label>
                        <textarea
                          id="description"
                          name="description"
                          value={workspaceData.description}
                          onChange={handleWorkspaceDataChange}
                          className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-500 h-32"
                          placeholder={t(
                            "workspaces.enterWorkspaceDescription",
                            "Describe the purpose of this workspace..."
                          )}
                          maxLength={250}
                        />
                      </div>
                    </div>
                  </div>

                  {/* LLM Selection Section */}
                  <div className="bg-zinc-800/50 rounded-lg p-5 border border-zinc-700 flex-1">
                    <h3 className="text-lg font-medium text-white mb-4 ">
                      {t("workspaces.selectLLM", "Select Main LLM")}{" "}
                      <span className="text-gray-400 text-sm">
                        ({t("workspaces.optional", "Optional")})
                      </span>
                    </h3>
                    <div className="grid grid-cols-5 gap-4">
                      {/* Provider Selection */}
                      <div className="mb-6 col-span-2">
                        <Select
                          id="provider"
                          value={selectedProvider}
                          onChange={(value) =>
                            setSelectedProvider(value as LLMOption["provider"])
                          }
                          options={providerOptions.map((provider) => ({
                            value: provider,
                            label: provider,
                          }))}
                          placeholder={t(
                            "workspaces.selectProviderPlaceholder",
                            "Select a provider..."
                          )}
                          label={t(
                            "workspaces.selectProvider",
                            "Select Provider"
                          )}
                        />
                      </div>

                      {/* Model Selection */}
                      <div className="mb-6 col-span-3">
                        <Select
                          id="model"
                          value={workspaceData.mainLLM.model?.id || ""}
                          onChange={(value) => {
                            const option = llmOptions.find(
                              (m) => m.id == value
                            );
                            if (!option) return;

                            setWorkspaceData((prev) => ({
                              ...prev,
                              // set new LLM option
                              mainLLM: {
                                provider: selectedProvider,
                                model: option,
                              },
                            }));
                          }}
                          options={[
                            {
                              value: "",
                              label: t(
                                "workspaces.selectModelPlaceholder",
                                "Select a model..."
                              ),
                              disabled: true,
                            },
                            ...(llmOptions || []).map((m) => ({
                              value: m.id,
                              label: m.name,
                            })),
                          ]}
                          disabled={!selectedProvider}
                          label={t("workspaces.selectModel", "Select Model")}
                        />
                      </div>
                    </div>

                    {/* API Key Section */}
                    <div className="mb-8 space-y-4">
                      <label
                        htmlFor="apiKeyOption"
                        className="block text-sm font-medium text-gray-300 mb-2 "
                      >
                        {t("workspaces.apiKey", "API Key")}
                      </label>

                      {/* API Key Options */}
                      <div className="flex gap-2 mb-4">
                        <button
                          type="button"
                          onClick={() =>
                            setWorkspaceData((prev) => ({
                              ...prev,
                              useSavedCredentials: false,
                            }))
                          }
                          className={`flex-1 py-2 px-4 rounded-md transition-all cursor-pointer ${
                            !workspaceData.useSavedCredentials
                              ? "bg-yellow-400 text-black font-medium"
                              : "bg-zinc-800 text-white border border-zinc-700 hover:bg-zinc-700"
                          }`}
                        >
                          {t("workspaces.newKey", "New Key")}
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setWorkspaceData((prev) => ({
                              ...prev,
                              useSavedCredentials: true,
                            }))
                          }
                          className={`flex-1 py-2 px-4 rounded-md transition-all cursor-pointer ${
                            workspaceData.useSavedCredentials
                              ? "bg-yellow-400 text-black font-medium"
                              : "bg-zinc-800 text-white border border-zinc-700 hover:bg-zinc-700"
                          }`}
                        >
                          {t("workspaces.keysVault", "Keys Vault")}
                        </button>
                      </div>

                      {/* API Key Input Container with fixed height */}
                      <div className="h-24">
                        {" "}
                        {/* Fixed height container */}
                        {!workspaceData.useSavedCredentials ? (
                          <div>
                            <div className="relative">
                              <input
                                type="password"
                                id="apiKey"
                                name="apiKey"
                                value={workspaceData.apiKey}
                                onChange={handleWorkspaceDataChange}
                                className="w-full pl-9 pr-3 py-2 bg-zinc-800 border border-zinc-700 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                                placeholder={t(
                                  "workspaces.enterApiKey",
                                  "Enter API key"
                                )}
                              />
                              <Key className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                            </div>
                            <div className="flex items-center mt-1">
                              <p className="text-xs text-gray-400">
                                {t(
                                  "workspaces.apiKeyInfo",
                                  "Your API key is stored locally and never shared"
                                )}
                              </p>
                              {selectedProvider === "Groq" && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    openUrl("https://console.groq.com/keys")
                                  }
                                  className="text-xs text-yellow-400 hover:text-yellow-300 ml-2 underline cursor-pointer"
                                >
                                  {t(
                                    "workspaces.getGroqApiKey",
                                    "Get Groq API Key"
                                  )}
                                </button>
                              )}
                            </div>
                          </div>
                        ) : (
                          /* Keys Vault Selection */
                          <div>
                            <Select
                              id="savedKey"
                              value={workspaceData.apiKey}
                              onChange={(value) =>
                                setWorkspaceData((prev) => ({
                                  ...prev,
                                  apiKey: value,
                                }))
                              }
                              options={[
                                {
                                  value: "",
                                  label: t(
                                    "workspaces.selectSavedKey",
                                    "Select a saved key..."
                                  ),
                                  disabled: true,
                                },
                                { value: "key1", label: "Groq API Key" },
                                { value: "key2", label: "OpenAI API Key" },
                              ]}
                              label={t("workspaces.savedKey", "Saved Key")}
                            />
                            <p className="text-xs text-gray-400 mt-1">
                              {t(
                                "workspaces.savedKeyInfo",
                                "Use a previously saved API key from your vault"
                              )}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Create Agents */}
            {currentStep === 2 && (
              <div className="space-y-6 ">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h2 className="text-xl font-bold text-white">
                      {t("workspaces.createAgents", "Create Agents")}
                    </h2>
                    <span className="text-blue-400 text-xs flex items-center">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-3 w-3 mr-1"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                          clipRule="evenodd"
                        />
                      </svg>
                      {t(
                        "workspaces.modifyLater",
                        "You can always modify Agents later"
                      )}
                    </span>
                  </div>
                  <p className="text-gray-400 mb-6">
                    {t(
                      "workspaces.createAgentsDescription",
                      "An agent has a role and can perform tasks based on its capabilities."
                    )}
                  </p>
                </div>

                {/* Side-by-side layout for agent creation and list */}
                <div className="flex flex-col lg:flex-row gap-6">
                  {/* Add Agent Form */}
                  <div className="bg-zinc-800/50 rounded-lg p-6 border border-zinc-700 lg:w-4/7">
                    <h3 className="text-lg font-medium text-white mb-4 ">
                      {isEditingAgent
                        ? t(
                            "workspaces.updateAgent",
                            `Update Agent: ${newAgent.name}`
                          )
                        : t("workspaces.addAgent", `Add Agent`)}
                    </h3>

                    <AgentForm
                      value={{
                        name: newAgent.name,
                        role: newAgent.role,
                        background: newAgent.background,
                        llm: newAgent.llm,
                        apiKey: newAgent.apiKey,
                        tools: newAgent.tools,
                        variables: newAgent.variables,
                      }}
                      onChange={(val: AgentFormValues) =>
                        setNewAgent((prev) => ({
                          ...prev,
                          name: val.name,
                          role: val.role,
                          background: val.background,
                          llm: {
                            provider: val.llm.provider,
                            model: val.llm.model || prev.llm.model,
                          },
                          apiKey: val.apiKey,
                          tools: val.tools,
                          variables: val.variables || {},
                        }))
                      }
                      handleImportWorkflow={handleImportWorkflow}
                      availableTools={availableTools}
                      availableMcpTools={availableMcpTools}
                      enableVariables={false}
                      workspaceMainLLMName={workspaceData.mainLLM.model?.name}
                    />

                    {isEditingAgent ? (
                      <div className="flex gap-2">
                        <Button
                          onClick={() => {
                            setNewAgent({
                              name: "",
                              role: "",
                              objective: "",
                              background: "",
                              capabilities: "",
                              tools: [],
                              llm: workspaceData.mainLLM,
                              apiKey: "",
                            });
                            setIsEditingAgent(false);
                          }}
                          className="flex-1 bg-zinc-700 hover:bg-zinc-600 text-white font-medium border-0 flex items-center justify-center"
                        >
                          <X className="h-4 w-4" />
                          {t("workspaces.cancelEdit", "Cancel")}
                        </Button>
                        <Button
                          onClick={handleAddAgent}
                          className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-black font-medium border-0 flex items-center justify-center"
                          disabled={!newAgent.name.trim()}
                        >
                          <Check className="h-4 w-4" />
                          {t("workspaces.updateAgent", "Update Agent")}
                        </Button>
                      </div>
                    ) : (
                      <Button
                        onClick={handleAddAgent}
                        className={`w-full bg-yellow-500 hover:bg-yellow-600 text-black font-medium border-0 flex items-center justify-center ${
                          newAgent.name.trim()
                            ? "cursor-pointer"
                            : "cursor-not-allowed"
                        }`}
                        disabled={!newAgent.name.trim()}
                      >
                        <Plus className="h-4 w-4" />
                        {t("workspaces.addAgent", "Add Agent")}
                      </Button>
                    )}
                  </div>

                  {/* Agent List */}
                  <div className="bg-zinc-800/50 rounded-lg p-6 border border-zinc-700 lg:w-3/7">
                    <h3 className="flex justify-between items-center text-lg font-medium text-white mb-4 ">
                      <span>{t("workspaces.agentList", "Agent List")}</span>{" "}
                      {workspaceData.agents.length > 0 && (
                        <span className="text-gray-400 text-sm">
                          {" "}
                          {workspaceData.agents.length}{" "}
                          {t("workspaces.agents", "agent(s)")}{" "}
                          {t("common.add", "added")}
                        </span>
                      )}
                    </h3>

                    {workspaceData.agents.length > 0 ? (
                      <div className="space-y-3 max-h-[500px] overflow-y-auto">
                        {workspaceData.agents.map((agent) => (
                          <div
                            key={agent.id}
                            className="bg-zinc-800 rounded-lg p-4 flex flex-col"
                          >
                            <div className="flex justify-between items-start">
                              <div>
                                <div className="flex items-center">
                                  <h4 className="font-medium text-white">
                                    {agent.name}
                                  </h4>
                                </div>
                                {agent.role && (
                                  <div>
                                    <span className="text-sm text-yellow-400">
                                      {agent.role}
                                    </span>
                                  </div>
                                )}
                                {agent.objective && (
                                  <p className="text-sm text-gray-400 mt-1">
                                    {agent.objective}
                                  </p>
                                )}
                                {agent.capabilities && (
                                  <p className="text-sm text-gray-400 mt-1">
                                    {agent.capabilities}
                                  </p>
                                )}
                                {agent.llm?.model &&
                                  agent.llm.model !==
                                    workspaceData.mainLLM.model && (
                                    <div className="mt-1 flex items-center">
                                      <span className="text-xs text-yellow-400">
                                        LLM: {agent.llm.model.name}
                                      </span>
                                    </div>
                                  )}
                              </div>
                              <div className="flex space-x-2">
                                <button
                                  onClick={() => handleEditAgent(agent.id)}
                                  className="text-gray-400 hover:text-yellow-400 transition-colors cursor-pointer"
                                >
                                  <Edit2 className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => handleRemoveAgent(agent.id)}
                                  className="text-gray-400 hover:text-red-500 transition-colors cursor-pointer"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            </div>

                            {/* Display background with variables replaced */}
                            {agent.background && (
                              <div className="mt-3 p-3 bg-zinc-900/50 border border-zinc-700 rounded-md">
                                <p className="text-xs text-gray-400 mb-1">
                                  {t(
                                    "workspaces.agentBackground",
                                    "Background:"
                                  )}
                                </p>
                                <p className="text-sm text-gray-300">
                                  {replaceVariables(
                                    agent.background,
                                    agent.variables || {}
                                  )}
                                </p>
                              </div>
                            )}

                            {/* Display variables summary with edit button */}
                            {agent.variables &&
                              Object.keys(agent.variables).length > 0 && (
                                <div className="mt-3 flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <p className="text-xs text-gray-400">
                                      {t(
                                        "workspaces.agentVariables",
                                        "Variables:"
                                      )}
                                    </p>
                                    <span className="text-xs text-gray-300">
                                      {Object.keys(agent.variables).length}{" "}
                                      {t("workspaces.defined", "defined")}
                                    </span>
                                    {hasEmptyVariables(agent.variables) && (
                                      <span className="text-xs text-amber-500 flex items-center gap-1">
                                        <svg
                                          xmlns="http://www.w3.org/2000/svg"
                                          className="h-3 w-3"
                                          viewBox="0 0 20 20"
                                          fill="currentColor"
                                        >
                                          <path
                                            fillRule="evenodd"
                                            d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                                            clipRule="evenodd"
                                          />
                                        </svg>
                                        {t(
                                          "workspaces.emptyValues",
                                          "Empty values"
                                        )}
                                      </span>
                                    )}
                                  </div>
                                  <button
                                    onClick={() =>
                                      handleOpenVariableDialog(agent.id)
                                    }
                                    className="text-xs text-yellow-400 hover:text-yellow-500 flex items-center gap-1"
                                  >
                                    <Edit2 className="h-3 w-3" />
                                    {t(
                                      "workspaces.editVariables",
                                      "Edit Values"
                                    )}
                                  </button>
                                </div>
                              )}

                            {/* Display tools */}
                            {agent.tools && agent.tools.length > 0 && (
                              <div className="mt-2">
                                <span className="text-xs text-gray-400">
                                  {t("agentsTab.tools", "Tools")}:
                                </span>
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {agent.tools.map((tool, index) => (
                                    <span
                                      key={index}
                                      className="text-xs bg-zinc-700 text-gray-300 px-2 py-0.5 rounded"
                                    >
                                      {tool.name}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center text-gray-400 py-8 bg-zinc-800/30 rounded-lg border border-zinc-700">
                        {t("workspaces.noAgents", "No agents added yet")}
                      </div>
                    )}
                  </div>

                  {/* Variables Editing Dialog */}
                  {editingAgentVariables && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                      <div className="bg-zinc-900 rounded-lg p-5 border border-zinc-700 w-full max-w-lg shadow-xl animate-in fade-in duration-200">
                        <div className="flex justify-between items-center mb-4">
                          <h3 className="text-lg font-medium text-white">
                            {t("workspaces.editVariables", "Edit Variables")}
                          </h3>
                          <button
                            onClick={() => setEditingAgentVariables(null)}
                            className="text-gray-400 hover:text-white"
                          >
                            <X className="h-5 w-5" />
                          </button>
                        </div>

                        <div className="mb-4 p-2 max-h-[60vh] overflow-y-auto">
                          {Object.keys(tempVariables).length > 0 ? (
                            <div className="space-y-3">
                              {Object.entries(tempVariables).map(
                                ([key, value]) => (
                                  <div
                                    key={key}
                                    className="flex flex-col gap-1"
                                  >
                                    <div className="flex justify-between items-center">
                                      <label className="text-sm font-medium text-yellow-400 mb-1">{`{{${key}}}`}</label>
                                    </div>
                                    <input
                                      type="text"
                                      value={value}
                                      onChange={(e) => {
                                        setTempVariables((prev) => ({
                                          ...prev,
                                          [key]: e.target.value,
                                        }));
                                      }}
                                      className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
                                      placeholder={t(
                                        "workspaces.enterValue",
                                        "Enter value"
                                      )}
                                    />
                                  </div>
                                )
                              )}
                            </div>
                          ) : (
                            <p className="text-center text-gray-400 py-4">
                              {t(
                                "workspaces.noVariables",
                                "No variables defined"
                              )}
                            </p>
                          )}
                        </div>

                        <div className="flex items-center justify-between mt-4">
                          <div></div>
                          <div className="flex gap-2">
                            <Button
                              onClick={() => setEditingAgentVariables(null)}
                              className="bg-zinc-700 hover:bg-zinc-600 text-white font-medium border-0"
                            >
                              {t("common.cancel", "Cancel")}
                            </Button>
                            <Button
                              onClick={handleSaveVariables}
                              className="bg-yellow-500 hover:bg-yellow-600 text-black font-medium border-0"
                            >
                              {t("common.save", "Save")}
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Step 3: Define Tasks */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h2 className="text-xl font-bold text-white">
                      {t("workspaces.defineTasks", "Define Tasks")}
                    </h2>
                    <span className="text-blue-400 text-xs flex items-center">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-3 w-3 mr-1"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                          clipRule="evenodd"
                        />
                      </svg>
                      {t(
                        "workspaces.modifyLater",
                        "You can always modify Tasks later"
                      )}
                    </span>
                  </div>
                  <p className="text-gray-400 mb-6">
                    {t(
                      "workspaces.defineTasksDescription",
                      "Define the tasks that your agents will work on."
                    )}
                  </p>
                </div>

                {/* Side-by-side layout for task creation and list */}
                <div className="flex flex-col lg:flex-row gap-6 h-full">
                  {/* Add Task Form (Left 2/3) */}
                  <div className="bg-zinc-800/50 rounded-lg p-6 border border-zinc-700 lg:w-2/3 flex flex-col h-full">
                    <h3 className="text-lg font-medium text-white mb-4 ">
                      {isEditingTask
                        ? t(
                            "workspaces.updateTask",
                            `Update Task: ${newTask.title}`
                          )
                        : t(
                            "workspaces.addTask",
                            `Add Task (${workspaceData.tasks.length + 1})`
                          )}
                    </h3>

                    <div className="space-y-4 mb-4">
                      <div>
                        <label
                          htmlFor="taskName"
                          className="block text-sm font-medium text-gray-300 mb-1 "
                        >
                          {t("workspaces.taskName", "Name")}{" "}
                          <span className="text-yellow-500">*</span>
                        </label>
                        <input
                          type="text"
                          id="taskName"
                          value={newTask.title}
                          onChange={(e) =>
                            setNewTask((prev) => ({
                              ...prev,
                              title: e.target.value,
                            }))
                          }
                          className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                          placeholder={t(
                            "workspaces.enterTaskName",
                            "Enter task name"
                          )}
                          maxLength={40}
                        />
                      </div>

                      <div>
                        <label
                          htmlFor="taskDescription"
                          className="block text-sm font-medium text-gray-300 mb-1 "
                        >
                          {t("workspaces.taskDescription", "Description")}
                        </label>
                        <textarea
                          id="taskDescription"
                          value={newTask.description}
                          onChange={(e) =>
                            setNewTask((prev) => ({
                              ...prev,
                              description: e.target.value,
                            }))
                          }
                          className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-500 h-20"
                          placeholder={t(
                            "workspaces.enterTaskDescription",
                            "Enter task description"
                          )}
                          maxLength={1000}
                        />
                      </div>
                      <div>
                        <label
                          htmlFor="taskExpectedOutput"
                          className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-1 "
                        >
                          {t(
                            "workspaces.taskExpectedOutput",
                            "Expected Output"
                          )}
                          <TooltipHelper
                            text={t(
                              "workspaces.taskExpectedOutputTooltip",
                              "This can be output type, format, content or any validation criteria"
                            )}
                            position="bottom"
                          />
                        </label>
                        <textarea
                          id="taskExpectedOutput"
                          value={newTask.expectedOutput}
                          onChange={(e) =>
                            setNewTask((prev) => ({
                              ...prev,
                              expectedOutput: e.target.value,
                            }))
                          }
                          className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                          placeholder={t(
                            "workspaces.enterTaskExpectedOutput",
                            "Enter task expected output"
                          )}
                          maxLength={1000}
                        />
                      </div>
                      <div className="flex gap-4">
                        <div className="flex-1">
                          <label
                            htmlFor="type"
                            className="block text-sm font-medium text-gray-300 mb-1"
                          >
                            {t("taskModal.type", "Type")}
                          </label>
                          <Select
                            id="type"
                            value={newTask.type}
                            onChange={(value) => {
                              setNewTask((prev) => {
                                let newExecutorId = prev.executorId;
                                if (
                                  value === "specific-agent" &&
                                  workspaceData.agents.length === 1
                                ) {
                                  newExecutorId = workspaceData.agents[0].id;
                                } else if (
                                  value === "agentic" ||
                                  value !== prev.type
                                ) {
                                  newExecutorId = null;
                                }
                                return {
                                  ...prev,
                                  type: value,
                                  executorId: newExecutorId,
                                };
                              });
                            }}
                            options={[
                              {
                                value: "agentic",
                                label: t(
                                  "taskModal.agenticAuto",
                                  "Agentic (Auto)"
                                ),
                              },
                              {
                                value: "specific-agent",
                                label: t(
                                  "taskModal.specificAgent",
                                  "Specific Agent"
                                ),
                              },
                              {
                                value: "workflow",
                                label: t("taskModal.workflow", "Workflow"),
                              },
                            ]}
                          />
                          <p className="text-xs text-gray-400 mt-1">
                            {newTask.type === "agentic"
                              ? t(
                                  "taskModal.typeNoteAgentic",
                                  "yaLLMa3 main Agent will decide how to handle the Task"
                                )
                              : newTask.type === "specific-agent"
                              ? t(
                                  "taskModal.typeNoteSpecific",
                                  "Select Agent to perform the Task"
                                )
                              : t(
                                  "taskModal.typeNoteWorkflow",
                                  "The specified Workflow will be used to perform the Task"
                                )}
                          </p>
                        </div>
                        {newTask.type === "specific-agent" ||
                        newTask.type === "workflow" ? (
                          <div className="flex-1">
                            <label
                              htmlFor="executorId"
                              className="block text-sm font-medium text-gray-300 mb-1"
                            >
                              {newTask.type === "specific-agent"
                                ? t("workspaces.selectAgent", "Select Agent")
                                : t(
                                    "workspaces.selectWorkflow",
                                    "Select Workflow"
                                  )}
                            </label>
                            <Select
                              id="executorId"
                              value={newTask.executorId || ""}
                              onChange={(value) => {
                                setNewTask((prev) => ({
                                  ...prev,
                                  executorId: value || null,
                                }));
                              }}
                              options={[
                                {
                                  value: "",
                                  label:
                                    newTask.type === "workflow"
                                      ? t(
                                          "workspaces.workflowLater",
                                          "Not for now, I'll specify later"
                                        )
                                      : newTask.type === "specific-agent"
                                      ? t(
                                          "workspaces.agentLater",
                                          "Not for now, I'll select later"
                                        )
                                      : t("taskModal.none", "None"),
                                },
                                ...(newTask.type === "specific-agent"
                                  ? workspaceData.agents.map((agent) => ({
                                      value: agent.id,
                                      label: agent.name,
                                    }))
                                  : workspaceData.workflows.map((wf) => ({
                                      value: wf.id,
                                      label: wf.name,
                                    }))),
                              ]}
                            />
                          </div>
                        ) : null}
                      </div>
                    </div>

                    {isEditingTask ? (
                      <div className="flex gap-2">
                        <Button
                          onClick={() => {
                            setNewTask({
                              id: generateTaskId(),
                              title: "",
                              description: "",
                              expectedOutput: "",
                              type: "agentic",
                              executorId: null as string | null,
                              sockets: [] as TaskSocket[],
                            });
                            setTaskToEdit(null);
                            setIsEditingTask(false);
                          }}
                          className="flex-1 bg-zinc-700 hover:bg-zinc-600 text-white font-medium border-0 flex items-center justify-center"
                        >
                          <X className="h-4 w-4 mr-1" />
                          {t("workspaces.cancelEdit", "Cancel")}
                        </Button>
                        <Button
                          onClick={handleAddTask}
                          className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-black font-medium border-0 flex items-center justify-center"
                          disabled={!newTask.title.trim()}
                        >
                          <Check className="h-4 w-4 mr-1" />
                          {t("workspaces.updateTask", "Update Task")}
                        </Button>
                      </div>
                    ) : (
                      <Button
                        onClick={handleAddTask}
                        className={`w-full bg-yellow-500 hover:bg-yellow-600 text-black font-medium border-0 flex items-center justify-center ${
                          newTask.title.trim()
                            ? "cursor-pointer"
                            : "cursor-not-allowed"
                        }`}
                        disabled={!newTask.title.trim()}
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        {t("workspaces.addTask", "Add Task")}
                      </Button>
                    )}
                  </div>

                  {/* Task List (Right 1/3) */}
                  <div className="bg-zinc-800/50 rounded-lg p-6 border border-zinc-700 lg:w-1/3 flex flex-col ">
                    <h3 className="text-lg font-medium text-white mb-4 ">
                      {t("workspaces.taskList", "Task List")}{" "}
                      {workspaceData.tasks.length > 0 && (
                        <span className="text-gray-400 text-sm">
                          {" "}
                          {workspaceData.tasks.length}{" "}
                          {t("workspaces.tasks", "task(s)")}{" "}
                          {t("common.add", "added")}
                        </span>
                      )}
                    </h3>

                    {workspaceData.tasks.length > 0 ? (
                      <div className="space-y-3 flex-grow overflow-y-auto">
                        {workspaceData.tasks.map((task) => (
                          <div
                            key={task.id}
                            className="bg-zinc-800 rounded-lg p-4 flex justify-between items-start w-full"
                          >
                            <div className="w-full">
                              <div className="flex items-center justify-between">
                                <h4 className="font-medium text-white">
                                  {task.title}
                                </h4>
                              </div>
                              <div className="mt-1 flex flex-wrap items-center gap-2">
                                <span className="text-[10px] uppercase tracking-wide bg-zinc-700 text-gray-200 px-2 py-0.5 rounded">
                                  {getTaskTypeLabel(
                                    task.type as unknown as string
                                  )}
                                </span>
                                {getExecutorLabel(
                                  task.type as unknown as string,
                                  task.executorId as unknown as string | null
                                ) && (
                                  <span className="text-[10px] bg-zinc-700/60 text-gray-300 px-2 py-0.5 rounded">
                                    {t("taskNode.executor", "Exec")}:{" "}
                                    {getExecutorLabel(
                                      task.type as unknown as string,
                                      task.executorId as unknown as
                                        | string
                                        | null
                                    )}
                                  </span>
                                )}
                              </div>
                              {task.description && (
                                <div className="mt-2">
                                  <span className="text-xs font-medium text-gray-400">
                                    {t(
                                      "workspaces.taskDescription",
                                      "Description"
                                    )}
                                    :
                                  </span>
                                  <p className="text-sm text-gray-300">
                                    {task.description}
                                  </p>
                                </div>
                              )}
                              {task.expectedOutput && (
                                <div className="mt-2">
                                  <span className="text-xs font-medium text-gray-400">
                                    {t(
                                      "taskNode.expectedOutput",
                                      "Expected Output"
                                    )}
                                    :
                                  </span>
                                  <p className="text-sm text-gray-300">
                                    {task.expectedOutput}
                                  </p>
                                </div>
                              )}
                            </div>
                            <div className="flex space-x-2 ml-4 flex-shrink-0">
                              <button
                                onClick={() => handleEditTask(task.id)}
                                className="text-gray-400 hover:text-yellow-400 transition-colors cursor-pointer"
                              >
                                <Edit2 className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleRemoveTask(task.id)}
                                className="text-gray-400 hover:text-red-500 transition-colors cursor-pointer"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center text-gray-400 py-8 bg-zinc-800/30 rounded-lg border border-zinc-700 flex items-center justify-center">
                        {t("workspaces.noTasks", "No tasks added yet")}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Review & Confirm */}
            {currentStep === 4 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-white mb-4 ">
                    {t("workspaces.reviewAndConfirm", "Review & Confirm")}
                  </h2>
                  <p className="text-gray-400 mb-6">
                    {t(
                      "workspaces.reviewDescription",
                      "Review your workspace configuration before creating"
                    )}
                  </p>
                </div>

                <div className="space-y-6">
                  {/* Workspace Basics */}
                  <div className="bg-zinc-800/50 rounded-lg p-4 border border-zinc-700">
                    <div className="flex justify-between items-center mb-3">
                      <h3 className="text-lg font-medium text-white ">
                        {t("workspaces.workspaceBasics", "Workspace Setup")}
                      </h3>
                      <button
                        onClick={() => handleGoToStep(1)}
                        className="text-yellow-400 hover:text-yellow-300 text-sm cursor-pointer"
                      >
                        {t("common.edit", "Edit")}
                      </button>
                    </div>

                    <div className="space-y-2">
                      <div className="flex">
                        <span className="text-gray-400 w-40 whitespace-nowrap">
                          {t("workspaces.workspaceName", "Workspace Name")}:
                        </span>
                        <span className="text-white font-medium">
                          {workspaceData.name}
                        </span>
                      </div>
                      {workspaceData.description && (
                        <div className="flex">
                          <span className="text-gray-400 w-40 whitespace-nowrap">
                            {t("resultDialog.description", "Purpose")}:
                          </span>
                          <span className="text-white">
                            {workspaceData.description}
                          </span>
                        </div>
                      )}
                      <div className="flex">
                        <span className="text-gray-400 w-40 whitespace-nowrap">
                          {t("workspaces.mainLLM", "Main LLM")}:
                        </span>
                        {workspaceData.mainLLM?.model ? (
                          <span className="text-white font-medium">
                            {workspaceData.mainLLM.model.name}
                          </span>
                        ) : (
                          <span className="text-white w-40 whitespace-nowrap">
                            {t(
                              "workspaceTab.noModelSelected",
                              "No LLM selected"
                            )}
                          </span>
                        )}
                      </div>
                      <div className="flex">
                        <span className="text-gray-400 w-40 whitespace-nowrap">
                          {t("workspaces.credentials", "Credentials")}:
                        </span>
                        <span className="text-white">
                          {workspaceData.mainLLM?.model
                            ? workspaceData.useSavedCredentials
                              ? t(
                                  "workspaces.usingSavedCredentials",
                                  "Using saved credentials"
                                )
                              : t(
                                  "workspaces.usingCustomApiKey",
                                  "Using custom API key"
                                )
                            : t(
                                "workspaceTab.noModelSelected",
                                "No LLM Selected"
                              )}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Agents */}
                  <div className="bg-zinc-800/50 rounded-lg p-4 border border-zinc-700">
                    <div className="flex justify-between items-center mb-3">
                      <h3 className="text-lg font-medium text-white ">
                        {t("workspaces.agents", "Agents")}
                      </h3>
                      <button
                        onClick={() => handleGoToStep(2)}
                        className="text-yellow-400 hover:text-yellow-300 text-sm cursor-pointer"
                      >
                        {t("common.edit", "Edit")}
                      </button>
                    </div>

                    {workspaceData.agents.length > 0 ? (
                      <div className="space-y-3">
                        {workspaceData.agents.map((agent) => (
                          <div
                            key={agent.id}
                            className="bg-zinc-800 rounded-md p-3"
                          >
                            <div className="flex items-center justify-between font-medium text-white text-base mb-1">
                              <span>{agent.name}</span>
                              {agent.llm?.model && (
                                <span
                                  className={`text-xs px-2 py-0.5 rounded ml-2 ${
                                    agent.llm.model ===
                                    workspaceData.mainLLM.model
                                      ? "bg-blue-700 text-blue-300"
                                      : "bg-zinc-700 text-yellow-400"
                                  }`}
                                >
                                  {agent.llm.model ===
                                  workspaceData.mainLLM.model
                                    ? `${t("workspaceTab.mainLLM", "Main LLM")}`
                                    : `${t(
                                        "workspaceTab.customLLM",
                                        "Custom LLM"
                                      )}: ${agent.llm.model.name}`}
                                  {agent.llm.model ===
                                    workspaceData.mainLLM.model && (
                                    <span className="ml-1 opacity-75">
                                      (
                                      {t(
                                        "agentsTab.workspaceDefault",
                                        "Workspace Default"
                                      )}
                                      )
                                    </span>
                                  )}
                                </span>
                              )}
                            </div>
                            {agent.role && (
                              <div className="text-sm text-yellow-400 mb-1">
                                {agent.role}
                              </div>
                            )}

                            {agent.background && (
                              <div className="mt-2 text-sm">
                                <span className="text-gray-400 whitespace-nowrap">
                                  {t("agentsTab.background", "Background")}:
                                </span>
                                <p className="text-gray-300 mt-1">
                                  {replaceVariables(
                                    agent.background,
                                    agent.variables || {}
                                  )}
                                </p>
                              </div>
                            )}

                            {agent.tools && agent.tools.length > 0 && (
                              <div className="mt-2">
                                <span className="text-xs text-gray-400">
                                  {t("agentsTab.tools", "Tools")}:
                                </span>
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {agent.tools.map((tool, index) => (
                                    <span
                                      key={index}
                                      className="text-xs bg-zinc-700 text-gray-300 px-2 py-0.5 rounded"
                                    >
                                      {tool.name}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-gray-400">
                        {t("workspaces.noAgents", "No agents added yet")}
                      </div>
                    )}
                  </div>

                  {/* Tasks */}
                  <div className="bg-zinc-800/50 rounded-lg p-4 border border-zinc-700">
                    <div className="flex justify-between items-center mb-3">
                      <h3 className="text-lg font-medium text-white ">
                        {t("workspaces.tasks", "Tasks")}
                      </h3>
                      <button
                        onClick={() => handleGoToStep(3)}
                        className="text-yellow-400 hover:text-yellow-300 text-sm cursor-pointer"
                      >
                        {t("common.edit", "Edit")}
                      </button>
                    </div>

                    {workspaceData.tasks.length > 0 ? (
                      <div className="space-y-3">
                        {workspaceData.tasks.map((task) => (
                          <div
                            key={task.id}
                            className="bg-zinc-800 rounded-md p-3"
                          >
                            <div className="flex items-center justify-between font-medium text-white text-base mb-1">
                              <span>{task.title}</span>
                              <span className="text-xs px-2 py-0.5 rounded ml-2 bg-zinc-700 text-gray-200">
                                {getTaskTypeLabel(
                                  task.type as unknown as string
                                )}
                                {getExecutorLabel(
                                  task.type as unknown as string,
                                  task.executorId as unknown as string | null
                                ) &&
                                  ` - ${getExecutorLabel(
                                    task.type as unknown as string,
                                    task.executorId as unknown as string | null
                                  )}`}
                              </span>
                            </div>

                            {/* Task details */}
                            <div className="mt-2 space-y-2">
                              {task.description && (
                                <div>
                                  <span className="text-xs text-gray-400 whitespace-nowrap">
                                    {t(
                                      "workspaces.taskDescription",
                                      "Description"
                                    )}
                                    :
                                  </span>
                                  <p className="text-sm text-gray-300 mt-0.5">
                                    {task.description}
                                  </p>
                                </div>
                              )}

                              {/* Expected output */}
                              {task.expectedOutput && (
                                <div>
                                  <span className="text-xs text-gray-400 whitespace-nowrap">
                                    {t(
                                      "taskNode.expectedOutput",
                                      "Expected Output"
                                    )}
                                    :
                                  </span>
                                  <p className="text-sm text-gray-300 mt-0.5">
                                    {task.expectedOutput}
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-gray-400">
                        {t("workspaces.noTasks", "No tasks added yet")}
                      </div>
                    )}
                  </div>

                  <div className="bg-green-900/20 rounded-lg p-4 border border-green-800">
                    <p className="text-green-400 text-center">
                      {t(
                        "workspaces.readyToCreate",
                        'Your workspace is ready to be created. Click "Finish" to continue.'
                      )}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </form>
        </div>
        {/* Navigation and submit buttons - sticky to the bottom */}
        <div className="fixed bottom-0 left-0 right-0 flex justify-center z-50">
          <div className="flex justify-between items-center p-6 border-t border-zinc-800 bg-zinc-900 w-full max-w-6xl shadow-lg">
            {currentStep > 1 ? (
              <Button
                onClick={handlePrevStep}
                className="bg-yellow-400 hover:bg-yellow-500 text-black font-medium border-0 flex items-center cursor-pointer"
              >
                {isRTL ? (
                  <ChevronRight className="h-4 w-4 mr-2" />
                ) : (
                  <ChevronLeft className="h-4 w-4 mr-2" />
                )}
                {t("common.back", "Back")}
              </Button>
            ) : (
              <Button
                onClick={onClose}
                className="bg-yellow-400 hover:bg-yellow-500 text-black font-medium border-0 flex items-center cursor-pointer"
              >
                {t("common.cancel", "Cancel")}
              </Button>
            )}

            {currentStep < 4 ? (
              <div className="flex gap-2">
                {currentStep != 1 && (
                  <Button
                    onClick={() =>
                      handleSubmit(
                        new Event("submit") as unknown as React.FormEvent
                      )
                    }
                    className="bg-red-400 hover:bg-red-500 text-black font-medium border-0 flex items-center cursor-pointer"
                  >
                    {t("common.finish", "Finish")}
                  </Button>
                )}
                <Button
                  onClick={handleNextStep}
                  className="bg-yellow-400 hover:bg-yellow-500 text-black font-medium border-0 flex items-center cursor-pointer"
                  disabled={!getCurrentStepValidation()}
                >
                  {t("common.next", "Next")}
                  {isRTL ? (
                    <ChevronLeft className="h-4 w-4 ml-2" />
                  ) : (
                    <ChevronRight className="h-4 w-4 ml-2" />
                  )}
                </Button>
              </div>
            ) : (
              <Button
                onClick={() =>
                  handleSubmit(
                    new Event("submit") as unknown as React.FormEvent
                  )
                }
                className="bg-green-500 hover:bg-green-600 text-black font-medium border-0 flex items-center cursor-pointer"
                disabled={!isStep4Valid}
              >
                <Check className="h-4 w-4 mr-2" />
                {t("common.finish", "Finish")}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkspaceCreationWizard;
