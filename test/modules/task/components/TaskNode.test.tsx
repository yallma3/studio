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
import TaskNode from '@/modules/task/components/TaskNode';
import { Task } from '@/modules/task/types/types';

describe('TaskNode Component', () => {
  const mockOnPositionChange = vi.fn();
  const mockOnSocketMouseDown = vi.fn();
  const mockOnSocketMouseUp = vi.fn();
  const mockOnEdit = vi.fn();
  const mockOnDelete = vi.fn();

  const mockTask: Task = {
    id: 'task-1',
    title: 'Test Task',
    description: 'A test task',
    expectedOutput: 'Expected output',
    type: 'agentic',
    executorId: 'agent-1',
    position: { x: 100, y: 100 },
    sockets: [
      { id: 1, type: 'input', title: 'Input 1' },
      { id: 2, type: 'output', title: 'Output 1' },
    ],
    selected: false,
  };

  const defaultProps = {
    task: mockTask,
    connections: [],
    onPositionChange: mockOnPositionChange,
    onSocketMouseDown: mockOnSocketMouseDown,
    onSocketMouseUp: mockOnSocketMouseUp,
    onEdit: mockOnEdit,
    onDelete: mockOnDelete,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render task title', () => {
    render(<TaskNode {...defaultProps} />);
    expect(screen.getByText('Test Task')).toBeInTheDocument();
  });

  it('should render task description', () => {
    render(<TaskNode {...defaultProps} />);
    expect(screen.getByText('A test task')).toBeInTheDocument();
  });

  it('should render input sockets', () => {
    render(<TaskNode {...defaultProps} />);
    const inputSocket = document.querySelector('[data-socket-id="1"]');
    expect(inputSocket).toBeInTheDocument();
    expect(inputSocket).toHaveAttribute('title', 'Input 1');
  });

  it('should render output sockets', () => {
    render(<TaskNode {...defaultProps} />);
    const outputSocket = document.querySelector('[data-socket-id="2"]');
    expect(outputSocket).toBeInTheDocument();
    expect(outputSocket).toHaveAttribute('title', 'Output 1');
  });

  it('should show edit button', () => {
    render(<TaskNode {...defaultProps} />);
    const editButton = document.querySelector('svg'); // Edit icon
    expect(editButton).toBeInTheDocument();
  });

  it('should call onEdit when edit button is clicked', () => {
    render(<TaskNode {...defaultProps} />);
    const editButton = document.querySelector('svg');
    if (editButton) {
      fireEvent.click(editButton);
      expect(mockOnEdit).toHaveBeenCalledWith(mockTask);
    }
  });
});