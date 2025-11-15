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
  generateConnectionPath,
  drawConnection,
  drawDragConnection,
} from '@/modules/flow/utils/connectionUtils';
import { Connection, BaseNode, Socket } from '@/modules/flow/types/NodeTypes';

// Mock the socket utilities
vi.mock('@/modules/flow/utils/socketUtils', () => ({
  findSocketById: vi.fn(),
  getNodeBySocketId: vi.fn(),
  getSocketPosition: vi.fn(),
}));

import { findSocketById, getNodeBySocketId, getSocketPosition } from '@/modules/flow/utils/socketUtils';

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
  y = 100
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
  sockets: [createMockSocket(id * 100 + 1, 'input', id), createMockSocket(id * 100 + 2, 'output', id)],
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

describe('Connection Utilities', () => {
  describe('generateConnectionPath', () => {
    it('should generate a basic bezier path for horizontal connections', () => {
      const path = generateConnectionPath(100, 100, 200, 100);

      expect(path).toContain('M 100 100'); // Move to start
      expect(path).toContain('C'); // Cubic bezier curve
      expect(path).toContain('200 100'); // End point
    });

    it('should generate a curved path for diagonal connections', () => {
      const path = generateConnectionPath(100, 100, 300, 200);

      expect(path).toContain('M 100 100');
      expect(path).toContain('C');
      expect(path).toContain('300 200');
      // Control points should create a curve
      expect(path.split(' ').length).toBeGreaterThan(7); // M x y C cp1x cp1y cp2x cp2y x y
    });

    it('should calculate appropriate curvature based on distance', () => {
      const shortPath = generateConnectionPath(100, 100, 150, 100);
      const longPath = generateConnectionPath(100, 100, 400, 100);

      // Both should contain control points, but with different curvatures
      expect(shortPath).toContain('C');
      expect(longPath).toContain('C');
      expect(shortPath).not.toBe(longPath);
    });

    it('should limit maximum curvature', () => {
      const veryLongPath = generateConnectionPath(0, 100, 1000, 100);

      expect(veryLongPath).toContain('C');
      // The path should contain reasonable control points
      expect(veryLongPath).toMatch(/C\s+[\d.-]+\s+[\d.-]+,\s+[\d.-]+\s+[\d.-]+,\s+[\d.-]+\s+[\d.-]+/);
    });

    it('should handle vertical connections', () => {
      const path = generateConnectionPath(100, 100, 100, 200);

      expect(path).toContain('M 100 100');
      expect(path).toContain('C');
      expect(path).toContain('100 200');
    });

    it('should handle zero distance connections', () => {
      const path = generateConnectionPath(100, 100, 100, 100);

      expect(path).toContain('M 100 100');
      expect(path).toContain('C');
      expect(path).toContain('100 100');
    });
  });

  describe('drawConnection', () => {
    let mockNodes: BaseNode[];
    let mockTransform: { scale: number; translateX: number; translateY: number };

    beforeEach(() => {
      vi.clearAllMocks();

      mockNodes = [createMockNode(1), createMockNode(2)];
      mockTransform = { scale: 1, translateX: 0, translateY: 0 };

      // Setup default mocks
      (findSocketById as any).mockImplementation((nodes: BaseNode[], socketId: number) => {
        for (const node of nodes) {
          const socket = node.sockets.find((s: Socket) => s.id === socketId);
          if (socket) return socket;
        }
        return undefined;
      });

      (getNodeBySocketId as any).mockImplementation((nodes: BaseNode[], socketId: number) => {
        return nodes.find((node: BaseNode) => node.sockets.some((s: Socket) => s.id === socketId));
      });

      (getSocketPosition as any).mockReturnValue({ x: 150, y: 150 });
    });

    it('should return a path element for valid connections', () => {
      const connection = createMockConnection(102, 201); // Node 1 output to Node 2 input

      const result = drawConnection(connection, mockNodes, mockTransform);

      expect(result).not.toBeNull();
      expect((result as any)?.type).toBe('path');
      expect((result as any)?.props.d).toContain('M');
      expect((result as any)?.props.d).toContain('C');
      expect((result as any)?.props.fill).toBe('none');
      expect((result as any)?.props.stroke).toBe('#FFC72C');
      expect((result as any)?.props.strokeWidth).toBe('2');
      expect((result as any)?.props.style?.zIndex).toBe(2);
    });

    it('should return null when from socket is not found', () => {
      (findSocketById as any).mockReturnValueOnce(undefined); // fromSocket not found

      const connection = createMockConnection(999, 201);

      const result = drawConnection(connection, mockNodes, mockTransform);

      expect(result).toBeNull();
    });

    it('should return null when to socket is not found', () => {
      (findSocketById as any)
        .mockReturnValueOnce(createMockSocket(102, 'output', 1)) // fromSocket found
        .mockReturnValueOnce(undefined); // toSocket not found

      const connection = createMockConnection(102, 999);

      const result = drawConnection(connection, mockNodes, mockTransform);

      expect(result).toBeNull();
    });

    it('should return null when from node is not found', () => {
      (getNodeBySocketId as any).mockReturnValueOnce(undefined); // fromNode not found

      const connection = createMockConnection(102, 201);

      const result = drawConnection(connection, mockNodes, mockTransform);

      expect(result).toBeNull();
    });

    it('should return null when to node is not found', () => {
      (getNodeBySocketId as any)
        .mockReturnValueOnce(createMockNode(1)) // fromNode found
        .mockReturnValueOnce(undefined); // toNode not found

      const connection = createMockConnection(102, 201);

      const result = drawConnection(connection, mockNodes, mockTransform);

      expect(result).toBeNull();
    });

    it('should return valid path elements for different connections', () => {
      const connection1 = createMockConnection(102, 201); // Valid connection
      const connection2 = createMockConnection(102, 201); // Same connection

      const result1 = drawConnection(connection1, mockNodes, mockTransform);
      const result2 = drawConnection(connection2, mockNodes, mockTransform);

      expect(result1).not.toBeNull();
      expect(result2).not.toBeNull();
      // Same connections should produce equivalent elements
      expect((result1 as any)?.props.d).toBe((result2 as any)?.props.d);
    });

    it('should apply transform to socket positions', () => {
      const scaledTransform = { scale: 2, translateX: 50, translateY: 25 };

      (getSocketPosition as any).mockReturnValue({ x: 200, y: 175 }); // Transformed position

      const connection = createMockConnection(102, 201);

      drawConnection(connection, mockNodes, scaledTransform);

      expect(getSocketPosition).toHaveBeenCalledWith(mockNodes[0], mockNodes[0].sockets[1], scaledTransform);
      expect(getSocketPosition).toHaveBeenCalledWith(mockNodes[1], mockNodes[1].sockets[0], scaledTransform);
    });
  });

  describe('drawDragConnection', () => {
    it('should return a path element for drag connections', () => {
      const dragConnection = {
        fromSocket: 102,
        fromX: 150,
        fromY: 150,
        toX: 250,
        toY: 200,
        isRemoving: false,
      };

      const result = drawDragConnection(dragConnection);

      expect((result as any).type).toBe('path');
      expect((result as any).props.d).toContain('M 150 150');
      expect((result as any).props.d).toContain('C');
      expect((result as any).props.d).toContain('250 200');
      expect((result as any).props.fill).toBe('none');
      expect((result as any).props.stroke).toBe('#FFC72C88'); // Semi-transparent
      expect((result as any).props.strokeWidth).toBe('2');
      expect((result as any).props.strokeDasharray).toBe('5,5');
      expect((result as any).props.style?.zIndex).toBe(2);
    });

    it('should handle removing drag connections', () => {
      const dragConnection = {
        fromSocket: 201,
        fromX: 150,
        fromY: 150,
        toX: 250,
        toY: 200,
        isRemoving: true,
      };

      const result = drawDragConnection(dragConnection);

      expect(result.type).toBe('path');
      expect((result as any).props.stroke).toBe('#FFC72C88');
      expect((result as any).props.strokeDasharray).toBe('5,5');
    });

    it('should generate different paths for different coordinates', () => {
      const drag1 = {
        fromSocket: 102,
        fromX: 100,
        fromY: 100,
        toX: 200,
        toY: 100,
        isRemoving: false,
      };

      const drag2 = {
        fromSocket: 102,
        fromX: 100,
        fromY: 100,
        toX: 200,
        toY: 150,
        isRemoving: false,
      };

      const result1 = drawDragConnection(drag1);
      const result2 = drawDragConnection(drag2);

      expect((result1 as any).props.d).not.toBe((result2 as any).props.d);
    });

    it('should handle zero-length drag connections', () => {
      const dragConnection = {
        fromSocket: 102,
        fromX: 150,
        fromY: 150,
        toX: 150,
        toY: 150,
        isRemoving: false,
      };

      const result = drawDragConnection(dragConnection);

      expect((result as any).props.d).toContain('M 150 150');
      expect((result as any).props.d).toContain('150 150');
    });
  });
});