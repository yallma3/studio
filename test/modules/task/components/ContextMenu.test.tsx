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
import ContextMenu, { ContextMenuItem } from '@/modules/task/components/ContextMenu';

describe('ContextMenu Component', () => {
  const mockOnClose = vi.fn();

  const mockItems: ContextMenuItem[] = [
    { label: 'Edit', onClick: vi.fn() },
    { label: 'Duplicate', onClick: vi.fn() },
    { label: 'Delete', onClick: vi.fn() },
  ];

  const defaultProps = {
    isOpen: true,
    position: { x: 100, y: 100 },
    items: mockItems,
    onClose: mockOnClose,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Mock window dimensions
    Object.defineProperty(window, 'innerWidth', { value: 1200, writable: true });
    Object.defineProperty(window, 'innerHeight', { value: 800, writable: true });
    // Mock getBoundingClientRect with default values
    const mockGetBoundingClientRect = vi.fn().mockReturnValue({
      width: 180,
      height: 100,
    });
    Object.defineProperty(HTMLElement.prototype, 'getBoundingClientRect', {
      value: mockGetBoundingClientRect,
      writable: true,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Rendering', () => {
    it('should not render when isOpen is false', () => {
      render(<ContextMenu {...defaultProps} isOpen={false} />);
      expect(screen.queryByText('Edit')).not.toBeInTheDocument();
    });

    it('should render menu when isOpen is true', () => {
      render(<ContextMenu {...defaultProps} />);
      expect(screen.getByText('Edit')).toBeInTheDocument();
      expect(screen.getByText('Duplicate')).toBeInTheDocument();
      expect(screen.getByText('Delete')).toBeInTheDocument();
    });

    it('should render all menu items', () => {
      render(<ContextMenu {...defaultProps} />);
      mockItems.forEach(item => {
        expect(screen.getByText(item.label)).toBeInTheDocument();
      });
    });
  });

  describe('Positioning', () => {
    it('should position menu at specified coordinates', () => {
      render(<ContextMenu {...defaultProps} position={{ x: 200, y: 150 }} />);
      const menu = document.querySelector('.fixed');
      expect(menu).toHaveStyle({ left: '200px', top: '150px' });
    });

    it('should adjust position when menu would go off-screen horizontally', () => {
      // Override the default mock for this test
      const mockGetBoundingClientRect = vi.fn().mockReturnValue({
        width: 200,
        height: 100,
      });
      Object.defineProperty(HTMLElement.prototype, 'getBoundingClientRect', {
        value: mockGetBoundingClientRect,
        writable: true,
      });

      render(<ContextMenu {...defaultProps} position={{ x: 1100, y: 100 }} />);
      const menu = document.querySelector('.fixed');
      // Should adjust to viewportWidth - width - 10 = 1200 - 200 - 10 = 990
      expect(menu).toHaveStyle({ left: '990px' });
    });

    it('should adjust position when menu would go off-screen vertically', () => {
      // Override the default mock for this test
      const mockGetBoundingClientRect = vi.fn().mockReturnValue({
        width: 180,
        height: 150,
      });
      Object.defineProperty(HTMLElement.prototype, 'getBoundingClientRect', {
        value: mockGetBoundingClientRect,
        writable: true,
      });

      render(<ContextMenu {...defaultProps} position={{ x: 100, y: 700 }} />);
      const menu = document.querySelector('.fixed');
      // Should adjust to viewportHeight - height - 10 = 800 - 150 - 10 = 640
      expect(menu).toHaveStyle({ left: '100px', top: '640px' });
    });

    it('should ensure minimum position of 10px', () => {
      render(<ContextMenu {...defaultProps} position={{ x: -50, y: -50 }} />);
      const menu = document.querySelector('.fixed');
      expect(menu).toHaveStyle({ left: '10px', top: '10px' });
    });
  });

  describe('Menu Items', () => {
    it('should call onClick and onClose when item is clicked', () => {
      const mockOnClick = vi.fn();
      const itemsWithClick = [{ label: 'Test', onClick: mockOnClick }];
      render(<ContextMenu {...defaultProps} items={itemsWithClick} />);

      fireEvent.click(screen.getByText('Test'));
      expect(mockOnClick).toHaveBeenCalled();
      expect(mockOnClose).toHaveBeenCalled();
    });

    it('should not call onClick when item is disabled', () => {
      const mockOnClick = vi.fn();
      const disabledItem = { label: 'Disabled', onClick: mockOnClick, disabled: true };
      render(<ContextMenu {...defaultProps} items={[disabledItem]} />);

      fireEvent.click(screen.getByText('Disabled'));
      expect(mockOnClick).not.toHaveBeenCalled();
      expect(mockOnClose).not.toHaveBeenCalled();
    });

    it('should render disabled items with correct styling', () => {
      const disabledItem = { label: 'Disabled', onClick: vi.fn(), disabled: true };
      render(<ContextMenu {...defaultProps} items={[disabledItem]} />);

      const button = screen.getByRole('button', { name: 'Disabled' });
      expect(button).toBeDisabled();
      expect(button.className).toContain('text-gray-500');
      expect(button.className).toContain('cursor-not-allowed');
    });

    it('should render enabled items with hover styling', () => {
      const enabledItem = { label: 'Enabled', onClick: vi.fn() };
      render(<ContextMenu {...defaultProps} items={[enabledItem]} />);

      const button = screen.getByRole('button', { name: 'Enabled' });
      expect(button).not.toBeDisabled();
      expect(button.className).toContain('hover:bg-[#222]');
      expect(button.className).toContain('cursor-pointer');
    });
  });

  describe('Special Item Styling', () => {
    it('should apply red styling to Delete items', () => {
      const deleteItem = { label: 'Delete', onClick: vi.fn() };
      render(<ContextMenu {...defaultProps} items={[deleteItem]} />);

      const button = screen.getByText('Delete');
      expect(button).toHaveStyle({ color: '#FF6B6B' });
    });

    it('should apply yellow styling to non-Delete items', () => {
      const normalItem = { label: 'Edit', onClick: vi.fn() };
      render(<ContextMenu {...defaultProps} items={[normalItem]} />);

      const button = screen.getByText('Edit');
      expect(button).toHaveStyle({ color: '#FFC72C' });
    });
  });

  describe('Icons', () => {
    it('should render icon when provided', () => {
      const itemWithIcon = {
        label: 'Icon Item',
        onClick: vi.fn(),
        icon: <span data-testid="test-icon">📝</span>
      };
      render(<ContextMenu {...defaultProps} items={[itemWithIcon]} />);

      expect(screen.getByTestId('test-icon')).toBeInTheDocument();
      expect(screen.getByText('📝')).toBeInTheDocument();
    });

    it('should apply correct color to icon for Delete items', () => {
      const deleteItemWithIcon = {
        label: 'Delete',
        onClick: vi.fn(),
        icon: <span data-testid="delete-icon">🗑️</span>
      };
      render(<ContextMenu {...defaultProps} items={[deleteItemWithIcon]} />);

      const icon = screen.getByTestId('delete-icon');
      expect(icon).toHaveStyle({ color: '#FF6B6B' });
    });

    it('should apply correct color to icon for non-Delete items', () => {
      const itemWithIcon = {
        label: 'Edit',
        onClick: vi.fn(),
        icon: <span data-testid="edit-icon">✏️</span>
      };
      render(<ContextMenu {...defaultProps} items={[itemWithIcon]} />);

      const icon = screen.getByTestId('edit-icon');
      expect(icon).toHaveStyle({ color: '#FFC72C' });
    });
  });

  describe('Separators', () => {
    it('should render separator when item has separator property', () => {
      const itemsWithSeparator = [
        { label: 'Item 1', onClick: vi.fn() },
        { label: '', onClick: vi.fn(), separator: true },
        { label: 'Item 2', onClick: vi.fn() },
      ];
      render(<ContextMenu {...defaultProps} items={itemsWithSeparator} />);

      const separators = document.querySelectorAll('.border-t');
      expect(separators).toHaveLength(1);
      expect(separators[0]).toHaveStyle({ borderColor: 'rgba(255, 199, 44, 0.15)' });
    });

    it('should not render label for separator items', () => {
      const separatorItem = { label: 'Should not show', onClick: vi.fn(), separator: true };
      render(<ContextMenu {...defaultProps} items={[separatorItem]} />);

      expect(screen.queryByText('Should not show')).not.toBeInTheDocument();
    });
  });

  describe('Event Handling', () => {
    it('should call onClose when clicking outside menu', () => {
      render(<ContextMenu {...defaultProps} />);
      fireEvent.mouseDown(document.body);
      expect(mockOnClose).toHaveBeenCalled();
    });

    it('should not call onClose when clicking inside menu', () => {
      render(<ContextMenu {...defaultProps} />);
      const menu = document.querySelector('.fixed');
      fireEvent.mouseDown(menu!);
      expect(mockOnClose).not.toHaveBeenCalled();
    });

    it('should call onClose when Escape key is pressed', () => {
      render(<ContextMenu {...defaultProps} />);
      fireEvent.keyDown(document, { key: 'Escape' });
      expect(mockOnClose).toHaveBeenCalled();
    });

    it('should not call onClose for other keys', () => {
      render(<ContextMenu {...defaultProps} />);
      fireEvent.keyDown(document, { key: 'Enter' });
      expect(mockOnClose).not.toHaveBeenCalled();
    });
  });

  describe('Styling', () => {
    it('should apply correct base styling to menu container', () => {
      render(<ContextMenu {...defaultProps} />);
      const menu = document.querySelector('.fixed');
      expect(menu).toHaveClass('z-50', 'py-1', 'min-w-[180px]');
      expect(menu).toHaveStyle({
        backgroundColor: 'rgba(17, 17, 17, 0.95)',
        borderRadius: '8px',
        boxShadow: '0 4px 15px rgba(0, 0, 0, 0.3)',
        borderLeft: '1px solid rgba(255, 199, 44, 0.2)',
        color: 'rgb(255, 255, 255)',
      });
    });

    it('should apply correct styling to menu items', () => {
      render(<ContextMenu {...defaultProps} />);
      const buttons = document.querySelectorAll('button');
      buttons.forEach(button => {
        expect(button).toHaveClass('w-full', 'text-left', 'px-3', 'py-2', 'text-sm', 'flex', 'items-center', 'gap-2');
      });
    });
  });
});