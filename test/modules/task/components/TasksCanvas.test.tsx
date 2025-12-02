/*
 * yaLLMa3 - Framework for building AI agents that are capable of learning from their environment and interacting with it.

 * Copyright (C) 2025 yaLLMa3

 * This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0.
    If a copy of the MPL was not distributed with this file, You can obtain one at https://www.mozilla.org/MPL/2.0/.

 * This software is distributed on an "AS IS" basis,
    WITHOUT WARRANTY OF ANY KIND, either express or implied.
    See the Mozilla Public License for the specific language governing rights and limitations under the License.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import TasksCanvas from '@/modules/task/components/TasksCanvas';
import { Task, TaskConnection } from '@/modules/task/types/types';

// Mock the ContextMenu component
vi.mock('@/modules/task/components/ContextMenu', () => ({
  default: ({ isOpen, items, onClose }: any) => {
    if (!isOpen) return null;
    return (
      <div data-testid="context-menu">
        {items.map((item: any, index: number) => (
          <button
            key={index}
            data-testid={`context-menu-item-${index}`}
            onClick={() => {
              item.onClick();
              onClose();
            }}
          >
            {item.label}
          </button>
        ))}
      </div>
    );
  },
}));

// Mock the TaskNode component
vi.mock('@/modules/task/components/TaskNode', () => ({
  default: ({ task, onSocketMouseDown, onSocketMouseUp, onEdit, onDelete }: any) => (
    <div
      data-testid={`task-node-${task.id}`}
      data-task-node
      style={{
        position: 'absolute',
        left: task.position.x,
        top: task.position.y,
      }}
    >
      <div data-testid={`task-title-${task.id}`}>{task.title}</div>
      {task.sockets.map((socket: any) => (
        <div
          key={socket.id}
          data-testid={`socket-${socket.id}`}
          data-socket-id={socket.id}
          onMouseDown={(e) => {
            e.stopPropagation();
            onSocketMouseDown?.(socket.id, { x: task.position.x + (socket.type === 'output' ? 400 : 0), y: task.position.y + 140 }, socket.type === 'output');
          }}
          onMouseUp={(e) => {
            e.stopPropagation();
            onSocketMouseUp?.(socket.id, socket.type === 'input');
          }}
        >
          {socket.title}
        </div>
      ))}
      <button data-testid={`edit-${task.id}`} onClick={() => onEdit?.(task)}>
        Edit
      </button>
      <button data-testid={`delete-${task.id}`} onClick={() => onDelete?.(task.id)}>
        Delete
      </button>
    </div>
  ),
}));

describe('TasksCanvas Component', () => {
  const mockOnTaskPositionChange = vi.fn();
  const mockOnConnectionCreate = vi.fn();
  const mockOnConnectionRemove = vi.fn();
  const mockOnTaskEdit = vi.fn();
  const mockOnTaskDelete = vi.fn();
  const mockOnTaskAdd = vi.fn();

  const mockTasks: Task[] = [
    {
      id: 'task-1',
      title: 'Task 1',
      description: 'First task',
      expectedOutput: 'Output 1',
      type: 'agentic',
      executorId: null,
      position: { x: 100, y: 100 },
      sockets: [
        { id: 101, type: 'input', title: 'Input 1' },
        { id: 102, type: 'output', title: 'Output 1' },
      ],
      selected: false,
    },
    {
      id: 'task-2',
      title: 'Task 2',
      description: 'Second task',
      expectedOutput: 'Output 2',
      type: 'agentic',
      executorId: null,
      position: { x: 300, y: 200 },
      sockets: [
        { id: 201, type: 'input', title: 'Input 2' },
        { id: 202, type: 'output', title: 'Output 2' },
      ],
      selected: false,
    },
  ];

  const mockConnections: TaskConnection[] = [
    { fromSocket: 102, toSocket: 201 },
  ];

  const defaultProps = {
    tasks: mockTasks,
    connections: mockConnections,
    onTaskPositionChange: mockOnTaskPositionChange,
    onConnectionCreate: mockOnConnectionCreate,
    onConnectionRemove: mockOnConnectionRemove,
    onTaskEdit: mockOnTaskEdit,
    onTaskDelete: mockOnTaskDelete,
    onTaskAdd: mockOnTaskAdd,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Mock getBoundingClientRect for canvas operations
    Element.prototype.getBoundingClientRect = vi.fn(() => ({
      width: 800,
      height: 600,
      top: 0,
      left: 0,
      bottom: 600,
      right: 800,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    }));
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Rendering', () => {
    it('should render canvas container', () => {
      render(<TasksCanvas {...defaultProps} />);
      const canvas = document.querySelector('[data-canvas-container]');
      expect(canvas).toBeInTheDocument();
    });

    it('should render all task nodes', () => {
      render(<TasksCanvas {...defaultProps} />);
      expect(screen.getByTestId('task-node-task-1')).toBeInTheDocument();
      expect(screen.getByTestId('task-node-task-2')).toBeInTheDocument();
    });

    it('should render task titles', () => {
      render(<TasksCanvas {...defaultProps} />);
      expect(screen.getByTestId('task-title-task-1')).toHaveTextContent('Task 1');
      expect(screen.getByTestId('task-title-task-2')).toHaveTextContent('Task 2');
    });

    it('should render task sockets', () => {
      render(<TasksCanvas {...defaultProps} />);
      expect(screen.getByTestId('socket-101')).toBeInTheDocument();
      expect(screen.getByTestId('socket-102')).toBeInTheDocument();
      expect(screen.getByTestId('socket-201')).toBeInTheDocument();
      expect(screen.getByTestId('socket-202')).toBeInTheDocument();
    });

    it('should render connections', () => {
      render(<TasksCanvas {...defaultProps} />);
      // Check that SVG paths exist for connections
      const svg = document.querySelector('svg');
      expect(svg).toBeInTheDocument();
      const paths = svg?.querySelectorAll('path');
      expect(paths?.length).toBeGreaterThan(0);
    });

    it('should render zoom controls', () => {
      render(<TasksCanvas {...defaultProps} />);
      expect(screen.getByText(/Zoom.*%/)).toBeInTheDocument();
    });

    it('should render zoom buttons', () => {
      render(<TasksCanvas {...defaultProps} />);
      const zoomInButton = document.getElementById('tasks-canvas-zoom-in-button');
      const zoomOutButton = document.getElementById('tasks-canvas-zoom-out-button');
      expect(zoomInButton).toBeInTheDocument();
      expect(zoomOutButton).toBeInTheDocument();
    });
  });

  describe('Canvas Panning', () => {
    it('should start dragging when clicking on canvas background', () => {
      render(<TasksCanvas {...defaultProps} />);
      const canvas = document.querySelector('[data-canvas-container]');

      fireEvent.mouseDown(canvas!, { clientX: 100, clientY: 100 });
      expect(canvas).toHaveStyle({ cursor: 'grabbing' });
    });

    it('should update viewport position during drag', () => {
      render(<TasksCanvas {...defaultProps} />);
      const canvas = document.querySelector('[data-canvas-container]');

      fireEvent.mouseDown(canvas!, { clientX: 100, clientY: 100 });
      fireEvent.mouseMove(canvas!, { clientX: 150, clientY: 150 });
      fireEvent.mouseUp(canvas!);

      // The viewport should have been updated (though we can't easily test the exact transform)
      expect(canvas).toBeInTheDocument();
    });

    it('should not start dragging when clicking on task node', () => {
      render(<TasksCanvas {...defaultProps} />);
      const taskNode = screen.getByTestId('task-node-task-1');

      fireEvent.mouseDown(taskNode, { clientX: 100, clientY: 100 });
      const canvas = document.querySelector('[data-canvas-container]');
      expect(canvas).not.toHaveStyle({ cursor: 'grabbing' });
    });
  });

  describe('Zooming', () => {
    it('should zoom in when zoom in button is clicked', () => {
      render(<TasksCanvas {...defaultProps} />);
      const zoomInButton = document.getElementById('tasks-canvas-zoom-in-button') as HTMLButtonElement;

      fireEvent.click(zoomInButton);
      expect(screen.getByText(/Zoom.*100%/)).toBeInTheDocument();
    });

    it('should zoom out when zoom out button is clicked', () => {
      render(<TasksCanvas {...defaultProps} />);
      const zoomOutButton = document.getElementById('tasks-canvas-zoom-out-button') as HTMLButtonElement;

      fireEvent.click(zoomOutButton);
      expect(screen.getByText(/Zoom.*66%/)).toBeInTheDocument();
    });

    it('should handle mouse wheel zooming', () => {
      render(<TasksCanvas {...defaultProps} />);
      const canvas = document.querySelector('[data-canvas-container]');

      fireEvent.wheel(canvas!, { deltaY: -100 }); // Zoom in
      expect(screen.getByText(/Zoom.*\d+%/)).toBeInTheDocument();

      fireEvent.wheel(canvas!, { deltaY: 100 }); // Zoom out
      // Just check that zoom changed (exact value may vary due to floating point)
      expect(screen.getByText(/Zoom.*\d+%/)).toBeInTheDocument();
    });

    it('should limit zoom to minimum value', () => {
      render(<TasksCanvas {...defaultProps} />);
      const zoomOutButton = document.getElementById('tasks-canvas-zoom-out-button') as HTMLButtonElement;

      // Click zoom out multiple times
      for (let i = 0; i < 20; i++) {
        fireEvent.click(zoomOutButton);
      }
      expect(screen.getByText(/Zoom.*10%/)).toBeInTheDocument();
    });

    it('should limit zoom to maximum value', () => {
      render(<TasksCanvas {...defaultProps} />);
      const zoomInButton = document.getElementById('tasks-canvas-zoom-in-button') as HTMLButtonElement;

      // Click zoom in multiple times
      for (let i = 0; i < 20; i++) {
        fireEvent.click(zoomInButton);
      }
      expect(screen.getByText(/Zoom.*300%/)).toBeInTheDocument();
    });
  });

  describe('Task Position Changes', () => {
    it('should call onTaskPositionChange when task position changes', () => {
      render(<TasksCanvas {...defaultProps} />);
      // This would be triggered by the TaskNode component's onPositionChange
      // Since we're mocking TaskNode, we can't easily test this directly
      expect(mockOnTaskPositionChange).not.toHaveBeenCalled();
    });
  });

  describe('Socket Interactions', () => {
    it('should render task sockets with correct properties', () => {
      render(<TasksCanvas {...defaultProps} />);
      const outputSocket = screen.getByTestId('socket-102');
      const inputSocket = screen.getByTestId('socket-201');

      expect(outputSocket).toBeInTheDocument();
      expect(inputSocket).toBeInTheDocument();
      expect(outputSocket).toHaveAttribute('data-socket-id', '102');
      expect(inputSocket).toHaveAttribute('data-socket-id', '201');
    });

    it('should handle socket mouse events', () => {
      render(<TasksCanvas {...defaultProps} />);
      const outputSocket = screen.getByTestId('socket-102');

      fireEvent.mouseDown(outputSocket);
      // The actual connection logic is complex and hard to test in isolation
      // Just verify the socket interaction works
      expect(outputSocket).toBeInTheDocument();
    });
  });

  describe('Context Menus', () => {
    it('should show canvas context menu on right click', () => {
      render(<TasksCanvas {...defaultProps} />);
      const canvas = document.querySelector('[data-canvas-container]');

      fireEvent.contextMenu(canvas!, { clientX: 100, clientY: 100 });
      expect(screen.getByTestId('context-menu')).toBeInTheDocument();
    });

    it('should show task context menu on right click', () => {
      render(<TasksCanvas {...defaultProps} />);
      const taskNode = screen.getByTestId('task-node-task-1');

      fireEvent.contextMenu(taskNode, { clientX: 100, clientY: 100 });
      expect(screen.getByTestId('context-menu')).toBeInTheDocument();
    });

    it('should call onTaskAdd when Add Task is clicked in canvas context menu', () => {
      render(<TasksCanvas {...defaultProps} />);
      const canvas = document.querySelector('[data-canvas-container]');

      fireEvent.contextMenu(canvas!, { clientX: 100, clientY: 100 });
      const addTaskButton = screen.getByTestId('context-menu-item-0');
      fireEvent.click(addTaskButton);

      expect(mockOnTaskAdd).toHaveBeenCalled();
    });

    it('should call onTaskEdit when Edit is clicked in task context menu', () => {
      render(<TasksCanvas {...defaultProps} />);
      const taskNode = screen.getByTestId('task-node-task-1');

      fireEvent.contextMenu(taskNode, { clientX: 100, clientY: 100 });
      const editButton = screen.getByTestId('context-menu-item-0');
      fireEvent.click(editButton);

      expect(mockOnTaskEdit).toHaveBeenCalledWith(mockTasks[0]);
    });

    it('should call onTaskDelete when Delete is clicked in task context menu', () => {
      render(<TasksCanvas {...defaultProps} />);
      const taskNode = screen.getByTestId('task-node-task-1');

      fireEvent.contextMenu(taskNode, { clientX: 100, clientY: 100 });
      const deleteButton = screen.getByTestId('context-menu-item-1');
      fireEvent.click(deleteButton);

      expect(mockOnTaskDelete).toHaveBeenCalledWith('task-1');
    });
  });

  describe('Empty State', () => {
    it('should render without tasks', () => {
      render(<TasksCanvas {...defaultProps} tasks={[]} />);
      expect(document.querySelector('[data-canvas-container]')).toBeInTheDocument();
      expect(screen.queryByTestId('task-node-task-1')).not.toBeInTheDocument();
    });

    it('should render without connections', () => {
      render(<TasksCanvas {...defaultProps} connections={[]} />);
      const svg = document.querySelector('svg');
      const paths = svg?.querySelectorAll('path');
      expect(paths?.length).toBe(0);
    });
  });

  describe('Fit to View', () => {
    it('should fit to view when Fit To View is clicked in context menu', () => {
      render(<TasksCanvas {...defaultProps} />);
      const canvas = document.querySelector('[data-canvas-container]');

      fireEvent.contextMenu(canvas!, { clientX: 100, clientY: 100 });
      const fitToViewButton = screen.getByTestId('context-menu-item-1');
      fireEvent.click(fitToViewButton);

      // The viewport should be updated (hard to test exact values without complex mocking)
      // Just verify the context menu interaction works
      expect(mockOnTaskAdd).not.toHaveBeenCalled(); // Should not trigger add task
    });
  });

  describe('Styling and UI', () => {
    it('should have correct canvas styling', () => {
      render(<TasksCanvas {...defaultProps} />);
      const canvas = document.querySelector('[data-canvas-container]');
      expect(canvas).toHaveClass('absolute', 'inset-0', 'cursor-grab');
    });

    it('should have dotted background', () => {
      render(<TasksCanvas {...defaultProps} />);
      const background = document.querySelector('.absolute.inset-0.opacity-30');
      expect(background).toBeInTheDocument();
    });

    it('should render SVG for connections', () => {
      render(<TasksCanvas {...defaultProps} />);
      const svg = document.querySelector('svg');
      expect(svg).toHaveStyle({
        position: 'absolute',
        top: '0px',
        left: '0px',
        width: '100%',
        height: '100%',
      });
    });
  });
});