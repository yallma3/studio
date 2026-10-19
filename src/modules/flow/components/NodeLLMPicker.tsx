import React, { useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import LLMPicker, { LLMOptionValue } from "../../../shared/components/LLMPicker";
import { BaseNode, setConfigParameter } from "../types/NodeTypes";

interface NodeLLMPickerProps {
  node: BaseNode;
  formValues: Record<string, string | number | boolean>;
  onFormValueChange: (name: string, value: string | number | boolean) => void;
}

const DEFAULT_OLLAMA_BASE_URL = "http://localhost:11434";

const NodeLLMPicker: React.FC<NodeLLMPickerProps> = ({
  node,
  formValues,
  onFormValueChange,
}) => {
  const { t } = useTranslation();
  const provider = (formValues["Provider"] as string) || "Groq";
  const modelId = formValues["Model"] as string;
  const ollamaBaseUrl = formValues["Ollama Base URL"] as string | undefined;
  const isOllama = provider.toLowerCase() === "ollama";

  const llmValue = useMemo<LLMOptionValue>(() => ({
    provider: provider as LLMOptionValue["provider"],
    model: modelId ? { name: modelId, id: modelId } : undefined,
    options: isOllama
      ? { baseUrl: ollamaBaseUrl || DEFAULT_OLLAMA_BASE_URL }
      : undefined,
  }), [provider, modelId, ollamaBaseUrl, isOllama]);

  const apiKey = formValues["API Key"] as string | undefined;

  const handleLLMChange = useCallback(
    (llm: LLMOptionValue) => {
      onFormValueChange("Provider", llm.provider);
      setConfigParameter(node, "Provider", llm.provider);

      const modelId = llm.model?.id || "";
      onFormValueChange("Model", modelId);
      setConfigParameter(node, "Model", modelId);

      if (llm.provider === "Ollama") {
        // Preserve an already-configured host when the picker does not carry
        // one (e.g. when the user switches back to Ollama), falling back to the
        // default local endpoint only as a last resort.
        const baseUrl =
          llm.options?.baseUrl || ollamaBaseUrl || DEFAULT_OLLAMA_BASE_URL;
        onFormValueChange("Ollama Base URL", baseUrl);
        setConfigParameter(node, "Ollama Base URL", baseUrl);
      }
    },
    [node, onFormValueChange, ollamaBaseUrl]
  );

  const handleOllamaBaseUrlChange = useCallback(
    (url: string) => {
      onFormValueChange("Ollama Base URL", url);
      setConfigParameter(node, "Ollama Base URL", url);
    },
    [node, onFormValueChange]
  );

  const handleApiKeyChange = useCallback(
    (key: string) => {
      onFormValueChange("API Key", key);
      setConfigParameter(node, "API Key", key);
    },
    [node, onFormValueChange]
  );

  return (
    <div className="space-y-4">
      <LLMPicker
        value={llmValue}
        onChange={handleLLMChange}
        apiKey={apiKey}
        onApiKeyChange={isOllama ? undefined : handleApiKeyChange}
      />
      {isOllama && (
        <div>
          <label
            htmlFor="ollama-base-url"
            className="block text-sm font-medium text-zinc-300 mb-1"
          >
            {t("llmPicker.ollamaBaseUrl", "Ollama Base URL")}
          </label>
          <input
            id="ollama-base-url"
            type="text"
            className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-500"
            value={ollamaBaseUrl || DEFAULT_OLLAMA_BASE_URL}
            onChange={(e) => handleOllamaBaseUrlChange(e.target.value)}
            placeholder={DEFAULT_OLLAMA_BASE_URL}
          />
        </div>
      )}
    </div>
  );
};

export default NodeLLMPicker;
