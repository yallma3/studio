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
  Clock,
  Play,
  Zap,
  Webhook,
  MessageCircle,
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
import { 
  Task, 
  TaskConnection, 
  TaskSocket, 
  Trigger, 
  TriggerType, 
  ManualTrigger, 
  ScheduledTrigger,
  WebhookTrigger,
  TelegramTrigger
} from "../task/types/types";

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
const getUserTimezone = (): string => {
  return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
};
const CRON_PRESETS = [
 {
    label: 'Every minute',
    value: '* * * * *',
    description: 'Runs every minute',
  },
  {
    label: 'Every 5 minutes',
    value: '*/5 * * * *',
    description: 'Runs every 5 minutes',
  },
  {
    label: 'Every 15 minutes',
    value: '*/15 * * * *',
    description: 'Runs every 15 minutes',
  },
  {
    label: 'Every 30 minutes',
    value: '*/30 * * * *',
    description: 'Runs every 30 minutes',
  },
  {
    label: 'Every hour',
    value: '0 * * * *',
    description: 'Runs at the start of every hour',
  },
  {
    label: 'Every day at 9 AM',
    value: '0 9 * * *',
    description: 'Runs every day at 9:00 AM',
  },
  {
    label: 'Every Monday at 9 AM',
    value: '0 9 * * 1',
    description: 'Runs every Monday at 9:00 AM',
  },
  {
    label: 'First day of month at 9 AM',
    value: '0 9 1 * *',
    description: 'Runs on the 1st of every month at 9:00 AM',
  }
];
const WorkspaceCreationWizard: React.FC<WorkspaceCreationWizardProps> = ({
  onClose,
  onCreateWorkspace,
}) => {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === "ar";
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedWebhookType, setSelectedWebhookType] = useState<'telegram' | 'http-webhook' | null>(null);

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
    agents: [],
    tasks: [],
    connections: [],
    workflows: [],
    mcpTools: [],
    trigger: {
      id: `trigger-${Date.now()}`,
      type: "manual",
      enabled: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      config: {
        description: "Run workspace manually from UI",
        requiresConfirmation: false,
      },
    } as ManualTrigger,
  });

  const [isEditingTrigger, setIsEditingTrigger] = useState(false);

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

  const handleSubmit = async () => {
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
        trigger: {
          id: `trigger-${Date.now()}`,
          type: "manual",
          enabled: true,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          config: {
            description: "Run workspace manually from UI",
            requiresConfirmation: false,
          },
        } as ManualTrigger,
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

  const handleTriggerTypeChange = (newType: TriggerType, webhookSubType?: 'telegram' | 'http-webhook') => {
    const baseFields = {
      id: workspaceData.trigger?.id || `trigger-${Date.now()}`,
      enabled: workspaceData.trigger?.enabled ?? true,
      createdAt: workspaceData.trigger?.createdAt || Date.now(),
      updatedAt: Date.now(),
    };

    let newTrigger: Trigger;

    switch (newType) {
      case "manual":
        newTrigger = {
          ...baseFields,
          type: "manual",
          config: {
            description: "Run workspace manually from UI",
            requiresConfirmation: false,
          },
        } as ManualTrigger;
        setSelectedWebhookType(null); 
        break;

      case "scheduled":
        newTrigger = {
          ...baseFields,
          type: "scheduled",
          config: {
            cronExpression: workspaceData.trigger?.type === "scheduled" 
              ? workspaceData.trigger.config.cronExpression 
              : "0 9 * * *",
            timezone: workspaceData.trigger?.type === "scheduled" 
              ? workspaceData.trigger.config.timezone 
              : getUserTimezone(),
            description: "Run on schedule",
          },
        } as ScheduledTrigger;
        setSelectedWebhookType(null); 
        break;

      case "webhook":
        if (!webhookSubType) {
          setSelectedWebhookType('http-webhook');
          return; 
        }
        
        if (webhookSubType === 'telegram') {
          newTrigger = {
            ...baseFields,
            type: "telegram",
            config: {
              botToken: "",
              updateTypes: ["message"],
              filterChatId: undefined,
              filterChatType: undefined,
            },
          } as TelegramTrigger;
          setSelectedWebhookType('telegram');
        } else {
          newTrigger = {
            ...baseFields,
            type: "webhook",
            config: {
              webhookUrl: workspaceData.trigger?.type === "webhook"
                ? workspaceData.trigger.config.webhookUrl
                : "",
              webhookId: workspaceData.trigger?.type === "webhook"
                ? workspaceData.trigger.config.webhookId
                : undefined,
              secret: workspaceData.trigger?.type === "webhook"
                ? workspaceData.trigger.config.secret
                : undefined,
              method: workspaceData.trigger?.type === "webhook"
                ? workspaceData.trigger.config.method
                : "POST",
            },
          } as WebhookTrigger;
          setSelectedWebhookType('http-webhook');
        }
        break;

      case "telegram":
        newTrigger = {
          ...baseFields,
          type: "telegram",
          config: {
            botToken: workspaceData.trigger?.type === "telegram"
              ? workspaceData.trigger.config.botToken
              : "",
            updateTypes: workspaceData.trigger?.type === "telegram"
              ? workspaceData.trigger.config.updateTypes
              : ["message"],
            filterChatId: workspaceData.trigger?.type === "telegram"
              ? workspaceData.trigger.config.filterChatId
              : undefined,
            filterChatType: workspaceData.trigger?.type === "telegram"
              ? workspaceData.trigger.config.filterChatType
              : undefined,
          },
        } as TelegramTrigger;
        setSelectedWebhookType('telegram');
        break;

      default:
        throw new Error(`Unknown trigger type: ${newType}`);
    }

    setWorkspaceData((prev) => ({
      ...prev,
      trigger: newTrigger,
    }));
  };

  const handleTriggerConfigChange = (key: string, value: string | boolean) => {
    if (!workspaceData.trigger) return;

    setWorkspaceData((prev) => {
      if (!prev.trigger) return prev;

      return {
        ...prev,
        trigger: {
          ...prev.trigger,
          updatedAt: Date.now(),
          config: {
            ...prev.trigger.config,
            [key]: value,
          },
        } as Trigger,
      };
    });
  };

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

  const getTriggerIcon = (type: string) => {
    switch (type) {
      case "manual":
        return <Play className="h-5 w-5" />;
      case "scheduled":
        return <Clock className="h-5 w-5" />;
      case "webhook":
        return <Webhook className="h-5 w-5" />;
      case "telegram":
        return <MessageCircle className="h-5 w-5" />;
      default:
        return <Zap className="h-5 w-5" />;
    }
  };

  const getTriggerDisplayName = (trigger: Trigger) => {
    switch (trigger.type) {
      case "manual":
        return t("workspaces.manualTrigger", "Manual Trigger");
      case "scheduled":
        return t("workspaces.scheduledTrigger", "Scheduled Trigger");
      case "webhook":
        return t("workspaces.webhookTrigger", "Webhook Trigger");
      case "telegram":
        return t("workspaces.telegramTrigger", "Telegram Bot Trigger");
      default:
        return t("workspaces.trigger", "Trigger");
    }
  };

  const getTriggerDescription = (trigger: Trigger) => {
    switch (trigger.type) {
      case "manual":
        return t("workspaces.manualTriggerDesc", "Run manually from UI");
      case "scheduled":
        return trigger.config.cronExpression 
          ? `${trigger.config.cronExpression} (${trigger.config.timezone || "UTC"})`
          : t("workspaces.scheduledTriggerDesc", "Run on schedule");
      case "webhook":
        return trigger.config.webhookUrl
          ? `${trigger.config.method || "POST"} ${trigger.config.webhookUrl}`
          : t("workspaces.webhookPending", "Webhook URL will be generated");
      case "telegram":
        return t("workspaces.telegramBotDesc", "Receive updates from Telegram bot");
      default:
        return "";
    }
  };

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
                              variables: {},
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
                </div>
              </div>
            )}

            {/* Step 3: Define Tasks WITH TRIGGER NODE */}
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
                        "You can always modify later"
                      )}
                    </span>
                  </div>
                  <p className="text-gray-400 mb-6">
                    {t(
                      "workspaces.defineTasksDescription",
                      "Tasks are the breakdown of what you want to accomplish. You can have a single Task (at least one is required), or multiple Tasks. Tasks can be connected in a sequence (which is preferred) or remain independent. You can always connect and modify them after finishing this wizard."
                    )}
                  </p>
                </div>

                <div className="flex flex-col lg:flex-row gap-6 h-full">
                  {/* Task Form - Left side */}
                  {!isEditingTrigger && (
                    <div className="bg-zinc-800/50 rounded-lg p-6 border border-zinc-700 lg:w-2/3 flex flex-col h-full">
                      <h3 className="text-lg font-medium text-white mb-4 ">
                        {isEditingTask
                          ? t(
                              "workspaces.updateTask",
                              `Update Task: ${newTask.title}`
                            )
                          : t("workspaces.addTask", "Add Task")}
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
                              "Enter a description of the Task in terms of what needs to be done"
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
                                "Specify what defines completion of the task and success criteria"
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
                              "Specify what defines completion of the task and success criteria"
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
                                    "The specified Workflow will be used"
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
                                    label: t("taskModal.none", "None"),
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
                  )}

                  {/* TRIGGER EDIT FORM  */}
                  {isEditingTrigger && (
                    <div className="bg-zinc-800/50 rounded-lg p-6 border border-zinc-700 lg:w-2/3 flex flex-col h-full">
                      <h3 className="text-lg font-medium text-white mb-4 ">
                        {t("workspaces.editTrigger", "Edit Trigger")}
                      </h3>

                      <div className="space-y-4 mb-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-3">
                            {t("workspaces.triggerType", "Trigger Type")}
                          </label>
                          <div className="grid grid-cols-3 gap-4">
                            {/* Manual Button */}
                            <button
                              type="button"
                              onClick={() => handleTriggerTypeChange("manual")}
                              className={`p-4 rounded-lg border-2 transition-all ${
                                workspaceData.trigger?.type === "manual" && selectedWebhookType === null
                                  ? "border-yellow-500 bg-yellow-500/10"
                                  : "border-zinc-700 bg-zinc-800 hover:border-zinc-600"
                              }`}
                            >
                              <div className="flex flex-col items-center gap-2">
                                <Play className="h-8 w-8 text-yellow-400" />
                                <span className="text-white font-medium">
                                  {t("workspaces.manual", "Manual")}
                                </span>
                                <span className="text-xs text-gray-400 text-center">
                                  {t(
                                    "workspaces.manualDescription",
                                    "Run manually from UI"
                                  )}
                                </span>
                              </div>
                            </button>

                            {/* Scheduled Button */}
                            <button
                              type="button"
                              onClick={() => handleTriggerTypeChange("scheduled")}
                              className={`p-4 rounded-lg border-2 transition-all ${
                                workspaceData.trigger?.type === "scheduled" && selectedWebhookType === null
                                  ? "border-yellow-500 bg-yellow-500/10"
                                  : "border-zinc-700 bg-zinc-800 hover:border-zinc-600"
                              }`}
                            >
                              <div className="flex flex-col items-center gap-2">
                                <Clock className="h-8 w-8 text-blue-400" />
                                <span className="text-white font-medium">
                                  {t("workspaces.scheduled", "Scheduled")}
                                </span>
                                <span className="text-xs text-gray-400 text-center">
                                  {t(
                                    "workspaces.scheduledDescription",
                                    "Run on schedule"
                                  )}
                                </span>
                              </div>
                            </button>

                            {/* Webhook Button */}
                            <button
                              type="button"
                              onClick={() => handleTriggerTypeChange("webhook")}
                              className={`p-4 rounded-lg border-2 transition-all ${
                                selectedWebhookType !== null
                                  ? "border-yellow-500 bg-yellow-500/10"
                                  : "border-zinc-700 bg-zinc-800 hover:border-zinc-600"
                              }`}
                            >
                              <div className="flex flex-col items-center gap-2">
                                <Webhook className="h-8 w-8 text-green-400" />
                                <span className="text-white font-medium">
                                  {t("workspaces.webhook", "Webhook")}
                                </span>
                                <span className="text-xs text-gray-400 text-center">
                                  {t(
                                    "workspaces.webhookDescription",
                                    "Trigger via HTTP"
                                  )}
                                </span>
                              </div>
                            </button>
                          </div>
                        </div>

                        {/*  Webhook Type Selection */}
                        {selectedWebhookType !== null && (
                          <div className="p-4 bg-zinc-900/50 rounded-lg border border-zinc-700">
                            <label className="block text-sm font-medium text-gray-300 mb-3">
                              {t("workspaces.webhookType", "Webhook Type")}
                            </label>
                            <div className="grid grid-cols-2 gap-4">
                              {/* Telegram Bot */}
                              <button
                                type="button"
                                onClick={() => handleTriggerTypeChange("webhook", "telegram")}
                                className={`p-4 rounded-lg border-2 transition-all ${
                                  workspaceData.trigger?.type === "telegram"
                                    ? "border-blue-500 bg-blue-500/10"
                                    : "border-zinc-700 bg-zinc-800 hover:border-zinc-600"
                                }`}
                              >
                                <div className="flex flex-col items-center gap-2">
                                  <MessageCircle className="h-6 w-6 text-blue-400" />
                                  <span className="text-white font-medium text-sm">
                                    {t("workspaces.telegramBot", "Telegram Bot")}
                                  </span>
                                  <span className="text-xs text-gray-400 text-center">
                                    {t("workspaces.telegramDescription", "Receive Telegram updates")}
                                  </span>
                                </div>
                              </button>

                              {/* HTTP Webhook */}
                              <button
                                type="button"
                                onClick={() => handleTriggerTypeChange("webhook", "http-webhook")}
                                className={`p-4 rounded-lg border-2 transition-all ${
                                  workspaceData.trigger?.type === "webhook"
                                    ? "border-green-500 bg-green-500/10"
                                    : "border-zinc-700 bg-zinc-800 hover:border-zinc-600"
                                }`}
                              >
                                <div className="flex flex-col items-center gap-2">
                                  <Webhook className="h-6 w-6 text-green-400" />
                                  <span className="text-white font-medium text-sm">
                                    {t("workspaces.httpWebhook", "HTTP Webhook")}
                                  </span>
                                  <span className="text-xs text-gray-400 text-center">
                                    {t("workspaces.httpDescription", "Receive HTTP requests")}
                                  </span>
                                </div>
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Scheduled Trigger Configuration */}
                        {workspaceData.trigger?.type === "scheduled" && selectedWebhookType === null && (
                          <div className="space-y-4 p-4 bg-zinc-900/50 rounded-lg border border-zinc-700">
                            {/* Preset Dropdown */}
                            <div>
                              <label className="block text-sm font-medium text-gray-300 mb-2">
                                {t("workspaces.schedulePreset", "Schedule Preset")}
                              </label>
                              <select
                                value={workspaceData.trigger.config.cronExpression || '0 9 * * *'}
                                onChange={(e) => handleTriggerConfigChange("cronExpression", e.target.value)}
                                className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
                              >
                                {CRON_PRESETS.map((preset) => (
                                  <option key={preset.value} value={preset.value}>
                                    {preset.label} - {preset.description}
                                  </option>
                                ))}
                              </select>
                            </div>

                            {/* Timezone */}
                            <div>
                              <label className="block text-sm font-medium text-gray-300 mb-2">
                                {t("workspaces.timezone", "Timezone")}
                              </label>
                              <select
                                value={workspaceData.trigger.config.timezone || getUserTimezone()}
                                onChange={(e) =>
                                  handleTriggerConfigChange("timezone", e.target.value)
                                }
                                className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
                              >
                                <option value={getUserTimezone()}>{getUserTimezone()} (Local)</option>
                                <option value="UTC">UTC</option>
                                <option value="America/New_York">America/New_York (EST/EDT)</option>
                                <option value="America/Los_Angeles">America/Los_Angeles (PST/PDT)</option>
                                <option value="Europe/London">Europe/London (GMT/BST)</option>
                                <option value="Asia/Tokyo">Asia/Tokyo (JST)</option>
                                <option value="Australia/Sydney">Australia/Sydney (AEST/AEDT)</option>
                              </select>
                            </div>

                            {/* Description */}
                            <div>
                              <label className="block text-sm font-medium text-gray-300 mb-2">
                                {t("workspaces.description", "Description")}{" "}
                                <span className="text-gray-400 text-xs">(Optional)</span>
                              </label>
                              <input
                                type="text"
                                value={workspaceData.trigger.config.description || ""}
                                onChange={(e) =>
                                  handleTriggerConfigChange("description", e.target.value)
                                }
                                className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                                placeholder="Describe the schedule"
                              />
                            </div>
                          </div>
                        )}

                        {/* HTTP Webhook Configuration */}
                        {workspaceData.trigger?.type === "webhook" && (
                          <div className="space-y-4 p-4 bg-zinc-900/50 rounded-lg border border-zinc-700">
                            <div className="p-3 bg-green-900/20 rounded border border-green-700/50">
                              <p className="text-sm text-green-300 mb-2">
                                {t("workspaces.webhookInfo", "A unique webhook URL will be automatically generated when you activate this workspace.")}
                              </p>
                              <p className="text-xs text-gray-400">
                                {t("workspaces.webhookSecure", "The webhook will be secured with a secret token.")}
                              </p>
                            </div>

                            {/* Method Selection */}
                            <div>
                              <label className="block text-sm font-medium text-gray-300 mb-2">
                                {t("workspaces.method", "HTTP Method")}
                              </label>
                              <div className="flex gap-4">
                                <button
                                  type="button"
                                  onClick={() => handleTriggerConfigChange("method", "POST")}
                                  className={`flex-1 py-2 px-4 rounded-md border-2 transition-all ${
                                    workspaceData.trigger.config.method === "POST"
                                      ? "border-yellow-500 bg-yellow-500/10 text-white"
                                      : "border-zinc-700 bg-zinc-800 text-gray-400 hover:border-zinc-600"
                                  }`}
                                >
                                  POST
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleTriggerConfigChange("method", "GET")}
                                  className={`flex-1 py-2 px-4 rounded-md border-2 transition-all ${
                                    workspaceData.trigger.config.method === "GET"
                                      ? "border-yellow-500 bg-yellow-500/10 text-white"
                                      : "border-zinc-700 bg-zinc-800 text-gray-400 hover:border-zinc-600"
                                  }`}
                                >
                                  GET
                                </button>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Telegram Configuration */}
                        {workspaceData.trigger?.type === "telegram" && (
                          <div className="space-y-4 p-4 bg-zinc-900/50 rounded-lg border border-zinc-700">
                            <div className="p-3 bg-blue-900/20 rounded border border-blue-700/50">
                              <p className="text-sm text-blue-300">
                                {t("workspaces.telegramInfo", "Enter your Telegram Bot Token to receive updates from Telegram.")}
                              </p>
                            </div>

                            {/* Bot Token */}
                            <div>
                              <label className="block text-sm font-medium text-gray-300 mb-2">
                                {t("workspaces.botToken", "Bot Token")}
                                <span className="text-yellow-500"> *</span>
                              </label>
                              <input
                                type="password"
                                value={workspaceData.trigger.config.botToken || ""}
                                onChange={(e) => handleTriggerConfigChange("botToken", e.target.value)}
                                className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                                placeholder="123456789:ABCdefGHIjklMNOpqrsTUVwxyz"
                              />
                              <p className="text-xs text-gray-400 mt-1">
                                {t("workspaces.botTokenHint", "Get your bot token from @BotFather on Telegram")}
                              </p>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-300 mb-2">
                                {t("workspaces.eventTypes", "Event Types")}
                              </label>
                              <p className="text-xs text-gray-400">
                                {t("workspaces.eventTypesHint", "Bot will receive messages and callbacks (configurable after creation)")}
                              </p>
                            </div>
                          </div>
                        )}

                        {/* Manual Trigger Info */}
                        {workspaceData.trigger?.type === "manual" && selectedWebhookType === null && (
                          <div className="p-4 bg-zinc-900/50 rounded-lg border border-zinc-700">
                            <p className="text-sm text-gray-300">
                              {t(
                                "workspaces.manualInfo",
                                "This workspace will only run when manually triggered from the UI."
                              )}
                            </p>
                          </div>
                        )}
                      </div>

                      <Button
                        onClick={() => {
                          setIsEditingTrigger(false);
                          setSelectedWebhookType(null);
                        }}
                        className="w-full bg-yellow-500 hover:bg-yellow-600 text-black font-medium border-0 flex items-center justify-center"
                      >
                        <Check className="h-4 w-4 mr-1" />
                        {t("workspaces.saveTrigger", "Save Trigger")}
                      </Button>
                    </div>
                  )}

                  {/* Task & Trigger List */}
                  <div className="bg-zinc-800/50 rounded-lg p-6 border border-zinc-700 lg:w-1/3 flex flex-col">
                    <h3 className="text-lg font-medium text-white mb-4">
                      {t("workspaces.taskList", "Task List")}{" "}
                      <span className="text-gray-400 text-sm">
                        {workspaceData.tasks.length + 1}{" "}
                        {t("workspaces.items", "items")}
                      </span>
                    </h3>

                    <div className="space-y-3 flex-grow overflow-y-auto">
                      {/* Trigger Node */}
                      {workspaceData.trigger && (
                        <div className={`rounded-lg p-4 border-2 relative ${
                          workspaceData.trigger.type === "webhook"
                            ? "bg-gradient-to-r from-green-900/20 to-green-800/10 border-green-700/50"
                            : workspaceData.trigger.type === "telegram"
                            ? "bg-gradient-to-r from-blue-900/20 to-blue-800/10 border-blue-700/50"
                            : "bg-gradient-to-r from-yellow-900/20 to-yellow-800/10 border-yellow-700/50"
                        }`}>
                          <div className="absolute top-2 right-2">
                            <span className={`text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-full ${
                              workspaceData.trigger.type === "webhook"
                                ? "bg-green-700/30 text-green-300"
                                : workspaceData.trigger.type === "telegram"
                                ? "bg-blue-700/30 text-blue-300"
                                : "bg-yellow-700/30 text-yellow-300"
                            }`}>
                              {t("workspaces.default", "Default")}
                            </span>
                          </div>
                          
                          <div className="flex items-start gap-3">
                            <div className="mt-1">
                              {getTriggerIcon(workspaceData.trigger.type)}
                            </div>
                            <div className="flex-1">
                              <h4 className="font-medium text-white mb-1">
                                {getTriggerDisplayName(workspaceData.trigger)}
                              </h4>
                              <p className="text-xs text-gray-400">
                                {getTriggerDescription(workspaceData.trigger)}
                              </p>
                            </div>
                          </div>

                          <div className="mt-3 flex justify-end">
                            <button
                              onClick={() => setIsEditingTrigger(true)}
                              className={`transition-colors cursor-pointer flex items-center gap-1 text-sm ${
                                workspaceData.trigger.type === "webhook"
                                  ? "text-green-400 hover:text-green-300"
                                  : workspaceData.trigger.type === "telegram"
                                  ? "text-blue-400 hover:text-blue-300"
                                  : "text-yellow-400 hover:text-yellow-300"
                              }`}
                            >
                              <Edit2 className="h-3 w-3" />
                              {t("common.edit", "Edit")}
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Tasks */}
                      {workspaceData.tasks.length > 0 ? (
                        workspaceData.tasks.map((task) => (
                          <div
                            key={task.id}
                            className="bg-zinc-800 rounded-lg p-4 flex justify-between items-start"
                          >
                            <div className="w-full">
                              <h4 className="font-medium text-white mb-1">
                                {task.title}
                              </h4>
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="text-[10px] uppercase tracking-wide bg-zinc-700 text-gray-200 px-2 py-0.5 rounded">
                                  {getTaskTypeLabel(task.type as unknown as string)}
                                </span>
                                {getExecutorLabel(
                                  task.type as unknown as string,
                                  task.executorId as unknown as string | null
                                ) && (
                                  <span className="text-[10px] bg-zinc-700/60 text-gray-300 px-2 py-0.5 rounded">
                                    {getExecutorLabel(
                                      task.type as unknown as string,
                                      task.executorId as unknown as string | null
                                    )}
                                  </span>
                                )}
                              </div>
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
                        ))
                      ) : (
                        <div className="text-center text-gray-400 py-8 bg-zinc-800/30 rounded-lg border border-zinc-700">
                          {t("workspaces.noTasks", "No tasks added yet")}
                        </div>
                      )}
                    </div>
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
                        type="button"
                        onClick={() => handleGoToStep(1)}
                        className="text-yellow-400 hover:text-yellow-300 text-sm cursor-pointer"
                      >
                        {t("common.edit", "Edit")}
                      </button>
                    </div>

                    <div className="space-y-2">
                      <div className="flex">
                        <span className="text-gray-400 w-40">
                          {t("workspaces.workspaceName", "Workspace Name")}:
                        </span>
                        <span className="text-white font-medium">
                          {workspaceData.name}
                        </span>
                      </div>
                      {workspaceData.description && (
                        <div className="flex">
                          <span className="text-gray-400 w-40">
                            {t("resultDialog.description", "Purpose")}:
                          </span>
                          <span className="text-white">
                            {workspaceData.description}
                          </span>
                        </div>
                      )}
                      <div className="flex">
                        <span className="text-gray-400 w-40">
                          {t("workspaces.mainLLM", "Main LLM")}:
                        </span>
                        <span className="text-white font-medium">
                          {workspaceData.mainLLM?.model?.name || t("workspaceTab.noModelSelected", "No LLM selected")}
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
                        type="button"
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
                            <div className="font-medium text-white text-base">
                              {agent.name}
                            </div>
                            {agent.role && (
                              <div className="text-sm text-yellow-400">
                                {agent.role}
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

                  {/* Tasks & Trigger */}
                  <div className="bg-zinc-800/50 rounded-lg p-4 border border-zinc-700">
                    <div className="flex justify-between items-center mb-3">
                      <h3 className="text-lg font-medium text-white ">
                        {t("workspaces.tasksAndTrigger", "Tasks & Trigger")}
                      </h3>
                      <button
                        type="button"
                        onClick={() => handleGoToStep(3)}
                        className="text-yellow-400 hover:text-yellow-300 text-sm cursor-pointer"
                      >
                        {t("common.edit", "Edit")}
                      </button>
                    </div>

                    <div className="space-y-3">
                      {/* Trigger */}
                      {workspaceData.trigger && (
                        <div className={`rounded-md p-3 border ${
                          workspaceData.trigger.type === "webhook"
                            ? "bg-gradient-to-r from-green-900/20 to-green-800/10 border-green-700/50"
                            : workspaceData.trigger.type === "telegram"
                            ? "bg-gradient-to-r from-blue-900/20 to-blue-800/10 border-blue-700/50"
                            : "bg-gradient-to-r from-yellow-900/20 to-yellow-800/10 border-yellow-700/50"
                        }`}>
                          <div className="flex items-center gap-2 mb-1">
                            {getTriggerIcon(workspaceData.trigger.type)}
                            <span className="text-white font-medium">
                              {getTriggerDisplayName(workspaceData.trigger)}
                            </span>
                            <span className={`text-xs px-2 py-0.5 rounded-full ml-auto ${
                              workspaceData.trigger.type === "webhook"
                                ? "bg-green-700/30 text-green-300"
                                : workspaceData.trigger.type === "telegram"
                                ? "bg-blue-700/30 text-blue-300"
                                : "bg-yellow-700/30 text-yellow-300"
                            }`}>
                              {t("workspaces.trigger", "Trigger")}
                            </span>
                          </div>
                          <p className="text-sm text-gray-300 ml-7">
                            {getTriggerDescription(workspaceData.trigger)}
                          </p>
                        </div>
                      )}

                      {/* Tasks */}
                      {workspaceData.tasks.length > 0 ? (
                        workspaceData.tasks.map((task) => (
                          <div
                            key={task.id}
                            className="bg-zinc-800 rounded-md p-3"
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-white font-medium">
                                {task.title}
                              </span>
                              <span className="text-xs px-2 py-0.5 rounded bg-zinc-700 text-gray-200">
                                {getTaskTypeLabel(task.type as unknown as string)}
                              </span>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-gray-400 text-sm">
                          {t("workspaces.noTasks", "No tasks added yet")}
                        </div>
                      )}
                    </div>
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

        {/* Navigation buttons */}
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
                    onClick={handleSubmit}
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
                onClick={handleSubmit}
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
