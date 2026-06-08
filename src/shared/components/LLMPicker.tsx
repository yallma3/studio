import React, { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import Select from "./ui/select";
import { LLMModel } from "../LLM/config";
import { useLLMProvider, LLMProvider } from "../LLM/useLLMProvider";
import { Key, Link, RefreshCw } from "lucide-react";

const PROVIDER_KEY_LINKS: Partial<Record<LLMProvider, string>> = {
  Groq: "https://console.groq.com/keys",
  OpenAI: "https://platform.openai.com/api-keys",
  Anthropic: "https://console.anthropic.com/settings/keys",
  Gemini: "https://aistudio.google.com/app/apikey",
  OpenRouter: "https://openrouter.ai/keys",
};

const PROVIDER_KEY_FORMATS: Partial<Record<LLMProvider, string>> = {
  Groq: "gsk_...",
  OpenAI: "sk-...",
  Anthropic: "sk-ant-...",
  Gemini: "AIza...",
  OpenRouter: "sk-or-...",
};

export interface LLMOptionValue {
  provider: LLMProvider;
  model?: LLMModel;
  options?: Record<string, string>;
}

interface LLMPickerProps {
  value: LLMOptionValue;
  onChange: (llm: LLMOptionValue) => void;
  apiKey?: string;
  onApiKeyChange?: (key: string) => void;
  savedKeyOptions?: { value: string; label: string }[];
  useSavedCredentials?: boolean;
  onUseSavedCredentialsChange?: (use: boolean) => void;
}

const LLMPicker: React.FC<LLMPickerProps> = ({
  value,
  onChange,
  apiKey,
  onApiKeyChange,
  savedKeyOptions = [],
  useSavedCredentials = false,
  onUseSavedCredentialsChange,
}) => {
  const { t } = useTranslation();
  const {
    providerOptions,
    getModelsForProvider,
    models: registryModels,
    selectedProvider,
    setSelectedProvider,
    ollamaModels,
    ollamaLoading,
    ollamaFetchError,
    fetchOllamaModels,
  } = useLLMProvider(value.provider);

  const isOllama = selectedProvider === "Ollama";
  const models = isOllama ? ollamaModels : registryModels;
  const ollamaBaseUrl = value.options?.baseUrl || "";

  const prevProviderRef = useRef(value.provider);
  useEffect(() => {
    const prev = prevProviderRef.current;
    prevProviderRef.current = value.provider;
    if (prev !== value.provider) {
      setSelectedProvider(value.provider);
    }
  }, [value.provider, setSelectedProvider]);

  useEffect(() => {
    if (isOllama) {
      const url = ollamaBaseUrl || "http://localhost:11434";
      fetchOllamaModels(url);
    }
  }, [selectedProvider]);

  const handleProviderChange = (newProvider: string) => {
    const provider = newProvider as LLMProvider;
    setSelectedProvider(provider);
    const providerModels = getModelsForProvider(provider);
    const firstModel = providerModels[0];
    onChange({
      provider,
      model: firstModel,
      options: provider === "Ollama" ? { baseUrl: "http://localhost:11434" } : undefined,
    });
  };

  const handleModelChange = (modelId: string) => {
    const option = models.find((m: LLMModel) => m.id === modelId);
    if (!option) return;
    onChange({
      ...value,
      model: option,
    });
  };

  const handleOllamaBaseUrlChange = (url: string) => {
    onChange({
      ...value,
      options: { ...value.options, baseUrl: url },
    });
  };

  const handleRefreshOllama = () => {
    fetchOllamaModels(ollamaBaseUrl || "http://localhost:11434");
  };

  const keyLink = PROVIDER_KEY_LINKS[selectedProvider];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-5 gap-4">
        <div className="col-span-2">
          <Select
            id="llm-provider"
            value={selectedProvider}
            onChange={handleProviderChange}
            options={providerOptions}
            label={t("llmPicker.provider", "Provider")}
          />
        </div>
        <div className="col-span-3">
          {isOllama ? (
            <div className="flex flex-col gap-1">
              <label className="block text-sm font-medium text-gray-300 mb-1">
                {t("llmPicker.model", "Model")}
              </label>
              {ollamaLoading ? (
                <div className="flex items-center gap-2 px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-md text-zinc-400 text-sm">
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  {t("llmPicker.loadingModels", "Loading models...")}
                </div>
              ) : ollamaFetchError ? (
                <input
                  type="text"
                  id="llm-model-manual"
                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  value={value.model?.id || ""}
                  onChange={(e) => {
                    const name = e.target.value;
                    onChange({
                      ...value,
                      model: name.trim()
                        ? { name, id: name }
                        : undefined,
                    });
                  }}
                  placeholder={t("llmPicker.enterModelName", "Enter model name (e.g. llama3.1:8b)")}
                />
              ) : (
                <div className="flex gap-2">
                  <div className="flex-1">
                    <Select
                      id="llm-model-ollama"
                      value={value.model?.id || ""}
                      onChange={handleModelChange}
                      options={[
                        {
                          value: "",
                          label: t("llmPicker.selectModel", "Select a model..."),
                          disabled: true,
                        },
                        ...ollamaModels.map((m: LLMModel) => ({
                          value: m.id,
                          label: m.name,
                        })),
                      ]}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleRefreshOllama}
                    disabled={ollamaLoading}
                    className="self-end px-3 py-2 bg-zinc-700 hover:bg-zinc-600 disabled:opacity-50 text-white rounded-md transition-colors mb-px"
                    title={t("llmPicker.refreshModels", "Refresh models")}
                  >
                    <RefreshCw className={`h-4 w-4 ${ollamaLoading ? "animate-spin" : ""}`} />
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Select
              id="llm-model"
              value={value.model?.id || ""}
              onChange={handleModelChange}
              options={[
                {
                  value: "",
                  label: t("llmPicker.selectModel", "Select a model..."),
                  disabled: true,
                },
                ...registryModels.map((m: LLMModel) => ({
                  value: m.id,
                  label: m.name,
                })),
              ]}
              disabled={!selectedProvider}
              label={t("llmPicker.model", "Model")}
            />
          )}
        </div>
      </div>

      {isOllama ? (
        <div>
          <label
            htmlFor="llm-ollama-base-url"
            className="block text-sm font-medium text-zinc-300 mb-1"
          >
            {t("llmPicker.ollamaBaseUrl", "Ollama Base URL")}
          </label>
          <div className="relative">
            <input
              id="llm-ollama-base-url"
              type="text"
              className="w-full pl-9 pr-3 py-2 bg-zinc-800 border border-zinc-700 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-500"
              value={ollamaBaseUrl}
              onChange={(e) => handleOllamaBaseUrlChange(e.target.value)}
              placeholder="http://localhost:11434"
            />
            <Link className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
          </div>
        </div>
      ) : (
        <div>
          {savedKeyOptions.length > 0 && onUseSavedCredentialsChange ? (
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                {t("llmPicker.apiKey", "API Key")}
              </label>
              <div className="flex gap-2 mb-4">
                <button
                  type="button"
                  onClick={() => onUseSavedCredentialsChange(false)}
                  className={`flex-1 py-2 px-4 rounded-md transition-all cursor-pointer ${
                    !useSavedCredentials
                      ? "bg-yellow-500 text-black font-medium"
                      : "bg-zinc-800 text-white border border-zinc-700 hover:bg-zinc-700"
                  }`}
                >
                  {t("llmPicker.newKey", "New Key")}
                </button>
                <button
                  type="button"
                  onClick={() => onUseSavedCredentialsChange(true)}
                  className={`flex-1 py-2 px-4 rounded-md transition-all cursor-pointer ${
                    useSavedCredentials
                      ? "bg-yellow-500 text-black font-medium"
                      : "bg-zinc-800 text-white border border-zinc-700 hover:bg-zinc-700"
                  }`}
                >
                  {t("llmPicker.savedKey", "Saved Key")}
                </button>
              </div>

              {useSavedCredentials ? (
                <div>
                  <Select
                    id="llm-saved-key"
                    value={apiKey || ""}
                    onChange={(val) => onApiKeyChange?.(val)}
                    options={[
                      {
                        value: "",
                        label: t("llmPicker.selectSavedKey", "Select a saved key..."),
                        disabled: true,
                      },
                      ...savedKeyOptions,
                    ]}
                    label={t("llmPicker.savedKey", "Saved Key")}
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    {t("llmPicker.savedKeyInfo", "Use a previously saved API key from your vault")}
                  </p>
                </div>
              ) : (
                <div>
                  <div className="relative">
                    <input
                      id="llm-api-key"
                      type="password"
                      className="w-full pl-9 pr-3 py-2 bg-zinc-800 border border-zinc-700 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                      value={apiKey || ""}
                      onChange={(e) => onApiKeyChange?.(e.target.value)}
                      placeholder={t("llmPicker.enterApiKey", "Enter API key")}
                    />
                    <Key className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    {t("llmPicker.apiKeyInfo", "Your API key is stored locally and never shared")}
                  </p>
                  {PROVIDER_KEY_FORMATS[selectedProvider] && (
                    <p className="text-xs text-zinc-500 mt-1">
                      {t("llmPicker.keyFormat", "Format: {{format}}", { format: PROVIDER_KEY_FORMATS[selectedProvider] })}
                    </p>
                  )}
                </div>
              )}
            </div>
          ) : onApiKeyChange ? (
            <div>
              <label
                htmlFor="llm-api-key"
                className="block text-sm font-medium text-zinc-300 mb-1"
              >
                {t("llmPicker.apiKey", "API Key")}
              </label>
              <div className="relative">
                <input
                  id="llm-api-key"
                  type="password"
                  className="w-full pl-9 pr-3 py-2 bg-zinc-800 border border-zinc-700 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  value={apiKey || ""}
                  onChange={(e) => onApiKeyChange(e.target.value)}
                  placeholder={t("llmPicker.enterApiKey", "Enter API key")}
                />
                <Key className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
              </div>
              {keyLink && (
                <p className="text-xs text-gray-400 mt-1">
                  {t("llmPicker.apiKeyInfo", "Your API key is stored locally and never shared")}
                  <button
                    type="button"
                    onClick={() => window.open(keyLink, "_blank")}
                    className="text-xs text-yellow-400 hover:text-yellow-300 ml-2 underline cursor-pointer"
                  >
                    {t("llmPicker.getApiKey", "Get {{provider}} API Key", { provider: selectedProvider })}
                  </button>
                </p>
              )}
              {PROVIDER_KEY_FORMATS[selectedProvider] && (
                <p className="text-xs text-zinc-500 mt-1">
                  {t("llmPicker.keyFormat", "Format: {{format}}", { format: PROVIDER_KEY_FORMATS[selectedProvider] })}
                </p>
              )}
            </div>
          ) : null}
        </div>
      )}

      {ollamaFetchError && (
        <p className="text-xs text-red-400">
          {t("llmPicker.ollamaFetchFailed", "Could not reach Ollama — enter model name manually")}
        </p>
      )}
    </div>
  );
};

export default LLMPicker;