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
  Terminal,
  Clock,
  MessageCircle,
  ExternalLink,
} from "lucide-react";
import {
  saveWorkspaceToDefaultLocation,
  workspaceFileExists,
  saveWorkspaceState,
  saveEncryptedWorkspace,
} from "./utils/storageUtils";
import { sidecarClient, SidecarCommand } from "../api/SidecarClient";
import { useTranslation } from "react-i18next";

import { WorkspaceData, Workflow } from "./types/Types";

import { WorkspaceTab, TasksTab, AgentsTab, AiFlowsTab, EnvironmentVariablesTab } from "./tabs";

import { getWorkflow } from "./utils/runtimeUtils";
import { createJson } from "../flow/utils/flowRuntime";
import { ConsoleProvider, useConsole } from "./context/ConsoleContext";
import ConsolePanel from "./components/ConsolePanel";

import { encryptWorkspaceData, encryptWorkspaceApiKeys } from "./utils/encryptionUtils";
import { PasswordModal } from "./components/PasswordModal";
import { EncryptionChoiceModal } from "./components/EncryptionChoiceModal";
import UserPromptDialog from "../flow/components/UserPromptDialog";

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

type WorkspaceTabSelector = "workspace" | "tasks" | "agents" | "aiflows" | "environment";

interface WorkspaceCanvasProps {
  workspaceData: WorkspaceData;
  onReturnToHome: () => void;
}

// Countdown component - Live updating countdown timer
interface CountdownTimerProps {
  nextExecutionTime: number | null;
}

