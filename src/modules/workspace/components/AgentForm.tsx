import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import Select from "../../../shared/components/ui/select";
import { Button } from "../../../shared/components/ui/button";
import ToolSelectionPopup from "../../../shared/components/ToolSelectionPopup";
import { AvailableLLMs, LLMModel } from "../../../shared/LLM/config";
import { LLMOption, Tool, Workflow } from "../types/Types";
import { Plus, X } from "lucide-react";

export interface AgentFormValues {
  name: string;
  role: string;
  background: string;
  llm: {
    provider: LLMOption["provider"];
    model?: LLMModel;
  };
  apiKey: string;
  tools: Tool[];
  variables?: Record<string, string>;
}

interface AgentFormProps {
  value: AgentFormValues;
  onChange: (next: AgentFormValues) => void;
  handleImportWorkflow: (workflow: Workflow) => void;
  availableTools: Tool[];
  enableVariables?: boolean;
  workspaceMainLLMName?: string; // for hint text
}

const AgentForm: React.FC<AgentFormProps> = ({
  value,
  onChange,
  handleImportWorkflow,
  availableTools,
  enableVariables = false,
  workspaceMainLLMName,
}) => {
  const { t } = useTranslation();

  const llmProviders = Object.keys(AvailableLLMs) as LLMOption["provider"][];
  const [selectedProvider, setSelectedProvider] = useState<
    LLMOption["provider"]
  >(value.llm.provider || "Groq");

  const [llmOptions, setLLMOptions] = useState<LLMModel[]>(
    AvailableLLMs[selectedProvider]
  );

  useEffect(() => {
    setLLMOptions(AvailableLLMs[selectedProvider]);
  }, [selectedProvider]);

  const [showToolPopup, setShowToolPopup] = useState(false);

  const [newVariable, setNewVariable] = useState({ key: "", value: "" });
  const [showVariablePopup, setShowVariablePopup] = useState(false);
  const [variableError, setVariableError] = useState<string | null>(null);

  const handleAddTool = (tool: Tool) => {
    if (value.tools.some((t) => t.name === tool.name)) {
      setShowToolPopup(false);
      return;
    }
    onChange({ ...value, tools: [...value.tools, tool] });
    setShowToolPopup(false);
  };

  const handleRemoveTool = (toolName: string) => {
    onChange({
      ...value,
      tools: value.tools.filter((t) => t.name !== toolName),
    });
  };

  const handleAddVariable = () => {
    const trimmedKey = newVariable.key.trim();
    if (!trimmedKey) return;
    if (value.variables && value.variables[trimmedKey] !== undefined) {
      setVariableError(
        t(
          "workspaces.duplicateVariable",
          "A variable with this name already exists"
        )
      );
      return;
    }
    onChange({
      ...value,
      variables: {
        ...(value.variables || {}),
        [trimmedKey]: newVariable.value,
      },
    });
    setNewVariable({ key: "", value: "" });
    setVariableError(null);
    setShowVariablePopup(false);
  };

  const handleRemoveVariable = (key: string) => {
    const updated = { ...(value.variables || {}) };
    delete updated[key];
    onChange({ ...value, variables: updated });
  };

  const replaceVariables = (
    text: string,
    variables: Record<string, string> = {}
  ) => {
    if (!text) return "";
    let result = text;
    Object.entries(variables).forEach(([k, v]) => {
      const regex = new RegExp(`\\{\\{${k}\\}\\}`, "g");
      result = result.replace(regex, v || `{{${k}}}`);
    });
    return result;
  };

  return (
    <div className="space-y-4 mb-4">
      <div className="flex flex-col gap-1">
        <label
          htmlFor="agentName"
          className="block text-sm font-medium text-gray-300 mb-1 "
        >
          {t("workspaces.agentName", "Name")}
        </label>
        <input
          type="text"
          id="agentName"
          value={value.name}
          onChange={(e) => onChange({ ...value, name: e.target.value })}
          className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
          placeholder={t("workspaces.enterAgentName", "Enter agent name")}
        />
      </div>

      <div className="flex flex-col gap-1">
        <label
          htmlFor="agentRole"
          className="block text-sm font-medium text-gray-300 mb-1 "
        >
          {t("workspaces.agentRole", "Role")}
        </label>
        <input
          type="text"
          id="agentRole"
          value={value.role}
          onChange={(e) => onChange({ ...value, role: e.target.value })}
          className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
          placeholder={t("workspaces.enterAgentRole", "Enter agent role")}
        />
      </div>

      <div className="flex flex-col gap-1">
        <div className="flex justify-between items-center">
          <label
            htmlFor="agentBackground"
            className="block text-sm font-medium text-gray-300 mb-1 "
          >
            {t("workspaces.agentDescription", "Background")}
          </label>
          {enableVariables && (
            <button
              onClick={() => setShowVariablePopup(true)}
              className="text-yellow-400 hover:text-yellow-500 transition-colors flex items-center gap-1 text-sm cursor-pointer"
              title={t("workspaces.addVariable", "Add variable")}
              type="button"
            >
              <Plus className="h-4 w-4 " />
              {t("workspaces.addVariable", "Add Variable")}
            </button>
          )}
        </div>
        <textarea
          id="agentBackground"
          value={value.background}
          onChange={(e) => onChange({ ...value, background: e.target.value })}
          className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-yellow-500 h-20"
          placeholder={
            enableVariables
              ? t(
                  "workspaces.enterAgentBackground",
                  "Enter agent background with {{variables}} like: You are an expert in {{expertise}} with {{years}} years of experience"
                )
              : t(
                  "workspaces.enterAgentBackground",
                  "You are a helpful assistant."
                )
          }
        />

        {enableVariables &&
          value.variables &&
          Object.keys(value.variables).length > 0 && (
            <div className="mt-2">
              <p className="text-xs text-gray-400 mb-1">
                {t("workspaces.definedVariables", "Defined Variables:")}
              </p>
              <div className="flex flex-wrap gap-2">
                {Object.entries(value.variables).map(([key, val]) => (
                  <div
                    key={key}
                    className="bg-zinc-800 text-white px-2 py-1 rounded flex items-center gap-2 border border-zinc-700"
                  >
                    <span className="text-sm text-yellow-400">{`{{${key}}}`}</span>
                    {val && (
                      <span className="text-xs text-gray-400">= {val}</span>
                    )}
                    <button
                      onClick={() => handleRemoveVariable(key)}
                      className="text-gray-400 hover:text-red-500 transition-colors"
                      title={t("workspaces.removeVariable", "Remove variable")}
                      type="button"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

        {enableVariables &&
          value.background &&
          value.variables &&
          Object.keys(value.variables).length > 0 && (
            <div className="mt-3 p-3 bg-zinc-900 border border-zinc-700 rounded-md">
              <p className="text-xs text-gray-400 mb-1">
                {t("workspaces.backgroundPreview", "Background Preview:")}
              </p>
              <p className="text-sm text-gray-300">
                {replaceVariables(value.background, value.variables)}
              </p>
            </div>
          )}

        {enableVariables && showVariablePopup && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-zinc-900 rounded-lg p-5 border border-zinc-700 w-full max-w-md shadow-xl animate-in fade-in duration-200">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-white">
                  {t("workspaces.addVariable", "Add Variable")}
                </h3>
                <button
                  onClick={() => setShowVariablePopup(false)}
                  className="text-gray-400 hover:text-white"
                  type="button"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  {t("workspaces.variableName", "Variable Name")}
                </label>
                <input
                  type="text"
                  value={newVariable.key}
                  onChange={(e) => {
                    setNewVariable((prev) => ({
                      ...prev,
                      key: e.target.value,
                    }));
                    setVariableError(null);
                  }}
                  className={`w-full px-3 py-2 bg-zinc-800 border ${
                    variableError ? "border-red-500" : "border-zinc-700"
                  } rounded-md text-white focus:outline-none focus:ring-2 focus:ring-yellow-500`}
                  placeholder={t(
                    "workspaces.enterVariableName",
                    "Enter variable name (e.g. expertise)"
                  )}
                />
                {variableError && (
                  <p className="text-red-500 text-xs mt-1">{variableError}</p>
                )}
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  {t("workspaces.variableValue", "Default Value")}
                </label>
                <input
                  type="text"
                  value={newVariable.value}
                  onChange={(e) =>
                    setNewVariable((prev) => ({
                      ...prev,
                      value: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  placeholder={t(
                    "workspaces.enterVariableValue",
                    "Enter default value (e.g. JavaScript)"
                  )}
                />
              </div>

              <div className="flex gap-2 justify-end">
                <Button
                  onClick={() => setShowVariablePopup(false)}
                  className="bg-zinc-700 hover:bg-zinc-600 text-white font-medium border-0"
                >
                  {t("common.cancel", "Cancel")}
                </Button>
                <Button
                  onClick={handleAddVariable}
                  className="bg-yellow-500 hover:bg-yellow-600 text-white font-medium border-0"
                  disabled={!newVariable.key.trim()}
                >
                  {t("common.add", "Add")}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-zinc-300 mb-1">
          {t("workspaces.agentLLM", "Language Model")}
        </label>
        <div className="grid grid-cols-5 gap-4">
          <div className="col-span-2">
            <Select
              id="agent-llm-provider"
              value={selectedProvider}
              onChange={(value: string) => {
                setSelectedProvider(value as LLMOption["provider"]);
              }}
              options={llmProviders.map((provider) => ({
                value: provider,
                label: provider,
              }))}
              label={t("workspaces.selectProvider", "Provider")}
            />
          </div>
          <div className="col-span-3">
            <Select
              id="agent-llm-model"
              value={value.llm.model?.id || ""}
              onChange={(v: string) => {
                const option = llmOptions.find((m) => m.id == v);
                if (!option) return;
                onChange({
                  ...value,
                  llm: { provider: selectedProvider, model: option },
                });
              }}
              options={[
                { value: "", label: "Select a model...", disabled: true },
                ...llmOptions.map((m) => ({ value: m.id, label: m.name })),
              ]}
              label={t("workspaces.selectModel", "Model")}
            />
          </div>
        </div>
        <p className="text-xs text-zinc-400 mt-2">
          {value.llm.model
            ? t(
                "workspaces.customLLMSelected",
                "Custom LLM selected for this agent"
              )
            : t(
                "workspaces.usingWorkspaceLLM",
                `Using workspace's main LLM: ${
                  workspaceMainLLMName || "None selected"
                }`
              )}
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-zinc-300 mb-1">
          {t("workspaces.agentApiKey", "Api Key")}
        </label>
        <input
          type="password"
          className="w-full bg-[#111] border border-zinc-700 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-[#FFC72C]"
          value={value.apiKey}
          onChange={(e) => onChange({ ...value, apiKey: e.target.value })}
          placeholder={t("workspaces.enterApiKey", "Enter agent Api Key")}
        />
      </div>

      <div className="flex flex-col space-y-2">
        <div className="flex items-center justify-between gap-2">
          <label className="block text-sm font-medium text-zinc-300 mb-1">
            {t("workspaces.tools", "Tools")}
          </label>
          <button
            onClick={() => setShowToolPopup(true)}
            className="px-2 py-1 text-xs bg-[#FFC72C] hover:bg-[#E6B428] text-black rounded-md transition-colors flex items-center gap-1"
            type="button"
          >
            <Plus size={16} />
            {t("workspaces.addTool", "Add Tool")}
          </button>
        </div>
        {value.tools.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {value.tools.map((tool) => (
              <div
                key={tool.name}
                className="flex items-center gap-1 bg-zinc-800/30 rounded-md px-2 py-1 text-xs text-zinc-400 hover:bg-zinc-700/50 transition-colors"
              >
                <span>{tool.name}</span>
                <button
                  className="text-zinc-500 hover:text-red-400 cursor-pointer rounded-sm p-0.5"
                  onClick={() => handleRemoveTool(tool.name)}
                  title="Remove tool"
                  type="button"
                >
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
        )}
        {value.tools.length === 0 && (
          <p className="text-sm text-zinc-400">
            {t(
              "workspaces.noToolsSelected",
              "No tools selected - Press the plus button to add tools"
            )}
          </p>
        )}
      </div>

      <ToolSelectionPopup
        isOpen={showToolPopup}
        onClose={() => setShowToolPopup(false)}
        onAddTool={handleAddTool}
        handleImportWorkflow={handleImportWorkflow}
        availableTools={availableTools}
        existingTools={value.tools}
        editingTool={null}
      />
    </div>
  );
};

export default AgentForm;
