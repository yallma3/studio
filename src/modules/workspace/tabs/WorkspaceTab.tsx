/*
* yaLLMa3 - Framework for building AI agents that are capable of learning from their environment and interacting with it.
 
 * Copyright (C) 2025 yaLLMa3
 
 * This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0.
   If a copy of the MPL was not distributed with this file, You can obtain one at https://www.mozilla.org/MPL/2.0/.
 
 * This software is distributed on an "AS IS" basis,
   WITHOUT WARRANTY OF ANY KIND, either express or implied.
   See the Mozilla Public License for the specific language governing rights and limitations under the License.
*/
import React, { useState, useEffect, useCallback, useRef } from "react";

import { WorkspaceData, LLMOption, ConsoleEvent } from "../types/Types";
import {
  Edit,
  Hash,
  Brain,
  Calendar,
  Clock,
  Play,
  Pause,
  Trash2,
  Expand,
  Minimize,
  X,
  Key,
  Check,
  FileText,
} from "lucide-react";

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "../../../shared/components/ui/card";
import { Button } from "../../../shared/components/ui/button";
import { ScrollArea } from "../../../shared/components/ui/scroll-area";
import Select from "../../../shared/components/ui/select";
import { AvailableLLMs, LLMModel } from "../../../shared/LLM/config";
import EventResultDialog from "../components/EventResultDialog";
import { useTranslation } from "react-i18next";

interface PendingPromptData {
  promptId: string;
  nodeId: number;
  nodeName?: string;
  message: string;
  timestamp: number;
  inputValue: string;
}

interface WorkspaceTabProps {
  workspaceData: WorkspaceData;
  onUpdateWorkspace?: (updatedData: Partial<WorkspaceData>) => Promise<void>;
  events: ConsoleEvent[];
  onClearEvents?: () => void;
  onAddEvent?: (event: ConsoleEvent) => void;
  onSendConsoleInput?: (event: ConsoleEvent) => void;
}

