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
import { renderHook, act } from '@testing-library/react';
import { useConnectionDrag } from '@/modules/flow/hooks/useConnectionDrag';
import { Connection, BaseNode, Socket } from '@/modules/flow/types/NodeTypes';

// Mock the socket utilities
vi.mock('@/modules/flow/utils/socketUtils', () => ({
  findSocketById: vi.fn(),
  getNodeBySocketId: vi.fn(),
  getSocketPosition: vi.fn(),
  findSocketUnderMouse: vi.fn(),
}));

import {
  findSocketById,
  getNodeBySocketId,
  getSocketPosition,
  findSocketUnderMouse,
} from '@/modules/flow/utils/socketUtils';

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

describe('useConnectionDrag', () => {
  let mockNodes: BaseNode[];
  let mockConnections: Connection[];
  let mockSetConnections: any;
  let mockTransform: { scale: number; translateX: number; translateY: number };
  let mockMousePosition: { x: number; y: number };

  beforeEach(() => {
    vi.clearAllMocks();

    mockNodes = [createMockNode(1), createMockNode(2)];
    mockConnections = [createMockConnection(102, 201)]; // Node 1 output to Node 2 input
    mockSetConnections = vi.fn();
    mockTransform = { scale: 1, translateX: 0, translateY: 0 };
    mockMousePosition = { x: 300, y: 200 };

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

    (getSocketPosition as any).mockReturnValue({ x: 150, y: 150 }); // Mock socket position
    (findSocketUnderMouse as any).mockReturnValue(null);
  });

  describe('initialization', () => {
    it('should initialize with no drag connection', () => {
      const { result } = renderHook(() =>
        useConnectionDrag(mockNodes, mockConnections, mockSetConnections, mockTransform, mockMousePosition)
      );

      expect(result.current.dragConnection).toBeNull();
    });
  });

  describe('handleSocketDragStart', () => {
    it('should start dragging from output socket', () => {
      const { result } = renderHook(() =>
        useConnectionDrag(mockNodes, mockConnections, mockSetConnections, mockTransform, mockMousePosition)
      );

      const mockEvent = {
        stopPropagation: vi.fn(),
        clientX: 250,
        clientY: 180,
      } as any;

      act(() => {
        result.current.handleSocketDragStart(mockEvent, 102, false); // Node 1 output socket
      });

      expect(mockEvent.stopPropagation).toHaveBeenCalled();
      expect(result.current.dragConnection).toEqual({
        fromSocket: 102,
        fromX: 150,
        fromY: 150,
        toX: 250,
        toY: 180,
        isRemoving: false,
      });
    });

    it('should not start dragging from input socket for creation', () => {
      const { result } = renderHook(() =>
        useConnectionDrag(mockNodes, mockConnections, mockSetConnections, mockTransform, mockMousePosition)
      );

      const mockEvent = {
        stopPropagation: vi.fn(),
        clientX: 250,
        clientY: 180,
      } as any;

      act(() => {
        result.current.handleSocketDragStart(mockEvent, 201, false); // Node 2 input socket
      });

      expect(result.current.dragConnection).toBeNull();
    });

    it('should start removing connection from input socket', () => {
      const { result } = renderHook(() =>
        useConnectionDrag(mockNodes, mockConnections, mockSetConnections, mockTransform, mockMousePosition)
      );

      const mockEvent = {
        stopPropagation: vi.fn(),
        clientX: 250,
        clientY: 180,
      } as any;

      act(() => {
        result.current.handleSocketDragStart(mockEvent, 201, true); // Node 2 input socket, removing
      });

      expect(mockEvent.stopPropagation).toHaveBeenCalled();
      expect(result.current.dragConnection).toEqual({
        fromSocket: 201, // Input socket ID
        fromX: 150,
        fromY: 150,
        toX: 250,
        toY: 180,
        isRemoving: true,
      });
    });

    it('should not start dragging if socket not found', () => {
      (findSocketById as any).mockReturnValue(undefined);

      const { result } = renderHook(() =>
        useConnectionDrag(mockNodes, mockConnections, mockSetConnections, mockTransform, mockMousePosition)
      );

      const mockEvent = {
        stopPropagation: vi.fn(),
        clientX: 250,
        clientY: 180,
      } as any;

      act(() => {
        result.current.handleSocketDragStart(mockEvent, 999, false);
      });

      expect(result.current.dragConnection).toBeNull();
    });

    it('should not start removing if input socket has no connection', () => {
      const { result } = renderHook(() =>
        useConnectionDrag(mockNodes, mockConnections, mockSetConnections, mockTransform, mockMousePosition)
      );

      const mockEvent = {
        stopPropagation: vi.fn(),
        clientX: 250,
        clientY: 180,
      } as any;

      act(() => {
        result.current.handleSocketDragStart(mockEvent, 301, true); // Node 3 input socket (doesn't exist)
      });

      expect(result.current.dragConnection).toBeNull();
    });
  });

  describe('handleSocketDragMove', () => {
    it('should update drag position when dragging', () => {
      const { result } = renderHook(() =>
        useConnectionDrag(mockNodes, mockConnections, mockSetConnections, mockTransform, mockMousePosition)
      );

      // Start dragging
      const startEvent = {
        stopPropagation: vi.fn(),
        clientX: 250,
        clientY: 180,
      } as any;

      act(() => {
        result.current.handleSocketDragStart(startEvent, 102, false);
      });

      // Move drag
      const moveEvent = {
        clientX: 300,
        clientY: 220,
      } as any;

      act(() => {
        result.current.handleSocketDragMove(moveEvent);
      });

      expect(result.current.dragConnection).toEqual({
        fromSocket: 102,
        fromX: 150,
        fromY: 150,
        toX: 300,
        toY: 220,
        isRemoving: false,
      });
    });

    it('should not update position when not dragging', () => {
      const { result } = renderHook(() =>
        useConnectionDrag(mockNodes, mockConnections, mockSetConnections, mockTransform, mockMousePosition)
      );

      const moveEvent = {
        clientX: 300,
        clientY: 220,
      } as any;

      act(() => {
        result.current.handleSocketDragMove(moveEvent);
      });

      expect(result.current.dragConnection).toBeNull();
    });
  });

  describe('handleSocketDragEnd', () => {
    it('should create new connection when dragging from output to input', () => {
      const { result } = renderHook(() =>
        useConnectionDrag(mockNodes, mockConnections, mockSetConnections, mockTransform, mockMousePosition)
      );

      // Add a third node for the target socket
      mockNodes.push(createMockNode(3));

      // Mock finding target socket
      const targetSocket = createMockSocket(301, 'input', 3);
      (findSocketUnderMouse as any).mockReturnValue(targetSocket);

      // Start dragging from output
      const startEvent = {
        stopPropagation: vi.fn(),
        clientX: 250,
        clientY: 180,
      } as any;

      act(() => {
        result.current.handleSocketDragStart(startEvent, 102, false);
      });

      // End drag
      act(() => {
        result.current.handleSocketDragEnd();
      });

      expect(mockSetConnections).toHaveBeenCalledWith([
        ...mockConnections,
        { fromSocket: 102, toSocket: 301 }
      ]);
      expect(result.current.dragConnection).toBeNull();
    });

    it('should replace existing connection when dropping on occupied input', () => {
      const { result } = renderHook(() =>
        useConnectionDrag(mockNodes, mockConnections, mockSetConnections, mockTransform, mockMousePosition)
      );

      // Mock finding target socket (already connected)
      const targetSocket = createMockSocket(201, 'input', 2); // Already connected in mockConnections
      (findSocketUnderMouse as any).mockReturnValue(targetSocket);

      // Start dragging from output
      const startEvent = {
        stopPropagation: vi.fn(),
        clientX: 250,
        clientY: 180,
      } as any;

      act(() => {
        result.current.handleSocketDragStart(startEvent, 102, false);
      });

      // End drag
      act(() => {
        result.current.handleSocketDragEnd();
      });

      expect(mockSetConnections).toHaveBeenCalledWith([
        { fromSocket: 102, toSocket: 201 } // Replaced the original connection
      ]);
    });

    it('should remove connection when removing drag ends in empty space', () => {
      const { result } = renderHook(() =>
        useConnectionDrag(mockNodes, mockConnections, mockSetConnections, mockTransform, mockMousePosition)
      );

      // Start removing connection from input
      const startEvent = {
        stopPropagation: vi.fn(),
        clientX: 250,
        clientY: 180,
      } as any;

      act(() => {
        result.current.handleSocketDragStart(startEvent, 201, true); // Remove from input socket
      });

      // End drag in empty space (no socket found)
      act(() => {
        result.current.handleSocketDragEnd();
      });

      expect(mockSetConnections).toHaveBeenCalledWith([]); // Connection removed
      expect(result.current.dragConnection).toBeNull();
    });

    it('should move connection when removing drag ends on different input', () => {
      const { result } = renderHook(() =>
        useConnectionDrag(mockNodes, mockConnections, mockSetConnections, mockTransform, mockMousePosition)
      );

      // Add another node with input socket
      const node3 = createMockNode(3);
      mockNodes.push(node3);

      // Mock finding target socket
      const targetSocket = createMockSocket(301, 'input', 3);
      (findSocketUnderMouse as any).mockReturnValue(targetSocket);

      // Start removing connection from input
      const startEvent = {
        stopPropagation: vi.fn(),
        clientX: 250,
        clientY: 180,
      } as any;

      act(() => {
        result.current.handleSocketDragStart(startEvent, 201, true);
      });

      // End drag on different input
      act(() => {
        result.current.handleSocketDragEnd();
      });

      expect(mockSetConnections).toHaveBeenCalledWith([
        { fromSocket: 102, toSocket: 301 } // Moved to new input
      ]);
    });

    it('should not create connection to same node', () => {
      const { result } = renderHook(() =>
        useConnectionDrag(mockNodes, mockConnections, mockSetConnections, mockTransform, mockMousePosition)
      );

      // Mock finding target socket on same node
      const targetSocket = createMockSocket(101, 'input', 1); // Same node as source
      (findSocketUnderMouse as any).mockReturnValue(targetSocket);

      // Start dragging from output
      const startEvent = {
        stopPropagation: vi.fn(),
        clientX: 250,
        clientY: 180,
      } as any;

      act(() => {
        result.current.handleSocketDragStart(startEvent, 102, false);
      });

      // End drag
      act(() => {
        result.current.handleSocketDragEnd();
      });

      // Should not create connection
      expect(mockSetConnections).not.toHaveBeenCalled();
      expect(result.current.dragConnection).toBeNull();
    });

    it('should not create connection to output socket', () => {
      const { result } = renderHook(() =>
        useConnectionDrag(mockNodes, mockConnections, mockSetConnections, mockTransform, mockMousePosition)
      );

      // Mock finding output socket as target
      const targetSocket = createMockSocket(202, 'output', 2);
      (findSocketUnderMouse as any).mockReturnValue(targetSocket);

      // Start dragging from output
      const startEvent = {
        stopPropagation: vi.fn(),
        clientX: 250,
        clientY: 180,
      } as any;

      act(() => {
        result.current.handleSocketDragStart(startEvent, 102, false);
      });

      // End drag
      act(() => {
        result.current.handleSocketDragEnd();
      });

      // Should not create connection
      expect(mockSetConnections).not.toHaveBeenCalled();
      expect(result.current.dragConnection).toBeNull();
    });

    it('should do nothing when not dragging', () => {
      const { result } = renderHook(() =>
        useConnectionDrag(mockNodes, mockConnections, mockSetConnections, mockTransform, mockMousePosition)
      );

      act(() => {
        result.current.handleSocketDragEnd();
      });

      expect(mockSetConnections).not.toHaveBeenCalled();
    });
  });
});