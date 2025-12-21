import type { LLMModel } from "../../shared/LLM/config";
import { llmsRegistry } from "../../shared/LLM/LLMsRegistry";

interface LLMApiModel extends LLMModel {
  provider: string;
}

interface LLMApiResponse {
  success: boolean;
  data: Record<string, LLMApiModel[]>;
  count: number;
}

function normalizeProviderName(providerKey: string): string {
  switch (providerKey.toLowerCase()) {
    case "openai":
      return "OpenAI";
    case "anthropic":
      return "Anthropic";
    case "openrouter":
      return "OpenRouter";
    case "groq":
      return "Groq";
    case "gemini":
      return "Gemini";
    default:
      return providerKey;
  }
}

export async function getLLMs() {
  try {
    const baseUrl = import.meta.env.VITE_CORE_URL ?? "http://localhost:3001";
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    const response = await fetch(`${baseUrl}/llm/models`, {
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(
        `Failed to fetch nodes: ${response.status} ${response.statusText}`
      );
    }
    const apiRes = (await response.json()) as LLMApiResponse;
    console.log("LLMs:", apiRes);

    if (!apiRes.success || !apiRes.data) {
      throw new Error("Failed to fetch LLMs: invalid response format");
    }

    const providersMap: Record<string, LLMModel[]> = {};

    Object.entries(apiRes.data).forEach(([providerKey, models]) => {
      const providerName = normalizeProviderName(providerKey);
      providersMap[providerName] = models.map((m) => ({
        id: m.id,
        name: m.name,
        provider: providerName,
        contextWindow: m.contextWindow,
      }));
    });

    // Store all available LLMs in the registry, grouped by provider
    llmsRegistry.setProviders(providersMap);

    return providersMap;
  } catch (error) {
    console.error("Error fetching LLMs:", error);
    return [];
  }
}
