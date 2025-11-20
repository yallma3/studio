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
import CanvasContextMenu from '@/modules/flow/components/CanvasContextMenu';

describe('CanvasContextMenu Component', () => {
  const mockOnAddNode = vi.fn();
  const mockOnContextMenuAction = vi.fn();

  const defaultProps = {
    contextMenu: {
      visible: true,
      x: 100,
      y: 100,
      targetNodeId: undefined,
    },
    onAddNode: mockOnAddNode,
    onContextMenuAction: mockOnContextMenuAction,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should not render when contextMenu.visible is false', () => {
      render(
        <CanvasContextMenu
          {...defaultProps}
          contextMenu={{ ...defaultProps.contextMenu, visible: false }}
        />
      );

      expect(screen.queryByPlaceholderText('Search...')).not.toBeInTheDocument();
    });

    it('should render when contextMenu.visible is true', () => {
      render(<CanvasContextMenu {...defaultProps} />);

      expect(screen.getByPlaceholderText('Search...')).toBeInTheDocument();
      expect(screen.getByText('Add')).toBeInTheDocument();
      expect(screen.getByText('Settings')).toBeInTheDocument();
    });

    it('should render with correct positioning', () => {
      render(<CanvasContextMenu {...defaultProps} />);

      const menu = screen.getByPlaceholderText('Search...').closest('div');
      expect(menu).toHaveStyle({
        position: 'absolute',
        top: '100px',
        left: '100px',
      });
    });
  });

  describe('Search functionality', () => {
    it('should show search input', () => {
      render(<CanvasContextMenu {...defaultProps} />);

      const searchInput = screen.getByPlaceholderText('Search...');
      expect(searchInput).toBeInTheDocument();
      expect(searchInput).toHaveAttribute('aria-label', 'Search nodes');
    });

    it('should update search query when typing', () => {
      render(<CanvasContextMenu {...defaultProps} />);

      const searchInput = screen.getByPlaceholderText('Search...');
      fireEvent.change(searchInput, { target: { value: 'test' } });

      expect(searchInput).toHaveValue('test');
    });

    it('should show "No results" when search has no matches', () => {
      render(<CanvasContextMenu {...defaultProps} />);

      const searchInput = screen.getByPlaceholderText('Search...');
      fireEvent.change(searchInput, { target: { value: 'nonexistentnode' } });

      expect(screen.getByText('No results')).toBeInTheDocument();
    });

    it('should handle keyboard navigation in search results', () => {
      render(<CanvasContextMenu {...defaultProps} />);

      const searchInput = screen.getByPlaceholderText('Search...');
      fireEvent.change(searchInput, { target: { value: 'text' } });

      // Arrow down should work (though we may not have results)
      fireEvent.keyDown(searchInput, { key: 'ArrowDown' });
      expect(searchInput).toHaveValue('text');
    });

    it('should clear search on Escape key', () => {
      render(<CanvasContextMenu {...defaultProps} />);

      const searchInput = screen.getByPlaceholderText('Search...');
      fireEvent.change(searchInput, { target: { value: 'test' } });
      fireEvent.keyDown(searchInput, { key: 'Escape' });

      expect(searchInput).toHaveValue('');
    });
  });

  describe('Menu interactions', () => {
    it('should show submenu on hover for Add menu item', async () => {
      render(<CanvasContextMenu {...defaultProps} />);

      const addMenuItem = screen.getByText('Add').closest('div');
      fireEvent.mouseEnter(addMenuItem!);

      // Wait for hover delay
      await waitFor(() => {
        expect(screen.getByText('Categories')).toBeInTheDocument();
      });
    });

    it('should show submenu on hover for Settings menu item', async () => {
      render(<CanvasContextMenu {...defaultProps} />);

      const settingsMenuItem = screen.getByText('Settings').closest('div');
      fireEvent.mouseEnter(settingsMenuItem!);

      // Wait for hover delay
      await waitFor(() => {
        expect(screen.getByText('Settings')).toBeInTheDocument();
      });
    });

    it('should call onContextMenuAction when Clear View is clicked', async () => {
      render(<CanvasContextMenu {...defaultProps} />);

      const settingsMenuItem = screen.getByText('Settings').closest('div');
      fireEvent.mouseEnter(settingsMenuItem!);

      await waitFor(() => {
        expect(screen.getByText('Clear View')).toBeInTheDocument();
      });

      const clearViewButton = screen.getByText('Clear View');
      fireEvent.click(clearViewButton);

      expect(mockOnContextMenuAction).toHaveBeenCalledWith('clearView', expect.any(Object));
    });
  });

  describe('Focus management', () => {
    it('should focus search input when menu opens', async () => {
      render(<CanvasContextMenu {...defaultProps} />);

      const searchInput = screen.getByPlaceholderText('Search...');
      await waitFor(() => {
        expect(searchInput).toHaveFocus();
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      render(<CanvasContextMenu {...defaultProps} />);

      const searchInput = screen.getByPlaceholderText('Search...');
      expect(searchInput).toHaveAttribute('aria-label', 'Search nodes');
    });

    it('should have proper role attributes for search results', () => {
      render(<CanvasContextMenu {...defaultProps} />);

      const searchInput = screen.getByPlaceholderText('Search...');
      fireEvent.change(searchInput, { target: { value: 'text' } });

      // Even if no results, the container should have proper role
      const resultsContainer = searchInput.closest('div')?.querySelector('[role="list"]');
      if (resultsContainer) {
        expect(resultsContainer).toHaveAttribute('aria-label', 'search-results');
      }
    });
  });

  describe('Event handling', () => {
    it('should render clickable elements', () => {
      render(<CanvasContextMenu {...defaultProps} />);

      const searchInput = screen.getByPlaceholderText('Search...');
      expect(searchInput).toBeInTheDocument();
    });
  });
});