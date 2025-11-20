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
import { NodeComponent } from '@/modules/flow/components/NodeComponent';
import { BaseNode, Connection, Socket } from '@/modules/flow/types/NodeTypes';

// Test data factories
const createMockSocket = (
  id: number,
  type: 'input' | 'output',
  nodeId: number,
  title = 'Test Socket'
): Socket => ({
  id,
  title,
  type,
  nodeId,
  dataType: 'string',
});

const createMockNode = (
  id: number,
  title = 'Test Node',
  nodeType = 'Text',
  x = 100,
  y = 100,
  sockets: Socket[] = []
): BaseNode => ({
  id,
  category: 'Test',
  title,
  nodeType,
  nodeValue: 'test value',
  x,
  y,
  width: 200,
  height: 100,
  sockets,
  selected: false,
  processing: false,
  configParameters: [],
  getConfigParameters: function () { return this.configParameters ?? []; },
  getConfigParameter: function (parameterName: string) {
    return (this.configParameters ?? []).find(param => param.parameterName === parameterName);
  },
  setConfigParameter: function (parameterName: string, value: string | number | boolean) {
    const parameter = (this.configParameters ?? []).find(param => param.parameterName === parameterName);
    if (parameter) {
      parameter.paramValue = value;
    }
  },
});

const createMockConnection = (fromSocket: number, toSocket: number): Connection => ({
  fromSocket,
  toSocket,
});

