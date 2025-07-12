/*
* yaLLMa3 - Framework for building AI agents that are capable of learning from their environment and interacting with it.
 
 * Copyright (C) 2025 yaLLMa3
 
 * This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0.
   If a copy of the MPL was not distributed with this file, You can obtain one at https://www.mozilla.org/MPL/2.0/.
 
 * This software is distributed on an "AS IS" basis,
   WITHOUT WARRANTY OF ANY KIND, either express or implied.
   See the Mozilla Public License for the specific language governing rights and limitations under the License.
*/
import React, { useState, useEffect, useCallback, useMemo } from "react";

import { WorkspaceData, LLMOption, ConsoleEvent } from "../../types/Types";
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

interface WorkspaceTabProps {
  workspaceData: WorkspaceData;
  onUpdateWorkspace?: (updatedData: Partial<WorkspaceData>) => Promise<void>;
  events: ConsoleEvent[];
}

const WorkspaceTab: React.FC<WorkspaceTabProps> = ({
  workspaceData,
  onUpdateWorkspace: onUpdateWorkspace,
  events: initialEvents,
}) => {
  // Console state
  const [events, setEvents] = useState<ConsoleEvent[]>([]);

  const [isConsoleRunning, setIsConsoleRunning] = useState(true);
  const [isConsoleExpanded, setIsConsoleExpanded] = useState(false);

  // Available LLM options
  const availableLLMs: LLMOption[] = useMemo(
    () => [
      {
        id: "gpt-4",
        name: "GPT-4",
        provider: "OpenAI",
        tokenLimit: 8192,
      },
      {
        id: "gpt-3.5-turbo",
        name: "GPT-3.5 Turbo",
        provider: "OpenAI",
        tokenLimit: 4096,
      },
      {
        id: "claude-3-opus",
        name: "Claude 3 Opus",
        provider: "Anthropic",
        tokenLimit: 200000,
      },
      {
        id: "claude-3-sonnet",
        name: "Claude 3 Sonnet",
        provider: "Anthropic",
        tokenLimit: 100000,
      },
      {
        id: "gemini-pro",
        name: "Gemini Pro",
        provider: "Google",
        tokenLimit: 32768,
      },
      {
        id: "llama-3-70b",
        name: "Llama 3 (70B)",
        provider: "Meta",
        tokenLimit: 8192,
      },
      {
        id: "mixtral-8x7b",
        name: "Mixtral 8x7B",
        provider: "Groq",
        tokenLimit: 32768,
      },
      {
        id: "llama-2-70b",
        name: "Llama 2 (70B)",
        provider: "Groq",
        tokenLimit: 4096,
      },
    ],
    []
  );

  // Helper function to determine provider from LLM ID
  const getProviderFromLLM = useCallback(
    (llmId: string): string | null => {
      if (!llmId) return null;
      const llm = availableLLMs.find((llm) => llm.id === llmId);
      return llm ? llm.provider : null;
    },
    [availableLLMs]
  );

  // Get unique providers from available LLMs
  const llmProviders = [...new Set(availableLLMs.map((llm) => llm.provider))];

  // State for editing mode
  const [isEditing, setIsEditing] = useState<boolean>(false);

  // State for form values
  const [formValues, setFormValues] = useState({
    name: workspaceData.name || "",
    description: workspaceData.description || "",
    mainLLM: workspaceData.mainLLM || "",
    apiKey: workspaceData.apiKey || "",
    useSavedCredentials: workspaceData.useSavedCredentials || false,
  });

  // State for selected provider
  const [selectedProvider, setSelectedProvider] = useState<string>(
    // Try to determine the provider from the mainLLM
    getProviderFromLLM(workspaceData.mainLLM) || "Groq"
  );

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

  // Handle cancel
  const handleCancel = () => {
    // Reset form values to original data
    setFormValues({
      name: workspaceData.name || "",
      description: workspaceData.description || "",
      mainLLM: workspaceData.mainLLM || "",
      apiKey: workspaceData.apiKey || "",
      useSavedCredentials: workspaceData.useSavedCredentials || false,
    });
    // Reset provider selection
    setSelectedProvider(getProviderFromLLM(workspaceData.mainLLM) || "Groq");
    setIsEditing(false);
  };

  // Sync form values when workspace data changes
  useEffect(() => {
    setFormValues({
      name: workspaceData.name || "",
      description: workspaceData.description || "",
      mainLLM: workspaceData.mainLLM || "",
      apiKey: workspaceData.apiKey || "",
      useSavedCredentials: workspaceData.useSavedCredentials || false,
    });
    setSelectedProvider(getProviderFromLLM(workspaceData.mainLLM) || "Groq");
  }, [workspaceData, getProviderFromLLM]);

  // Update selected provider when mainLLM changes via Select component
  useEffect(() => {
    if (formValues.mainLLM) {
      const selectedLLM = availableLLMs.find(
        (llm) => llm.id === formValues.mainLLM
      );
      if (selectedLLM && selectedLLM.provider !== selectedProvider) {
        setSelectedProvider(selectedLLM.provider);
      }
    }
  }, [formValues.mainLLM, availableLLMs, selectedProvider]);

  useEffect(() => {
    setEvents(initialEvents);
  }, [initialEvents]);

  // Simulate real-time events
  useEffect(() => {
    if (!isConsoleRunning) return;

    // const eventTypes: ('info' | 'warning' | 'error' | 'success')[] = ['info', 'warning', 'error', 'success'];
    // const messages = [
    //   'Task executed successfully',
    //   'Agent response received',
    //   'Workflow step completed',
    //   'Model inference completed',
    //   'Data processed successfully'
    // ];

    // const newEvent: ConsoleEvent = {
    //   id: Date.now().toString(),
    //   timestamp: Date.now(),
    //   type: eventTypes[Math.floor(Math.random() * eventTypes.length)],
    //   message: messages[Math.floor(Math.random() * messages.length)],
    //   details: Math.random() > 0.5 ? 'Additional context information' : undefined
    // };

    // setEvents(prev => [newEvent, ...prev].slice(0, 50)); // Keep only last 50 events

    // return () => clearInterval(interval);
  }, [isConsoleRunning]);

  const clearEvents = () => {
    setEvents([]);
  };

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  const getEventColor = (type: string) => {
    switch (type) {
      case "error":
        return "text-red-400";
      case "warning":
        return "text-yellow-400";
      case "success":
        return "text-green-400";
      default:
        return "text-blue-400";
    }
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
                    placeholder="Workspace name"
                  />
                ) : (
                  workspaceData.name || "Content Creation"
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
                    placeholder="Workspace description"
                  />
                ) : (
                  workspaceData.description || "No description provided"
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
                    Confirm
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCancel}
                    className="border-zinc-700 hover:bg-zinc-800 text-zinc-300"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Cancel
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
                  Edit
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="grid grid-cols-2 gap-x-12 gap-y-6">
              <div>
                <label className="text-sm text-zinc-400 block mb-2">
                  Workspace ID
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
                  Created
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
                  Main LLM
                </label>
                <div className="flex items-center gap-2">
                  <Brain className="h-4 w-4 text-zinc-500" />
                  {isEditing ? (
                    <div className="flex-1">
                      <div className="flex gap-3">
                        <div className="flex-1">
                          <Select
                            id="provider"
                            value={selectedProvider}
                            onChange={(value) => setSelectedProvider(value)}
                            options={llmProviders.map((provider) => ({
                              value: provider,
                              label: provider,
                            }))}
                            placeholder="Select a provider..."
                            label="Select Provider"
                          />
                        </div>
                        <div className="flex-1">
                          <Select
                            id="model"
                            value={formValues.mainLLM || ""}
                            onChange={(value) =>
                              setFormValues((prev) => ({
                                ...prev,
                                mainLLM: value,
                              }))
                            }
                            options={[
                              {
                                value: "",
                                label: "Select a model...",
                                disabled: true,
                              },
                              ...availableLLMs
                                .filter(
                                  (llm) =>
                                    !selectedProvider ||
                                    llm.provider === selectedProvider
                                )
                                .map((llm) => ({
                                  value: llm.id,
                                  label: `${
                                    llm.name
                                  } - ${llm.tokenLimit.toLocaleString()} tokens`,
                                })),
                            ]}
                            disabled={!selectedProvider}
                            label="Select Model"
                          />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <span className="text-sm text-[#FFC72C] font-medium">
                      {workspaceData.mainLLM || "gpt-3.5-turbo"}
                    </span>
                  )}
                </div>
              </div>

              <div>
                <label className="text-sm text-zinc-400 block mb-2">
                  Last Updated
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
              {isEditing && formValues.mainLLM && (
                <>
                  <div className="col-span-2">
                    <label className="text-sm text-zinc-400 block mb-2">
                      API Configuration
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
                        New Key
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
                        Keys Vault
                      </button>
                    </div>

                    {/* API Key Input Container with fixed height */}
                    <div className="h-24">
                      {" "}
                      {/* Fixed height container */}
                      {!formValues.useSavedCredentials ? (
                        <div>
                          <div className="relative">
                            <input
                              type="password"
                              name="apiKey"
                              value={formValues.apiKey}
                              onChange={handleInputChange}
                              className="w-full pl-9 pr-3 py-2 bg-zinc-800 border border-zinc-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-[#FFC72C]"
                              placeholder="Enter API key"
                            />
                            <Key className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
                          </div>
                          <p className="text-xs text-zinc-400 mt-1">
                            Your API key is stored locally and never shared
                          </p>
                        </div>
                      ) : (
                        /* Keys Vault Selection */
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
                                label: "Select a saved key...",
                                disabled: true,
                              },
                              { value: "key1", label: "Groq API Key" },
                              { value: "key2", label: "OpenAI API Key" },
                              { value: "key3", label: "Anthropic API Key" },
                              { value: "key4", label: "Google API Key" },
                            ]}
                            label="Saved Key"
                          />
                          <p className="text-xs text-zinc-400 mt-1">
                            Use a previously saved API key from your vault
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
            <CardTitle className="text-white">Event Console</CardTitle>
            <CardDescription className="text-zinc-400">
              Real-time workspace events and system logs
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
                  Minimize
                </>
              ) : (
                <>
                  <Expand className="h-4 w-4 mr-2" />
                  Expand
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
                  Pause
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Resume
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
              Clear
            </Button>
          </div>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col min-h-0">
          <ScrollArea className="flex-1 w-full">
            <div className="space-y-2 font-mono text-sm">
              {events.length === 0 ? (
                <div className="text-zinc-500 text-center py-8">
                  No events to display. Events will appear here as they occur.
                </div>
              ) : (
                events.map((event) => (
                  <div
                    key={event.id}
                    className="flex items-start gap-3 p-2 rounded hover:bg-zinc-800/50"
                  >
                    <span className="text-zinc-500 text-xs mt-0.5 min-w-[60px]">
                      {formatTimestamp(event.timestamp)}
                    </span>
                    <span
                      className={`text-xs font-medium min-w-[60px] ${getEventColor(
                        event.type
                      )}`}
                    >
                      [{event.type.toUpperCase()}]
                    </span>
                    <div className="flex-1">
                      <div className="text-white">{event.message}</div>
                      {event.details && (
                        <div className="text-zinc-400 text-xs mt-1">
                          {event.details}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};

export default WorkspaceTab;
