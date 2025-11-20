/*
 * yaLLMa3 - Framework for building AI agents that are capable of learning from their environment and interacting with it.

 * Copyright (C) 2025 yaLLMa3

 * This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0.
   If a copy of the MPL was not distributed with this file, You can obtain one at https://www.mozilla.org/MPL/2.0/.

 * This software is distributed on an "AS IS" basis,
   WITHOUT WARRANTY OF ANY KIND, either express or implied.
   See the Mozilla Public License for the specific language governing rights and limitations under the License.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { loadNodeFromUrl } from '@/modules/flow/types/LoadExternalNode';

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock nodeRegistry
vi.mock('@/modules/flow/types/NodeRegistry', () => ({
  nodeRegistry: {
    register: vi.fn(),
  },
}));

describe('loadNodeFromUrl', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Error handling', () => {
    it('should throw error when fetch fails', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        statusText: 'Not Found',
      });

      await expect(loadNodeFromUrl('https://example.com/node.js')).rejects.toThrow(
        'Failed to fetch external node from https://example.com/node.js: Not Found'
      );
    });

    it('should throw error when fetch throws', async () => {
      const networkError = new Error('Network error');
      mockFetch.mockRejectedValueOnce(networkError);

      await expect(loadNodeFromUrl('https://example.com/node.js')).rejects.toThrow('Network error');
    });
  });





  describe('Logging', () => {
    it('should log error message when loading fails', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      mockFetch.mockRejectedValueOnce(new Error('Import failed'));

      await expect(loadNodeFromUrl('https://example.com/node.js')).rejects.toThrow();

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error loading external node from https://example.com/node.js:',
        expect.any(Error)
      );
      consoleErrorSpy.mockRestore();
    });
  });
});