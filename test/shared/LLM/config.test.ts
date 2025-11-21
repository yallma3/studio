/*
 * yaLLMa3 - Framework for building AI agents that are capable of learning from their environment and interacting with it.

 * Copyright (C) 2025 yaLLMa3

 * This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0.
   If a copy of the MPL was not distributed with this file, You can obtain one at https://www.mozilla.org/MPL/2.0/.

 * This software is distributed on an "AS IS" basis,
   WITHOUT WARRANTY OF ANY KIND, either express or implied.
   See the Mozilla Public License for the specific language governing rights and limitations under the License.
 */

import { describe, it, expect } from 'vitest';
import { AvailableLLMs, LLMModel } from '@/shared/LLM/config';

describe('LLM Configuration Testing', () => {
  describe('AvailableLLMs structure', () => {
    it('should contain all expected LLM providers', () => {
      const expectedProviders = ['Groq', 'OpenAI', 'OpenRouter', 'Gemini', 'Anthropic'];
      const actualProviders = Object.keys(AvailableLLMs);

      expect(actualProviders).toEqual(expectedProviders);
    });

    it('should have non-empty model arrays for each provider', () => {
      Object.values(AvailableLLMs).forEach((models) => {
        expect(Array.isArray(models)).toBe(true);
        expect(models.length).toBeGreaterThan(0);
        expect(models).toHaveLength(models.length); // Ensure no sparse arrays
      });
    });

    it('should have valid LLMModel objects', () => {
      Object.values(AvailableLLMs).forEach((models) => {
        models.forEach((model: LLMModel) => {
          expect(model).toHaveProperty('name');
          expect(model).toHaveProperty('id');
          expect(typeof model.name).toBe('string');
          expect(typeof model.id).toBe('string');
          expect(model.name.length).toBeGreaterThan(0);
          expect(model.id.length).toBeGreaterThan(0);
        });
      });
    });
  });

  describe('Individual provider models', () => {
    describe('Groq models', () => {
      it('should have expected Groq models', () => {
        const groqModels = AvailableLLMs.Groq;
        expect(groqModels).toHaveLength(5);

        const expectedIds = [
          'llama-3.1-8b-instant',
          'llama-3.3-70b-versatile',
          'meta-llama/llama-guard-4-12b',
          'openai/gpt-oss-20b',
          'openai/gpt-oss-120b'
        ];

        const actualIds = groqModels.map(m => m.id);
        expect(actualIds).toEqual(expectedIds);
      });
    });

    describe('OpenAI models', () => {
      it('should have expected OpenAI models', () => {
        const openAIModels = AvailableLLMs.OpenAI;
        expect(openAIModels).toHaveLength(8);

        const expectedIds = [
          'gpt-5',
          'gpt-5-nano',
          'gpt-5-mini',
          'gpt-4.1',
          'gpt-4.1-nano',
          'gpt-4.1-mini',
          'gpt-4o',
          'gpt-4o-mini'
        ];

        const actualIds = openAIModels.map(m => m.id);
        expect(actualIds).toEqual(expectedIds);
      });
    });

    describe('OpenRouter models', () => {
      it('should have expected OpenRouter models', () => {
        const openRouterModels = AvailableLLMs.OpenRouter;
        expect(openRouterModels).toHaveLength(10);

        // Check that it contains expected models
        const modelIds = openRouterModels.map(m => m.id);
        expect(modelIds).toContain('deepseek/deepseek-chat-v3.1:free');
        expect(modelIds).toContain('x-ai/grok-4-fast');
        expect(modelIds).toContain('mistralai/mistral-nemo');
      });
    });

    describe('Gemini models', () => {
      it('should have expected Gemini models', () => {
        const geminiModels = AvailableLLMs.Gemini;
        expect(geminiModels).toHaveLength(7);

        const modelIds = geminiModels.map(m => m.id);
        expect(modelIds).toContain('models/gemini-2.5-pro');
        expect(modelIds).toContain('models/gemini-2.5-flash');
        expect(modelIds).toContain('models/gemma-3-27b-it');
      });
    });

    describe('Anthropic models', () => {
      it('should have expected Anthropic models', () => {
        const anthropicModels = AvailableLLMs.Anthropic;
        expect(anthropicModels).toHaveLength(7);

        const modelIds = anthropicModels.map(m => m.id);
        expect(modelIds).toContain('claude-3-7-sonnet-latest');
        expect(modelIds).toContain('claude-3-5-sonnet-latest');
        expect(modelIds).toContain('claude-3-opus-latest');
      });
    });
  });

  describe('Model validation', () => {
    it('should have unique model IDs within each provider', () => {
      Object.values(AvailableLLMs).forEach((models) => {
        const ids = models.map(m => m.id);
        const uniqueIds = new Set(ids);
        expect(uniqueIds.size).toBe(ids.length);
      });
    });

    it('should have reasonable model names', () => {
      Object.values(AvailableLLMs).forEach(models => {
        models.forEach(model => {
          expect(model.name.length).toBeGreaterThan(2);
          expect(model.name.length).toBeLessThan(100);
        });
      });
    });

    it('should have valid model ID formats', () => {
      Object.values(AvailableLLMs).forEach(models => {
        models.forEach(model => {
          // IDs should not contain spaces and be reasonable length
          expect(model.id).not.toMatch(/\s/);
          expect(model.id.length).toBeGreaterThan(2);
          expect(model.id.length).toBeLessThan(200);
        });
      });
    });
  });
});