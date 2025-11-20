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
import { useContextMenu } from '@/modules/flow/hooks/useContextMenu';
import { NodeType } from '@/modules/flow/types/NodeTypes';
import { CanvasTransform } from '@/modules/flow/hooks/useCanvasTransform';

// Mock dependencies
vi.mock('@/modules/flow/utils/canvasTransforms', () => ({
  screenToCanvas: vi.fn((x: number, y: number, transform: CanvasTransform) => ({
    x: x - transform.translateX,
    y: y - transform.translateY
  })),
}));

vi.mock('@/modules/flow/types/NodeRegistry', () => ({
  nodeRegistry: {
    getNode: vi.fn((type) => ({
      category: 'Test',
      title: `${type} Node`,
      nodeType: type,
      nodeValue: '',
      sockets: [],
    })),
  },
}));

vi.mock('@/modules/flow/types/NodeTypes', async () => {
  const actual = await vi.importActual('@/modules/flow/types/NodeTypes');
  return {
    ...actual,
    createNode: vi.fn((id, pos, node) => ({
      id,
      ...node,
      x: pos.x,
      y: pos.y,
      width: 200,
      height: 100,
      selected: false,
    })),
  };
});

describe('useContextMenu Hook', () => {
  const mockSetNodes = vi.fn();
  const mockSetSelectedNodeIds = vi.fn();
  const mockTransform: CanvasTransform = {
    scale: 1,
    translateX: 10,
    translateY: 10,
  };
  const mockNextNodeId = { current: 1 };

  const defaultProps = {
    setNodes: mockSetNodes,
    setSelectedNodeIds: mockSetSelectedNodeIds,
    transform: mockTransform,
    nextNodeId: mockNextNodeId,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockSetNodes.mockReset();
  });

  describe('Initial state', () => {
    it('should initialize with context menu not visible', () => {
      const { result } = renderHook(() => useContextMenu(
        defaultProps.setNodes,
        defaultProps.setSelectedNodeIds,
        defaultProps.transform,
        defaultProps.nextNodeId
      ));

      expect(result.current.contextMenu).toEqual({
        visible: false,
        x: 0,
        y: 0,
        subMenu: null,
      });
    });
  });

  describe('handleContextMenu', () => {
    it('should show context menu on canvas right-click', () => {
      const { result } = renderHook(() => useContextMenu(
        defaultProps.setNodes,
        defaultProps.setSelectedNodeIds,
        defaultProps.transform,
        defaultProps.nextNodeId
      ));

      const mockEvent = {
        preventDefault: vi.fn(),
        clientX: 100,
        clientY: 200,
      } as any;

      act(() => {
        result.current.handleContextMenu(mockEvent);
      });

      expect(mockEvent.preventDefault).toHaveBeenCalled();
      expect(result.current.contextMenu).toEqual({
        visible: true,
        x: 100,
        y: 200,
        subMenu: null,
      });
    });

    it('should store canvas position for node creation', () => {
      const { result } = renderHook(() => useContextMenu(
        defaultProps.setNodes,
        defaultProps.setSelectedNodeIds,
        defaultProps.transform,
        defaultProps.nextNodeId
      ));

      const mockEvent = {
        preventDefault: vi.fn(),
        clientX: 100,
        clientY: 200,
      } as any;

      act(() => {
        result.current.handleContextMenu(mockEvent);
      });

      // canvas position should be client position minus transform offset
      expect(result.current.contextMenuCanvasPosition.current).toEqual({
        x: 90, // 100 - 10
        y: 190, // 200 - 10
      });
    });
  });

  describe('handleNodeContextMenu', () => {
    it('should show context menu for node and select the node', () => {
      const { result } = renderHook(() => useContextMenu(
        defaultProps.setNodes,
        defaultProps.setSelectedNodeIds,
        defaultProps.transform,
        defaultProps.nextNodeId
      ));

      const mockNodes: NodeType[] = [
        { id: 1, category: 'Test', title: 'Node 1', nodeType: 'TestNode', nodeValue: '', x: 0, y: 0, width: 100, height: 100, sockets: [], selected: false },
        { id: 2, category: 'Test', title: 'Node 2', nodeType: 'TestNode', nodeValue: '', x: 0, y: 0, width: 100, height: 100, sockets: [], selected: false },
      ];

      mockSetNodes.mockImplementation((fn) => {
        const newNodes = fn(mockNodes);
        expect(newNodes[0].selected).toBe(true);
        expect(newNodes[1].selected).toBe(false);
      });

      const mockEvent = {
        preventDefault: vi.fn(),
        clientX: 150,
        clientY: 250,
      } as any;

      act(() => {
        result.current.handleNodeContextMenu(mockEvent, 1);
      });

      expect(mockEvent.preventDefault).toHaveBeenCalled();
      expect(mockSetNodes).toHaveBeenCalled();
      expect(mockSetSelectedNodeIds).toHaveBeenCalledWith([1]);
      expect(result.current.contextMenu).toEqual({
        visible: true,
        x: 150,
        y: 250,
        subMenu: null,
        targetNodeId: 1,
      });
    });
  });

  describe('handleAddNodeFromContextMenu', () => {
    it('should create and add a new node', () => {
      const { result } = renderHook(() => useContextMenu(
        defaultProps.setNodes,
        defaultProps.setSelectedNodeIds,
        defaultProps.transform,
        defaultProps.nextNodeId
      ));

      // Set up canvas position
      act(() => {
        result.current.contextMenuCanvasPosition.current = { x: 50, y: 60 };
      });

      const mockEvent = {
        stopPropagation: vi.fn(),
      } as any;

      act(() => {
        result.current.handleAddNodeFromContextMenu('TestNode', mockEvent);
      });

      expect(mockEvent.stopPropagation).toHaveBeenCalled();
      expect(mockSetNodes).toHaveBeenCalled();
      expect(mockSetSelectedNodeIds).toHaveBeenCalledWith([1]);
      expect(result.current.contextMenu.visible).toBe(false);
      expect(mockNextNodeId.current).toBe(2); // Should increment
    });

    it('should handle event without stopPropagation method', () => {
      const { result } = renderHook(() => useContextMenu(
        defaultProps.setNodes,
        defaultProps.setSelectedNodeIds,
        defaultProps.transform,
        defaultProps.nextNodeId
      ));

      act(() => {
        result.current.handleAddNodeFromContextMenu('TestNode', null);
      });

      expect(mockSetNodes).toHaveBeenCalled();
    });
  });

  describe('Global click handling', () => {
    it('should close context menu on global click when visible', () => {
      const { result } = renderHook(() => useContextMenu(
        defaultProps.setNodes,
        defaultProps.setSelectedNodeIds,
        defaultProps.transform,
        defaultProps.nextNodeId
      ));

      // Show context menu first
      act(() => {
        result.current.setContextMenu({
          visible: true,
          x: 100,
          y: 100,
          subMenu: 'test',
        });
      });

      expect(result.current.contextMenu.visible).toBe(true);

      // Simulate global click
      act(() => {
        window.dispatchEvent(new MouseEvent('click'));
      });

      expect(result.current.contextMenu.visible).toBe(false);
      expect(result.current.contextMenu.subMenu).toBe(null);
    });

    it('should not close context menu on global click when not visible', () => {
      const { result } = renderHook(() => useContextMenu(
        defaultProps.setNodes,
        defaultProps.setSelectedNodeIds,
        defaultProps.transform,
        defaultProps.nextNodeId
      ));

      act(() => {
        window.dispatchEvent(new MouseEvent('click'));
      });

      expect(result.current.contextMenu.visible).toBe(false);
    });
  });

  describe('setContextMenu', () => {
    it('should allow manual context menu state updates', () => {
      const { result } = renderHook(() => useContextMenu(
        defaultProps.setNodes,
        defaultProps.setSelectedNodeIds,
        defaultProps.transform,
        defaultProps.nextNodeId
      ));

      const newState = {
        visible: true,
        x: 200,
        y: 300,
        subMenu: 'submenu',
        targetNodeId: 5,
      };

      act(() => {
        result.current.setContextMenu(newState);
      });

      expect(result.current.contextMenu).toEqual(newState);
    });
  });
});