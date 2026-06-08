import React, { useCallback, useMemo } from "react";
import LLMPicker, { LLMOptionValue } from "../../../shared/components/LLMPicker";
import { BaseNode, setConfigParameter } from "../types/NodeTypes";

interface NodeLLMPickerProps {
  node: BaseNode;
  formValues: Record<string, string | number | boolean>;
  onFormValueChange: (name: string, value: string | number | boolean) => void;
}

const NodeLLMPicker: React.FC<NodeLLMPickerProps> = ({
  node,
  formValues,
  onFormValueChange,
}) => {
  const provider = (formValues["Provider"] as string) || "Groq";
  const modelId = formValues["Model"] as string;
  const ollamaBaseUrl = formValues["Ollama Base URL"] as string | undefined;
  const isOllama = provider.toLowerCase() === "ollama";

  const llmValue = useMemo<LLMOptionValue>(() => ({
    provider: provider as LLMOptionValue["provider"],
    model: modelId ? { name: modelId, id: modelId } : undefined,
    options: isOllama
      ? { baseUrl: ollamaBaseUrl || "http://localhost:11434" }
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
        const baseUrl = llm.options?.baseUrl || "http://localhost:11434";
        onFormValueChange("Ollama Base URL", baseUrl);
        setConfigParameter(node, "Ollama Base URL", baseUrl);
      }
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
    <LLMPicker
      value={llmValue}
      onChange={handleLLMChange}
      apiKey={apiKey}
      onApiKeyChange={handleApiKeyChange}
    />
  );
};

export default NodeLLMPicker;
