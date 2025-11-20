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
import NodeEditPanel from '@/modules/flow/components/NodeEditPanel';
import { BaseNode, Socket } from '@/modules/flow/types/NodeTypes';

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'nodeEditPanel.title': 'Node Edit Panel',
        'nodeEditPanel.nodeTitle': 'Node Title',
        'nodeEditPanel.socketInfo': 'Socket Information',
        'nodeEditPanel.input': 'Input',
        'nodeEditPanel.output': 'Output',
        'nodeEditPanel.id': 'ID',
        'nodeEditPanel.textValuePlaceholder': 'Text value...',
        'nodeEditPanel.true': 'TRUE',
        'nodeEditPanel.false': 'FALSE',
        'nodeEditPanel.valueLabels.default': 'Value',
        'nodeEditPanel.valueLabels.string': 'Text',
        'nodeEditPanel.valueLabels.number': 'Number',
        'nodeEditPanel.valueLabels.boolean': 'Boolean',
        'nodeEditPanel.valueLabels.text': 'Text Area',
        'common.close': 'Close',
      };
      return translations[key] || key;
    },
    i18n: {
      language: 'en',
    },
  }),
}));

// Mock NodeTypes functions
vi.mock('@/modules/flow/types/NodeTypes', async () => {
  const actual = await vi.importActual('@/modules/flow/types/NodeTypes');
  return {
    ...actual,
    getConfigParameters: vi.fn(() => []),
    setConfigParameter: vi.fn(),
  };
});

describe('NodeEditPanel Component', () => {
  const mockOnClose = vi.fn();
  const mockOnSave = vi.fn();

  const mockSocket: Socket = {
    id: 1,
    title: 'Test Input',
    type: 'input',
    nodeId: 1,
    dataType: 'string',
  };

  const mockNode: BaseNode = {
    id: 1,
    category: 'Test',
    title: 'Test Node',
    nodeType: 'TextNode',
    nodeValue: 'test value',
    x: 100,
    y: 100,
    width: 200,
    height: 100,
    sockets: [mockSocket],
  };

  const defaultProps = {
    node: mockNode,
    onClose: mockOnClose,
    onSave: mockOnSave,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should not render when node is null', () => {
      render(<NodeEditPanel {...defaultProps} node={null} />);

      expect(screen.queryByText('Node Edit Panel')).not.toBeInTheDocument();
    });

    it('should render when node is provided', () => {
      render(<NodeEditPanel {...defaultProps} />);

      expect(screen.getByText('Node Edit Panel')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Test Node')).toBeInTheDocument();
      expect(screen.getByText('TextNode')).toBeInTheDocument();
      expect(screen.getByText('ID: 1')).toBeInTheDocument();
    });

    it('should render node title input', () => {
      render(<NodeEditPanel {...defaultProps} />);

      const titleInput = screen.getByLabelText('Node Title');
      expect(titleInput).toHaveValue('Test Node');
    });

    it('should render socket information', () => {
      render(<NodeEditPanel {...defaultProps} />);

      expect(screen.getByText('Socket Information')).toBeInTheDocument();
      expect(screen.getByText('Test Input')).toBeInTheDocument();
      expect(screen.getByText('Input')).toBeInTheDocument();
      expect(screen.getByText('- string')).toBeInTheDocument();
    });
  });

  describe('Panel interactions', () => {
    it('should call onClose when close button is clicked', async () => {
      render(<NodeEditPanel {...defaultProps} />);

      const closeButton = screen.getByLabelText('Close');
      fireEvent.click(closeButton);

      // Wait for animation timeout
      await waitFor(() => {
        expect(mockOnClose).toHaveBeenCalled();
      }, { timeout: 400 });
    });

    it('should update node title when input changes', () => {
      render(<NodeEditPanel {...defaultProps} />);

      const titleInput = screen.getByLabelText('Node Title');
      fireEvent.change(titleInput, { target: { value: 'Updated Title' } });

      expect(titleInput).toHaveValue('Updated Title');
    });


  });

  describe('Click outside behavior', () => {
    it('should call onClose when clicking outside the panel', async () => {
      render(<NodeEditPanel {...defaultProps} />);

      // Click on the document body (outside the panel)
      fireEvent.mouseDown(document.body);

      // Wait for animation timeout
      await waitFor(() => {
        expect(mockOnClose).toHaveBeenCalled();
      }, { timeout: 400 });
    });

    it('should not call onClose when clicking inside the panel', () => {
      render(<NodeEditPanel {...defaultProps} />);

      const panel = screen.getByText('Node Edit Panel').closest('div');
      fireEvent.mouseDown(panel!);

      expect(mockOnClose).not.toHaveBeenCalled();
    });
  });

  describe('Animation', () => {
    it('should have slide-in animation when visible', async () => {
      render(<NodeEditPanel {...defaultProps} />);

      const panel = screen.getByText('Node Edit Panel').closest('.fixed');
      await waitFor(() => {
        expect(panel).toHaveStyle({ transform: 'translateX(0)' });
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      render(<NodeEditPanel {...defaultProps} />);

      expect(screen.getByLabelText('Close')).toBeInTheDocument();
      expect(screen.getByLabelText('Node Title')).toBeInTheDocument();
    });

    it('should have proper input IDs', () => {
      render(<NodeEditPanel {...defaultProps} />);

      const titleInput = screen.getByLabelText('Node Title');
      expect(titleInput).toHaveAttribute('id', 'node-title-input');
    });
  });



  describe('Socket display', () => {
    it('should display input sockets with blue indicator', () => {
      render(<NodeEditPanel {...defaultProps} />);

      const socketIndicator = screen.getByText('Test Input').previousElementSibling;
      expect(socketIndicator).toHaveClass('bg-blue-400');
    });

    it('should display output sockets with yellow indicator', () => {
      const outputSocket: Socket = {
        ...mockSocket,
        type: 'output',
        title: 'Test Output',
      };

      const nodeWithOutput = {
        ...mockNode,
        sockets: [outputSocket],
      };

      render(<NodeEditPanel {...defaultProps} node={nodeWithOutput} />);

      const socketIndicator = screen.getByText('Test Output').previousElementSibling;
      expect(socketIndicator).toHaveClass('bg-[#FFC72C]');
    });
  });
});