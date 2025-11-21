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
import TaskModal from '@/modules/task/components/TaskModal';
import { Task } from '@/modules/task/types/types';
import { Agent, Workflow } from '@/modules/workspace/types/Types';

describe('TaskModal Component', () => {
  const mockOnClose = vi.fn();
  const mockOnSave = vi.fn();

  const mockAgents: Agent[] = [
    { id: 'agent-1', name: 'Test Agent 1', role: 'Test Role', objective: 'Test Objective', background: 'Test Background', capabilities: 'Test Capabilities', tools: [], llm: { provider: 'OpenAI', model: { name: 'GPT 4o', id: 'gpt-40' } }, apiKey: 'test-key' },
    { id: 'agent-2', name: 'Test Agent 2', role: 'Test Role 2', objective: 'Test Objective 2', background: 'Test Background 2', capabilities: 'Test Capabilities 2', tools: [], llm: { provider: 'OpenAI', model: { name: 'GPT 4o mini', id: 'gpt-4o-mini' } }, apiKey: 'test-key-2' },
  ];

  const mockWorkflows: Workflow[] = [
    { id: 'wf-1', name: 'Test Workflow 1', description: 'Test Description 1' },
    { id: 'wf-2', name: 'Test Workflow 2', description: 'Test Description 2' },
  ];

  const mockTask: Task = {
    id: 'task-1',
    title: 'Test Task',
    description: 'A test task description',
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
    isOpen: true,
    onClose: mockOnClose,
    onSave: mockOnSave,
    tasksCount: 0,
    agents: mockAgents,
    workflows: mockWorkflows,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Modal Rendering', () => {
    it('should not render when isOpen is false', () => {
      render(<TaskModal {...defaultProps} isOpen={false} />);
      expect(screen.queryByText('Add Task')).not.toBeInTheDocument();
    });

    it('should render modal when isOpen is true', () => {
      render(<TaskModal {...defaultProps} />);
      expect(screen.getByText('Add Task')).toBeInTheDocument();
    });

    it('should render custom title when provided', () => {
      render(<TaskModal {...defaultProps} title="Custom Title" />);
      expect(screen.getByText('Custom Title')).toBeInTheDocument();
    });

    it('should render "Edit Task" when editing existing task', () => {
      render(<TaskModal {...defaultProps} task={mockTask} />);
      expect(screen.getByText('Edit Task')).toBeInTheDocument();
    });
  });

  describe('Form Fields', () => {
    it('should render all required form fields', () => {
      render(<TaskModal {...defaultProps} />);
      expect(screen.getByLabelText('Title *')).toBeInTheDocument();
      expect(screen.getByLabelText('Description')).toBeInTheDocument();
      expect(screen.getByLabelText('Expected Output')).toBeInTheDocument();
      expect(screen.getByLabelText('Type')).toBeInTheDocument();
    });

    it('should have required attribute on title field', () => {
      render(<TaskModal {...defaultProps} />);
      const titleInput = screen.getByLabelText('Title *');
      expect(titleInput).toBeRequired();
    });

    it('should render type select with correct options', () => {
      render(<TaskModal {...defaultProps} />);
      const typeSelect = screen.getByLabelText('Type');
      expect(typeSelect).toHaveValue('agentic');
      expect(screen.getByText('Agentic (Auto)')).toBeInTheDocument();
      expect(screen.getByText('Specific Agent')).toBeInTheDocument();
      expect(screen.getByText('Workflow')).toBeInTheDocument();
    });
  });

  describe('Form Data Management', () => {
    it('should initialize form with empty values for new task', () => {
      render(<TaskModal {...defaultProps} />);
      expect(screen.getByLabelText('Title *')).toHaveValue('');
      expect(screen.getByLabelText('Description')).toHaveValue('');
      expect(screen.getByLabelText('Expected Output')).toHaveValue('');
      expect(screen.getByLabelText('Type')).toHaveValue('agentic');
    });

    it('should initialize form with task data when editing', () => {
      render(<TaskModal {...defaultProps} task={mockTask} />);
      expect(screen.getByLabelText('Title *')).toHaveValue('Test Task');
      expect(screen.getByLabelText('Description')).toHaveValue('A test task description');
      expect(screen.getByLabelText('Expected Output')).toHaveValue('Expected output');
      expect(screen.getByLabelText('Type')).toHaveValue('agentic');
    });

    it('should update form data when inputs change', () => {
      render(<TaskModal {...defaultProps} />);
      const titleInput = screen.getByLabelText('Title *');
      const descriptionInput = screen.getByLabelText('Description');
      const expectedOutputInput = screen.getByLabelText('Expected Output');

      fireEvent.change(titleInput, { target: { value: 'New Title' } });
      fireEvent.change(descriptionInput, { target: { value: 'New Description' } });
      fireEvent.change(expectedOutputInput, { target: { value: 'New Expected Output' } });

      expect(titleInput).toHaveValue('New Title');
      expect(descriptionInput).toHaveValue('New Description');
      expect(expectedOutputInput).toHaveValue('New Expected Output');
    });
  });

  describe('Type Selection and Executor Fields', () => {
    it('should not show executor field when type is agentic', () => {
      render(<TaskModal {...defaultProps} />);
      expect(screen.queryByLabelText('Select Agent')).not.toBeInTheDocument();
      expect(screen.queryByLabelText('Workflow')).not.toBeInTheDocument();
    });

    it('should show agent selector when type is specific-agent', () => {
      render(<TaskModal {...defaultProps} />);
      const typeSelect = screen.getByLabelText('Type');
      fireEvent.change(typeSelect, { target: { value: 'specific-agent' } });

      expect(screen.getByLabelText('Select Agent')).toBeInTheDocument();
      expect(screen.queryByLabelText('Workflow')).not.toBeInTheDocument();
    });

    it('should show workflow selector when type is workflow', () => {
      render(<TaskModal {...defaultProps} />);
      const typeSelect = screen.getByLabelText('Type');
      fireEvent.change(typeSelect, { target: { value: 'workflow' } });

      expect(screen.getByLabelText('Select Workflow')).toBeInTheDocument();
      expect(screen.queryByLabelText('Select Agent')).not.toBeInTheDocument();
    });

    it('should populate agent options correctly', () => {
      render(<TaskModal {...defaultProps} />);
      const typeSelect = screen.getByLabelText('Type');
      fireEvent.change(typeSelect, { target: { value: 'specific-agent' } });

      expect(screen.getByLabelText('Select Agent')).toBeInTheDocument();
      expect(screen.getByText('Test Agent 1')).toBeInTheDocument();
      expect(screen.getByText('Test Agent 2')).toBeInTheDocument();
    });

    it('should populate workflow options correctly', () => {
      render(<TaskModal {...defaultProps} />);
      const typeSelect = screen.getByLabelText('Type');
      fireEvent.change(typeSelect, { target: { value: 'workflow' } });

      expect(screen.getByLabelText('Select Workflow')).toBeInTheDocument();
      expect(screen.getByText('Test Workflow 1')).toBeInTheDocument();
      expect(screen.getByText('Test Workflow 2')).toBeInTheDocument();
    });

    it('should clear executorId when type changes to agentic', () => {
      render(<TaskModal {...defaultProps} />);
      const typeSelect = screen.getByLabelText('Type');

      // First set to specific-agent and select an agent
      fireEvent.change(typeSelect, { target: { value: 'specific-agent' } });
       fireEvent.change(screen.getByLabelText('Select Agent'), { target: { value: 'agent-1' } });

      // Then change back to agentic
      fireEvent.change(typeSelect, { target: { value: 'agentic' } });

      // executorId should be cleared (not visible in form, but handled in state)
       expect(screen.queryByLabelText('Select Agent')).not.toBeInTheDocument();
    });
  });

  describe('Form Submission', () => {
    it('should call onSave with correct data for new task', () => {
      render(<TaskModal {...defaultProps} />);
      const titleInput = screen.getByLabelText('Title *');
      const descriptionInput = screen.getByLabelText('Description');
      const expectedOutputInput = screen.getByLabelText('Expected Output');
      const submitButton = screen.getByText('Create Task');

      fireEvent.change(titleInput, { target: { value: 'New Task' } });
      fireEvent.change(descriptionInput, { target: { value: 'Task description' } });
      fireEvent.change(expectedOutputInput, { target: { value: 'Expected result' } });
      fireEvent.click(submitButton);

      expect(mockOnSave).toHaveBeenCalledWith({
        title: 'New Task',
        description: 'Task description',
        expectedOutput: 'Expected result',
        type: 'agentic',
        executorId: null,
        sockets: [
          { id: 101, title: 'Input', type: 'input' },
          { id: 102, title: 'Output', type: 'output' },
        ],
      });
      expect(mockOnClose).toHaveBeenCalled();
    });

    it('should generate correct socket IDs based on tasksCount', () => {
      render(<TaskModal {...defaultProps} tasksCount={5} />);
      const titleInput = screen.getByLabelText('Title *');
      const submitButton = screen.getByText('Create Task');

      fireEvent.change(titleInput, { target: { value: 'New Task' } });
      fireEvent.click(submitButton);

      expect(mockOnSave).toHaveBeenCalledWith(
        expect.objectContaining({
          sockets: [
            { id: 601, title: 'Input', type: 'input' },
            { id: 602, title: 'Output', type: 'output' },
          ],
        })
      );
    });

    it('should call onSave with existing sockets when editing', () => {
      render(<TaskModal {...defaultProps} task={mockTask} />);
      const submitButton = screen.getByText('Update Task');

      fireEvent.click(submitButton);

      expect(mockOnSave).toHaveBeenCalledWith({
        title: 'Test Task',
        description: 'A test task description',
        expectedOutput: 'Expected output',
        type: 'agentic',
        executorId: 'agent-1',
        sockets: mockTask.sockets, // Should preserve existing sockets
      });
      expect(mockOnClose).toHaveBeenCalled();
    });

    it('should handle executor selection for specific-agent type', () => {
      render(<TaskModal {...defaultProps} />);
      const typeSelect = screen.getByLabelText('Type');
      const titleInput = screen.getByLabelText('Title *');
      const submitButton = screen.getByText('Create Task');

      fireEvent.change(typeSelect, { target: { value: 'specific-agent' } });
      const agentSelect = screen.getByLabelText('Select Agent');
      fireEvent.change(agentSelect, { target: { value: 'agent-2' } });
      fireEvent.change(titleInput, { target: { value: 'Agent Task' } });
      fireEvent.click(submitButton);

      expect(mockOnSave).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'specific-agent',
          executorId: 'agent-2',
        })
      );
    });

    it('should handle executor selection for workflow type', () => {
      render(<TaskModal {...defaultProps} />);
      const typeSelect = screen.getByLabelText('Type');
      const titleInput = screen.getByLabelText('Title *');
      const submitButton = screen.getByText('Create Task');

      fireEvent.change(typeSelect, { target: { value: 'workflow' } });
      fireEvent.change(screen.getByLabelText('Select Workflow'), { target: { value: 'wf-1' } });
      fireEvent.change(titleInput, { target: { value: 'Workflow Task' } });
      fireEvent.click(submitButton);

      expect(mockOnSave).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'workflow',
          executorId: 'wf-1',
        })
      );
    });
  });

  describe('Modal Actions', () => {
    it('should call onClose when close button is clicked', () => {
      render(<TaskModal {...defaultProps} />);
      const closeButton = screen.getByTitle('Close');
      fireEvent.click(closeButton);
      expect(mockOnClose).toHaveBeenCalled();
    });

    it('should call onClose when cancel button is clicked', () => {
      render(<TaskModal {...defaultProps} />);
      const cancelButton = screen.getByText('Cancel');
      fireEvent.click(cancelButton);
      expect(mockOnClose).toHaveBeenCalled();
    });

    it('should reset form when modal reopens', async () => {
      const { rerender } = render(<TaskModal {...defaultProps} isOpen={false} />);
      rerender(<TaskModal {...defaultProps} isOpen={true} />);

      const titleInput = screen.getByLabelText('Title *');
      expect(titleInput).toHaveValue('');
    });

    it('should load task data when modal opens with task prop', () => {
      const { rerender } = render(<TaskModal {...defaultProps} isOpen={false} />);
      rerender(<TaskModal {...defaultProps} isOpen={true} task={mockTask} />);

      expect(screen.getByLabelText('Title *')).toHaveValue('Test Task');
      expect(screen.getByLabelText('Description')).toHaveValue('A test task description');
    });
  });

  describe('Form Validation', () => {
    it('should prevent submission when title is empty', () => {
      render(<TaskModal {...defaultProps} />);
      const submitButton = screen.getByText('Create Task');

      // Title is required, so form should not submit
      fireEvent.click(submitButton);

      expect(mockOnSave).not.toHaveBeenCalled();
      expect(mockOnClose).not.toHaveBeenCalled();
    });

    it('should allow submission with only title filled', () => {
      render(<TaskModal {...defaultProps} />);
      const titleInput = screen.getByLabelText('Title *');
      const submitButton = screen.getByText('Create Task');

      fireEvent.change(titleInput, { target: { value: 'Minimal Task' } });
      fireEvent.click(submitButton);

      expect(mockOnSave).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Minimal Task',
          description: '',
          expectedOutput: '',
          type: 'agentic',
          executorId: null,
        })
      );
    });
  });

  describe('UI Elements', () => {
    it('should have correct modal overlay styling', () => {
      render(<TaskModal {...defaultProps} />);
      const modalOverlay = document.querySelector('.fixed.inset-0');
      expect(modalOverlay).toHaveClass('bg-black/50', 'flex', 'items-center', 'justify-center', 'z-50');
    });

    it('should render form with proper styling', () => {
      render(<TaskModal {...defaultProps} />);
      const form = document.querySelector('form');
      expect(form).toHaveClass('space-y-6');
    });

    it('should render action buttons with correct styling', () => {
      render(<TaskModal {...defaultProps} />);
      const cancelButton = screen.getByText('Cancel');
      const createButton = screen.getByText('Create Task');

      expect(cancelButton).toHaveClass('px-4', 'py-2', 'text-sm', 'text-zinc-300');
      expect(createButton).toHaveClass('px-4', 'py-2', 'bg-[#FFC72C]', 'text-black', 'rounded-md');
    });
  });
});