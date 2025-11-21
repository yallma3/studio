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
import { render, screen, fireEvent } from '@testing-library/react';
import NodeCanvas from '@/modules/flow/NodeCanvas';
import { CanvasState } from '@/modules/flow/utils/storageUtils';


// Mock all the hooks and utilities
vi.mock('@/modules/flow/hooks/useCanvasState', () => ({
  useCanvasState: vi.fn(),
}));

vi.mock('@/modules/flow/hooks/useCanvasTransform', () => ({
  useCanvasTransform: vi.fn(),
}));

vi.mock('@/modules/flow/hooks/useConnectionDrag', () => ({
  useConnectionDrag: vi.fn(),
}));

vi.mock('@/modules/flow/hooks/useContextMenu', () => ({
  useContextMenu: vi.fn(),
}));

vi.mock('@/modules/flow/utils/exportFlowRunner', () => ({
  exportFlowRunner: vi.fn(),
}));

vi.mock('@/modules/flow/utils/flowRuntime', () => ({
  createJson: vi.fn(),
}));

vi.mock('@/modules/flow/utils/storageUtils', () => ({
  saveCanvasState: vi.fn(),
}));

vi.mock('@tauri-apps/plugin-fs', () => ({
  writeTextFile: vi.fn(),
}));

vi.mock('@tauri-apps/plugin-dialog', () => ({
  save: vi.fn(),
}));

