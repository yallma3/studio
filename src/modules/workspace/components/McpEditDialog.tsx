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
import { X, Wrench, Loader2 } from "lucide-react";
import { McpToolFile } from "../utils/mcpStorageUtils";
import { Tool } from "../types/Types";
import Select from "../../../shared/components/ui/select";

interface McpEditDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (tool: Tool) => Promise<void>;
  mcpTool: McpToolFile | null;
  baseUrl: string;
}

export const McpEditDialog: React.FC<McpEditDialogProps> = ({
  isOpen,
  onClose,
  onSave,
  mcpTool,
  baseUrl,
}) => {
  const { t } = useTranslation();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<"STDIO" | "HTTP">("STDIO");
  const [command, setCommand] = useState("");
  const [args, setArgs] = useState<string[]>([]);
  const [url, setUrl] = useState("");
  const [headers, setHeaders] = useState<Record<string, string>>({});
  const [healthError, setHealthError] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen && mcpTool) {
      setName(mcpTool.name || "");
      setDescription(mcpTool.description || "");
      const toolType = mcpTool.type || "STDIO";
      setType(toolType);
      setCommand(mcpTool.parameters?.command || "");
      setArgs(mcpTool.parameters?.args ? [...mcpTool.parameters.args] : []);
      setUrl(mcpTool.parameters?.url || "");
      setHeaders(
        mcpTool.parameters?.headers ? { ...mcpTool.parameters.headers } : {}
      );
      setHealthError("");
      setIsSubmitting(false);
    }
  }, [isOpen, mcpTool]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      onClose();
    }
  };

  const addArg = () => {
    setArgs([...args, ""]);
  };

  const updateArg = (index: number, value: string) => {
    const newArgs = [...args];
    newArgs[index] = value;
    setArgs(newArgs);
  };

  const removeArg = (index: number) => {
    setArgs(args.filter((_, i) => i !== index));
  };

  const addHeader = () => {
    setHeaders({ ...headers, "": "" });
  };

  const updateHeader = (key: string, newKey: string, value: string) => {
    const newHeaders = { ...headers };
    delete newHeaders[key];
    if (newKey.trim()) {
      newHeaders[newKey.trim()] = value;
    }
    setHeaders(newHeaders);
  };

  const removeHeader = (key: string) => {
    const newHeaders = { ...headers };
    delete newHeaders[key];
    setHeaders(newHeaders);
  };

  const checkMcpServerHealth = async (): Promise<boolean> => {
    setHealthError("");

    const mcp = {
      type,
      command,
      args,
      url,
      headers,
    };

    try {
      const res = await fetch(`${baseUrl}/mcp/health`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(mcp),
      });

      if (res.status === 200) {
        return true;
      } else if (res.status === 500) {
        setHealthError(
          t(
            "workspaces.mcpServerCannotConnect",
            "Server cannot connect. Please check your configuration."
          )
        );
        return false;
      } else {
        setHealthError(
          t(
            "workspaces.mcpServerUnexpectedError",
            "Unexpected error occurred while checking server health."
          )
        );
        return false;
      }
    } catch (err) {
      console.error("MCP health check error:", err);
      setHealthError(
        t(
          "workspaces.mcpServerConnectionFailed",
          "Failed to connect to MCP server. Please check if the server is running."
        )
      );
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (type === "STDIO" && !command.trim()) return;
    if (type === "HTTP" && !url.trim()) return;

    setIsSubmitting(true);

    const isHealthy = await checkMcpServerHealth();
    if (!isHealthy) {
      setIsSubmitting(false);
      return;
    }

    const tool: Tool = {
      id: mcpTool?.id,
      type: "mcp",
      name: name.trim(),
      description: description.trim(),
      parameters: {
        type,
        ...(type === "STDIO" ? { command, args } : { url, headers }),
      },
    };

    try {
      await onSave(tool);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen || !mcpTool) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 backdrop-blur-sm p-4">
      <div className="bg-gradient-to-br from-[#1a1a1a] to-[#151515] rounded-xl shadow-2xl border border-zinc-800/50 dialog-md max-w-lg w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 pb-4 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-600/20 to-blue-700/20 border border-blue-600/30 flex items-center justify-center">
              <Wrench size={16} className="text-blue-400" />
            </div>
            <h3 className="text-xl font-bold text-white">
              {t("workspaces.editMcpTool", "Edit MCP Tool")}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white transition-colors p-1"
            disabled={isSubmitting}
            aria-label="Close dialog"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto px-6 pb-4">
          <form id="mcp-edit-form" onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="edit-mcp-name"
                className="block text-sm font-medium text-zinc-300 mb-2"
              >
                {t("workspaces.toolName", "Tool Name")} *
              </label>
              <input
                id="edit-mcp-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
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
                htmlFor="edit-mcp-description"
                className="block text-sm font-medium text-zinc-300 mb-2"
              >
                {t("workspaces.toolDescription", "Description")}
              </label>
              <textarea
                id="edit-mcp-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
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

            <Select
              id="edit-mcp-type"
              label={`${t("workspaces.connectionType", "Connection Type")} *`}
              value={type}
              onChange={(next) => {
                setType(next as "STDIO" | "HTTP");
                setHealthError("");
              }}
              options={[
                { value: "STDIO", label: "STDIO" },
                { value: "HTTP", label: "HTTP" },
              ]}
              disabled={isSubmitting}
            />

            {healthError && (
              <div className="p-3 bg-red-900/20 border border-red-600/30 rounded-md">
                <p className="text-sm text-red-400">{healthError}</p>
              </div>
            )}

            {/* STDIO Configuration */}
            {type === "STDIO" && (
              <>
                <div>
                  <label
                    htmlFor="edit-mcp-command"
                    className="block text-sm font-medium text-zinc-300 mb-2"
                  >
                    {t("workspaces.command", "Command")} *
                  </label>
                  <input
                    id="edit-mcp-command"
                    type="text"
                    value={command}
                    onChange={(e) => {
                      setCommand(e.target.value);
                      setHealthError("");
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
                  {args.map((arg, index) => (
                    <div key={index} className="flex gap-2 mb-2">
                      <input
                        type="text"
                        value={arg}
                        onChange={(e) => updateArg(index, e.target.value)}
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
                        onClick={() => removeArg(index)}
                        className="px-2 py-2 text-red-400 hover:text-red-300 transition-colors"
                        disabled={isSubmitting}
                        aria-label="Remove argument"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={addArg}
                    className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
                    disabled={isSubmitting}
                  >
                    + {t("workspaces.addArgument", "Add Argument")}
                  </button>
                </div>
              </>
            )}

            {/* HTTP Configuration */}
            {type === "HTTP" && (
              <>
                <div>
                  <label
                    htmlFor="edit-mcp-url"
                    className="block text-sm font-medium text-zinc-300 mb-2"
                  >
                    {t("workspaces.url", "URL")} *
                  </label>
                  <input
                    id="edit-mcp-url"
                    type="url"
                    value={url}
                    onChange={(e) => {
                      setUrl(e.target.value);
                      setHealthError("");
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
                  {Object.entries(headers).map(([key, value], index) => (
                    <div key={index} className="flex gap-2 mb-2">
                      <input
                        type="text"
                        value={key}
                        onChange={(e) =>
                          updateHeader(key, e.target.value, value)
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
                          updateHeader(key, key, e.target.value)
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
                        onClick={() => removeHeader(key)}
                        className="px-2 py-2 text-red-400 hover:text-red-300 transition-colors"
                        disabled={isSubmitting}
                        aria-label="Remove header"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={addHeader}
                    className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
                    disabled={isSubmitting}
                  >
                    + {t("workspaces.addHeader", "Add Header")}
                  </button>
                </div>
              </>
            )}
          </form>
        </div>

        {/* Footer */}
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
              form="mcp-edit-form"
              className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              disabled={
                !name.trim() ||
                (type === "STDIO" && !command.trim()) ||
                (type === "HTTP" && !url.trim()) ||
                isSubmitting
              }
            >
              {isSubmitting && <Loader2 size={16} className="animate-spin" />}
              {isSubmitting
                ? t("workspaces.testingConnection", "Testing Connection...")
                : t("common.save", "Save")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
