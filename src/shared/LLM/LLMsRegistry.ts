/*
 * yaLLMa3 - Framework for building AI agents that are capable of learning from their environment and interacting with it.
 *
 * Copyright (C) 2025 yaLLMa3
 *
 * This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0.
 * If a copy of the MPL was not distributed with this file, You can obtain one at https://www.mozilla.org/MPL/2.0/.
 *
 * This software is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied.
 * See the Mozilla Public License for the specific language governing rights and limitations under the License.
 */

import type { LLMModel } from "./config";

// Registry for storing all available LLMs grouped by provider
export class LLMsRegistry {
  private providers: Record<string, LLMModel[]> = {};
  private ollamaCache: Map<string, LLMModel[]> = new Map();

  // Replace the entire providers map (used when loading from the core API)
  setProviders(providers: Record<string, LLMModel[]>) {
    // Shallow clone to avoid external mutation
    const clone: Record<string, LLMModel[]> = {};
    Object.entries(providers).forEach(([provider, models]) => {
      clone[provider] = models.map((m) => ({ ...m }));
    });
    this.providers = clone;
  }

  // Register or overwrite a single provider's models
  registerProvider(provider: string, models: LLMModel[]) {
    this.providers[provider] = models.map((m) => ({ ...m }));
  }

  // Get models for a specific provider
  getProviderModels(provider: string): LLMModel[] | undefined {
    return this.providers[provider];
  }

  // List provider names (OpenAI, Anthropic, OpenRouter, Groq, Gemini, etc.)
  listProviders(): string[] {
    return Object.keys(this.providers);
  }

  // Get all models from all providers as a flat list
  listAllModels(): LLMModel[] {
    return Object.values(this.providers).flat();
  }

  // Get the raw providers map
  getAll(): Record<string, LLMModel[]> {
    return this.providers;
  }

  // Fetch Ollama models with URL-based caching
  async fetchOllamaModels(baseUrl: string): Promise<LLMModel[]> {
    const normalizedUrl = baseUrl.replace(/\/+$/, "");
    const cached = this.ollamaCache.get(normalizedUrl);
    if (cached) {
      return cached;
    }

    const res = await fetch(`${normalizedUrl}/api/tags`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const models: LLMModel[] = (data.models || []).map((m: { name: string }) => ({
      name: m.name,
      id: m.name,
    }));
    this.ollamaCache.set(normalizedUrl, models);
    return models;
  }

  // Clear Ollama cache for a specific URL or all
  clearOllamaCache(baseUrl?: string) {
    if (baseUrl) {
      const normalizedUrl = baseUrl.replace(/\/+$/, "");
      this.ollamaCache.delete(normalizedUrl);
    } else {
      this.ollamaCache.clear();
    }
  }
}

// Export singleton instance (similar to nodeRegistry)
export const llmsRegistry = new LLMsRegistry();