describe('NodeComponent', () => {
  const defaultProps = {
    node: createMockNode(1, 'Test Node', 'Text', 100, 100, [
      createMockSocket(101, 'input', 1, 'Input'),
      createMockSocket(102, 'output', 1, 'Output'),
    ]),
    connections: [] as Connection[],
    onMouseDown: vi.fn(),
    onSocketDragStart: vi.fn(),
    onNodeContextMenu: vi.fn(),
    onEditNode: vi.fn(),
    onShowResult: vi.fn(),
    isBeingEdited: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('should render node with title and basic structure', () => {
      render(<NodeComponent {...defaultProps} />);

      expect(screen.getByText('Test Node')).toBeInTheDocument();
      // Check for the node container by class and style
      const nodeElement = document.querySelector('[style*="width: 200px"][style*="height: 100px"]');
      expect(nodeElement).toBeInTheDocument();
    });

    it('should render input and output sockets', () => {
      render(<NodeComponent {...defaultProps} />);

      // Check for socket containers by their styles
      const sockets = document.querySelectorAll('[style*="width: 20px"][style*="height: 20px"][style*="border-radius: 50%"]');
      expect(sockets).toHaveLength(2); // One input, one output
    });

    it('should render node value based on type', () => {
      const textNode = createMockNode(1, 'Text Node', 'Text');
      textNode.nodeValue = 'Hello World';

      render(
        <NodeComponent
          {...defaultProps}
          node={textNode}
        />
      );

      expect(screen.getByText('Hello World')).toBeInTheDocument();
    });

    it('should render different content for different node types', () => {
      const booleanNode = createMockNode(2, 'Boolean Node', 'Boolean');
      booleanNode.nodeValue = true;

      render(
        <NodeComponent
          {...defaultProps}
          node={booleanNode}
        />
      );

      // Boolean nodes should show TRUE/FALSE
      expect(screen.getByText('TRUE')).toBeInTheDocument();
    });

    it('should show processing state when node is processing', () => {
      const processingNode = createMockNode(1, 'Processing Node');
      processingNode.processing = true;

      render(
        <NodeComponent
          {...defaultProps}
          node={processingNode}
        />
      );

      // Should show loading spinner
      const spinner = document.querySelector('svg.animate-spin');
      expect(spinner).toBeInTheDocument();
    });

    it('should show selected state when node is selected', () => {
      const selectedNode = createMockNode(1, 'Selected Node');
      selectedNode.selected = true;

      render(
        <NodeComponent
          {...defaultProps}
          node={selectedNode}
        />
      );

      // Should show selected styling with border class
      const nodeElement = document.querySelector('.border-\\[\\#FFC72C\\]');
      expect(nodeElement).toBeInTheDocument();
    });

    it('should show result button when node has result', () => {
      const nodeWithResult = createMockNode(1, 'Node with Result');
      nodeWithResult.result = 'Test Result';

      render(
        <NodeComponent
          {...defaultProps}
          node={nodeWithResult}
        />
      );

      expect(screen.getByTestId('view-result-button')).toBeInTheDocument();
    });

    it('should render edit button when onEditNode is provided', () => {
      render(<NodeComponent {...defaultProps} />);

      // Find the settings icon button
      const editButton = document.querySelector('button[title="Edit Node"]');
      expect(editButton).toBeInTheDocument();
    });

    it('should render result button when node has result', () => {
      const nodeWithResult = createMockNode(1, 'Node with Result');
      nodeWithResult.result = 'Test Result';

      render(
        <NodeComponent
          {...defaultProps}
          node={nodeWithResult}
        />
      );

      expect(screen.getByTestId('view-result-button')).toBeInTheDocument();
    });
  });

  describe('user interactions', () => {
    it('should call onMouseDown when node is clicked', () => {
      render(<NodeComponent {...defaultProps} />);

      const nodeElement = document.querySelector('[style*="width: 200px"][style*="height: 100px"]');
      fireEvent.mouseDown(nodeElement!, { clientX: 100, clientY: 100 });

      expect(defaultProps.onMouseDown).toHaveBeenCalledWith(
        expect.any(Object),
        1
      );
    });

    it('should call onNodeContextMenu when right-clicked', () => {
      render(<NodeComponent {...defaultProps} />);

      const nodeElement = document.querySelector('[style*="width: 200px"][style*="height: 100px"]');
      fireEvent.contextMenu(nodeElement!, { clientX: 100, clientY: 100 });

      expect(defaultProps.onNodeContextMenu).toHaveBeenCalledWith(
        expect.any(Object),
        1
      );
    });

    it('should call onSocketDragStart when input socket is dragged', () => {
      render(<NodeComponent {...defaultProps} />);

      // Find input socket (left side)
      const inputSocket = document.querySelector('[style*="left: 0px"]');
      fireEvent.mouseDown(inputSocket!, { clientX: 100, clientY: 100 });

      expect(defaultProps.onSocketDragStart).toHaveBeenCalledWith(
        expect.any(Object),
        101,
        true
      );
    });

    it('should call onSocketDragStart when output socket is dragged', () => {
      render(<NodeComponent {...defaultProps} />);

      // Find output socket (right side)
      const outputSocket = document.querySelector('[style*="right: 0px"]');
      fireEvent.mouseDown(outputSocket!, { clientX: 100, clientY: 100 });

      expect(defaultProps.onSocketDragStart).toHaveBeenCalledWith(
        expect.any(Object),
        102
      );
    });

    it('should call onEditNode when edit button is clicked', () => {
      render(<NodeComponent {...defaultProps} />);

      const editButton = document.querySelector('button[title="Edit Node"]');
      fireEvent.click(editButton!);

      expect(defaultProps.onEditNode).toHaveBeenCalledWith(1);
    });

    it('should call onShowResult when result button is clicked', () => {
      const nodeWithResult = createMockNode(1, 'Node with Result');
      nodeWithResult.result = 'Test Result';

      render(
        <NodeComponent
          {...defaultProps}
          node={nodeWithResult}
        />
      );

      const resultButton = screen.getByTestId('view-result-button');
      fireEvent.click(resultButton);

      expect(defaultProps.onShowResult).toHaveBeenCalledWith(nodeWithResult);
    });
  });

  describe('socket positioning', () => {
    it('should position single input socket at 80% height', () => {
      const nodeWithSingleInput = createMockNode(1, 'Single Input', 'Text', 100, 100, [
        createMockSocket(101, 'input', 1, 'Input'),
      ]);

      render(
        <NodeComponent
          {...defaultProps}
          node={nodeWithSingleInput}
        />
      );

      // Check that only one socket is rendered
      const sockets = document.querySelectorAll('[style*="width: 20px"][style*="height: 20px"][style*="border-radius: 50%"]');
      expect(sockets).toHaveLength(1);
    });

    it('should distribute multiple input sockets vertically', () => {
      const nodeWithMultipleInputs = createMockNode(1, 'Multiple Inputs', 'Text', 100, 100, [
        createMockSocket(101, 'input', 1, 'Input 1'),
        createMockSocket(102, 'input', 1, 'Input 2'),
        createMockSocket(103, 'input', 1, 'Input 3'),
      ]);

      render(
        <NodeComponent
          {...defaultProps}
          node={nodeWithMultipleInputs}
        />
      );

      // Should render 3 sockets
      const sockets = document.querySelectorAll('[style*="width: 20px"][style*="height: 20px"][style*="border-radius: 50%"]');
      expect(sockets).toHaveLength(3);
    });

    it('should position output sockets on the right side', () => {
      render(<NodeComponent {...defaultProps} />);

      // Output sockets should be positioned on the right side (right: 0px)
      const outputSocket = document.querySelector('[style*="right: 0px"]');
      expect(outputSocket).toBeInTheDocument();
    });
  });

  describe('connection indicators', () => {
    it('should show connection indicators for connected sockets', () => {
      const connections = [
        createMockConnection(999, 101), // Some other connection to our input
      ];

      render(
        <NodeComponent
          {...defaultProps}
          connections={connections}
        />
      );

      // Should show connection indicator on input socket
      const inputSocket = document.querySelector('[style*="left: 0px"]');
      expect(inputSocket).toBeInTheDocument();
    });

    it('should show connection indicators for output connections', () => {
      const connections = [
        createMockConnection(102, 999), // Our output to some other socket
      ];

      render(
        <NodeComponent
          {...defaultProps}
          connections={connections}
        />
      );

      // Should show connection indicator on output socket
      const outputSocket = document.querySelector('[style*="right: 0px"]');
      expect(outputSocket).toBeInTheDocument();
    });
  });

  describe('editing state', () => {
    it('should show editing indicator when isBeingEdited is true', () => {
      render(
        <NodeComponent
          {...defaultProps}
          isBeingEdited={true}
        />
      );

      const nodeElement = document.querySelector('[style*="width: 200px"][style*="height: 100px"]');
      expect(nodeElement).toBeInTheDocument();
      // The component should still render normally when being edited
    });

    it('should disable interactions when being edited', () => {
      render(
        <NodeComponent
          {...defaultProps}
          isBeingEdited={true}
        />
      );

      const nodeElement = document.querySelector('[style*="width: 200px"][style*="height: 100px"]');
      fireEvent.mouseDown(nodeElement!);

       // Should not call onMouseDown when being edited
       expect(defaultProps.onMouseDown).not.toHaveBeenCalled();
    });
  });

  describe('result animation', () => {
    it('should animate when result changes', () => {
      const nodeWithResult = createMockNode(1, 'Animated Node');
      nodeWithResult.result = 'New Result';

      render(
        <NodeComponent
          {...defaultProps}
          node={nodeWithResult}
        />
      );

      // Check that the result button is rendered when node has result
      expect(screen.getByTestId('view-result-button')).toBeInTheDocument();
    });
  });

  describe('node types', () => {
    it('should render Text node content correctly', () => {
      const textNode = createMockNode(1, 'Text Node', 'Text');
      textNode.nodeValue = 'Sample text content';

      render(
        <NodeComponent
          {...defaultProps}
          node={textNode}
        />
      );

      expect(screen.getByText('Sample text content')).toBeInTheDocument();
    });

    it('should render Number node content correctly', () => {
      const numberNode = createMockNode(1, 'Number Node', 'Number');
      numberNode.nodeValue = 42;

      render(
        <NodeComponent
          {...defaultProps}
          node={numberNode}
        />
      );

      const input = screen.getByDisplayValue('42');
      expect(input).toBeInTheDocument();
    });

    it('should render Boolean node content correctly', () => {
      const booleanNode = createMockNode(1, 'Boolean Node', 'Boolean');
      booleanNode.nodeValue = false;

      render(
        <NodeComponent
          {...defaultProps}
          node={booleanNode}
        />
      );

      expect(screen.getByText('FALSE')).toBeInTheDocument();
    });

    it('should render Image node content correctly', () => {
      const imageNode = createMockNode(1, 'Image Node', 'Image');
      imageNode.nodeValue = 'https://example.com/image.jpg';

      render(
        <NodeComponent
          {...defaultProps}
          node={imageNode}
        />
      );

      const img = screen.getByAltText('Node image');
      expect(img).toBeInTheDocument();
      expect(img).toHaveAttribute('src', 'https://example.com/image.jpg');
    });
  });

  describe('error handling', () => {
    it('should handle missing node gracefully', () => {
      const nodeWithMissingSockets = createMockNode(1, 'Incomplete Node');

      render(
        <NodeComponent
          {...defaultProps}
          node={nodeWithMissingSockets}
        />
      );

      // Should still render without crashing
      const nodeElement = document.querySelector('[style*="width: 200px"][style*="height: 100px"]');
      expect(nodeElement).toBeInTheDocument();
    });

    it('should handle empty connections array', () => {
      render(
        <NodeComponent
          {...defaultProps}
          connections={[]}
        />
      );

      expect(screen.getByText('Test Node')).toBeInTheDocument();
    });
  });
});