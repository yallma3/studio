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
import { renderHook, act } from '@testing-library/react';
import { useCanvasState } from '@/modules/flow/hooks/useCanvasState';
import { Connection, BaseNode, Socket } from '@/modules/flow/types/NodeTypes';

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
  nodeType = 'Generic',
  x = 100,
  y = 100
): BaseNode => ({
  id,
  category: 'Test',
  title,
  nodeType,
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

describe('useCanvasState', () => {
  describe('initialization', () => {
    it('should initialize with empty arrays by default', () => {
      const { result } = renderHook(() => useCanvasState());

      expect(result.current.nodes).toEqual([]);
      expect(result.current.connections).toEqual([]);
      expect(result.current.nextNodeId.current).toBe(1);
    });

    it('should initialize with provided nodes and connections', () => {
      const initialNodes = [createMockNode(1), createMockNode(2)];
      const initialConnections = [createMockConnection(101, 201)];

      const { result } = renderHook(() => useCanvasState(initialNodes, initialConnections));

      expect(result.current.nodes).toEqual(initialNodes);
      expect(result.current.connections).toEqual(initialConnections);
      expect(result.current.nextNodeId.current).toBe(3); // Max ID + 1
    });

    it('should handle empty initial arrays', () => {
      const { result } = renderHook(() => useCanvasState([], []));

      expect(result.current.nodes).toEqual([]);
      expect(result.current.connections).toEqual([]);
      expect(result.current.nextNodeId.current).toBe(1);
    });

    it('should calculate nextNodeId correctly from initial nodes', () => {
      const initialNodes = [createMockNode(5), createMockNode(3), createMockNode(10)];

      const { result } = renderHook(() => useCanvasState(initialNodes, []));

      expect(result.current.nextNodeId.current).toBe(11); // Max ID (10) + 1
    });
  });

  describe('addNode', () => {
    it('should add a node with auto-generated ID', () => {
      const { result } = renderHook(() => useCanvasState());

      const newNode = createMockNode(0, 'New Node'); // ID will be overridden
      let assignedId: number | undefined;

      act(() => {
        assignedId = result.current.addNode(newNode);
      });

      expect(assignedId).toBe(1);
      expect(result.current.nodes).toHaveLength(1);
      expect(result.current.nodes[0].id).toBe(1);
      expect(result.current.nodes[0].title).toBe('New Node');
      expect(result.current.nextNodeId.current).toBe(2);
    });

    it('should increment node IDs correctly', () => {
      const { result } = renderHook(() => useCanvasState());

      const node1 = createMockNode(0, 'Node 1');
      const node2 = createMockNode(0, 'Node 2');

      act(() => {
        result.current.addNode(node1);
        result.current.addNode(node2);
      });

      expect(result.current.nodes).toHaveLength(2);
      expect(result.current.nodes[0].id).toBe(1);
      expect(result.current.nodes[1].id).toBe(2);
      expect(result.current.nextNodeId.current).toBe(3);
    });

    it('should add nodes to existing nodes', () => {
      const initialNodes = [createMockNode(1)];
      const { result } = renderHook(() => useCanvasState(initialNodes, []));

      const newNode = createMockNode(0, 'New Node');

      act(() => {
        result.current.addNode(newNode);
      });

      expect(result.current.nodes).toHaveLength(2);
      expect(result.current.nodes[0].id).toBe(1);
      expect(result.current.nodes[1].id).toBe(2);
    });
  });

  describe('updateNode', () => {
    it('should update an existing node', () => {
      const initialNode = createMockNode(1, 'Original Title');
      const { result } = renderHook(() => useCanvasState([initialNode], []));

      const updatedNode = { ...initialNode, title: 'Updated Title', x: 200 };

      act(() => {
        result.current.updateNode(updatedNode);
      });

      expect(result.current.nodes).toHaveLength(1);
      expect(result.current.nodes[0].title).toBe('Updated Title');
      expect(result.current.nodes[0].x).toBe(200);
      expect(result.current.nodes[0].id).toBe(1); // ID unchanged
    });

    it('should not modify other nodes when updating one', () => {
      const node1 = createMockNode(1, 'Node 1');
      const node2 = createMockNode(2, 'Node 2');
      const { result } = renderHook(() => useCanvasState([node1, node2], []));

      const updatedNode1 = { ...node1, title: 'Updated Node 1' };

      act(() => {
        result.current.updateNode(updatedNode1);
      });

      expect(result.current.nodes).toHaveLength(2);
      expect(result.current.nodes[0].title).toBe('Updated Node 1');
      expect(result.current.nodes[1].title).toBe('Node 2'); // Unchanged
    });

    it('should do nothing if node ID does not exist', () => {
      const initialNode = createMockNode(1);
      const { result } = renderHook(() => useCanvasState([initialNode], []));

      const nonExistentNode = createMockNode(999, 'Non-existent');

      act(() => {
        result.current.updateNode(nonExistentNode);
      });

      expect(result.current.nodes).toHaveLength(1);
      expect(result.current.nodes[0].id).toBe(1);
    });
  });

  describe('removeNode', () => {
    it('should remove a node and its connections', () => {
      const node1 = createMockNode(1);
      const node2 = createMockNode(2);
      const connection = createMockConnection(101, 201); // Node 1 output to Node 2 input
      const { result } = renderHook(() => useCanvasState([node1, node2], [connection]));

      act(() => {
        result.current.removeNode(1);
      });

      expect(result.current.nodes).toHaveLength(1);
      expect(result.current.nodes[0].id).toBe(2);
      expect(result.current.connections).toHaveLength(0);
    });

    it('should remove only connections involving the removed node', () => {
      const node1 = createMockNode(1);
      const node2 = createMockNode(2);
      const node3 = createMockNode(3);
      const connections = [
        createMockConnection(101, 201), // Node 1 -> Node 2
        createMockConnection(202, 301), // Node 2 -> Node 3
      ];
      const { result } = renderHook(() => useCanvasState([node1, node2, node3], connections));

      act(() => {
        result.current.removeNode(2);
      });

      expect(result.current.nodes).toHaveLength(2);
      expect(result.current.nodes.map(n => n.id)).toEqual([1, 3]);
      expect(result.current.connections).toHaveLength(0); // Both connections involved node 2
    });

    it('should do nothing if node ID does not exist', () => {
      const initialNodes = [createMockNode(1)];
      const initialConnections = [createMockConnection(101, 201)];
      const { result } = renderHook(() => useCanvasState(initialNodes, initialConnections));

      act(() => {
        result.current.removeNode(999);
      });

      expect(result.current.nodes).toHaveLength(1);
      expect(result.current.connections).toHaveLength(1);
    });

    it('should handle removing node with no connections', () => {
      const node1 = createMockNode(1);
      const node2 = createMockNode(2);
      const { result } = renderHook(() => useCanvasState([node1, node2], []));

      act(() => {
        result.current.removeNode(1);
      });

      expect(result.current.nodes).toHaveLength(1);
      expect(result.current.nodes[0].id).toBe(2);
      expect(result.current.connections).toHaveLength(0);
    });
  });

  describe('addConnection', () => {
    it('should add a new connection', () => {
      const { result } = renderHook(() => useCanvasState());

      act(() => {
        result.current.addConnection(101, 201);
      });

      expect(result.current.connections).toHaveLength(1);
      expect(result.current.connections[0]).toEqual({ fromSocket: 101, toSocket: 201 });
    });

    it('should not add duplicate connections', () => {
      const { result } = renderHook(() => useCanvasState());

      act(() => {
        result.current.addConnection(101, 201);
        result.current.addConnection(101, 201); // Duplicate
      });

      expect(result.current.connections).toHaveLength(1);
      expect(result.current.connections[0]).toEqual({ fromSocket: 101, toSocket: 201 });
    });

    it('should allow multiple different connections', () => {
      const { result } = renderHook(() => useCanvasState());

      act(() => {
        result.current.addConnection(101, 201);
        result.current.addConnection(102, 202);
      });

      expect(result.current.connections).toHaveLength(2);
      expect(result.current.connections).toEqual([
        { fromSocket: 101, toSocket: 201 },
        { fromSocket: 102, toSocket: 202 },
      ]);
    });
  });

  describe('removeConnection', () => {
    it('should remove an existing connection', () => {
      const connection = createMockConnection(101, 201);
      const { result } = renderHook(() => useCanvasState([], [connection]));

      act(() => {
        result.current.removeConnection(101, 201);
      });

      expect(result.current.connections).toHaveLength(0);
    });

    it('should only remove the specified connection', () => {
      const connections = [
        createMockConnection(101, 201),
        createMockConnection(102, 202),
      ];
      const { result } = renderHook(() => useCanvasState([], connections));

      act(() => {
        result.current.removeConnection(101, 201);
      });

      expect(result.current.connections).toHaveLength(1);
      expect(result.current.connections[0]).toEqual({ fromSocket: 102, toSocket: 202 });
    });

    it('should do nothing if connection does not exist', () => {
      const connection = createMockConnection(101, 201);
      const { result } = renderHook(() => useCanvasState([], [connection]));

      act(() => {
        result.current.removeConnection(999, 888);
      });

      expect(result.current.connections).toHaveLength(1);
      expect(result.current.connections[0]).toEqual(connection);
    });
  });

  describe('setters', () => {
    it('should allow direct setting of nodes', () => {
      const { result } = renderHook(() => useCanvasState());

      const newNodes = [createMockNode(1), createMockNode(2)];

      act(() => {
        result.current.setNodes(newNodes);
      });

      expect(result.current.nodes).toEqual(newNodes);
    });

    it('should allow direct setting of connections', () => {
      const { result } = renderHook(() => useCanvasState());

      const newConnections = [createMockConnection(101, 201)];

      act(() => {
        result.current.setConnections(newConnections);
      });

      expect(result.current.connections).toEqual(newConnections);
    });
  });
});