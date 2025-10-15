export interface LLMModel {
  name: string;
  id: string;
}

const GroqModels: LLMModel[] = [
  { name: "Llama 3.1 8B", id: "llama-3.1-8b-instant" },
  { name: "Llama 3.3 70B", id: "llama-3.3-70b-versatile" },
  { name: "Llama Guard 4 12B", id: "meta-llama/llama-guard-4-12b" },
  { name: "GPT OSS 20B", id: "openai/gpt-oss-20b" },
  { name: "GPT OSS 120B", id: "openai/gpt-oss-120b" },
];

const OpenAIModels: LLMModel[] = [
  { name: "GPT 5", id: "gpt-5" },
  { name: "GPT 5 nano", id: "gpt-5-nano" },
  { name: "GPT 5 mini", id: "gpt-5-mini" },
  { name: "GPT 4.1", id: "gpt-4.1" },
  { name: "GPT 4.1 nano", id: "gpt-4.1-nano" },
  { name: "GPT 4.1 mini", id: "gpt-4.1-mini" },
  { name: "GPT 4o", id: "gpt-40" },
  { name: "GPT 4o mini", id: "gpt-4o-mini" },
];

const OpenRouterModels: LLMModel[] = [
  { name: "Deepseek chat v3.1 free", id: "deepseek/deepseek-chat-v3.1:free" },
  { name: "Grok Code Fast 1", id: "x-ai/grok-code-fast-1" },
  { name: "Grok 4 Fast", id: "x-ai/grok-4-fast" },
  { name: "Grok 3 Mini", id: "x-ai/grok-3-mini" },
  { name: "GPT OSS 20B", id: "openai/gpt-oss-20b" },
  { name: "GPT OSS 120B", id: "openai/gpt-oss-120b" },
  { name: "Mistral Nemo", id: "mistralai/mistral-nemo" },
  {
    name: "Mistral Small 3.2 24B",
    id: "mistralai/mistral-small-3.2-24b-instruct",
  },
  {
    name: "Qwen3 Coder",
    id: "qwen/qwen3-coder",
  },
  {
    name: "Qwen3 Coder 30B A3B Instruct",
    id: "qwen/qwen3-coder-30b-a3b-instruct",
  },
];

const GeminiModels: LLMModel[] = [
  { name: "Gemini 2.5 Pro", id: "models/gemini-2.5-pro" },
  { name: "Gemini 2.5 Flash", id: "models/gemini-2.5-flash" },
  { name: "Gemini 2.5 Flash-Lite", id: "models/gemini-2.5-flash-lite" },
  { name: "Gemini 2.0 Flash", id: "models/gemini-2.0-flash" },
  { name: "Gemini 2.0 Flash-Lite", id: "models/gemini-2.0-flash-lite" },
  { name: "Gemma 3 12B", id: "models/gemma-3-12b-it" },
  { name: "Gemma 3 27B", id: "models/gemma-3-27b-it" },
];

const AnthropicModels: LLMModel[] = [
  { name: "Claude 3.7 Sonnet", id: "claude-3-7-sonnet-latest" },
  {
    name: "Claude 3.7 Sonnet Thinking",
    id: "claude-3-7-sonnet-thinking-latest",
  },
  { name: "Claude 3.5 Sonnet", id: "claude-3-5-sonnet-latest" },
  { name: "Claude 3.5 Haiku", id: "claude-3-5-haiku-latest" },
  { name: "Claude 3 Opus", id: "claude-3-opus-latest" },
  { name: "Claude 3 Sonnet", id: "claude-3-sonnet-latest" },
  { name: "Claude 3 Haiku", id: "claude-3-haiku-latest" },
];

export const AvailableLLMs: Record<string, LLMModel[]> = {
  Groq: GroqModels,
  OpenAI: OpenAIModels,
  OpenRouter: OpenRouterModels,
  Gemini: GeminiModels,
  Anthropic: AnthropicModels,
};
