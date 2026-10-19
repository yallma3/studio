import { useState, useEffect, useMemo } from "react";
import { llmsRegistry } from "./LLMsRegistry";
import { AvailableLLMs, LLMModel } from "./config";

export type LLMProvider = "Groq" | "OpenAI" | "OpenRouter" | "Gemini" | "Anthropic" | "Ollama";

export interface UseLLMProviderReturn {
  providers: LLMProvider[];
  providerOptions: { value: LLMProvider; label: string }[];
  getModelsForProvider: (provider: string) => LLMModel[];
  models: LLMModel[];
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

  useEffect(() => {
    setModels(getModelsForProvider(selectedProvider));
  }, [selectedProvider]);

  return {
    providers: (registryProviders.length > 0 ? registryProviders : fallbackProviders) as LLMProvider[],
    providerOptions,
    getModelsForProvider,
    models,
    selectedProvider,
    setSelectedProvider,
  };
}