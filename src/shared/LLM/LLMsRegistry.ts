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
}

// Export singleton instance (similar to nodeRegistry)
export const llmsRegistry = new LLMsRegistry();