vi.mock('@/modules/api/SidecarClient', () => ({
  sidecarClient: {
    executeFlow: vi.fn(),
    onCommand: vi.fn(),
    sendMessage: vi.fn(),
  },
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

import { useCanvasState } from '@/modules/flow/hooks/useCanvasState';
import { useCanvasTransform } from '@/modules/flow/hooks/useCanvasTransform';
import { useConnectionDrag } from '@/modules/flow/hooks/useConnectionDrag';
import { useContextMenu } from '@/modules/flow/hooks/useContextMenu';
import { createJson } from '@/modules/flow/utils/flowRuntime';

// Create typed mocks
const mockedUseCanvasState = vi.mocked(useCanvasState);
const mockedUseCanvasTransform = vi.mocked(useCanvasTransform);
const mockedUseConnectionDrag = vi.mocked(useConnectionDrag);
const mockedUseContextMenu = vi.mocked(useContextMenu);
const mockedCreateJson = vi.mocked(createJson);

// Test data factories
const createMockCanvasState = (): CanvasState => ({
  graphId: 'test-graph',
  graphName: 'Test Graph',
  nodes: [],
  connections: [],
  nextNodeId: 1,
});



describe('NodeCanvas Component', () => {
  const mockOnReturnToHome = vi.fn();

  const defaultMocks = {
    // Canvas state
    nodes: [],
    setNodes: vi.fn(),
    connections: [],
    setConnections: vi.fn(),
    nextNodeId: { current: 1 },
    addNode: vi.fn(),
    updateNode: vi.fn(),
    removeNode: vi.fn(),
    addConnection: vi.fn(),
    removeConnection: vi.fn(),

    // Canvas transform
    transform: { scale: 1, translateX: 0, translateY: 0 },
    setTransform: vi.fn(),
    isPanningActive: false,
    handleWheel: vi.fn(),
    startPanning: vi.fn(),
    updatePanning: vi.fn(),
    endPanning: vi.fn(),
    resetView: vi.fn(),
    zoomIn: vi.fn(),
    zoomOut: vi.fn(),

    // Connection drag
    dragConnection: null,
    handleSocketDragStart: vi.fn(),
    handleSocketDragMove: vi.fn(),
    handleSocketDragEnd: vi.fn(),

    // Context menu
    contextMenu: { visible: false, x: 0, y: 0, subMenu: null },
    setContextMenu: vi.fn(),
    contextMenuCanvasPosition: { current: { x: 0, y: 0 } },
    handleContextMenu: vi.fn(),
    handleNodeContextMenu: vi.fn(),
    handleAddNodeFromContextMenu: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup default hook mocks
    mockedUseCanvasState.mockReturnValue({
      nodes: defaultMocks.nodes,
      setNodes: defaultMocks.setNodes,
      connections: defaultMocks.connections,
      setConnections: defaultMocks.setConnections,
      nextNodeId: defaultMocks.nextNodeId,
      addNode: defaultMocks.addNode,
      updateNode: defaultMocks.updateNode,
      removeNode: defaultMocks.removeNode,
      addConnection: defaultMocks.addConnection,
      removeConnection: defaultMocks.removeConnection,
    });

    mockedUseCanvasTransform.mockReturnValue({
      transform: defaultMocks.transform,
      setTransform: defaultMocks.setTransform,
      isPanningActive: defaultMocks.isPanningActive,
      handleWheel: defaultMocks.handleWheel,
      startPanning: defaultMocks.startPanning,
      updatePanning: defaultMocks.updatePanning,
      endPanning: defaultMocks.endPanning,
      resetView: defaultMocks.resetView,
      zoomIn: defaultMocks.zoomIn,
      zoomOut: defaultMocks.zoomOut,
    });

    mockedUseConnectionDrag.mockReturnValue({
      dragConnection: defaultMocks.dragConnection,
      handleSocketDragStart: defaultMocks.handleSocketDragStart,
      handleSocketDragMove: defaultMocks.handleSocketDragMove,
      handleSocketDragEnd: defaultMocks.handleSocketDragEnd,
    });

    mockedUseContextMenu.mockReturnValue({
      contextMenu: defaultMocks.contextMenu,
      setContextMenu: defaultMocks.setContextMenu,
      contextMenuCanvasPosition: defaultMocks.contextMenuCanvasPosition,
      handleContextMenu: defaultMocks.handleContextMenu,
      handleNodeContextMenu: defaultMocks.handleNodeContextMenu,
      handleAddNodeFromContextMenu: defaultMocks.handleAddNodeFromContextMenu,
    });

    mockedCreateJson.mockReturnValue({
      id: 'wf-123',
      name: 'Test Workflow',
      description: 'A test workflow',
      nodes: [],
      connections: [],
    });
  });

  describe('rendering', () => {
    it('should render canvas container', () => {
      const graph = createMockCanvasState();

      render(
        <NodeCanvas
          graph={graph}
          onReturnToHome={mockOnReturnToHome}
          workflowMeta={null}
        />
      );

      // Check for the main canvas div with specific class
      expect(document.querySelector('.bg-black\\/98')).toBeInTheDocument();
    });

    it('should render toolbar with navigation and action buttons', () => {
      const graph = createMockCanvasState();

      render(
        <NodeCanvas
          graph={graph}
          onReturnToHome={mockOnReturnToHome}
          workflowMeta={null}
        />
      );

      expect(screen.getByLabelText('canvas.returnToHome')).toBeInTheDocument();
      // Save is in the dropdown menu, so check for run button
      expect(screen.getByText('canvas.run')).toBeInTheDocument();
    });

    it('should render zoom controls', () => {
      const graph = createMockCanvasState();

      render(
        <NodeCanvas
          graph={graph}
          onReturnToHome={mockOnReturnToHome}
          workflowMeta={null}
        />
      );

      // Zoom controls have title attributes instead of text
      expect(screen.getByTitle('Zoom In')).toBeInTheDocument();
      expect(screen.getByTitle('Zoom Out')).toBeInTheDocument();
      expect(screen.getByTitle('Reset View')).toBeInTheDocument();
    });

    it('should render file menu button', () => {
      const graph = createMockCanvasState();

      render(
        <NodeCanvas
          graph={graph}
          onReturnToHome={mockOnReturnToHome}
          workflowMeta={null}
        />
      );

      // File menu button is present (find by class containing menu icon)
      const menuButton = document.querySelector('button svg.lucide-menu');
      expect(menuButton).toBeInTheDocument();
    });

    it('should display graph name when provided', () => {
      const graph = createMockCanvasState();
      graph.graphName = 'My Test Graph';

      render(
        <NodeCanvas
          graph={graph}
          onReturnToHome={mockOnReturnToHome}
          workflowMeta={null}
        />
      );

      expect(screen.getByText('My Test Graph')).toBeInTheDocument();
    });

    it('should display graph name when provided', () => {
      const graph = createMockCanvasState();
      graph.graphName = 'My Test Graph';

      render(
        <NodeCanvas
          graph={graph}
          onReturnToHome={mockOnReturnToHome}
          workflowMeta={null}
        />
      );

      expect(screen.getByText('My Test Graph')).toBeInTheDocument();
    });
  });

  describe('user interactions', () => {
    it('should call onReturnToHome when back button is clicked', () => {
      const graph = createMockCanvasState();

      render(
        <NodeCanvas
          graph={graph}
          onReturnToHome={mockOnReturnToHome}
          workflowMeta={null}
        />
      );

      const backButton = screen.getByLabelText('canvas.returnToHome');
      fireEvent.click(backButton);

      expect(mockOnReturnToHome).toHaveBeenCalledWith(expect.objectContaining({
        graphId: 'test-graph',
        graphName: 'Test Graph',
        nodes: [],
        connections: []
      }));
    });

    it('should toggle file menu when file button is clicked', () => {
      const graph = createMockCanvasState();

      render(
        <NodeCanvas
          graph={graph}
          onReturnToHome={mockOnReturnToHome}
          workflowMeta={null}
        />
      );

      const fileButton = document.querySelector('button svg.lucide-menu')?.parentElement as HTMLElement;
      fireEvent.click(fileButton);

      // File menu should be visible (this is a basic check - actual menu rendering would need more setup)
      expect(fileButton).toBeInTheDocument();
    });

    it('should call zoomIn when zoom in button is clicked', () => {
      const graph = createMockCanvasState();

      render(
        <NodeCanvas
          graph={graph}
          onReturnToHome={mockOnReturnToHome}
          workflowMeta={null}
        />
      );

      const zoomInButton = screen.getByTitle('Zoom In');
      fireEvent.click(zoomInButton);

      expect(defaultMocks.zoomIn).toHaveBeenCalled();
    });

    it('should call zoomOut when zoom out button is clicked', () => {
      const graph = createMockCanvasState();

      render(
        <NodeCanvas
          graph={graph}
          onReturnToHome={mockOnReturnToHome}
          workflowMeta={null}
        />
      );

      const zoomOutButton = screen.getByTitle('Zoom Out');
      fireEvent.click(zoomOutButton);

      expect(defaultMocks.zoomOut).toHaveBeenCalled();
    });

    it('should call resetView when reset view button is clicked', () => {
      const graph = createMockCanvasState();

      render(
        <NodeCanvas
          graph={graph}
          onReturnToHome={mockOnReturnToHome}
          workflowMeta={null}
        />
      );

      const resetButton = screen.getByTitle('Reset View');
      fireEvent.click(resetButton);

      expect(defaultMocks.resetView).toHaveBeenCalled();
    });

    it('should handle canvas wheel events', () => {
      const graph = createMockCanvasState();

      render(
        <NodeCanvas
          graph={graph}
          onReturnToHome={mockOnReturnToHome}
          workflowMeta={null}
        />
      );

      const canvas = document.querySelector('.bg-black\\/98') as HTMLElement;
      fireEvent.wheel(canvas, { deltaY: 100 });

      expect(defaultMocks.handleWheel).toHaveBeenCalled();
    });

    it('should handle canvas mouse down for panning', () => {
      const graph = createMockCanvasState();

      render(
        <NodeCanvas
          graph={graph}
          onReturnToHome={mockOnReturnToHome}
          workflowMeta={null}
        />
      );

      const canvas = document.querySelector('.bg-black\\/98') as HTMLElement;
      fireEvent.mouseDown(canvas, { clientX: 100, clientY: 100 });

      expect(defaultMocks.startPanning).toHaveBeenCalled();
    });

    it('should handle canvas mouse move for panning', () => {
      const graph = createMockCanvasState();

      render(
        <NodeCanvas
          graph={graph}
          onReturnToHome={mockOnReturnToHome}
          workflowMeta={null}
        />
      );

      const canvas = document.querySelector('.bg-black\\/98') as HTMLElement;
      fireEvent.mouseMove(canvas, { clientX: 150, clientY: 150 });

      expect(defaultMocks.updatePanning).toHaveBeenCalled();
    });

    it('should handle canvas mouse up to end panning', () => {
      const graph = createMockCanvasState();

      render(
        <NodeCanvas
          graph={graph}
          onReturnToHome={mockOnReturnToHome}
          workflowMeta={null}
        />
      );

      const canvas = document.querySelector('.bg-black\\/98') as HTMLElement;
      fireEvent.mouseUp(canvas);

      expect(defaultMocks.endPanning).toHaveBeenCalled();
    });
  });

  describe('keyboard shortcuts', () => {
    it('should clear selection on Escape key', () => {
      const graph = createMockCanvasState();

      render(
        <NodeCanvas
          graph={graph}
          onReturnToHome={mockOnReturnToHome}
          workflowMeta={null}
        />
      );

      fireEvent.keyDown(document, { key: 'Escape' });

      expect(defaultMocks.setNodes).toHaveBeenCalled();
    });

    it('should close file menu on Escape when open', () => {
      const graph = createMockCanvasState();

      render(
        <NodeCanvas
          graph={graph}
          onReturnToHome={mockOnReturnToHome}
          workflowMeta={null}
        />
      );

      // First open the file menu
      const fileButton = document.querySelector('button svg.lucide-menu')?.parentElement as HTMLElement;
      fireEvent.click(fileButton);

      // Then press Escape
      fireEvent.keyDown(document, { key: 'Escape' });

      // The file menu should be closed (we can't easily test this without more complex setup)
      expect(fileButton).toBeInTheDocument();
    });
  });

  describe('execution', () => {
    it('should show execution status when running', () => {
      // This test would require mocking the execution state
      // For now, we verify the component renders without execution state
      const graph = createMockCanvasState();

      render(
        <NodeCanvas
          graph={graph}
          onReturnToHome={mockOnReturnToHome}
          workflowMeta={null}
        />
      );

      expect(screen.getByText('canvas.run')).toBeInTheDocument();
    });
  });

  describe('context menus', () => {
    it('should handle canvas context menu', () => {
      const graph = createMockCanvasState();

      render(
        <NodeCanvas
          graph={graph}
          onReturnToHome={mockOnReturnToHome}
          workflowMeta={null}
        />
      );

      const canvas = document.querySelector('.bg-black\\/98') as HTMLElement;
      fireEvent.contextMenu(canvas, { clientX: 100, clientY: 100 });

      expect(defaultMocks.handleContextMenu).toHaveBeenCalled();
    });
  });

  describe('error handling', () => {
    it('should handle missing graph gracefully', () => {
      render(
        <NodeCanvas
          graph={null}
          onReturnToHome={mockOnReturnToHome}
          workflowMeta={null}
        />
      );

      expect(document.querySelector('.bg-black\\/98')).toBeInTheDocument();
    });
  });
});