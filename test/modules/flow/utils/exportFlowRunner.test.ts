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
import { exportFlowRunner } from '@/modules/flow/utils/exportFlowRunner';
import { NodeType } from '@/modules/flow/types/NodeTypes';

// Mock Tauri APIs
vi.mock('@tauri-apps/plugin-dialog', () => ({
  save: vi.fn(),
}));

vi.mock('@tauri-apps/plugin-fs', () => ({
  writeTextFile: vi.fn(),
}));

const { save: mockSave } = vi.mocked(await import('@tauri-apps/plugin-dialog'));
const { writeTextFile: mockWriteTextFile } = vi.mocked(await import('@tauri-apps/plugin-fs'));

describe('exportFlowRunner', () => {
  beforeEach(() => {
    mockSave.mockReset();
    mockWriteTextFile.mockReset();
  });

  const mockNodes: NodeType[] = [
    {
      id: 1,
      category: 'Input',
      title: 'Input Node',
      nodeType: 'TextInput',
      nodeValue: 'test input',
      x: 100,
      y: 100,
      width: 200,
      height: 100,
      sockets: [
        { id: 1, title: 'Output', type: 'output', nodeId: 1, dataType: 'string' },
      ],
      process: vi.fn(),
    },
    {
      id: 2,
      category: 'Output',
      title: 'Output Node',
      nodeType: 'TextOutput',
      nodeValue: '',
      x: 300,
      y: 100,
      width: 200,
      height: 100,
      sockets: [
        { id: 2, title: 'Input', type: 'input', nodeId: 2, dataType: 'string' },
      ],
      process: vi.fn(),
    },
  ];

  const mockConnections = [
    { fromSocket: 1, toSocket: 2 },
  ];

  describe('exportToText mode', () => {
    it('should return JavaScript code as string when exportToText is true', async () => {
      const result = await exportFlowRunner(mockNodes, mockConnections, true);

      expect(typeof result).toBe('string');
      expect(result).toContain('Flow Runner - Generated from NodeCanvas');
      expect(result).toContain('flowData');
      expect(result).toContain('runFlow');
      expect(result).toContain(JSON.stringify({
        nodes: mockNodes.map(node => ({
          id: node.id,
          x: node.x,
          y: node.y,
          nodeType: node.nodeType,
          title: node.title,
          nodeValue: node.nodeValue,
          sockets: node.sockets.map(socket => ({
            id: socket.id,
            title: socket.title,
            type: socket.type,
            nodeId: socket.nodeId,
            dataType: socket.dataType,
          })),
        })),
        connections: mockConnections.map(conn => ({
          fromSocket: conn.fromSocket,
          toSocket: conn.toSocket,
        })),
      }, null, 2));
    });

    it('should include processors from nodes with process functions', async () => {
      const result = await exportFlowRunner(mockNodes, mockConnections, true);

      expect(result).toContain('processors');
      expect(result).toContain('TextInput');
      expect(result).toContain('TextOutput');
    });

    it('should handle empty nodes and connections', async () => {
      const result = await exportFlowRunner([], [], true);

      expect(typeof result).toBe('string');
      expect(result).toContain('"nodes": []');
      expect(result).toContain('"connections": []');
    });
  });

  describe('file export mode', () => {

    it('should save file when user selects path', async () => {
      const mockFilePath = '/path/to/flow-runner.js';
      mockSave.mockResolvedValueOnce(mockFilePath);
      mockWriteTextFile.mockResolvedValueOnce(undefined);

      const result = await exportFlowRunner(mockNodes, mockConnections, false);

      expect(mockSave).toHaveBeenCalledWith({
        defaultPath: 'flow-runner.js',
        filters: [
          {
            name: 'JavaScript',
            extensions: ['js'],
          },
        ],
      });
      expect(mockWriteTextFile).toHaveBeenCalledWith(mockFilePath, expect.any(String));
      expect(result).toBe(mockFilePath);
    });

    it('should return null when user cancels save dialog', async () => {
      mockSave.mockResolvedValueOnce(null);

      const result = await exportFlowRunner(mockNodes, mockConnections, false);

      expect(mockWriteTextFile).not.toHaveBeenCalled();
      expect(result).toBeNull();
    });

    it('should handle save dialog errors', async () => {
      const error = new Error('Save dialog failed');
      mockSave.mockRejectedValueOnce(error);

      await expect(exportFlowRunner(mockNodes, mockConnections, false)).rejects.toThrow('Save dialog failed');
    });

    it('should handle file write errors', async () => {
      const mockFilePath = '/path/to/flow-runner.js';
      const error = new Error('Write failed');
      mockSave.mockResolvedValueOnce(mockFilePath);
      mockWriteTextFile.mockRejectedValueOnce(error);

      await expect(exportFlowRunner(mockNodes, mockConnections, false)).rejects.toThrow('Write failed');
    });
  });

  describe('generated code structure', () => {
    it('should include all necessary components in generated code', async () => {
      const result = await exportFlowRunner(mockNodes, mockConnections, true);

      // Check for essential components
      expect(result).toContain('const flowData =');
      expect(result).toContain('const processors =');
      expect(result).toContain('async function executeNode');
      expect(result).toContain('async function runFlow');
      expect(result).toContain('findNodeById');
      expect(result).toContain('findSocketById');
    });

    it('should include global config object', async () => {
      const result = await exportFlowRunner(mockNodes, mockConnections, true);

      expect(result).toContain('const globalConfig = {');
      expect(result).toContain('apiKey: null');
      expect(result).toContain('debug: false');
    });

    it('should include built-in processors', async () => {
      const result = await exportFlowRunner(mockNodes, mockConnections, true);

      expect(result).toContain('Number: async ({ node }) => node.value');
      expect(result).toContain('Boolean: async ({ node }) => node.value');
      expect(result).toContain('Add: async ({ node, getInputValue }) => {');
    });
  });
});