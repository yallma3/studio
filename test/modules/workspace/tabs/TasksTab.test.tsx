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
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import TasksTab from '@/modules/workspace/tabs/TasksTab';
import { WorkspaceData } from '@/modules/workspace/types/Types';

// Mock the components
vi.mock('@/modules/task/components/TasksCanvas', () => ({
  default: ({
    tasks,
    connections,
    onTaskPositionChange,
    onConnectionCreate,
    onConnectionRemove,
    onTaskEdit,
    onTaskDelete,
    onTaskAdd,
  }: any) => (
    <div data-testid="tasks-canvas">
      <div data-testid="tasks-data">{JSON.stringify(tasks)}</div>
      <div data-testid="connections-data">{JSON.stringify(connections)}</div>
      <button
        data-testid="add-task-btn"
        onClick={() => onTaskAdd({ x: 50, y: 50 })}
      >
        Add Task
      </button>
      <button
        data-testid="edit-task-btn"
        onClick={() => onTaskEdit(tasks[0])}
      >
        Edit Task
      </button>
      <button
        data-testid="delete-task-btn"
        onClick={() => onTaskDelete(tasks[0]?.id)}
      >
        Delete Task
      </button>
      <button
        data-testid="position-change-btn"
        onClick={() => onTaskPositionChange(tasks[0]?.id, { x: 100, y: 100 })}
      >
        Change Position
      </button>
      <button
        data-testid="create-connection-btn"
        onClick={() => onConnectionCreate({ fromSocket: 1, toSocket: 2 })}
      >
        Create Connection
      </button>
      <button
        data-testid="remove-connection-btn"
        onClick={() => onConnectionRemove(connections[0])}
      >
        Remove Connection
      </button>
    </div>
  ),
}));

vi.mock('@/modules/task/components/TaskModal', () => ({
  default: ({ isOpen, onClose, onSave, task, title, tasksCount, agents, workflows }: any) => (
    <div data-testid="task-modal" style={{ display: isOpen ? 'block' : 'none' }}>
      <div data-testid="modal-title">{title}</div>
      <div data-testid="modal-task">{JSON.stringify(task)}</div>
      <div data-testid="modal-tasks-count">{tasksCount}</div>
      <div data-testid="modal-agents">{JSON.stringify(agents)}</div>
      <div data-testid="modal-workflows">{JSON.stringify(workflows)}</div>
      <button data-testid="modal-save-btn" onClick={() => onSave({
        title: 'Test Task',
        description: 'Test description',
        expectedOutput: 'Expected output',
        type: 'agentic',
        executorId: 'test-agent',
        sockets: [],
      })}>
        Save
      </button>
      <button data-testid="modal-close-btn" onClick={onClose}>
        Close
      </button>
    </div>
  ),
}));

