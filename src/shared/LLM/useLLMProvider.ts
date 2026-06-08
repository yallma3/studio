import { useState, useEffect, useMemo } from "react";
import { llmsRegistry } from "./LLMsRegistry";
import { AvailableLLMs, LLMModel } from "./config";

export type LLMProvider = "Groq" | "OpenAI" | "OpenRouter" | "Gemini" | "Anthropic" | "Ollama";

export interface UseLLMProviderReturn {
  providers: LLMProvider[];
  providerOptions: { value: LLMProvider; label: string }[];
  getModelsForProvider: (provider: string) => LLMModel[];
  models: LLMModel[];
  ollamaModels: LLMModel[];
  ollamaLoading: boolean;
  ollamaFetchError: boolean;
  fetchOllamaModels: (baseUrl: string) => Promise<void>;
  selectedProvider: LLMProvider;
  setSelectedProvider: (provider: LLMProvider) => void;
}

export function useLLMProvider(initialProvider: LLMProvider = "Groq"): UseLLMProviderReturn {
  const registryProviders = llmsRegistry.listProviders();
  const fallbackProviders = Object.keys(AvailableLLMs) as LLMProvider[];
  const activeProviders = registryProviders.length > 0
    ? registryProviders as LLMProvider[]
    : fallbackProviders;

  const providerOptions = useMemo(
    () =>
      activeProviders.map((p) => ({
        value: p,
        label: p,
      })),
    [activeProviders]
  );

  const getModelsForProvider = (provider: string): LLMModel[] => {
    const models = llmsRegistry.getProviderModels(provider);
    if (models && models.length > 0) {
      return models;
    }
    return AvailableLLMs[provider] || [];
  };

  const [selectedProvider, setSelectedProvider] = useState<LLMProvider>(initialProvider);
  const [models, setModels] = useState<LLMModel[]>(() => getModelsForProvider(initialProvider));
  const [ollamaModels, setOllamaModels] = useState<LLMModel[]>([]);
  const [ollamaLoading, setOllamaLoading] = useState(false);
  const [ollamaFetchError, setOllamaFetchError] = useState(false);

  useEffect(() => {
    if (selectedProvider !== "Ollama") {
      setModels(getModelsForProvider(selectedProvider));
    }
  }, [selectedProvider]);

  const fetchOllamaModels = async (baseUrl: string) => {
    setOllamaLoading(true);
    setOllamaFetchError(false);
    try {
      const res = await fetch(`${baseUrl}/api/tags`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const models: LLMModel[] = (data.models || []).map((m: { name: string }) => ({
        name: m.name,
        id: m.name,
      }));
      setOllamaModels(models);
    } catch {
      setOllamaFetchError(true);
    } finally {
      setOllamaLoading(false);
    }
  };

  return {
    providers: (registryProviders.length > 0 ? registryProviders : fallbackProviders) as LLMProvider[],
    providerOptions,
    getModelsForProvider,
    models,
    ollamaModels,
    ollamaLoading,
    ollamaFetchError,
    fetchOllamaModels,
    selectedProvider,
    setSelectedProvider,
  };
}