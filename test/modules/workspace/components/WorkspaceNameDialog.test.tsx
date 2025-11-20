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
import WorkspaceNameDialog from '@/modules/workspace/components/WorkspaceNameDialog';

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: vi.fn(() => ({
    t: (key: string) => key,
  })),
}));

describe('WorkspaceNameDialog Component', () => {
  const mockOnClose = vi.fn();
  const mockOnSave = vi.fn();

  const defaultProps = {
    isOpen: true,
    initialName: 'Test Workspace',
    onClose: mockOnClose,
    onSave: mockOnSave,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should not render when isOpen is false', () => {
    const { container } = render(
      <WorkspaceNameDialog {...defaultProps} isOpen={false} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('should render dialog when isOpen is true', () => {
    render(<WorkspaceNameDialog {...defaultProps} />);
    expect(screen.getByText('workspaces.saveWorkspace')).toBeInTheDocument();
    expect(screen.getByLabelText('workspaces.workspaceName')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Test Workspace')).toBeInTheDocument();
  });

  it('should set initial name correctly', () => {
    render(<WorkspaceNameDialog {...defaultProps} initialName="My Workspace" />);
    expect(screen.getByDisplayValue('My Workspace')).toBeInTheDocument();
  });

  it('should update name when input changes', () => {
    render(<WorkspaceNameDialog {...defaultProps} />);
    const input = screen.getByDisplayValue('Test Workspace');
    fireEvent.change(input, { target: { value: 'New Workspace Name' } });
    expect(input).toHaveValue('New Workspace Name');
  });

  it('should call onSave with trimmed name when form is submitted', () => {
    render(<WorkspaceNameDialog {...defaultProps} />);
    const input = screen.getByDisplayValue('Test Workspace');
    const saveButton = screen.getByText('common.save');

    fireEvent.change(input, { target: { value: '  New Name  ' } });
    fireEvent.click(saveButton);

    expect(mockOnSave).toHaveBeenCalledWith('New Name');
    expect(mockOnSave).toHaveBeenCalledTimes(1);
  });

  it('should call onClose when cancel button is clicked', () => {
    render(<WorkspaceNameDialog {...defaultProps} />);
    const cancelButton = screen.getByText('common.cancel');
    fireEvent.click(cancelButton);
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('should call onClose when close button is clicked', () => {
    render(<WorkspaceNameDialog {...defaultProps} />);
    // Find the close button by its position (first button in header)
    const header = screen.getByText('workspaces.saveWorkspace').closest('div');
    const closeButton = header?.querySelector('button');
    expect(closeButton).toBeInTheDocument();
    fireEvent.click(closeButton!);
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('should disable save button when name is empty', () => {
    render(<WorkspaceNameDialog {...defaultProps} initialName="" />);
    const saveButton = screen.getByText('common.save');
    expect(saveButton).toBeDisabled();
  });

  it('should disable save button when name is only whitespace', () => {
    render(<WorkspaceNameDialog {...defaultProps} initialName="   " />);
    const saveButton = screen.getByText('common.save');
    expect(saveButton).toBeDisabled();
  });

  it('should enable save button when name has content', () => {
    render(<WorkspaceNameDialog {...defaultProps} initialName="Valid Name" />);
    const saveButton = screen.getByText('common.save');
    expect(saveButton).not.toBeDisabled();
  });

  it('should prevent form submission when name is empty', () => {
    render(<WorkspaceNameDialog {...defaultProps} initialName="" />);
    const form = document.querySelector('form');
    expect(form).toBeInTheDocument();
    fireEvent.submit(form!);
    expect(mockOnSave).not.toHaveBeenCalled();
  });

  it('should handle Enter key submission', () => {
    render(<WorkspaceNameDialog {...defaultProps} />);
    const input = screen.getByDisplayValue('Test Workspace');
    fireEvent.change(input, { target: { value: 'Submitted Name' } });
    const form = document.querySelector('form');
    expect(form).toBeInTheDocument();
    fireEvent.submit(form!);
    expect(mockOnSave).toHaveBeenCalledWith('Submitted Name');
  });
});