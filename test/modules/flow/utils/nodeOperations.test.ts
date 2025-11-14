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
import { duplicateNode, updateNodeSelection } from '@/modules/flow/utils/nodeOperations';
import { BaseNode, Socket, createNode } from '@/modules/flow/types/NodeTypes';

// Mock createNode function
vi.mock('@/modules/flow/types/NodeTypes', async () => {
  const actual = await vi.importActual('@/modules/flow/types/NodeTypes');
  return {
    ...actual,
    createNode: vi.fn(),
  };
});

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
  nodeType = 'Generic',
  x = 100,
  y = 100,
  selected = false
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
  sockets: [createMockSocket(id * 100 + 1, 'input', id), createMockSocket(id * 100 + 2, 'output', id)],
  selected,
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

describe('duplicateNode', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should create a duplicate node with new ID and offset position', () => {
    const originalNode = createMockNode(1, 'Original Node', 'Generic', 50, 50);
    const newId = 2;
    const expectedPosition = { x: 80, y: 80 }; // 50 + 30 offset

    const duplicatedNode = createMockNode(newId, 'Original Node', 'Generic', expectedPosition.x, expectedPosition.y);
    duplicatedNode.nodeValue = originalNode.nodeValue;

    (createNode as any).mockReturnValue(duplicatedNode);

    const result = duplicateNode(originalNode, newId);

    expect(createNode).toHaveBeenCalledWith(newId, expectedPosition, originalNode, true);
    expect(result).toEqual(duplicatedNode);
    expect(result?.title).toBe(originalNode.title);
    expect(result?.nodeValue).toBe(originalNode.nodeValue);
  });

  it('should use custom position offset when provided', () => {
    const originalNode = createMockNode(1, 'Original Node', 'Generic', 100, 100);
    const newId = 3;
    const customOffset = { x: 50, y: 25 };
    const expectedPosition = { x: 150, y: 125 };

    const duplicatedNode = createMockNode(newId, 'Original Node', 'Generic', expectedPosition.x, expectedPosition.y);
    duplicatedNode.nodeValue = originalNode.nodeValue;

    (createNode as any).mockReturnValue(duplicatedNode);

    const result = duplicateNode(originalNode, newId, customOffset);

    expect(createNode).toHaveBeenCalledWith(newId, expectedPosition, originalNode, true);
    expect(result).toEqual(duplicatedNode);
  });

  it('should return undefined when createNode fails', () => {
    const originalNode = createMockNode(1);
    const newId = 2;

    (createNode as any).mockReturnValue(undefined);

    const result = duplicateNode(originalNode, newId);

    expect(createNode).toHaveBeenCalledWith(newId, { x: 130, y: 130 }, originalNode, true);
    expect(result).toBeUndefined();
  });

  it('should preserve title and nodeValue from original node', () => {
    const originalNode = createMockNode(1, 'Custom Title', 'Generic', 0, 0);
    originalNode.nodeValue = 'custom value';
    const newId = 2;

    const duplicatedNode = createMockNode(newId, 'Custom Title', 'Generic', 30, 30);
    duplicatedNode.nodeValue = 'custom value';

    (createNode as any).mockReturnValue(duplicatedNode);

    const result = duplicateNode(originalNode, newId);

    expect(result?.title).toBe('Custom Title');
    expect(result?.nodeValue).toBe('custom value');
  });
});

describe('updateNodeSelection', () => {
  it('should select only specified nodes when addToSelection is false', () => {
    const nodes = [
      createMockNode(1, 'Node 1', 'Generic', 0, 0, false),
      createMockNode(2, 'Node 2', 'Generic', 0, 0, true),
      createMockNode(3, 'Node 3', 'Generic', 0, 0, false),
    ];
    const selectedIds = [1, 3];

    const result = updateNodeSelection(nodes, selectedIds, false);

    expect(result).toHaveLength(3);
    expect(result[0].selected).toBe(true); // Node 1
    expect(result[1].selected).toBe(false); // Node 2 (was true, now false)
    expect(result[2].selected).toBe(true); // Node 3
  });

  it('should add to existing selection when addToSelection is true', () => {
    const nodes = [
      createMockNode(1, 'Node 1', 'Generic', 0, 0, true),
      createMockNode(2, 'Node 2', 'Generic', 0, 0, false),
      createMockNode(3, 'Node 3', 'Generic', 0, 0, true),
    ];
    const selectedIds = [2];

    const result = updateNodeSelection(nodes, selectedIds, true);

    expect(result).toHaveLength(3);
    expect(result[0].selected).toBe(true); // Node 1 (remains true)
    expect(result[1].selected).toBe(true); // Node 2 (added to selection)
    expect(result[2].selected).toBe(true); // Node 3 (remains true)
  });

  it('should handle empty selectedIds array', () => {
    const nodes = [
      createMockNode(1, 'Node 1', 'Generic', 0, 0, true),
      createMockNode(2, 'Node 2', 'Generic', 0, 0, true),
    ];
    const selectedIds: number[] = [];

    const result = updateNodeSelection(nodes, selectedIds, false);

    expect(result).toHaveLength(2);
    expect(result[0].selected).toBe(false);
    expect(result[1].selected).toBe(false);
  });

  it('should handle single node selection', () => {
    const nodes = [
      createMockNode(1, 'Node 1', 'Generic', 0, 0, false),
      createMockNode(2, 'Node 2', 'Generic', 0, 0, false),
    ];
    const selectedIds = [2];

    const result = updateNodeSelection(nodes, selectedIds, false);

    expect(result).toHaveLength(2);
    expect(result[0].selected).toBe(false);
    expect(result[1].selected).toBe(true);
  });

  it('should handle multiple nodes with mixed initial selection states', () => {
    const nodes = [
      createMockNode(1, 'Node 1', 'Generic', 0, 0, true),
      createMockNode(2, 'Node 2', 'Generic', 0, 0, false),
      createMockNode(3, 'Node 3', 'Generic', 0, 0, true),
      createMockNode(4, 'Node 4', 'Generic', 0, 0, false),
    ];
    const selectedIds = [2, 4];

    const result = updateNodeSelection(nodes, selectedIds, false);

    expect(result).toHaveLength(4);
    expect(result[0].selected).toBe(false); // Was true, now false
    expect(result[1].selected).toBe(true);  // Was false, now true
    expect(result[2].selected).toBe(false); // Was true, now false
    expect(result[3].selected).toBe(true);  // Was false, now true
  });

  it('should not modify original nodes array', () => {
    const nodes = [
      createMockNode(1, 'Node 1', 'Generic', 0, 0, false),
      createMockNode(2, 'Node 2', 'Generic', 0, 0, false),
    ];
    const originalNodes = [...nodes];
    const selectedIds = [1];

    const result = updateNodeSelection(nodes, selectedIds, false);

    expect(nodes).toEqual(originalNodes); // Original should be unchanged
    expect(result).not.toBe(nodes); // Should return new array
  });
});