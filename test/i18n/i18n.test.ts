/*
 * yaLLMa3 - Framework for building AI agents that are capable of learning from their environment and interacting with it.

 * Copyright (C) 2025 yaLLMa3

 * This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0.
   If a copy of the MPL was not distributed with this file, You can obtain one at https://www.mozilla.org/MPL/2.0/.

 * This software is distributed on an "AS IS" basis,
   WITHOUT WARRANTY OF ANY KIND, either express or implied.
   See the Mozilla Public License for the specific language governing rights and limitations under the License.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import i18next from 'i18next';

// Mock i18next and its plugins
vi.mock('i18next', () => ({
  default: {
    use: vi.fn().mockReturnThis(),
    init: vi.fn().mockResolvedValue(undefined),
  },
}));

vi.mock('react-i18next', () => ({
  initReactI18next: vi.fn(),
}));

vi.mock('i18next-browser-languagedetector', () => ({
  default: vi.fn(),
}));

// Mock translation files
vi.mock('../../src/i18n/locales/en/translation.json', () => ({
  default: {
    app: { title: 'yaLLMa3' },
    home: { createNewGraph: 'Create flow' },
  },
}));

vi.mock('../../src/i18n/locales/ar/translation.json', () => ({
  default: {
    app: { title: 'yaLLMa3' },
    home: { createNewGraph: 'إنشاء تدفق' },
  },
}));

import i18n from '@/i18n/i18n';

describe('i18n Configuration', () => {
  let mockI18n: any;

  beforeEach(() => {
    // Import the module to trigger initialization
    mockI18n = i18next;
  });

  afterEach(() => {
    // vi.resetModules(); // Removed to keep mocks across tests
  });

  it('should initialize i18n with correct configuration and plugins', async () => {
    // Wait for the module to load and initialization to complete
    await new Promise(resolve => setTimeout(resolve, 0));

    expect(mockI18n.use).toHaveBeenCalledTimes(2);
    expect(mockI18n.init).toHaveBeenCalledTimes(1);

    const initConfig = mockI18n.init.mock.calls[0][0];

    expect(initConfig).toEqual(
      expect.objectContaining({
        fallbackLng: 'en',
        debug: false,
        saveMissing: false,
        missingKeyHandler: false,
        supportedLngs: ['en', 'ar'],
        load: 'languageOnly',
        interpolation: {
          escapeValue: false,
        },
      })
    );
  });

  it('should export the i18n instance', async () => {
    expect(i18n).toBe(mockI18n);
  });
});