const WorkspaceTab: React.FC<WorkspaceTabProps> = ({
  workspaceData,
  onUpdateWorkspace: onUpdateWorkspace,
  events: initialEvents,
  onClearEvents,
  onAddEvent,
  onSendConsoleInput,
}) => {
  const { t } = useTranslation();

  const WAITING_FOR_INPUT = t("workspaceTab.waitingForInput", "Waiting for user input");
  
   // Console state
   const [events, setEvents] = useState<ConsoleEvent[]>([]);
   const [pendingPrompts, setPendingPrompts] = useState<PendingPromptData[]>([]);
   const [consumedPromptIds, setConsumedPromptIds] = useState<string[]>([]);
   const [consoleInput, setConsoleInput] = useState("");
   const [isConsoleRunning, setIsConsoleRunning] = useState(true);
   const [isConsoleExpanded, setIsConsoleExpanded] = useState(false);

  // Event result dialog state
  const [selectedEvent, setSelectedEvent] = useState<ConsoleEvent | null>(null);
  const [isResultDialogOpen, setIsResultDialogOpen] = useState(false);

  // Ref for scroll area
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Function to scroll to bottom of console
  const scrollToBottom = useCallback(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({
        top: scrollAreaRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, []);

  const [formValues, setFormValues] = useState({
    name: workspaceData.name || "",
    description: workspaceData.description || "",
    mainLLM: workspaceData.mainLLM,
    apiKey: workspaceData.apiKey || "",
    useSavedCredentials: workspaceData.useSavedCredentials || false,
  });

  // LLM providers/models derived from AvailableLLMs
  const llmProviders = Object.keys(AvailableLLMs) as LLMOption["provider"][];

  // State for selected provider
  const [selectedProvider, setSelectedProvider] =
    useState<LLMOption["provider"]>("Groq");
      // remove unused selectedModel state

  const [llmOptions, setLLMOptions] = useState<LLMModel[]>(
    AvailableLLMs["Groq"]
  );

  useEffect(() => {
    setLLMOptions(AvailableLLMs[selectedProvider]);
  }, [selectedProvider]);

  // State for editing mode
  const [isEditing, setIsEditing] = useState<boolean>(false);

  // State for form values
  useEffect(() => {
    if (isEditing) {
      setSelectedProvider(workspaceData.mainLLM.provider);
    }
  }, [isEditing, workspaceData.mainLLM.provider]);

  // Handle input changes
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormValues((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handle save
  const handleSave = async () => {
    if (onUpdateWorkspace) {
      await onUpdateWorkspace({
        name: formValues.name,
        description: formValues.description,
        mainLLM: formValues.mainLLM,
        apiKey: formValues.apiKey,
        useSavedCredentials: formValues.useSavedCredentials,
      });
    }
    setIsEditing(false);
  };

   // Handle adding new pending prompts from console events - ONE AT A TIME
   useEffect(() => {
     if (pendingPrompts.length === 0) {
       const newPrompt = events.find(
         (event) =>
           event.type === "input" &&
           event.promptId &&
           event.details === WAITING_FOR_INPUT &&
           !consumedPromptIds.includes(event.promptId)
       );

       if (newPrompt) {
         setPendingPrompts([{
           promptId: newPrompt.promptId!,
           nodeId: newPrompt.nodeId || 0,
           nodeName: newPrompt.nodeName || t("workspaceTab.unknownNode", "Unknown Node"),
           message: newPrompt.message,
           timestamp: newPrompt.timestamp,
           inputValue: "",
         }]);
       }
     }
   }, [events, pendingPrompts, consumedPromptIds, t]);
  const handleConsoleInputSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!consoleInput.trim()) return;

    if (pendingPrompts.length > 0) {
      const currentPrompt = pendingPrompts[0];
      
      const newEvent: ConsoleEvent = {
        id: Date.now().toString() + Math.random().toString(36).substring(2, 11),
        timestamp: Date.now(),
        type: "user",
        message: consoleInput,
        details: t("workspaceTab.userInput", "User input"),
        promptId: currentPrompt.promptId,
      };

      console.log("Sending console input via WebSocket:", newEvent);

      setEvents((prev) => [...prev, newEvent]);

      // Send via WebSocket if callback is provided
      if (onSendConsoleInput) {
        onSendConsoleInput(newEvent);
      } else {
        console.warn("No WebSocket callback provided, adding locally only");
        if (onAddEvent) {
          onAddEvent(newEvent);
        }
      }

       // Remove the prompt from pending list and mark as consumed
       setPendingPrompts(prev => prev.filter(p => p.promptId !== currentPrompt.promptId));
       setConsumedPromptIds(prev => [...prev, currentPrompt.promptId]);

       // Clear input immediately
       setConsoleInput("");
    } else {
      // No pending prompt, just add as regular console input
      const newEvent: ConsoleEvent = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        timestamp: Date.now(),
        type: "user",
        message: consoleInput,
        details: t("workspaceTab.userInput", "User input"),
      };

      console.log("Sending console input via WebSocket:", newEvent);

      // Add the event locally first
      setEvents((prev) => [...prev, newEvent]);

      if (onSendConsoleInput) {
        onSendConsoleInput(newEvent);
      } else {
        console.warn("No WebSocket callback provided, adding locally only");
        if (onAddEvent) {
          onAddEvent(newEvent);
        }
      }

      // Clear input
      setConsoleInput("");
    }
  };



  // Handle cancel
  const handleCancel = () => {
    setFormValues({
      name: workspaceData.name || "",
      description: workspaceData.description || "",
      mainLLM: workspaceData.mainLLM,
      apiKey: workspaceData.apiKey || "",
      useSavedCredentials: workspaceData.useSavedCredentials || false,
    });
    setIsEditing(false);
  };

  // Sync form values when workspace data changes
  useEffect(() => {
    setFormValues({
      name: workspaceData.name || "",
      description: workspaceData.description || "",
      mainLLM: workspaceData.mainLLM,
      apiKey: workspaceData.apiKey || "",
      useSavedCredentials: workspaceData.useSavedCredentials || false,
    });
  }, [workspaceData]);

  useEffect(() => {
    setEvents(initialEvents);
  }, [initialEvents]);

  // Scroll to bottom when new events are added
  useEffect(() => {
    if (events.length > 0) {
      setTimeout(() => {
        scrollToBottom();
      }, 0);
    }
  }, [events, scrollToBottom]);

  useEffect(() => {
    if (!isConsoleRunning) return;
  }, [isConsoleRunning]);

  const clearEvents = () => {
    setEvents([]);
    setPendingPrompts([]);
    if (onClearEvents) {
      onClearEvents();
    }
  };

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  const getEventColor = (type: string) => {
    switch (type) {
      case "info":
        return "text-blue-400";
      case "error":
        return "text-red-400";
      case "warning":
        return "text-yellow-400";
      case "success":
        return "text-green-400";
      case "system":
        return "text-[#9CA3AF]";
      case "input":
        return "text-[#06B6D4]";
      case "user":
        return "text-[#8B5CF6]";
      default:
        return "text-blue-400";
    }
  };

  const handleViewResult = (event: ConsoleEvent) => {
    setSelectedEvent(event);
    setIsResultDialogOpen(true);
  };

  const handleCloseResultDialog = () => {
    setIsResultDialogOpen(false);
    setSelectedEvent(null);
  };

  return (
    <div className="p-6 h-full max-h-screen flex flex-col gap-6 overflow-hidden">
      {/* Workspace Details Card - Hidden when console is expanded */}
      {!isConsoleExpanded && (
        <Card className="bg-zinc-900 border-zinc-800 flex-shrink-0">
          <CardHeader className="flex flex-row items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-white flex items-center gap-3 text-xl mb-3">
                <div className="h-2 w-2 bg-[#FFC72C] rounded-full"></div>
                {isEditing ? (
                  <input
                    type="text"
                    name="name"
                    value={formValues.name}
                    onChange={handleInputChange}
                    className="bg-zinc-800 border border-zinc-600 rounded px-2 py-1 text-white focus:outline-none focus:ring-2 focus:ring-[#FFC72C]"
                    placeholder={t("workspaceTab.workspaceName", "Workspace name")}
                  />
                ) : (
                  workspaceData.name || t("workspaceTab.contentCreation", "Content Creation")
                )}
              </CardTitle>
              <CardDescription className="text-zinc-400 text-sm leading-relaxed">
                {isEditing ? (
                  <textarea
                    name="description"
                    value={formValues.description}
                    onChange={handleInputChange}
                    className="w-full bg-zinc-800 border border-zinc-600 rounded px-2 py-1 text-zinc-300 focus:outline-none focus:ring-2 focus:ring-[#FFC72C] resize-none"
                    rows={3}
                    placeholder={t("workspaceTab.workspaceDescription", "Workspace description")}
                  />
                ) : (
                  workspaceData.description || t("workspaceTab.noDescription", "No description provided")
                )}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {isEditing ? (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSave}
                    className="border-green-600 hover:bg-green-700 text-green-400"
                  >
                    <Check className="h-4 w-4 mr-2" />
                    {t("workspaceTab.confirm", "Confirm")}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCancel}
                    className="border-zinc-700 hover:bg-zinc-800 text-zinc-300"
                  >
                    <X className="h-4 w-4 mr-2" />
                    {t("common.cancel", "Cancel")}
                  </Button>
                </>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditing(true)}
                  className="border-zinc-700 hover:bg-zinc-800 text-zinc-300"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  {t("common.edit", "Edit")}
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="grid grid-cols-2 gap-x-12 gap-y-6">
              <div>
                <label className="text-sm text-zinc-400 block mb-2">
                  {t("workspaceTab.workspaceId", "Workspace ID")}
                </label>
                <div className="flex items-center gap-2">
                  <Hash className="h-4 w-4 text-zinc-500" />
                  <code className="text-sm text-[#FFC72C] font-mono">
                    {workspaceData.id || "workspace-1748435851397"}
                  </code>
                </div>
              </div>

              <div>
                <label className="text-sm text-zinc-400 block mb-2">
                  {t("workspaceTab.created", "Created")}
                </label>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-zinc-500" />
                  <span className="text-sm text-white">
                    {workspaceData.createdAt
                      ? new Date(workspaceData.createdAt).toLocaleDateString(
                          "en-GB"
                        ) +
                        ", " +
                        new Date(workspaceData.createdAt).toLocaleTimeString(
                          "en-GB",
                          { hour12: false }
                        )
                      : "28/05/2025, 15:37:31"}
                  </span>
                </div>
              </div>

              <div>
                <label className="text-sm text-zinc-400 block mb-2">
                  {t("workspaceTab.mainLLM", "Main LLM")}
                </label>
                <div className="flex items-center gap-2">
                  <Brain className="h-4 w-4 text-zinc-500" />
                  {isEditing ? (
                    <div className="flex-1">
                      <div className="grid grid-cols-5 gap-4">
                        <div className="col-span-2">
                          <Select
                            id="workspace-llm-provider"
                            value={selectedProvider}
                            onChange={(value) => {
                              setSelectedProvider(
                                value as LLMOption["provider"]
                              );
                            }}
                            options={llmProviders.map((p) => ({
                              value: p,
                              label: p,
                            }))}
                            label={t("workspaceTab.provider", "Provider")}
                          />
                        </div>
                        <div className="col-span-3">
                          <Select
                            id="workspace-llm-model"
                            value={formValues.mainLLM.model.id}
                            onChange={(value) => {
                              const option = llmOptions.find(
                                (m) => m.id === value
                              );
                              if (!option) return;

                              setFormValues((prev) => ({
                                ...prev,
                                mainLLM: {
                                  provider: selectedProvider,
                                  model: option,
                                },
                              }));
                            }}
                            options={[
                              {
                                value: "",
                                label: t("workspaceTab.selectModel", "Select a model..."),
                                disabled: true,
                              },
                              ...llmOptions.map((m) => ({
                                value: m.id,
                                label: m.name,
                              })),
                            ]}
                            disabled={!selectedProvider}
                            label={t("workspaceTab.model", "Model")}
                          />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <span className="text-sm text-[#FFC72C] font-medium">
                      {workspaceData.mainLLM?.model.name || t("workspaceTab.noModelSelected", "No model selected")}
                    </span>
                  )}
                </div>
              </div>

              <div>
                <label className="text-sm text-zinc-400 block mb-2">
                  {t("workspaceTab.lastUpdated", "Last Updated")}
                </label>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-zinc-500" />
                  <span className="text-sm text-white">
                    {workspaceData.updatedAt
                      ? new Date(workspaceData.updatedAt).toLocaleDateString(
                          "en-GB"
                        ) +
                        ", " +
                        new Date(workspaceData.updatedAt).toLocaleTimeString(
                          "en-GB",
                          { hour12: false }
                        )
                      : "28/05/2025, 15:46:54"}
                  </span>
                </div>
              </div>

              {/* API Key Section - Only show when editing */}
              {isEditing && formValues.mainLLM?.model && (
                <>
                  <div className="col-span-2">
                    <label className="text-sm text-zinc-400 block mb-2">
                      {t("workspaceTab.apiConfiguration", "API Configuration")}
                    </label>
                    
                    {/* API Key Options */}
                    <div className="flex gap-2 mb-4">
                      <button
                        type="button"
                        onClick={() =>
                          setFormValues((prev) => ({
                            ...prev,
                            useSavedCredentials: false,
                          }))
                        }
                        className={`flex-1 py-2 px-4 rounded-md transition-all cursor-pointer ${
                          !formValues.useSavedCredentials
                            ? "bg-[#FFC72C] text-black font-medium"
                            : "bg-zinc-800 text-white border border-zinc-700 hover:bg-zinc-700"
                        }`}
                      >
                        {t("workspaceTab.newKey", "New Key")}
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setFormValues((prev) => ({
                            ...prev,
                            useSavedCredentials: true,
                          }))
                        }
                        className={`flex-1 py-2 px-4 rounded-md transition-all cursor-pointer ${
                          formValues.useSavedCredentials
                            ? "bg-[#FFC72C] text-black font-medium"
                            : "bg-zinc-800 text-white border border-zinc-700 hover:bg-zinc-700"
                        }`}
                      >
                        {t("workspaceTab.keysVault", "Keys Vault")}
                      </button>
                    </div>

                    <div className="h-24">
                      {!formValues.useSavedCredentials ? (
                        <div>
                          <div className="relative">
                            <input
                              type="password"
                              name="apiKey"
                              value={formValues.apiKey}
                              onChange={handleInputChange}
                              className="w-full pl-9 pr-3 py-2 bg-zinc-800 border border-zinc-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-[#FFC72C]"
                              placeholder={t("workspaceTab.enterApiKey", "Enter API key")}
                            />
                            <Key className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
                          </div>
                          <p className="text-xs text-zinc-400 mt-1">
                            {t("workspaceTab.apiKeyInfo", "Your API key is stored locally and never shared")}
                          </p>
                        </div>
                      ) : (
                        <div>
                          <Select
                            id="savedKey"
                            value={formValues.apiKey}
                            onChange={(value) =>
                              setFormValues((prev) => ({
                                ...prev,
                                apiKey: value,
                              }))
                            }
                            options={[
                              {
                                value: "",
                                label: t("workspaceTab.selectSavedKey", "Select a saved key..."),
                                disabled: true,
                              },
                              { value: "key1", label: "Groq API Key" },
                              { value: "key2", label: "OpenAI API Key" },
                              { value: "key3", label: "Anthropic API Key" },
                              { value: "key4", label: "Google API Key" },
                            ]}
                            label={t("workspaceTab.savedKey", "Saved Key")}
                          />
                          <p className="text-xs text-zinc-400 mt-1">
                            {t("workspaceTab.savedKeyInfo", "Use a previously saved API key from your vault")}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Event Console Card - Expandable */}
      <Card className="bg-zinc-900 border-zinc-800 flex-1 flex flex-col min-h-0">
        <CardHeader className="flex flex-row items-center justify-between flex-shrink-0">
          <div>
            <CardTitle className="text-white">
              {t("workspaceTab.eventConsole", "Event Console")}
            </CardTitle>
            <CardDescription className="text-zinc-400">
              {t("workspaceTab.eventConsoleDescription", "Real-time workspace events and system logs")}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsConsoleExpanded(!isConsoleExpanded)}
              className="border-zinc-700 hover:bg-zinc-800"
            >
              {isConsoleExpanded ? (
                <>
                  <Minimize className="h-4 w-4 mr-2" />
                  {t("workspaceTab.minimize", "Minimize")}
                </>
              ) : (
                <>
                  <Expand className="h-4 w-4 mr-2" />
                  {t("workspaceTab.expand", "Expand")}
                </>
              )}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsConsoleRunning(!isConsoleRunning)}
              className="border-zinc-700 hover:bg-zinc-800"
            >
              {isConsoleRunning ? (
                <>
                  <Pause className="h-4 w-4 mr-2" />
                  {t("workspaceTab.pause", "Pause")}
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  {t("workspaceTab.resume", "Resume")}
                </>
              )}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={clearEvents}
              className="border-zinc-700 hover:bg-zinc-800"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              {t("workspaceTab.clear", "Clear")}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col min-h-0">
          <ScrollArea ref={scrollAreaRef} className="flex-1 w-full mb-3">
            <div className="space-y-2 font-mono text-sm">
              {events.length === 0 ? (
                <div className="text-zinc-500 text-center py-8">
                  {t("workspaceTab.noEvents", "No events to display. Events will appear here as they occur.")}
                </div>
              ) : (
                events.map((event) => (
                  <div
                    key={event.id}
                    className="flex items-start gap-3 p-2 rounded hover:bg-zinc-800/50"
                  >
                    <span className="text-zinc-500 text-xs min-w-[60px] flex-shrink-0">
                      {formatTimestamp(event.timestamp)}
                    </span>
                    <span
                      className={`text-xs font-medium min-w-[60px] flex-shrink-0 ${getEventColor(
                        event.type
                      )}`}
                    >
                      [{event.type.toUpperCase()}]
                    </span>
                    <div className="flex items-start justify-between gap-4 w-full">
                      <div className="text-white break-words flex-1">
                        {event.message}
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        {event.details && typeof event.details === 'string' && (
                          <div className="text-zinc-400 text-[0.65rem] break-words">
                            {event.details}
                          </div>
                        )}
                        {event.results !== undefined && event.results !== null && (
                          <button
                            onClick={() => handleViewResult(event)}
                            className="text-[#FFC72C] hover:text-[#FFB300] transition-colors p-1 rounded hover:bg-zinc-800 cursor-pointer"
                            title={t("workspaceTab.viewResult", "View result")}
                          >
                            <FileText className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
          
          {/* Console Input Form */}
          <form
            onSubmit={handleConsoleInputSubmit}
            className="flex gap-2 border-t border-zinc-800 pt-3"
          >
            <input
              type="text"
              value={consoleInput}
              onChange={(e) => setConsoleInput(e.target.value)}
              placeholder={
                pendingPrompts.length > 0 && pendingPrompts[0].message
                  ? pendingPrompts[0].message
                  : t("workspaceTab.enterInput", "Please enter your input:")
              }
              className="flex-1 bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-[#FFC72C] text-sm"
              disabled={!isConsoleRunning}
            />
            <button
              type="submit"
              className="bg-[#FFC72C] hover:bg-[#E6B428] text-black px-4 py-2 rounded text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={!isConsoleRunning || !consoleInput.trim()}
            >
              {t("workspaceTab.send", "Send")}
            </button>
          </form>
        </CardContent>
      </Card>

      {/* Event Result Dialog */}
      <EventResultDialog
        isOpen={isResultDialogOpen}
        onClose={handleCloseResultDialog}
        event={selectedEvent}
      />
    </div>
  );
};

export default WorkspaceTab;
