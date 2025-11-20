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
import {
  getSocketPosition,
  findSocketById,
  getNodeBySocketId,
  findSocketUnderMouse,
  buildExecutionGraph,
  addSocketToJoinNode,
} from '@/modules/flow/utils/socketUtils';
import { BaseNode, Socket, Connection } from '@/modules/flow/types/NodeTypes';

// Mock the canvasTransforms utility
vi.mock('@/modules/flow/utils/canvasTransforms', () => ({
  canvasToScreen: vi.fn((x, y, transform) => ({
    x: x * transform.scale + transform.translateX,
    y: y * transform.scale + transform.translateY
  })),
}));

import { canvasToScreen } from '@/modules/flow/utils/canvasTransforms';

// Test data factories
const createMockSocket = (
  id: number,
  type: 'input' | 'output',
  nodeId: number,
  title = 'Test Socket'
): Socket => ({
  id,
  title,
  type,
  nodeId,
  dataType: 'string',
});

const createMockNode = (
  id: number,
  title = 'Test Node',
  x = 100,
  y = 100,
  sockets: Socket[] = []
): BaseNode => ({
  id,
  category: 'Test',
  title,
  nodeType: 'Generic',
  nodeValue: 'test value',
  x,
  y,
  width: 200,
  height: 100,
  sockets,
  selected: false,
  processing: false,
  configParameters: [],
  getConfigParameters: function () { return this.configParameters ?? []; },
  getConfigParameter: function (parameterName: string) {
    return (this.configParameters ?? []).find(param => param.parameterName === parameterName);
  },
  setConfigParameter: function (parameterName: string, value: string | number | boolean) {
    const parameter = (this.configParameters ?? []).find(param => param.parameterName === parameterName);
    if (parameter) {
      parameter.paramValue = value;
    }
  },
});

const createMockConnection = (fromSocket: number, toSocket: number): Connection => ({
  fromSocket,
  toSocket,
});