describe('TasksTab', () => {
  const mockWorkspaceData: WorkspaceData = {
    id: 'test-workspace',
    createdAt: 1234567890123,
    updatedAt: 1234567890123,
    name: 'Test Workspace',
    description: 'Test Description',
    mainLLM: {
      provider: 'OpenAI',
      model: { name: 'GPT-4', id: 'gpt-4' },
    },
    apiKey: 'test-api-key',
    useSavedCredentials: false,
    tasks: [
      {
        id: 'task-1',
        title: 'Test Task 1',
        description: 'Test task description',
        expectedOutput: 'Expected output',
        type: 'agentic',
        executorId: 'test-agent',
        position: { x: 100, y: 100 },
        selected: false,
        sockets: [{ id: 1, title: 'Output', type: 'output' }],
      },
    ],
    connections: [
      {
        fromSocket: 1,
        toSocket: 2,
      },
    ],
    agents: [
      {
        id: 'agent-1',
        name: 'Test Agent',
        role: 'Test Role',
        objective: 'Test objective',
        background: 'Test background',
        capabilities: 'Test capabilities',
        tools: [],
        llm: {
          provider: 'OpenAI',
          model: { name: 'GPT-4', id: 'gpt-4' },
        },
        apiKey: 'test-key',
        variables: {},
      },
    ],
    workflows: [
      {
        id: 'workflow-1',
        name: 'Test Workflow',
        description: 'Test workflow description',
      },
    ],
    mcpTools: [],
  };

  const mockOnChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders TasksCanvas and TaskModal components', () => {
    render(<TasksTab workspaceData={mockWorkspaceData} onChange={mockOnChange} />);

    expect(screen.getByTestId('tasks-canvas')).toBeInTheDocument();
    expect(screen.getByTestId('task-modal')).toBeInTheDocument();
  });

  it('initializes with workspace data', () => {
    render(<TasksTab workspaceData={mockWorkspaceData} onChange={mockOnChange} />);

    const tasksData = screen.getByTestId('tasks-data');
    const connectionsData = screen.getByTestId('connections-data');

    expect(JSON.parse(tasksData.textContent || '[]')).toEqual(mockWorkspaceData.tasks);
    expect(JSON.parse(connectionsData.textContent || '[]')).toEqual(mockWorkspaceData.connections);
  });

  it('opens modal for adding new task', () => {
    render(<TasksTab workspaceData={mockWorkspaceData} onChange={mockOnChange} />);

    const addButton = screen.getByTestId('add-task-btn');
    fireEvent.click(addButton);

    expect(screen.getByTestId('task-modal')).toBeVisible();
    expect(screen.getByTestId('modal-title')).toHaveTextContent('Add New Task');
    expect(screen.getByTestId('modal-task')).toHaveTextContent('null');
  });

  it('opens modal for editing existing task', () => {
    render(<TasksTab workspaceData={mockWorkspaceData} onChange={mockOnChange} />);

    const editButton = screen.getByTestId('edit-task-btn');
    fireEvent.click(editButton);

    expect(screen.getByTestId('task-modal')).toBeVisible();
    expect(screen.getByTestId('modal-title')).toHaveTextContent('Edit Task');
    expect(screen.getByTestId('modal-task')).toHaveTextContent(JSON.stringify(mockWorkspaceData.tasks[0]));
  });

  it('saves new task', async () => {
    render(<TasksTab workspaceData={mockWorkspaceData} onChange={mockOnChange} />);

    // Open modal for new task
    const addButton = screen.getByTestId('add-task-btn');
    fireEvent.click(addButton);

    // Save the task
    const saveButton = screen.getByTestId('modal-save-btn');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(mockOnChange).toHaveBeenCalledWith({
        tasks: expect.arrayContaining([
          expect.objectContaining({
            title: 'Test Task',
            type: 'agentic',
            executorId: 'test-agent',
            description: 'Test description',
            expectedOutput: 'Expected output',
            position: { x: 50, y: 50 }, // From the add button click
          }),
        ]),
        connections: mockWorkspaceData.connections,
      });
    });
  });

  it('saves edited task', async () => {
    render(<TasksTab workspaceData={mockWorkspaceData} onChange={mockOnChange} />);

    // Open modal for editing
    const editButton = screen.getByTestId('edit-task-btn');
    fireEvent.click(editButton);

    // Save the task
    const saveButton = screen.getByTestId('modal-save-btn');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(mockOnChange).toHaveBeenCalledWith({
        tasks: expect.arrayContaining([
          expect.objectContaining({
            id: 'task-1',
            title: 'Test Task',
            type: 'agentic',
            executorId: 'test-agent',
            description: 'Test description',
            expectedOutput: 'Expected output',
          }),
        ]),
        connections: mockWorkspaceData.connections,
      });
    });
  });

  it('deletes task and associated connections', async () => {
    render(<TasksTab workspaceData={mockWorkspaceData} onChange={mockOnChange} />);

    const deleteButton = screen.getByTestId('delete-task-btn');
    fireEvent.click(deleteButton);

    await waitFor(() => {
      expect(mockOnChange).toHaveBeenCalledWith({
        tasks: [],
        connections: [], // Should be empty since socket1 is removed
      });
    });
  });

  it('handles task position change', async () => {
    render(<TasksTab workspaceData={mockWorkspaceData} onChange={mockOnChange} />);

    const positionButton = screen.getByTestId('position-change-btn');
    fireEvent.click(positionButton);

    await waitFor(() => {
      expect(mockOnChange).toHaveBeenCalledWith({
        tasks: expect.arrayContaining([
          expect.objectContaining({
            id: 'task-1',
            position: { x: 100, y: 100 },
          }),
        ]),
        connections: mockWorkspaceData.connections,
      });
    });
  });

  it('handles connection creation', async () => {
    render(<TasksTab workspaceData={mockWorkspaceData} onChange={mockOnChange} />);

    const createButton = screen.getByTestId('create-connection-btn');
    fireEvent.click(createButton);

    await waitFor(() => {
      expect(mockOnChange).toHaveBeenCalledWith({
        tasks: mockWorkspaceData.tasks,
        connections: expect.arrayContaining([
          mockWorkspaceData.connections[0],
          { fromSocket: 1, toSocket: 2 },
        ]),
      });
    });
  });

  it('handles connection removal', async () => {
    render(<TasksTab workspaceData={mockWorkspaceData} onChange={mockOnChange} />);

    const removeButton = screen.getByTestId('remove-connection-btn');
    fireEvent.click(removeButton);

    await waitFor(() => {
      expect(mockOnChange).toHaveBeenCalledWith({
        tasks: mockWorkspaceData.tasks,
        connections: [],
      });
    });
  });

  it('closes modal when requested', () => {
    render(<TasksTab workspaceData={mockWorkspaceData} onChange={mockOnChange} />);

    // Open modal
    const addButton = screen.getByTestId('add-task-btn');
    fireEvent.click(addButton);

    expect(screen.getByTestId('task-modal')).toBeVisible();

    // Close modal
    const closeButton = screen.getByTestId('modal-close-btn');
    fireEvent.click(closeButton);

    expect(screen.getByTestId('task-modal')).not.toBeVisible();
  });

  it('passes correct props to TaskModal', () => {
    render(<TasksTab workspaceData={mockWorkspaceData} onChange={mockOnChange} />);

    // Open modal for new task
    const addButton = screen.getByTestId('add-task-btn');
    fireEvent.click(addButton);

    expect(screen.getByTestId('modal-tasks-count')).toHaveTextContent('1');
    expect(screen.getByTestId('modal-agents')).toHaveTextContent(JSON.stringify(mockWorkspaceData.agents));
    expect(screen.getByTestId('modal-workflows')).toHaveTextContent(JSON.stringify(mockWorkspaceData.workflows));
  });

  it('does not call onChange on initial mount', () => {
    render(<TasksTab workspaceData={mockWorkspaceData} onChange={mockOnChange} />);

    expect(mockOnChange).not.toHaveBeenCalled();
  });
});