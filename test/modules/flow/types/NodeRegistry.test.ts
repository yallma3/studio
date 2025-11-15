/*
 * yaLLMa3 - Framework for building AI agents that are capable of learning from their environment and interacting with it.

 * Copyright (C) 2025 yaLLMa3

 * This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0.
   If a copy of the MPL was not distributed with this file, You can obtain one at https://www.mozilla.org/MPL/2.0/.

 * This software is distributed on an "AS IS" basis,
   WITHOUT WARRANTY OF ANY KIND, either express or implied.
   See the Mozilla Public License for the specific language governing rights and limitations under the License.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { NodeRegistry } from '@/modules/flow/types/NodeRegistry';
import { BaseNode } from '@/modules/flow/types/NodeTypes';

describe('NodeRegistry', () => {
  let registry: NodeRegistry;

  beforeEach(() => {
    registry = new NodeRegistry();
  });

  describe('registerNode', () => {
    it('should register a node', () => {
      const node: BaseNode = {
        id: 1,
        category: 'Test',
        title: 'Test Node',
        nodeType: 'TestNode',
        nodeValue: 'test',
        x: 0,
        y: 0,
        width: 100,
        height: 100,
        sockets: [],
      };

      registry.registerNode(node);

      const retrieved = registry.getNode('TestNode');
      expect(retrieved).toBeDefined();
      expect(retrieved?.title).toBe('Test Node');
    });

    it('should freeze registered nodes', () => {
      const node: BaseNode = {
        id: 1,
        category: 'Test',
        title: 'Test Node',
        nodeType: 'TestNode',
        nodeValue: 'test',
        x: 0,
        y: 0,
        width: 100,
        height: 100,
        sockets: [],
      };

      registry.registerNode(node);

      const retrieved = registry.getNode('TestNode');
      expect(() => {
        if (retrieved) {
          (retrieved as any).title = 'Modified';
        }
      }).toThrow();
    });

    it('should allow overwriting existing nodes', () => {
      const node1: BaseNode = {
        id: 1,
        category: 'Test',
        title: 'Test Node 1',
        nodeType: 'TestNode',
        nodeValue: 'test1',
        x: 0,
        y: 0,
        width: 100,
        height: 100,
        sockets: [],
      };

      const node2: BaseNode = {
        id: 2,
        category: 'Test',
        title: 'Test Node 2',
        nodeType: 'TestNode',
        nodeValue: 'test2',
        x: 0,
        y: 0,
        width: 100,
        height: 100,
        sockets: [],
      };

      registry.registerNode(node1);
      registry.registerNode(node2);

      const retrieved = registry.getNode('TestNode');
      expect(retrieved?.title).toBe('Test Node 2');
    });
  });

  describe('registerCategories', () => {
    it('should register categories', () => {
      registry.registerCategories(['Input', 'Output', 'Processing']);

      const categories = registry.listCategories();
      expect(categories).toEqual(['Input', 'Output', 'Processing']);
    });

    it('should deduplicate categories', () => {
      registry.registerCategories(['Input', 'Output']);
      registry.registerCategories(['Output', 'Processing', 'Input']);

      const categories = registry.listCategories();
      expect(categories.sort()).toEqual(['Input', 'Output', 'Processing']);
    });
  });

  describe('getNode', () => {
    it('should return registered node', () => {
      const node: BaseNode = {
        id: 1,
        category: 'Test',
        title: 'Test Node',
        nodeType: 'TestNode',
        nodeValue: 'test',
        x: 0,
        y: 0,
        width: 100,
        height: 100,
        sockets: [],
      };

      registry.registerNode(node);

      const retrieved = registry.getNode('TestNode');
      expect(retrieved).toEqual(node);
    });

    it('should return undefined for unregistered node', () => {
      const retrieved = registry.getNode('NonExistentNode');
      expect(retrieved).toBeUndefined();
    });
  });

  describe('listNodeDetails', () => {
    it('should return all registered nodes', () => {
      const node1: BaseNode = {
        id: 1,
        category: 'Input',
        title: 'Input Node',
        nodeType: 'InputNode',
        nodeValue: 'input',
        x: 0,
        y: 0,
        width: 100,
        height: 100,
        sockets: [],
      };

      const node2: BaseNode = {
        id: 2,
        category: 'Output',
        title: 'Output Node',
        nodeType: 'OutputNode',
        nodeValue: 'output',
        x: 0,
        y: 0,
        width: 100,
        height: 100,
        sockets: [],
      };

      registry.registerNode(node1);
      registry.registerNode(node2);

      const nodes = registry.listNodeDetails();
      expect(nodes).toHaveLength(2);
      expect(nodes.map(n => n.nodeType).sort()).toEqual(['InputNode', 'OutputNode']);
    });

    it('should return empty array when no nodes registered', () => {
      const nodes = registry.listNodeDetails();
      expect(nodes).toEqual([]);
    });
  });

  describe('listNodes', () => {
    it('should return all registered node types', () => {
      const node1: BaseNode = {
        id: 1,
        category: 'Input',
        title: 'Input Node',
        nodeType: 'InputNode',
        nodeValue: 'input',
        x: 0,
        y: 0,
        width: 100,
        height: 100,
        sockets: [],
      };

      const node2: BaseNode = {
        id: 2,
        category: 'Output',
        title: 'Output Node',
        nodeType: 'OutputNode',
        nodeValue: 'output',
        x: 0,
        y: 0,
        width: 100,
        height: 100,
        sockets: [],
      };

      registry.registerNode(node1);
      registry.registerNode(node2);

      const nodeTypes = registry.listNodes();
      expect(nodeTypes.sort()).toEqual(['InputNode', 'OutputNode']);
    });

    it('should return empty array when no nodes registered', () => {
      const nodeTypes = registry.listNodes();
      expect(nodeTypes).toEqual([]);
    });
  });

  describe('listCategories', () => {
    it('should return all registered categories', () => {
      registry.registerCategories(['Input', 'Output', 'Processing']);

      const categories = registry.listCategories();
      expect(categories).toEqual(['Input', 'Output', 'Processing']);
    });

    it('should return empty array when no categories registered', () => {
      const categories = registry.listCategories();
      expect(categories).toEqual([]);
    });
  });

  describe('listNodeTypesByCategory', () => {
    it('should return node types grouped by category', () => {
      const node1: BaseNode = {
        id: 1,
        category: 'Input',
        title: 'Text Input',
        nodeType: 'TextInputNode',
        nodeValue: 'text',
        x: 0,
        y: 0,
        width: 100,
        height: 100,
        sockets: [],
      };

      const node2: BaseNode = {
        id: 2,
        category: 'Input',
        title: 'Number Input',
        nodeType: 'NumberInputNode',
        nodeValue: 42,
        x: 0,
        y: 0,
        width: 100,
        height: 100,
        sockets: [],
      };

      const node3: BaseNode = {
        id: 3,
        category: 'Output',
        title: 'Console Output',
        nodeType: 'ConsoleOutputNode',
        nodeValue: 'console',
        x: 0,
        y: 0,
        width: 100,
        height: 100,
        sockets: [],
      };

      registry.registerNode(node1);
      registry.registerNode(node2);
      registry.registerNode(node3);

      const inputNodes = registry.listNodeTypesByCategory('Input');
      const outputNodes = registry.listNodeTypesByCategory('Output');
      const emptyCategory = registry.listNodeTypesByCategory('NonExistent');

      expect(inputNodes).toEqual({
        TextInputNode: 'Text Input',
        NumberInputNode: 'Number Input',
      });
      expect(outputNodes).toEqual({
        ConsoleOutputNode: 'Console Output',
      });
      expect(emptyCategory).toEqual({});
    });
  });
});