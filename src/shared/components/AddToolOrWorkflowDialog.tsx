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
import { useTranslation } from "react-i18next";
import {
  Plus,
  X,
  ArrowLeft,
  ArrowRight,
  Workflow,
  Wrench,
  Loader2,
} from "lucide-react";
import { Tool } from "../../modules/workspace/types/Types";

interface AddToolOrWorkflowDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveWorkflow: (name: string, description: string) => void;
  onSaveMcpTool: (tool: Tool) => void;
}

type DialogStep = "selection" | "workflow" | "mcp";

const AddToolOrWorkflowDialog: React.FC<AddToolOrWorkflowDialogProps> = ({
  isOpen,
  onClose,
  onSaveWorkflow,
  onSaveMcpTool,
}) => {
  const { t } = useTranslation();
  const [currentStep, setCurrentStep] = useState<DialogStep>("selection");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Workflow form state
  const [workflowName, setWorkflowName] = useState("");
  const [workflowDescription, setWorkflowDescription] = useState("");

  // MCP form state
  const [mcpName, setMcpName] = useState("");
  const [mcpDescription, setMcpDescription] = useState("");
  const [mcpType, setMcpType] = useState<"STDIO" | "HTTP">("STDIO");
  const [mcpCommand, setMcpCommand] = useState("");
  const [mcpArgs, setMcpArgs] = useState<string[]>([]);
  const [mcpUrl, setMcpUrl] = useState("");
  const [mcpHeaders, setMcpHeaders] = useState<Record<string, string>>({});
  const [mcpHealthError, setMcpHealthError] = useState<string>("");

  // Reset form when dialog opens
  useEffect(() => {
    if (isOpen) {
      setCurrentStep("selection");
      setIsSubmitting(false);
      setWorkflowName("");
      setWorkflowDescription("");
      setMcpName("");
      setMcpDescription("");
      setMcpType("STDIO");
      setMcpCommand("");
      setMcpArgs([]);
      setMcpUrl("");
      setMcpHeaders({});
      setMcpHealthError("");
    }
  }, [isOpen]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      onClose();
    }
  };

  const handleSelection = (type: "workflow" | "mcp") => {
    if (type === "workflow") {
      setCurrentStep("workflow");
    } else {
      setCurrentStep("mcp");
    }
  };

  const handleBack = () => {
    setCurrentStep("selection");
  };

  const handleWorkflowSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!workflowName.trim()) return;

    setIsSubmitting(true);
    onSaveWorkflow(workflowName.trim(), workflowDescription.trim());
  };

  const checkMcpServerHealth = async (): Promise<boolean> => {
    setMcpHealthError("");

    const mcp = {
      type: mcpType,
      command: mcpCommand,
      args: mcpArgs,
      url: mcpUrl,
      headers: mcpHeaders,
    };

    try {
      const res = await fetch("http://localhost:3001/mcp/health", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(mcp),
      });

      if (res.status === 200) {
        return true;
      } else if (res.status === 500) {
        setMcpHealthError(
          t(
            "workspaces.mcpServerCannotConnect",
            "Server cannot connect. Please check your configuration."
          )
        );
        return false;
      } else {
        setMcpHealthError(
          t(
            "workspaces.mcpServerUnexpectedError",
            "Unexpected error occurred while checking server health."
          )
        );
        return false;
      }
    } catch (err) {
      console.error("MCP health check error:", err);
      setMcpHealthError(
        t(
          "workspaces.mcpServerConnectionFailed",
          "Failed to connect to MCP server. Please check if the server is running."
        )
      );
      return false;
    }
  };

  const handleMcpSubmit = async (e: React.FormEvent) => {
    setIsSubmitting(true);
    e.preventDefault();
    if (!mcpName.trim()) return;

    // Check MCP server health before adding the tool
    const isHealthy = await checkMcpServerHealth();
    console.log("Health check", isHealthy);
    if (!isHealthy) {
      setIsSubmitting(false);
      return; // Don't proceed if health check failed
    }

    const tool: Tool = {
      type: "mcp",
      name: mcpName.trim(),
      description: mcpDescription.trim(),
      parameters: {
        type: mcpType,
        ...(mcpType === "STDIO"
          ? { command: mcpCommand, args: mcpArgs }
          : { url: mcpUrl, headers: mcpHeaders }),
      },
    };
    console.log("TOOL FILE", tool);
    onSaveMcpTool(tool);
    setIsSubmitting(false);
  };

  const addMcpArg = () => {
    setMcpArgs([...mcpArgs, ""]);
  };

  const updateMcpArg = (index: number, value: string) => {
    const newArgs = [...mcpArgs];
    newArgs[index] = value;
    setMcpArgs(newArgs);
  };

  const removeMcpArg = (index: number) => {
    const newArgs = mcpArgs.filter((_, i) => i !== index);
    setMcpArgs(newArgs);
  };

  const addMcpHeader = () => {
    setMcpHeaders({ ...mcpHeaders, "": "" });
  };

  const updateMcpHeader = (key: string, newKey: string, value: string) => {
    const newHeaders = { ...mcpHeaders };
    delete newHeaders[key];
    if (newKey.trim()) {
      newHeaders[newKey.trim()] = value;
    }
    setMcpHeaders(newHeaders);
  };

  const removeMcpHeader = (key: string) => {
    const newHeaders = { ...mcpHeaders };
    delete newHeaders[key];
    setMcpHeaders(newHeaders);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 backdrop-blur-sm p-4">
      <div className="bg-gradient-to-br from-[#1a1a1a] to-[#151515] rounded-xl shadow-2xl border border-zinc-800/50 max-w-lg w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 pb-4 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-600/20 to-purple-700/20 border border-purple-600/30 flex items-center justify-center">
              <Plus size={16} className="text-purple-400" />
            </div>
            <h3 className="text-xl font-bold text-white">
              {currentStep === "selection" &&
                t("workspaces.addToolOrWorkflow", "Add Tool or Workflow")}
              {currentStep === "workflow" &&
                t("workspaces.createNewFlow", "Create New Workflow")}
              {currentStep === "mcp" &&
                t("workspaces.addMcpTool", "Add MCP Tool")}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white transition-colors p-1"
            disabled={isSubmitting}
          >
            <X size={20} />
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto px-6 pb-4">
          {/* Step 1: Selection */}
          {currentStep === "selection" && (
            <div className="space-y-4">
              <p className="text-zinc-300 text-sm mb-6">
                {t("workspaces.chooseType", "Choose what you want to add:")}
              </p>

              <div className="grid grid-cols-1 gap-4">
                <button
                  onClick={() => handleSelection("workflow")}
                  className="p-4 bg-gradient-to-r from-purple-600/10 to-purple-700/10 border border-purple-600/30 rounded-lg hover:from-purple-600/20 hover:to-purple-700/20 transition-all group"
                  disabled={isSubmitting}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-purple-600/20 flex items-center justify-center group-hover:bg-purple-600/30 transition-colors">
                      <Workflow size={20} className="text-purple-400" />
                    </div>
                    <div className="text-left">
                      <h4 className="font-semibold text-white">Workflow</h4>
                      <p className="text-sm text-zinc-400">
                        {t(
                          "workspaces.workflowDescription",
                          "Create a new workflow with nodes and connections"
                        )}
                      </p>
                    </div>
                    <ArrowRight size={16} className="text-zinc-400 ml-auto" />
                  </div>
                </button>

                <button
                  onClick={() => handleSelection("mcp")}
                  className="p-4 bg-gradient-to-r from-blue-600/10 to-blue-700/10 border border-blue-600/30 rounded-lg hover:from-blue-600/20 hover:to-blue-700/20 transition-all group"
                  disabled={isSubmitting}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-600/20 flex items-center justify-center group-hover:bg-blue-600/30 transition-colors">
                      <Wrench size={20} className="text-blue-400" />
                    </div>
                    <div className="text-left">
                      <h4 className="font-semibold text-white">MCP Tool</h4>
                      <p className="text-sm text-zinc-400">
                        {t(
                          "workspaces.mcpDescription",
                          "Add an MCP (Model Context Protocol) tool"
                        )}
                      </p>
                    </div>
                    <ArrowRight size={16} className="text-zinc-400 ml-auto" />
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* Step 2a: Workflow Form */}
          {currentStep === "workflow" && (
            <form
              id="workflow-form"
              onSubmit={handleWorkflowSubmit}
              className="space-y-4"
            >
              <div className="flex items-center gap-2 mb-4">
                <button
                  type="button"
                  onClick={handleBack}
                  className="text-zinc-400 hover:text-white transition-colors p-1"
                  disabled={isSubmitting}
                >
                  <ArrowLeft size={16} />
                </button>
                <span className="text-sm text-zinc-400">
                  {t("workspaces.step", "Step")} 2/2
                </span>
              </div>

              <div>
                <label
                  htmlFor="workflow-name"
                  className="block text-sm font-medium text-zinc-300 mb-2"
                >
                  {t("workspaces.workflowName", "Workflow Name")} *
                </label>
                <input
                  id="workflow-name"
                  type="text"
                  value={workflowName}
                  onChange={(e) => setWorkflowName(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={t(
                    "workspaces.enterWorkflowName",
                    "Enter workflow name..."
                  )}
                  className="w-full px-3 py-2 bg-[#0a0a0a] border border-zinc-700 rounded-md text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  required
                  disabled={isSubmitting}
                  autoFocus
                />
              </div>

              <div>
                <label
                  htmlFor="workflow-description"
                  className="block text-sm font-medium text-zinc-300 mb-2"
                >
                  {t("workspaces.workflowDescription", "Description")}
                </label>
                <textarea
                  id="workflow-description"
                  value={workflowDescription}
                  onChange={(e) => setWorkflowDescription(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={t(
                    "workspaces.enterWorkflowDescription",
                    "Enter workflow description..."
                  )}
                  className="w-full px-3 py-2 bg-[#0a0a0a] border border-zinc-700 rounded-md text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                  rows={3}
                  disabled={isSubmitting}
                />
              </div>
            </form>
          )}

          {/* Step 2b: MCP Form */}
          {currentStep === "mcp" && (
            <form
              id="mcp-form"
              onSubmit={handleMcpSubmit}
              className="space-y-4"
            >
              <div className="flex items-center gap-2 mb-4">
                <button
                  type="button"
                  onClick={handleBack}
                  className="text-zinc-400 hover:text-white transition-colors p-1"
                  disabled={isSubmitting}
                >
                  <ArrowLeft size={16} />
                </button>
                <span className="text-sm text-zinc-400">
                  {t("workspaces.step", "Step")} 2/2
                </span>
              </div>

              <div>
                <label
                  htmlFor="mcp-name"
                  className="block text-sm font-medium text-zinc-300 mb-2"
                >
                  {t("workspaces.toolName", "Tool Name")} *
                </label>
                <input
                  id="mcp-name"
                  type="text"
                  value={mcpName}
                  onChange={(e) => setMcpName(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={t(
                    "workspaces.enterToolName",
                    "Enter tool name..."
                  )}
                  className="w-full px-3 py-2 bg-[#0a0a0a] border border-zinc-700 rounded-md text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                  disabled={isSubmitting}
                  autoFocus
                />
              </div>

              <div>
                <label
                  htmlFor="mcp-description"
                  className="block text-sm font-medium text-zinc-300 mb-2"
                >
                  {t("workspaces.toolDescription", "Description")}
                </label>
                <textarea
                  id="mcp-description"
                  value={mcpDescription}
                  onChange={(e) => setMcpDescription(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={t(
                    "workspaces.enterToolDescription",
                    "Enter tool description..."
                  )}
                  className="w-full px-3 py-2 bg-[#0a0a0a] border border-zinc-700 rounded-md text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  rows={2}
                  disabled={isSubmitting}
                />
              </div>

              <div>
                <label
                  htmlFor="mcp-type"
                  className="block text-sm font-medium text-zinc-300 mb-2"
                >
                  {t("workspaces.connectionType", "Connection Type")} *
                </label>
                <select
                  id="mcp-type"
                  value={mcpType}
                  onChange={(e) => {
                    setMcpType(e.target.value as "STDIO" | "HTTP");
                    setMcpHealthError(""); // Clear error when configuration changes
                  }}
                  className="w-full px-3 py-2 bg-[#0a0a0a] border border-zinc-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={isSubmitting}
                >
                  <option value="STDIO">STDIO</option>
                  <option value="HTTP">HTTP</option>
                </select>
              </div>

              {/* Health Check Error Message */}
              {mcpHealthError && (
                <div className="p-3 bg-red-900/20 border border-red-600/30 rounded-md">
                  <p className="text-sm text-red-400">{mcpHealthError}</p>
                </div>
              )}

              {/* STDIO Configuration */}
              {mcpType === "STDIO" && (
                <>
                  <div>
                    <label
                      htmlFor="mcp-command"
                      className="block text-sm font-medium text-zinc-300 mb-2"
                    >
                      {t("workspaces.command", "Command")} *
                    </label>
                    <input
                      id="mcp-command"
                      type="text"
                      value={mcpCommand}
                      onChange={(e) => {
                        setMcpCommand(e.target.value);
                        setMcpHealthError(""); // Clear error when configuration changes
                      }}
                      onKeyDown={handleKeyDown}
                      placeholder={t(
                        "workspaces.enterCommand",
                        "Enter command..."
                      )}
                      className="w-full px-3 py-2 bg-[#0a0a0a] border border-zinc-700 rounded-md text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                      disabled={isSubmitting}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-2">
                      {t("workspaces.arguments", "Arguments")}
                    </label>
                    {mcpArgs.map((arg, index) => (
                      <div key={index} className="flex gap-2 mb-2">
                        <input
                          type="text"
                          value={arg}
                          onChange={(e) => updateMcpArg(index, e.target.value)}
                          onKeyDown={handleKeyDown}
                          placeholder={t(
                            "workspaces.enterArgument",
                            "Enter argument..."
                          )}
                          className="flex-1 px-3 py-2 bg-[#0a0a0a] border border-zinc-700 rounded-md text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          disabled={isSubmitting}
                        />
                        <button
                          type="button"
                          onClick={() => removeMcpArg(index)}
                          className="px-2 py-2 text-red-400 hover:text-red-300 transition-colors"
                          disabled={isSubmitting}
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={addMcpArg}
                      className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
                      disabled={isSubmitting}
                    >
                      + {t("workspaces.addArgument", "Add Argument")}
                    </button>
                  </div>
                </>
              )}

              {/* HTTP Configuration */}
              {mcpType === "HTTP" && (
                <>
                  <div>
                    <label
                      htmlFor="mcp-url"
                      className="block text-sm font-medium text-zinc-300 mb-2"
                    >
                      {t("workspaces.url", "URL")} *
                    </label>
                    <input
                      id="mcp-url"
                      type="url"
                      value={mcpUrl}
                      onChange={(e) => {
                        setMcpUrl(e.target.value);
                        setMcpHealthError(""); // Clear error when configuration changes
                      }}
                      onKeyDown={handleKeyDown}
                      placeholder={t("workspaces.enterUrl", "Enter URL...")}
                      className="w-full px-3 py-2 bg-[#0a0a0a] border border-zinc-700 rounded-md text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                      disabled={isSubmitting}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-2">
                      {t("workspaces.headers", "Headers")}
                    </label>
                    {Object.entries(mcpHeaders).map(([key, value], index) => (
                      <div key={index} className="flex gap-2 mb-2">
                        <input
                          type="text"
                          value={key}
                          onChange={(e) =>
                            updateMcpHeader(key, e.target.value, value)
                          }
                          onKeyDown={handleKeyDown}
                          placeholder={t(
                            "workspaces.headerKey",
                            "Header key..."
                          )}
                          className="flex-1 px-3 py-2 bg-[#0a0a0a] border border-zinc-700 rounded-md text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          disabled={isSubmitting}
                        />
                        <input
                          type="text"
                          value={value}
                          onChange={(e) =>
                            updateMcpHeader(key, key, e.target.value)
                          }
                          onKeyDown={handleKeyDown}
                          placeholder={t(
                            "workspaces.headerValue",
                            "Header value..."
                          )}
                          className="flex-1 px-3 py-2 bg-[#0a0a0a] border border-zinc-700 rounded-md text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          disabled={isSubmitting}
                        />
                        <button
                          type="button"
                          onClick={() => removeMcpHeader(key)}
                          className="px-2 py-2 text-red-400 hover:text-red-300 transition-colors"
                          disabled={isSubmitting}
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={addMcpHeader}
                      className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
                      disabled={isSubmitting}
                    >
                      + {t("workspaces.addHeader", "Add Header")}
                    </button>
                  </div>
                </>
              )}
            </form>
          )}
        </div>

        {/* Action Buttons - Always visible at bottom */}
        {currentStep !== "selection" && (
          <div className="flex-shrink-0 p-6 pt-4 border-t border-zinc-800/50">
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm text-zinc-300 hover:text-white transition-colors"
                disabled={isSubmitting}
              >
                {t("common.cancel", "Cancel")}
              </button>
              <button
                type="submit"
                form={currentStep === "workflow" ? "workflow-form" : "mcp-form"}
                className={`px-4 py-2 text-sm text-white rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 ${
                  currentStep === "workflow"
                    ? "bg-purple-600 hover:bg-purple-700"
                    : "bg-blue-600 hover:bg-blue-700"
                }`}
                disabled={
                  (currentStep === "workflow" && !workflowName.trim()) ||
                  (currentStep === "mcp" && !mcpName.trim()) ||
                  isSubmitting
                }
              >
                {isSubmitting && <Loader2 size={16} className="animate-spin" />}
                {isSubmitting
                  ? currentStep === "mcp"
                    ? t("workspaces.testingConnection", "Testing Connection...")
                    : t("common.creating", "Creating...")
                  : currentStep === "mcp"
                  ? t("workspaces.testAndCreate", "Test & Create")
                  : t("common.create", "Create")}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AddToolOrWorkflowDialog;
