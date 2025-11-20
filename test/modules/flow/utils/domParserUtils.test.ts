/*
 * yaLLMa3 - Framework for building AI agents that are capable of learning from their environment and interacting with it.

 * Copyright (C) 2025 yaLLMa3

 * This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0.
   If a copy of the MPL was not distributed with this file, You can obtain one at https://www.mozilla.org/MPL/2.0/.

 * This software is distributed on an "AS IS" basis,
   WITHOUT WARRANTY OF ANY KIND, either express or implied.
   See the Mozilla Public License for the specific language governing rights and limitations under the License.
 */

import { describe, it, expect, vi } from 'vitest';
import { createDOMParser, parseFromString } from '@/modules/flow/utils/domParserUtils';

// Mock the xmldom module
vi.mock('@xmldom/xmldom', () => ({
  DOMParser: vi.fn().mockImplementation(() => ({
    parseFromString: vi.fn((text: string, mimeType: string) => {
      // Simple mock implementation
      const mockDoc = {
        documentElement: {
          tagName: mimeType.includes('html') ? 'HTML' : 'root',
          textContent: text,
        },
        getElementsByTagName: vi.fn(() => []),
        createElement: vi.fn(() => ({})),
      };
      return mockDoc;
    }),
  })),
}));

describe('domParserUtils', () => {
  describe('createDOMParser', () => {
    it('should create a DOMParser instance', () => {
      const parser = createDOMParser();
      expect(parser).toBeDefined();
      expect(typeof parser.parseFromString).toBe('function');
    });
  });

  describe('parseFromString', () => {
    it('should parse HTML string', () => {
      const html = '<html><body><h1>Test</h1></body></html>';
      const doc = parseFromString(html, 'text/html');

      expect(doc).toBeDefined();
      expect(doc.documentElement).toBeDefined();
      expect(doc.documentElement.tagName).toBe('HTML');
    });

    it('should parse XML string', () => {
      const xml = '<?xml version="1.0"?><root><item>Test</item></root>';
      const doc = parseFromString(xml, 'application/xml');

      expect(doc).toBeDefined();
      expect(doc.documentElement).toBeDefined();
    });

    it('should handle empty string', () => {
      const doc = parseFromString('', 'text/html');

      expect(doc).toBeDefined();
      expect(doc.documentElement).toBeDefined();
    });

    it('should handle malformed HTML gracefully', () => {
      const malformed = '<html><body><unclosed><h1>Test';
      const doc = parseFromString(malformed, 'text/html');

      expect(doc).toBeDefined();
      // The mock implementation should still return a document
      expect(doc.documentElement).toBeDefined();
    });
  });

  describe('Environment detection', () => {
    it('should work in Node.js environment simulation', () => {
      // The mocking simulates Node.js environment
      const parser = createDOMParser();
      expect(parser).toBeDefined();
    });
  });

  describe('Error handling', () => {
    it('should handle parsing errors gracefully', () => {
      // The mock implementation doesn't throw errors, but in real scenarios
      // malformed XML/HTML might cause issues
      const malformed = '<html><body><invalid><h1>Test</h1></invalid></body></html>';
      expect(() => {
        parseFromString(malformed, 'text/html');
      }).not.toThrow();
    });
  });
});