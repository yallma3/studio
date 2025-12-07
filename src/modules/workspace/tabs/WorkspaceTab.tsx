/*
* yaLLMa3 - Framework for building AI agents that are capable of learning from their environment and interacting with it.
 
 * Copyright (C) 2025 yaLLMa3
 
 * This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0.
   If a copy of the MPL was not distributed with this file, You can obtain one at https://www.mozilla.org/MPL/2.0/.
 
 * This software is distributed on an "AS IS" basis,
   WITHOUT WARRANTY OF ANY KIND, either express or implied.
   See the Mozilla Public License for the specific language governing rights and limitations under the License.
*/
import React, { useState, useEffect } from "react";

import { WorkspaceData, LLMOption } from "../types/Types";
import {
  Edit,
  Hash,
  Brain,
  Calendar,
  Clock,
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
import Select from "../../../shared/components/ui/select";
import { AvailableLLMs, LLMModel } from "../../../shared/LLM/config";
import { llmsRegistry } from "../../../shared/LLM/LLMsRegistry";
import { useTranslation } from "react-i18next";

interface WorkspaceTabProps {
  workspaceData: WorkspaceData;
  onUpdateWorkspace?: (updatedData: Partial<WorkspaceData>) => Promise<void>;
}

const WorkspaceTab: React.FC<WorkspaceTabProps> = ({
  workspaceData,
  onUpdateWorkspace: onUpdateWorkspace,
}) => {
  const { t } = useTranslation();

  const [formValues, setFormValues] = useState({
    name: workspaceData.name || "",
    description: workspaceData.description || "",
    mainLLM: workspaceData.mainLLM,
    apiKey: workspaceData.apiKey || "",
    useSavedCredentials: workspaceData.useSavedCredentials || false,
  });

  const registryProviders = llmsRegistry.listProviders();
  const fallbackProviders = Object.keys(
    AvailableLLMs
  ) as LLMOption["provider"][];
  const providerOptions = (
    registryProviders.length > 0 ? registryProviders : fallbackProviders
  ) as LLMOption["provider"][];

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

  const [llmOptions, setLLMOptions] = useState<LLMModel[]>(
    getModelsForProvider("Groq")
  );

  useEffect(() => {
    setLLMOptions(getModelsForProvider(selectedProvider));
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


  return (
    <div className="p-6 h-full max-h-screen flex flex-col gap-6 overflow-hidden">
      {/* Workspace Details Card */}
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
                  placeholder={t(
                    "workspaceTab.workspaceName",
                    "Workspace name"
                  )}
                />
              ) : (
                workspaceData.name ||
                t("workspaceTab.contentCreation", "Content Creation")
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
                  placeholder={t(
                    "workspaceTab.workspaceDescription",
                    "Workspace description"
                  )}
                />
              ) : (
                workspaceData.description ||
                t("workspaceTab.noDescription", "No description provided")
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
                          options={providerOptions.map((p) => ({
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
                              label: t(
                                "workspaceTab.selectModel",
                                "Select a model..."
                              ),
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
                    {workspaceData.mainLLM?.model.name ||
                      t("workspaceTab.noModelSelected", "No model selected")}
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
                            placeholder={t(
                              "workspaceTab.enterApiKey",
                              "Enter API key"
                            )}
                          />
                          <Key className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
                        </div>
                        <p className="text-xs text-zinc-400 mt-1">
                          {t(
                            "workspaceTab.apiKeyInfo",
                            "Your API key is stored locally and never shared"
                          )}
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
                              label: t(
                                "workspaceTab.selectSavedKey",
                                "Select a saved key..."
                              ),
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
                          {t(
                            "workspaceTab.savedKeyInfo",
                            "Use a previously saved API key from your vault"
                          )}
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
    </div>
  );
};

export default WorkspaceTab;