describe('Socket Utilities', () => {
  describe('getSocketPosition', () => {
    let mockTransform: { scale: number; translateX: number; translateY: number };

    beforeEach(() => {
      vi.clearAllMocks();
      mockTransform = { scale: 1, translateX: 0, translateY: 0 };
    });

    it('should calculate output socket position correctly', () => {
      const node = createMockNode(1, 'Test Node', 100, 100, [
        createMockSocket(101, 'input', 1),
        createMockSocket(102, 'output', 1),
      ]);
      const socket = node.sockets[1]; // The output socket

      const position = getSocketPosition(node, socket, mockTransform);

      expect(position.x).toBe(300); // (node.x + node.width) * scale + translateX = 300 * 1 + 0
      expect(position.y).toBe(180); // (node.y + node.height * 0.8) * scale + translateY = 180 * 1 + 0
      expect(canvasToScreen).toHaveBeenCalledWith(300, 180, mockTransform);
    });

    it('should calculate input socket position correctly', () => {
      const node = createMockNode(1, 'Test Node', 100, 100, [
        createMockSocket(101, 'input', 1),
        createMockSocket(102, 'output', 1),
      ]);
      const socket = node.sockets[0]; // The input socket

      const position = getSocketPosition(node, socket, mockTransform);

      expect(position.x).toBe(100); // node.x * scale + translateX = 100 * 1 + 0
      expect(position.y).toBe(180); // (node.y + node.height * 0.8) * scale + translateY = 180 * 1 + 0
    });

    it('should handle single socket positioning', () => {
      const node = createMockNode(1, 'Test Node', 100, 100);
      const socket = createMockSocket(101, 'input', 1);
      node.sockets = [socket]; // Only one socket

      const position = getSocketPosition(node, socket, mockTransform);

      expect(position.y).toBe(180); // node.y + (node.height * 0.8)
    });

    it('should distribute multiple sockets vertically', () => {
      const node = createMockNode(1, 'Test Node', 100, 100);
      const socket1 = createMockSocket(101, 'input', 1, 'Input 1');
      const socket2 = createMockSocket(102, 'input', 1, 'Input 2');
      const socket3 = createMockSocket(103, 'input', 1, 'Input 3');
      node.sockets = [socket1, socket2, socket3];

      const position1 = getSocketPosition(node, socket1, mockTransform);
      const position2 = getSocketPosition(node, socket2, mockTransform);
      const position3 = getSocketPosition(node, socket3, mockTransform);

      // totalSpacing = 40 * (3-1) = 80
      // startY = 100 + (100 - 80) / 2 = 110
      // First socket: 110 + (0 * 40) + 100 * 0.2 = 130
      expect(position1.y).toBe(130);
      // Second socket: 110 + (1 * 40) + 100 * 0.2 = 170
      expect(position2.y).toBe(170);
      // Third socket: 110 + (2 * 40) + 100 * 0.2 = 210
      expect(position3.y).toBe(210);
    });

    it('should return fallback position when socket not found in node', () => {
      const node = createMockNode(1, 'Test Node', 100, 100);
      const socket = createMockSocket(999, 'input', 1); // Not in node's sockets

      const position = getSocketPosition(node, socket, mockTransform);

      expect(position).toEqual({ x: 0, y: 0 });
      expect(canvasToScreen).not.toHaveBeenCalled();
    });

    it('should apply transform to final position', () => {
      const scaledTransform = { scale: 2, translateX: 50, translateY: 25 };

      const node = createMockNode(1, 'Test Node', 100, 100, [
        createMockSocket(101, 'input', 1),
        createMockSocket(102, 'output', 1),
      ]);
      const socket = node.sockets[1]; // The output socket

      const position = getSocketPosition(node, socket, scaledTransform);

      expect(position).toEqual({ x: 650, y: 385 }); // 300*2+50, 180*2+25
    });
  });

  describe('findSocketById', () => {
    it('should find socket by ID across multiple nodes', () => {
      const node1 = createMockNode(1, 'Node 1', 0, 0, [
        createMockSocket(101, 'input', 1),
        createMockSocket(102, 'output', 1),
      ]);
      const node2 = createMockNode(2, 'Node 2', 0, 0, [
        createMockSocket(201, 'input', 2),
        createMockSocket(202, 'output', 2),
      ]);
      const nodes = [node1, node2];

      const result = findSocketById(nodes, 201);

      expect(result).toEqual(createMockSocket(201, 'input', 2));
    });

    it('should return undefined when socket not found', () => {
      const node1 = createMockNode(1, 'Node 1', 0, 0, [
        createMockSocket(101, 'input', 1),
      ]);
      const nodes = [node1];

      const result = findSocketById(nodes, 999);

      expect(result).toBeUndefined();
    });

    it('should return undefined for empty nodes array', () => {
      const result = findSocketById([], 101);

      expect(result).toBeUndefined();
    });
  });

  describe('getNodeBySocketId', () => {
    it('should find node containing socket with given ID', () => {
      const node1 = createMockNode(1, 'Node 1', 0, 0, [
        createMockSocket(101, 'input', 1),
      ]);
      const node2 = createMockNode(2, 'Node 2', 0, 0, [
        createMockSocket(201, 'input', 2),
      ]);
      const nodes = [node1, node2];

      const result = getNodeBySocketId(nodes, 201);

      expect(result).toEqual(node2);
    });

    it('should return undefined when socket not found in any node', () => {
      const node1 = createMockNode(1, 'Node 1', 0, 0, [
        createMockSocket(101, 'input', 1),
      ]);
      const nodes = [node1];

      const result = getNodeBySocketId(nodes, 999);

      expect(result).toBeUndefined();
    });

    it('should return undefined for empty nodes array', () => {
      const result = getNodeBySocketId([], 101);

      expect(result).toBeUndefined();
    });
  });

  describe('findSocketUnderMouse', () => {
    let mockTransform: { scale: number; translateX: number; translateY: number };

    beforeEach(() => {
      vi.clearAllMocks();
      mockTransform = { scale: 1, translateX: 0, translateY: 0 };
    });

    it('should find socket when mouse is within range', () => {
      const node = createMockNode(1, 'Test Node', 100, 100, [
        createMockSocket(101, 'input', 1),
      ]);

      const result = findSocketUnderMouse(95, 175, [node], mockTransform);

      expect(result).toEqual(createMockSocket(101, 'input', 1));
    });

    it('should return undefined when mouse is outside range', () => {
      const node = createMockNode(1, 'Test Node', 100, 100, [
        createMockSocket(101, 'input', 1),
      ]);

      (canvasToScreen as any).mockReturnValue({ x: 100, y: 180 });

      const result = findSocketUnderMouse(200, 200, [node], mockTransform);

      expect(result).toBeUndefined();
    });

    it('should check all sockets across all nodes', () => {
      const node1 = createMockNode(1, 'Node 1', 100, 100, [
        createMockSocket(101, 'input', 1),
      ]);
      const node2 = createMockNode(2, 'Node 2', 200, 200, [
        createMockSocket(201, 'output', 2),
      ]);

      // Mock positions: first socket at (100, 180), second at (400, 380)
      (canvasToScreen as any)
        .mockReturnValueOnce({ x: 100, y: 180 })
        .mockReturnValueOnce({ x: 400, y: 380 });

      const result = findSocketUnderMouse(395, 375, [node1, node2], mockTransform);

      expect(result).toEqual(createMockSocket(201, 'output', 2));
    });

    it('should return the first socket found within range', () => {
      const node = createMockNode(1, 'Test Node', 100, 100, [
        createMockSocket(101, 'input', 1, 'Socket 1'),
        createMockSocket(102, 'output', 1, 'Socket 2'),
      ]);

      // Both sockets at same position (simplified for test)
      (canvasToScreen as any).mockReturnValue({ x: 100, y: 180 });

      const result = findSocketUnderMouse(95, 175, [node], mockTransform);

      expect(result).toEqual(createMockSocket(101, 'input', 1, 'Socket 1'));
    });

    it('should use 15px detection radius', () => {
      const node = createMockNode(1, 'Test Node', 100, 100, [
        createMockSocket(101, 'input', 1),
      ]);

      // Test at less than 15px distance (should be detected)
      const result = findSocketUnderMouse(100, 194, [node], mockTransform); // 180 + 14 = 194
      expect(result).toEqual(createMockSocket(101, 'input', 1));

      // Test at more than 15px distance (should not be detected)
      const result2 = findSocketUnderMouse(100, 196, [node], mockTransform); // 180 + 16 = 196
      expect(result2).toBeUndefined();
    });

    it('should return undefined for empty nodes array', () => {
      const result = findSocketUnderMouse(100, 100, [], mockTransform);

      expect(result).toBeUndefined();
    });
  });

  describe('buildExecutionGraph', () => {
    it('should build graph edges from connections', () => {
      const nodes = [
        createMockNode(1, 'Source', 0, 0, [
          createMockSocket(101, 'input', 1),
          createMockSocket(102, 'output', 1),
        ]),
        createMockNode(2, 'Process', 0, 0, [
          createMockSocket(201, 'input', 2),
          createMockSocket(202, 'output', 2),
        ]),
        createMockNode(3, 'Sink', 0, 0, [
          createMockSocket(301, 'input', 3),
          createMockSocket(302, 'output', 3),
        ]),
      ];

      const connections = [
        createMockConnection(102, 201), // Node 1 output to Node 2 input
        createMockConnection(202, 301), // Node 2 output to Node 3 input
      ];

      const graph = buildExecutionGraph(nodes, connections);

      expect(graph).toEqual([
        [1, 2], // Source -> Process
        [2, 3], // Process -> Sink
      ]);
    });

    it('should handle multiple connections from same source', () => {
      const nodes = [
        createMockNode(1, 'Source', 0, 0, [
          createMockSocket(101, 'output', 1),
          createMockSocket(102, 'output', 1),
        ]),
        createMockNode(2, 'Target1', 0, 0, [
          createMockSocket(201, 'input', 2),
        ]),
        createMockNode(3, 'Target2', 0, 0, [
          createMockSocket(301, 'input', 3),
        ]),
      ];

      const connections = [
        createMockConnection(101, 201), // Node 1 -> Node 2
        createMockConnection(102, 301), // Node 1 -> Node 3
      ];

      const graph = buildExecutionGraph(nodes, connections);

      expect(graph).toEqual([
        [1, 2],
        [1, 3],
      ]);
    });

    it('should handle empty connections array', () => {
      const nodes = [createMockNode(1, 'Test')];
      const connections: Connection[] = [];

      const graph = buildExecutionGraph(nodes, connections);

      expect(graph).toEqual([]);
    });

    it('should handle connections with invalid socket IDs', () => {
      const nodes = [createMockNode(1, 'Test')];
      const connections = [
        createMockConnection(999, 888), // Invalid socket IDs
      ];

      const graph = buildExecutionGraph(nodes, connections);

      expect(graph).toEqual([]);
    });

    it('should create unique edges (no duplicates)', () => {
      const nodes = [
        createMockNode(1, 'Source', 0, 0, [
          createMockSocket(101, 'output', 1),
        ]),
        createMockNode(2, 'Target', 0, 0, [
          createMockSocket(201, 'input', 2),
        ]),
      ];

      const connections = [
        createMockConnection(101, 201),
        createMockConnection(101, 201), // Duplicate
      ];

      const graph = buildExecutionGraph(nodes, connections);

      expect(graph).toEqual([[1, 2], [1, 2]]);
      expect(graph.length).toBe(2);
    });
  });

  describe('addSocketToJoinNode', () => {
    it('should add input socket to Join node', () => {
      const joinNode = createMockNode(1, 'Join Node');
      joinNode.nodeType = 'Join';
      joinNode.sockets = [
        createMockSocket(101, 'input', 1, 'Input 1'),
        createMockSocket(102, 'input', 1, 'Input 2'),
        createMockSocket(103, 'output', 1, 'Output'),
      ];
      joinNode.height = 230;

      const result = addSocketToJoinNode(joinNode);

      expect(result.sockets).toHaveLength(4);
      expect(result.sockets[3]).toEqual({
        id: 103, // node.id * 100 + (inputCount + 1) = 1 * 100 + (2 + 1) = 103
        title: 'Input 3',
        type: 'input',
        nodeId: 1,
        dataType: 'unknown',
      });
      expect(result.height).toBe(280); // 230 + 50 (height per extra socket for 2->3 inputs)
    });

    it('should increase height for additional sockets', () => {
      const joinNode = createMockNode(1, 'Join Node');
      joinNode.nodeType = 'Join';
      joinNode.sockets = [
        createMockSocket(101, 'input', 1, 'Input 1'),
        createMockSocket(102, 'output', 1, 'Output'),
      ];
      joinNode.height = 230;

      const result = addSocketToJoinNode(joinNode);

      expect(result.height).toBe(230); // 230 + 0 (no extra sockets yet for 1->2 inputs)
    });

    it('should return node unchanged if not a Join node', () => {
      const regularNode = createMockNode(1, 'Regular Node');
      regularNode.nodeType = 'Generic';

      const result = addSocketToJoinNode(regularNode);

      expect(result).toEqual(regularNode);
    });

    it('should handle Join node with no existing inputs', () => {
      const joinNode = createMockNode(1, 'Join Node');
      joinNode.nodeType = 'Join';
      joinNode.sockets = [
        createMockSocket(101, 'output', 1, 'Output'),
      ];
      joinNode.height = 230;

      const result = addSocketToJoinNode(joinNode);

      expect(result.sockets).toHaveLength(2);
      expect(result.sockets[1]).toEqual({
        id: 101, // 1 * 100 + (0 + 1) = 101
        title: 'Input 1',
        type: 'input',
        nodeId: 1,
        dataType: 'unknown',
      });
      expect(result.height).toBe(230); // 230 + 0 (no extra sockets for 0->1 inputs)
    });
  });
});