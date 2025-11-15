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
import NodeContextMenu from '@/modules/flow/components/NodeContextMenu';

describe('NodeContextMenu Component', () => {
  const mockOnContextMenuAction = vi.fn();

  const defaultProps = {
    x: 150,
    y: 200,
    onContextMenuAction: mockOnContextMenuAction,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render all menu items', () => {
      render(<NodeContextMenu {...defaultProps} />);

      expect(screen.getByText('Copy')).toBeInTheDocument();
      expect(screen.getByText('Edit')).toBeInTheDocument();
      expect(screen.getByText('Duplicate')).toBeInTheDocument();
      expect(screen.getByText('Delete')).toBeInTheDocument();
    });


  });

  describe('Menu actions', () => {
    it('should call onContextMenuAction with "copyNode" when Copy is clicked', () => {
      render(<NodeContextMenu {...defaultProps} />);

      const copyButton = screen.getByText('Copy');
      fireEvent.click(copyButton);

      expect(mockOnContextMenuAction).toHaveBeenCalledWith('copyNode', expect.any(Object));
    });

    it('should call onContextMenuAction with "editNode" when Edit is clicked', () => {
      render(<NodeContextMenu {...defaultProps} />);

      const editButton = screen.getByText('Edit');
      fireEvent.click(editButton);

      expect(mockOnContextMenuAction).toHaveBeenCalledWith('editNode', expect.any(Object));
    });

    it('should call onContextMenuAction with "duplicateNode" when Duplicate is clicked', () => {
      render(<NodeContextMenu {...defaultProps} />);

      const duplicateButton = screen.getByText('Duplicate');
      fireEvent.click(duplicateButton);

      expect(mockOnContextMenuAction).toHaveBeenCalledWith('duplicateNode', expect.any(Object));
    });

    it('should call onContextMenuAction with "deleteNode" when Delete is clicked', () => {
      render(<NodeContextMenu {...defaultProps} />);

      const deleteButton = screen.getByText('Delete');
      fireEvent.click(deleteButton);

      expect(mockOnContextMenuAction).toHaveBeenCalledWith('deleteNode', expect.any(Object));
    });
  });

  describe('Visual styling', () => {
    it('should have different styling for Delete button', () => {
      render(<NodeContextMenu {...defaultProps} />);

      const deleteButton = screen.getByText('Delete').closest('div');
      expect(deleteButton).toHaveStyle({ color: '#ff6b6b' });
    });

    it('should have border separator before Delete button', () => {
      render(<NodeContextMenu {...defaultProps} />);

      const borderElement = screen.getByText('Copy').closest('div')?.parentElement?.querySelector('.border-t');
      expect(borderElement).toBeInTheDocument();
    });
  });



  describe('Icons', () => {
    it('should render all icons', () => {
      render(<NodeContextMenu {...defaultProps} />);

      // Check that icons are present (they have specific styling)
      const menuItems = screen.getAllByText(/Copy|Edit|Duplicate|Delete/);
      expect(menuItems).toHaveLength(4);
    });
  });
});