const CountdownTimer: React.FC<CountdownTimerProps> = ({ nextExecutionTime }) => {
  const [timeLeft, setTimeLeft] = useState<string>('');
  const { t } = useTranslation();

  useEffect(() => {
    if (!nextExecutionTime) return;

    const updateCountdown = () => {
      const now = Date.now();
      const diff = nextExecutionTime - now;

      if (diff <= 0) {
        setTimeLeft('00:00:00');
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeLeft(
        `${hours.toString().padStart(2, '0')}:${minutes
          .toString()
          .padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
      );
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [nextExecutionTime]);

  if (!nextExecutionTime) return null;

  return (
    <div className="bg-blue-500/10 text-blue-400 border border-blue-500/20 px-4 py-2 rounded-md flex items-center gap-2">
      <Clock className="h-4 w-4" />
      <div className="flex flex-col items-start">
        <span className="text-[10px] uppercase tracking-wide opacity-70">
          {t("workspaces.nextRun", "Next run in")}
        </span>
        <span className="text-sm font-mono font-bold">{timeLeft}</span>
      </div>
    </div>
  );
};

// Webhook status indicator with animation
interface WebhookStatusProps {
  isActive: boolean;
}

const WebhookStatus: React.FC<WebhookStatusProps> = ({ isActive }) => {
  const { t } = useTranslation();

  return (
    <div className={`px-4 py-2 rounded-md flex items-center gap-2 border transition-all duration-300 ${
      isActive 
        ? 'bg-green-500/20 text-green-400 border-green-500/40 animate-pulse' 
        : 'bg-green-500/10 text-green-400 border-green-500/20'
    }`}>
      <div className={`h-2 w-2 rounded-full transition-all duration-300 ${
        isActive ? 'bg-green-400 animate-ping' : 'bg-green-500'
      }`} />
      <div className="flex flex-col items-start">
        <span className="text-[10px] uppercase tracking-wide opacity-70">
          {t("workspaces.webhookStatus", "Webhook")}
        </span>
        <span className="text-sm font-medium">
          {isActive 
            ? t("workspaces.webhookActive", "Request received!") 
            : t("workspaces.webhookListening", "Listening...")}
        </span>
      </div>
    </div>
  );
};

// Telegram status indicator with animation
interface TelegramStatusProps {
  isActive: boolean;
  botUsername?: string;
}

const TelegramStatus: React.FC<TelegramStatusProps> = ({ isActive, botUsername }) => {
  const { t } = useTranslation();

  return (
    <div className={`px-4 py-2 rounded-md flex items-center gap-2 border transition-all duration-300 ${
      isActive 
        ? 'bg-blue-500/20 text-blue-400 border-blue-500/40 animate-pulse' 
        : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
    }`}>
      <MessageCircle className="h-4 w-4" />
      <div className="flex flex-col items-start">
        <span className="text-[10px] uppercase tracking-wide opacity-70">
          {t("workspaces.telegramStatus", "Telegram")}
        </span>
        <span className="text-sm font-medium">
          {isActive 
            ? t("workspaces.telegramActive", "Update received!") 
            : botUsername 
              ? `@${botUsername}` 
              : t("workspaces.telegramListening", "Listening...")}
        </span>
      </div>
      {botUsername && !isActive && (
        <a
          href={`https://t.me/${botUsername}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-400 hover:text-blue-300 transition-colors"
          onClick={(e) => e.stopPropagation()}
        >
          <ExternalLink size={14} />
        </a>
      )}
    </div>
  );
};

interface UserPromptRequestData {
  promptId: string;
  nodeId: number;
  message?: string;
}

const WorkspaceCanvasContent: React.FC<WorkspaceCanvasProps> = ({
  workspaceData: initialWorkspaceData,
  onReturnToHome,
}) => {
  const { t, i18n } = useTranslation();
  const [activeTab, setActiveTab] = useState<WorkspaceTabSelector>("workspace");
  const { addEvent, events } = useConsole();

  // Console visibility state
  const [isConsoleOpen, setIsConsoleOpen] = useState(false);
  const [isConsoleMaximized, setIsConsoleMaximized] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const prevEventsLengthRef = useRef(0);
  const [isRunning, setIsRunning] = useState(false);
  const [isTriggerRegistered, setIsTriggerRegistered] = useState(false);
  const [nextExecutionTime, setNextExecutionTime] = useState<number | null>(null);
  const [isWebhookActive, setIsWebhookActive] = useState(false);
  const webhookActivityTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [userPromptDialog, setUserPromptDialog] = useState<{
    isOpen: boolean;
    promptId: string;
    nodeId: number;
    nodeTitle: string;
    message: string;
  } | null>(null);

  const showWebhookActivity = useCallback(() => {
    setIsWebhookActive(true);
    
    if (webhookActivityTimeoutRef.current) {
      clearTimeout(webhookActivityTimeoutRef.current);
    }
    
    webhookActivityTimeoutRef.current = setTimeout(() => {
      setIsWebhookActive(false);
    }, 3000);
  }, []);

  useEffect(() => {
    if (isConsoleOpen) {
      setUnreadCount(0);
    } else {
      const diff = events.length - prevEventsLengthRef.current;
      if (diff > 0) {
        setUnreadCount((prev) => prev + diff);
      } else if (events.length === 0) {
        setUnreadCount(0);
      }
    }
    prevEventsLengthRef.current = events.length;
  }, [events.length, isConsoleOpen]);

     // Handle active tab changes for console visibility
  useEffect(() => {
    if (activeTab === "workspace") {
      setIsConsoleOpen(true);
    } else {
      setIsConsoleOpen(false);
    }
  }, [activeTab]);

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

      // Encryption modal states
  const [showEncryptionChoice, setShowEncryptionChoice] = useState<boolean>(false);
  const [showPasswordModal, setShowPasswordModal] = useState<boolean>(false);
  const [passwordModalMode, setPasswordModalMode] = useState<'encrypt' | 'decrypt'>('encrypt');
  const [passwordError, setPasswordError] = useState<string>("");
  const [encryptionMode, setEncryptionMode] = useState<'full' | 'apikeys' | null>(null);

      // Sidecar connection status
  const [sidecarStatus, setSidecarStatus] = useState<string>("disconnected");

  // Handle user prompt submission
  const handleUserPromptSubmit = async (promptId: string, response: string) => {
    try {
      const message: SidecarCommand = {
        id: crypto.randomUUID(),
        type: "user_prompt_response",
        data: JSON.stringify({ promptId, response }),
        timestamp: new Date().toISOString(),
      };
      
      sidecarClient.sendMessage(message);
      setUserPromptDialog(null);
    } catch (error) {
      console.error("Error submitting user prompt:", error);
      showToast("Failed to submit response", "error");
    }
  };

  // Handle user prompt cancel
  const handleUserPromptCancel = () => {
    setUserPromptDialog(null);
  };

  // Single Run/Stop button handler
  const handleToggleWorkspace = React.useCallback(async () => {
    if (!workspaceData) return;
    if (isRunning || isTriggerRegistered) {
      console.log(' Stopping...');
      
      // Unregister trigger if it's scheduled, webhook, or telegram (NOT manual)
      if (isTriggerRegistered && workspaceData.trigger?.type !== 'manual') {
        sidecarClient.sendMessage({
          id: crypto.randomUUID(),
          type: "unregister_trigger",
          workspaceId: workspaceData.id,
          timestamp: new Date().toISOString(),
        });
        
        // Different messages for different trigger types
        if (workspaceData.trigger?.type === 'scheduled') {
          addEvent({
            id: crypto.randomUUID(),
            type: "info",
            message: " Scheduler stopped and trigger unregistered",
            timestamp: Date.now(),
          });
        } else if (workspaceData.trigger?.type === 'webhook') {
          addEvent({
            id: crypto.randomUUID(),
            type: "info",
            message: " Webhook listener stopped",
            timestamp: Date.now(),
          });
        } else if (workspaceData.trigger?.type === 'telegram') {
          addEvent({
            id: crypto.randomUUID(),
            type: "info",
            message: " Telegram bot stopped",
            timestamp: Date.now(),
          });
        }
      }

      if (isRunning) {
        sidecarClient.sendMessage({
          id: crypto.randomUUID(),
          type: "abort_workspace",
          timestamp: new Date().toISOString(),
        });
        
        if (!workspaceData.trigger || workspaceData.trigger.type === 'manual') {
          addEvent({
            id: crypto.randomUUID(),
            type: "info",
            message: " Workspace execution stopped",
            timestamp: Date.now(),
          });
        }
      }

      setIsTriggerRegistered(false);
      setNextExecutionTime(null);
      setIsRunning(false);
      setIsWebhookActive(false);
      
      return;
    }
    
    setIsRunning(true);
    
    if (workspaceData.trigger && workspaceData.trigger.type !== 'manual') {
      console.log(`Registering ${workspaceData.trigger.type} trigger...`);
      
      const { appDataDir } = await import("@tauri-apps/api/path");
      const workflowsDir = await appDataDir();
      
      sidecarClient.sendMessage({
        id: crypto.randomUUID(),
        type: "register_trigger",
        data: JSON.stringify({
          workspaceId: workspaceData.id,
          trigger: workspaceData.trigger,
          workspaceData: workspaceData,
          baseWorkflowsPath: workflowsDir,
        }),
        timestamp: new Date().toISOString(),
      });
      
      setIsTriggerRegistered(true);
    } else {
      // Manual trigger 
      addEvent({
        id: crypto.randomUUID(),
        type: "info",
        message: " Running workspace manually...",
        timestamp: Date.now(),
      });
    }
    
    // Run the workspace
    const message: SidecarCommand = {
      id: crypto.randomUUID(),
      type: "run_workspace",
      workspaceId: workspaceData.id,
      data: JSON.stringify(workspaceData),
      timestamp: new Date().toISOString(),
    };

    sidecarClient.sendMessage(message);
  }, [workspaceData, isRunning, isTriggerRegistered, addEvent]);

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
      console.log("Received sidecar command:", command);
      try {
        // Auto-stop when workspace completes or is aborted
        if (command.type === "workspace_stopped" || command.type === "workspace_aborted") {
          setIsRunning(false);
          
          // For manual triggers, show completion message
          if (!workspaceData.trigger || workspaceData.trigger.type === 'manual') {
            if (command.type === "workspace_stopped") {
              addEvent({
                id: crypto.randomUUID(),
                type: "success",
                message: " Workspace execution completed",
                timestamp: Date.now(),
              });
            }
          }
        }

        // Handle user prompt request
        if (command.type === "user_prompt_request") {
          const data = command.data as UserPromptRequestData;
          
          const promptId = data?.promptId;
          const nodeId = data?.nodeId;
          const message = data?.message || "Please provide your input:";
          
          if (promptId && typeof nodeId !== 'undefined') {
            setUserPromptDialog({
              isOpen: true,
              promptId,
              nodeId,
              nodeTitle: "User Prompt", 
              message,
            });
          }
        }

        // Handle trigger registration response
        if (command.type === "trigger_registered") {
          setIsTriggerRegistered(true);
          
          if (command.data && typeof command.data === 'object') {
            const data = command.data as any;
            
            if (workspaceData.trigger?.type === 'webhook') {
              const updatedTrigger = {
                ...workspaceData.trigger,
                config: {
                  ...workspaceData.trigger.config,
                  webhookUrl: data.webhookUrl || workspaceData.trigger.config.webhookUrl,
                  secret: data.secret || workspaceData.trigger.config.secret,
                }
              };
              
              setWorkspaceData(prev => ({
                ...prev,
                trigger: updatedTrigger
              }));
              
              console.log(" Webhook trigger updated:", updatedTrigger);
              
              addEvent({
                id: crypto.randomUUID(),
                type: "success",
                message: " Webhook listener started",
                timestamp: Date.now(),
              });
            } 
            // Update telegram trigger with backend-generated data
            else if (workspaceData.trigger?.type === 'telegram') {
              const updatedTrigger = {
                ...workspaceData.trigger,
                config: {
                  ...workspaceData.trigger.config,
                  webhookUrl: data.webhookUrl || workspaceData.trigger.config.webhookUrl,
                  secretToken: data.secretToken || workspaceData.trigger.config.secretToken,
                  botInfo: data.botInfo || workspaceData.trigger.config.botInfo,
                }
              };
              
              setWorkspaceData(prev => ({
                ...prev,
                trigger: updatedTrigger
              }));
              
              console.log(" Telegram trigger updated:", updatedTrigger);
              
              addEvent({
                id: crypto.randomUUID(),
                type: "success",
                message: ` Telegram bot started: @${data.botInfo?.username || 'bot'}`,
                timestamp: Date.now(),
              });
            }
            else if (workspaceData.trigger?.type === 'scheduled') {
              addEvent({
                id: crypto.randomUUID(),
                type: "success",
                message: " Scheduler started successfully",
                timestamp: Date.now(),
              });
            }
            
            if (data.nextExecutionTime) {
              console.log(` Next execution at: ${new Date(data.nextExecutionTime).toISOString()}`);
              setNextExecutionTime(data.nextExecutionTime);
            }
          }
        }

        // Handle trigger unregistration
        if (command.type === "trigger_unregistered") {
          console.log("Trigger unregistered successfully");
          setIsTriggerRegistered(false);
          setNextExecutionTime(null);
          setIsWebhookActive(false);
        }

        // Handle scheduled trigger execution
        if (command.type === "trigger_execution") {
          const data = command.data as any;
          
          if (data && data.success !== undefined) {
            if (data.success) {
              console.log("⏰ Workspace executed via trigger");
              addEvent({
                id: crypto.randomUUID(),
                type: "success",
                message: ` Scheduled execution completed`,
                timestamp: Date.now(),
              });
              
              if (data.nextExecutionTime) {
                console.log(` Updated next execution at: ${new Date(data.nextExecutionTime).toISOString()}`);
                setNextExecutionTime(data.nextExecutionTime);
              }
            } else {
              console.error("❌ Trigger execution failed:", data.message || 'Unknown error');
              addEvent({
                id: crypto.randomUUID(),
                type: "error",
                message: `Scheduled execution failed: ${data.message || 'Unknown error'}`,
                timestamp: Date.now(),
              });
              
              if (data.nextExecutionTime) {
                setNextExecutionTime(data.nextExecutionTime);
              }
            }
          }
        }

        if (command.type === "webhook_execution") {
          const data = command.data as any;
          console.log(" Webhook triggered:", data);
          
          showWebhookActivity();
          
          addEvent({
            id: crypto.randomUUID(),
            type: "success",
            message: ` Webhook execution completed`,
            timestamp: Date.now(),
          });
        }

        if (command.type === "telegram_execution") {
          const data = command.data as any;
          console.log(" Telegram update processed:", data);
          
          showWebhookActivity();
          
          addEvent({
            id: crypto.randomUUID(),
            type: "success",
            message: ` Telegram update processed successfully`,
            timestamp: Date.now(),
          });
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

    sidecarClient.onCommand(handleSidecarCommand);
    sidecarClient.onStatusChange(handleStatusChange);

       // Set initial status
    setSidecarStatus(sidecarClient.getConnectionStatus());

    return () => {
      // Clean up listeners to prevent duplicates
      sidecarClient.offCommand(handleSidecarCommand);
      sidecarClient.offStatusChange(handleStatusChange);
      
      if (webhookActivityTimeoutRef.current) {
        clearTimeout(webhookActivityTimeoutRef.current);
      }
    };
  }, [workspaceData.id, workspaceData.trigger, addEvent, showWebhookActivity]);

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
    }, 200);  // Match with transition duration in Toast component
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

  // Handle showing encryption choice modal
  const handleShareWorkspace = async () => {
    if (!workspaceData) return;
    setShowEncryptionChoice(true);
    setIsDropdownOpen(false);
  };

      // Handle choosing full encryption
  const handleShareWithEncryption = () => {
    setShowEncryptionChoice(false);
    setEncryptionMode('full');
    setPasswordModalMode('encrypt');
    setPasswordError("");
    setShowPasswordModal(true);
  };

      // Handle choosing sensitive data only encryption
  const handleShareWithSensitiveDataEncryption = () => {
    setShowEncryptionChoice(false);
    setEncryptionMode('apikeys');
    setPasswordModalMode('encrypt');
    setPasswordError("");
    setShowPasswordModal(true);
  };

     // Handle choosing unencrypted export
  const handleShareWithoutEncryption = async () => {
    setShowEncryptionChoice(false);
    
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
    } catch (error) {
      console.error("Error exporting workspace:", error);
      showToast(
        t("workspaces.exportError", "Failed to export workspace"),
        "error"
      );
    }
  };

    // Handle password confirmation for encryption
  const handlePasswordConfirmed = async (password: string) => {
    try {
      const updatedWorkspace = {
        ...workspaceData,
        updatedAt: Date.now(),
      };

      if (encryptionMode === 'apikeys') {
        // For sensitive data mode: encrypt only the API keys and sensitive env vars, return plain workspace
        const workspaceWithEncryptedKeys = encryptWorkspaceApiKeys(updatedWorkspace, password);

        // Save as normal workspace file (no wrapper, just enc_ prefixed keys)
        await saveEncryptedWorkspace(
          workspaceWithEncryptedKeys,
          updatedWorkspace.name || updatedWorkspace.id
        );
        
        setShowPasswordModal(false);
        setPasswordError("");
        setEncryptionMode(null);
        
        showToast(
          t("workspaces.sensitiveDataEncrypted", "Workspace exported with encrypted sensitive data"),
          "success"
        );
      } else {
         // For full encryption mode: encrypt entire workspace
        const encryptedData = encryptWorkspaceData(updatedWorkspace, password);
        
        // Save with wrapper       
        await saveEncryptedWorkspace(
          encryptedData,
          updatedWorkspace.name || updatedWorkspace.id
        );
        
        setShowPasswordModal(false);
        setPasswordError("");
        setEncryptionMode(null);
        
        showToast(
          t("workspaces.encryptedExported", "Encrypted workspace exported successfully"),
          "success"
        );
      }
    } catch (error) {
      console.error("Error encrypting workspace:", error);
      setPasswordError(
        error instanceof Error 
          ? error.message 
          : t("workspaces.encryptError", "Failed to encrypt workspace")
      );
    }
  };

     // Handle canceling password modal
  const handlePasswordCancel = () => {
    setShowPasswordModal(false);
    setPasswordError("");
    setEncryptionMode(null);
  };

      // Handle canceling encryption choice
  const handleEncryptionChoiceCancel = () => {
    setShowEncryptionChoice(false);
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

  const handleEditStatusChange = (isEditing: boolean) => {
    if (isEditing) {
      setIsConsoleOpen(false);
    } else {
      setIsConsoleOpen(true);
    }
  };

  const isRTL = i18n.language === "ar";

  const getRunButtonState = () => {
    if (isRunning || isTriggerRegistered) {
      return {
        label: "Stop",
        icon: <StopCircleIcon className="h-4 w-4" />,
        className: "bg-red-500/10 hover:bg-red-500/20 text-red-500 border-red-500/20"
      };
    }
    
    return {
      label: "Run",
      icon: <Play className="h-4 w-4" />,
      className: "bg-green-500/10 hover:bg-green-500/20 text-green-500 border-green-500/20"
    };
  };

  const buttonState = getRunButtonState();

  return (
    <div className="w-full h-screen bg-black overflow-hidden flex flex-col">
      <div className="border-b border-zinc-800 bg-zinc-900/50 backdrop-blur-sm relative z-10 flex-none">
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
              {isTriggerRegistered && (
                <>
                  {/* Scheduled trigger countdown */}
                  {workspaceData.trigger?.type === 'scheduled' && nextExecutionTime && (
                    <CountdownTimer nextExecutionTime={nextExecutionTime} />
                  )}
                  
                  {/* Webhook status */}
                  {workspaceData.trigger?.type === 'webhook' && (
                    <WebhookStatus isActive={isWebhookActive} />
                  )}
                  
                  {/* Telegram status */}
                  {workspaceData.trigger?.type === 'telegram' && (
                    <TelegramStatus 
                      isActive={isWebhookActive}
                      botUsername={workspaceData.trigger.config.botInfo?.username}
                    />
                  )}
                </>
              )}

              <button
                className={`border px-3 py-2 rounded-md transition-all flex items-center gap-2 ${buttonState.className}`}
                onClick={handleToggleWorkspace}
                title={buttonState.label}
              >
                {buttonState.icon}
                <span className="text-xs font-medium">{buttonState.label}</span>
              </button>

              <button
                className="bg-[#FFC72C]/10 hover:bg-[#FFC72C]/20 text-[#FFC72C] border border-[#FFC72C]/20 p-2 rounded-md transition-all"
                onClick={handleSaveWorkspace}
                title={t("common.save", "Save")}
              >
                <Save className="h-4 w-4" />
              </button>

              <button
                className={`relative border p-2 rounded-md transition-all ${
                  isConsoleOpen
                    ? "bg-zinc-700 text-white border-zinc-600"
                    : "bg-zinc-800 hover:bg-zinc-700 text-zinc-400 border-zinc-700 hover:text-white"
                }`}
                onClick={() => setIsConsoleOpen(!isConsoleOpen)}
                title={t("workspaceTab.openConsole", "Open Console")}
              >
                <Terminal className="h-4 w-4" />
                {!isConsoleOpen && unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-3 w-3 items-center justify-center rounded-full bg-red-600 text-[8px] font-bold text-white shadow-sm border border-[#0a0a0a]">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </button>

              <div className="relative" ref={dropdownRef}>
                <button
                  className="bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white border border-zinc-700 p-2 rounded-md transition-all"
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
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

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
              {
                key: "environment",
                label: t("workspaces.environment", "Environment Variables"),
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

      <div className="flex-1 relative overflow-hidden">
        <div
          className="bg-[#0a0a0a] absolute top-0 left-0 right-0 overflow-hidden transition-all duration-300 ease-in-out"
          style={{
            bottom: isConsoleOpen ? (isConsoleMaximized ? "100%" : "50%") : "0",
          }}
        >
          <div className="w-full h-full overflow-hidden">
            {activeTab === "workspace" && (
              <WorkspaceTab
                workspaceData={workspaceData}
                onUpdateWorkspace={handleUpdateWorkspace}
                onEditStatusChange={handleEditStatusChange}
              />
            )}
            {activeTab === "tasks" && (
              <TasksTab
                workspaceData={workspaceData}
                onTabChanges={handleTabChanges}
                onChange={({ tasks, connections }) =>
                  handleUpdateWorkspace({ tasks, connections })
                }
                onTriggerChange={(trigger) =>
                  handleUpdateWorkspace({ trigger })
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
            {activeTab === "environment" && (
              <EnvironmentVariablesTab
                workspaceData={workspaceData}
                onTabChanges={handleTabChanges}
                onUpdateWorkspace={handleUpdateWorkspace}
              />
            )}
          </div>
        </div>

        {/* Docked Console Panel */}
        <div
          className={`bg-zinc-900 border-zinc-800 absolute bottom-0 left-0 right-0 flex flex-col transition-all duration-300 ease-in-out z-20 ${
            isConsoleOpen ? "border-t" : "border-t-0"
          }`}
          style={{
            height: isConsoleOpen
              ? isConsoleMaximized
                ? "100%"
                : "55%"
              : "0px",
          }}
        >
          <div className="w-full h-full overflow-hidden">
            <ConsolePanel
              isMaximized={isConsoleMaximized}
              onToggleMaximize={() =>
                setIsConsoleMaximized(!isConsoleMaximized)
              }
              onClose={() => setIsConsoleOpen(false)}
              canClose={activeTab !== "workspace"}
              className="h-full border-0"
            />
          </div>
        </div>
      </div>

      {/* Encryption Choice Modal */}
      {showEncryptionChoice && (
        <EncryptionChoiceModal
          onChooseEncrypted={handleShareWithEncryption}
          onChooseUnencrypted={handleShareWithoutEncryption}
          onChooseSensitiveDataOnly={handleShareWithSensitiveDataEncryption}
          onCancel={handleEncryptionChoiceCancel}
        />
      )}

      {/* Password Modal */}
      {showPasswordModal && (
        <PasswordModal
          mode={passwordModalMode}
          onConfirm={handlePasswordConfirmed}
          onCancel={handlePasswordCancel}
          error={passwordError}
        />
      )}

      {/* User Prompt Dialog */}
      {userPromptDialog && (
        <UserPromptDialog
          isOpen={userPromptDialog.isOpen}
          promptId={userPromptDialog.promptId}
          nodeId={userPromptDialog.nodeId}
          nodeTitle={userPromptDialog.nodeTitle}
          message={userPromptDialog.message}
          onSubmit={handleUserPromptSubmit}
          onClose={handleUserPromptCancel}
        />
      )}

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

const WorkspaceCanvas: React.FC<WorkspaceCanvasProps> = (props) => {
  return (
    <ConsoleProvider workspaceId={props.workspaceData.id}>
      <WorkspaceCanvasContent {...props} />
    </ConsoleProvider>
  );
};

export default WorkspaceCanvas;
