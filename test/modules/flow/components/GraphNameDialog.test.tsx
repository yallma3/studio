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
import GraphNameDialog from '@/modules/flow/components/GraphNameDialog';

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'dialog.nameRequired': 'Name is required',
        'dialog.nameYourGraph': 'Name Your Graph',
        'dialog.graphName': 'Graph Name',
        'dialog.enterGraphName': 'Enter graph name',
        'dialog.cancel': 'Cancel',
        'dialog.save': 'Save',
      };
      return translations[key] || key;
    },
  }),
}));

describe('GraphNameDialog Component', () => {
  const mockOnClose = vi.fn();
  const mockOnSave = vi.fn();

  const defaultProps = {
    isOpen: true,
    initialName: '',
    onClose: mockOnClose,
    onSave: mockOnSave,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should not render when isOpen is false', () => {
      render(<GraphNameDialog {...defaultProps} isOpen={false} />);

      expect(screen.queryByText('Name Your Graph')).not.toBeInTheDocument();
    });

    it('should render when isOpen is true', () => {
      render(<GraphNameDialog {...defaultProps} />);

      expect(screen.getByText('Name Your Graph')).toBeInTheDocument();
      expect(screen.getByLabelText('Graph Name')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Enter graph name')).toBeInTheDocument();
      expect(screen.getByText('Cancel')).toBeInTheDocument();
      expect(screen.getByText('Save')).toBeInTheDocument();
    });

    it('should render with initial name', () => {
      render(<GraphNameDialog {...defaultProps} initialName="Test Graph" />);

      const input = screen.getByPlaceholderText('Enter graph name');
      expect(input).toHaveValue('Test Graph');
    });
  });

  describe('Form interactions', () => {
    it('should update input value when typing', () => {
      render(<GraphNameDialog {...defaultProps} />);

      const input = screen.getByPlaceholderText('Enter graph name');
      fireEvent.change(input, { target: { value: 'New Graph Name' } });

      expect(input).toHaveValue('New Graph Name');
    });

    it('should clear error when user starts typing after validation error', () => {
      render(<GraphNameDialog {...defaultProps} />);

      const input = screen.getByPlaceholderText('Enter graph name');
      const saveButton = screen.getByText('Save');

      // Submit empty form to trigger error
      fireEvent.click(saveButton);
      expect(screen.getByText('Name is required')).toBeInTheDocument();

      // Start typing
      fireEvent.change(input, { target: { value: 'a' } });
      expect(screen.queryByText('Name is required')).not.toBeInTheDocument();
    });
  });

  describe('Form submission', () => {
    it('should show error when submitting empty name', () => {
      render(<GraphNameDialog {...defaultProps} />);

      const saveButton = screen.getByText('Save');
      fireEvent.click(saveButton);

      expect(screen.getByText('Name is required')).toBeInTheDocument();
      expect(mockOnSave).not.toHaveBeenCalled();
    });

    it('should trim whitespace and call onSave with valid name', () => {
      render(<GraphNameDialog {...defaultProps} />);

      const input = screen.getByPlaceholderText('Enter graph name');
      const saveButton = screen.getByText('Save');

      fireEvent.change(input, { target: { value: '  Test Graph  ' } });
      fireEvent.click(saveButton);

      expect(mockOnSave).toHaveBeenCalledWith('Test Graph');
      expect(mockOnClose).not.toHaveBeenCalled();
    });

    it('should handle form submission via Enter key', () => {
      render(<GraphNameDialog {...defaultProps} />);

      const input = screen.getByPlaceholderText('Enter graph name');
      fireEvent.change(input, { target: { value: 'Test Graph' } });
      fireEvent.submit(input.closest('form')!);

      expect(mockOnSave).toHaveBeenCalledWith('Test Graph');
    });
  });

  describe('Dialog actions', () => {
    it('should call onClose when Cancel button is clicked', () => {
      render(<GraphNameDialog {...defaultProps} />);

      const cancelButton = screen.getByText('Cancel');
      fireEvent.click(cancelButton);

      expect(mockOnClose).toHaveBeenCalled();
      expect(mockOnSave).not.toHaveBeenCalled();
    });

    it('should call onClose when backdrop is clicked', () => {
      render(<GraphNameDialog {...defaultProps} />);

      const backdrop = screen.getByText('Name Your Graph').closest('.fixed');
      fireEvent.click(backdrop!);

      expect(mockOnClose).toHaveBeenCalled();
      expect(mockOnSave).not.toHaveBeenCalled();
    });

    it('should not call onClose when dialog content is clicked', () => {
      render(<GraphNameDialog {...defaultProps} />);

      const dialogContent = screen.getByText('Name Your Graph').closest('.bg-\\[\\#111\\]');
      fireEvent.click(dialogContent!);

      expect(mockOnClose).not.toHaveBeenCalled();
    });
  });

  describe('Focus management', () => {
    it('should focus input when dialog opens', async () => {
      render(<GraphNameDialog {...defaultProps} />);

      const input = screen.getByPlaceholderText('Enter graph name');
      await waitFor(() => {
        expect(input).toHaveFocus();
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper form labels', () => {
      render(<GraphNameDialog {...defaultProps} />);

      const input = screen.getByLabelText('Graph Name');
      expect(input).toBeInTheDocument();
      expect(input).toHaveAttribute('id', 'graph-name');
    });

    it('should have proper button types', () => {
      render(<GraphNameDialog {...defaultProps} />);

      const cancelButton = screen.getByText('Cancel');
      const saveButton = screen.getByText('Save');

      expect(cancelButton).toHaveAttribute('type', 'button');
      expect(saveButton).toHaveAttribute('type', 'submit');
    });
  });


});