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
import { executeNode, findNodeById, findSocketById, topologicalSort } from '@/modules/flow/types/NodeProcessor';
import { NodeType, Socket, Connection } from '@/modules/flow/types/NodeTypes';

// Mock console methods
const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

describe('NodeProcessor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('findNodeById', () => {
    it('should return the node with the matching id', () => {
      const nodes: NodeType[] = [
        { id: 1, category: 'Test', title: 'Node 1', nodeType: 'TestNode', nodeValue: '', x: 0, y: 0, width: 100, height: 100, sockets: [] },
        { id: 2, category: 'Test', title: 'Node 2', nodeType: 'TestNode', nodeValue: '', x: 0, y: 0, width: 100, height: 100, sockets: [] },
      ];

      const result = findNodeById(2, nodes);
      expect(result).toEqual(nodes[1]);
    });

    it('should return undefined when node is not found', () => {
      const nodes: NodeType[] = [
        { id: 1, category: 'Test', title: 'Node 1', nodeType: 'TestNode', nodeValue: '', x: 0, y: 0, width: 100, height: 100, sockets: [] },
      ];

      const result = findNodeById(999, nodes);
      expect(result).toBeUndefined();
    });
  });

  describe('findSocketById', () => {
    it('should return the socket with the matching id', () => {
      const socket1: Socket = { id: 1, title: 'Input', type: 'input', nodeId: 1, dataType: 'string' };
      const socket2: Socket = { id: 2, title: 'Output', type: 'output', nodeId: 1, dataType: 'string' };
      const socket3: Socket = { id: 3, title: 'Input', type: 'input', nodeId: 2, dataType: 'string' };

      const nodes: NodeType[] = [
        { id: 1, category: 'Test', title: 'Node 1', nodeType: 'TestNode', nodeValue: '', x: 0, y: 0, width: 100, height: 100, sockets: [socket1, socket2] },
        { id: 2, category: 'Test', title: 'Node 2', nodeType: 'TestNode', nodeValue: '', x: 0, y: 0, width: 100, height: 100, sockets: [socket3] },
      ];

      const result = findSocketById(3, nodes);
      expect(result).toEqual(socket3);
    });

    it('should return undefined when socket is not found', () => {
      const nodes: NodeType[] = [
        { id: 1, category: 'Test', title: 'Node 1', nodeType: 'TestNode', nodeValue: '', x: 0, y: 0, width: 100, height: 100, sockets: [] },
      ];

      const result = findSocketById(999, nodes);
      expect(result).toBeUndefined();
    });
  });

  describe('executeNode', () => {
    it('should execute a node without dependencies', async () => {
      const mockProcess = vi.fn().mockResolvedValue('processed result');
      const node: NodeType = {
        id: 1,
        category: 'Test',
        title: 'Test Node',
        nodeType: 'TestNode',
        nodeValue: '',
        x: 0,
        y: 0,
        width: 100,
        height: 100,
        sockets: [],
        process: mockProcess,
      };

      const result = await executeNode(node, [node], []);

      expect(mockProcess).toHaveBeenCalledWith({
        node,
        getInputValue: expect.any(Function),
      });
      expect(result).toBe('processed result');
    });

    it('should throw error when node has no process function', async () => {
      const node: NodeType = {
        id: 1,
        category: 'Test',
        title: 'Test Node',
        nodeType: 'TestNode',
        nodeValue: '',
        x: 0,
        y: 0,
        width: 100,
        height: 100,
        sockets: [],
      };

      await expect(executeNode(node, [node], [])).rejects.toThrow(
        'Node TestNode (ID: 1) does not have a process function'
      );
    });

    it('should execute nodes with dependencies in correct order', async () => {
      const executionOrder: string[] = [];

      const node1: NodeType = {
        id: 1,
        category: 'Test',
        title: 'Input Node',
        nodeType: 'InputNode',
        nodeValue: '',
        x: 0,
        y: 0,
        width: 100,
        height: 100,
        sockets: [{ id: 1, title: 'Output', type: 'output', nodeId: 1, dataType: 'string' }],
        process: vi.fn().mockImplementation(async () => {
          executionOrder.push('input');
          return 'input value';
        }),
      };

      const node2: NodeType = {
        id: 2,
        category: 'Test',
        title: 'Processor Node',
        nodeType: 'ProcessorNode',
        nodeValue: '',
        x: 100,
        y: 0,
        width: 100,
        height: 100,
        sockets: [
          { id: 2, title: 'Input', type: 'input', nodeId: 2, dataType: 'string' },
          { id: 3, title: 'Output', type: 'output', nodeId: 2, dataType: 'string' },
        ],
        process: vi.fn().mockImplementation(async (context) => {
          const inputValue = await context.getInputValue(2);
          executionOrder.push('processor');
          return `processed: ${inputValue}`;
        }),
      };

      const connections: Connection[] = [
        { fromSocket: 1, toSocket: 2 },
      ];

      const result = await executeNode(node2, [node1, node2], connections);

      expect(executionOrder).toEqual(['input', 'processor']);
      expect(result).toBe('processed: input value');
    });

    it('should use cache to avoid redundant executions', async () => {
      const mockProcess = vi.fn().mockResolvedValue('cached result');
      const node: NodeType = {
        id: 1,
        category: 'Test',
        title: 'Test Node',
        nodeType: 'TestNode',
        nodeValue: '',
        x: 0,
        y: 0,
        width: 100,
        height: 100,
        sockets: [],
        process: mockProcess,
      };

      const cache = new Map<number, Promise<string>>();
      await executeNode(node, [node], [], cache);

      // Execute again with same cache
      await executeNode(node, [node], [], cache);

      // Should only execute once due to caching
      expect(mockProcess).toHaveBeenCalledTimes(1);
    });

    it('should handle multi-output nodes correctly', async () => {
      const multiOutputNode: NodeType = {
        id: 1,
        category: 'Test',
        title: 'Multi Output Node',
        nodeType: 'MultiOutputNode',
        nodeValue: '',
        x: 0,
        y: 0,
        width: 100,
        height: 100,
        sockets: [
          { id: 1, title: 'Output A', type: 'output', nodeId: 1, dataType: 'string' },
          { id: 2, title: 'Output B', type: 'output', nodeId: 1, dataType: 'string' },
        ],
        process: vi.fn().mockResolvedValue({
          1: 'value A',
          2: 'value B',
        }),
      };

      const consumerNode: NodeType = {
        id: 2,
        category: 'Test',
        title: 'Consumer Node',
        nodeType: 'ConsumerNode',
        nodeValue: '',
        x: 100,
        y: 0,
        width: 100,
        height: 100,
        sockets: [
          { id: 3, title: 'Input', type: 'input', nodeId: 2, dataType: 'string' },
        ],
        process: vi.fn().mockImplementation(async (context) => {
          const inputValue = await context.getInputValue(3);
          return `consumed: ${inputValue}`;
        }),
      };

      const connections: Connection[] = [
        { fromSocket: 1, toSocket: 3 },
      ];

      const result = await executeNode(consumerNode, [multiOutputNode, consumerNode], connections);

      expect(result).toBe('consumed: value A');
    });
  });

  describe('topologicalSort', () => {
    it('should sort nodes with no dependencies in original order', () => {
      const nodes: NodeType[] = [
        { id: 1, category: 'Test', title: 'Node 1', nodeType: 'TestNode', nodeValue: '', x: 0, y: 0, width: 100, height: 100, sockets: [] },
        { id: 2, category: 'Test', title: 'Node 2', nodeType: 'TestNode', nodeValue: '', x: 100, y: 0, width: 100, height: 100, sockets: [] },
      ];

      const result = topologicalSort(nodes, []);

      expect(result).toEqual(nodes);
    });

    it('should sort nodes with dependencies correctly', () => {
      const node1: NodeType = {
        id: 1,
        category: 'Test',
        title: 'Input Node',
        nodeType: 'InputNode',
        nodeValue: '',
        x: 0,
        y: 0,
        width: 100,
        height: 100,
        sockets: [{ id: 1, title: 'Output', type: 'output', nodeId: 1, dataType: 'string' }],
      };

      const node2: NodeType = {
        id: 2,
        category: 'Test',
        title: 'Processor Node',
        nodeType: 'ProcessorNode',
        nodeValue: '',
        x: 100,
        y: 0,
        width: 100,
        height: 100,
        sockets: [
          { id: 2, title: 'Input', type: 'input', nodeId: 2, dataType: 'string' },
          { id: 3, title: 'Output', type: 'output', nodeId: 2, dataType: 'string' },
        ],
      };

      const node3: NodeType = {
        id: 3,
        category: 'Test',
        title: 'Output Node',
        nodeType: 'OutputNode',
        nodeValue: '',
        x: 200,
        y: 0,
        width: 100,
        height: 100,
        sockets: [{ id: 4, title: 'Input', type: 'input', nodeId: 3, dataType: 'string' }],
      };

      const connections: Connection[] = [
        { fromSocket: 1, toSocket: 2 },
        { fromSocket: 3, toSocket: 4 },
      ];

      const result = topologicalSort([node1, node2, node3], connections);

      // Should be sorted: node1, node2, node3 (dependencies first)
      expect(result[0]).toEqual(node1);
      expect(result[1]).toEqual(node2);
      expect(result[2]).toEqual(node3);
    });

    it('should detect cycles and fall back to x-position sorting', () => {
      const node1: NodeType = {
        id: 1,
        category: 'Test',
        title: 'Node 1',
        nodeType: 'TestNode',
        nodeValue: '',
        x: 100,
        y: 0,
        width: 100,
        height: 100,
        sockets: [
          { id: 1, title: 'Output', type: 'output', nodeId: 1, dataType: 'string' },
          { id: 2, title: 'Input', type: 'input', nodeId: 1, dataType: 'string' },
        ],
      };

      const node2: NodeType = {
        id: 2,
        category: 'Test',
        title: 'Node 2',
        nodeType: 'TestNode',
        nodeValue: '',
        x: 0,
        y: 0,
        width: 100,
        height: 100,
        sockets: [
          { id: 3, title: 'Output', type: 'output', nodeId: 2, dataType: 'string' },
          { id: 4, title: 'Input', type: 'input', nodeId: 2, dataType: 'string' },
        ],
      };

      const connections: Connection[] = [
        { fromSocket: 1, toSocket: 4 }, // node1 -> node2
        { fromSocket: 3, toSocket: 2 }, // node2 -> node1 (cycle)
      ];

      const result = topologicalSort([node1, node2], connections);

      // Should fall back to x-position sorting (node2.x = 0, node1.x = 100)
      expect(result[0]).toEqual(node2);
      expect(result[1]).toEqual(node1);
      expect(consoleWarnSpy).toHaveBeenCalledWith('Cycle detected in node graph! Falling back to left-to-right (x-position) ordering.');
    });
  });
});