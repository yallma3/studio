/*
* yaLLMa3 - Framework for building AI agents that are capable of learning from their environment and interacting with it.
 
 * Copyright (C) 2025 yaLLMa3
 
 * This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0.
   If a copy of the MPL was not distributed with this file, You can obtain one at https://www.mozilla.org/MPL/2.0/.
 
 * This software is distributed on an "AS IS" basis,
   WITHOUT WARRANTY OF ANY KIND, either express or implied.
   See the Mozilla Public License for the specific language governing rights and limitations under the License.
*/

import type { BaseNode } from "./NodeTypes";

// Factory type for creating new nodes
export type NodeFactory = (
  id: number,
  position: { x: number; y: number }
) => BaseNode;

export class NodeRegistry {
  private nodes: Record<string, BaseNode> = {};
  private categories: string[] = [];

  registerNode(node: BaseNode) {
    this.nodes[node.nodeType] = Object.freeze({ ...node });
  }
  registerCategories(categories: string[]) {
    const set = new Set([...this.categories, ...categories]);
    this.categories = Array.from(set);
  }

  getNode(nodeType: string): BaseNode | undefined {
    return this.nodes[nodeType];
  }

  listNodeDetails(): BaseNode[] {
    return Object.values(this.nodes);
  }
  listNodes(): string[] {
    return Object.keys(this.nodes);
  }

  listCategories(): string[] {
    return this.categories;
  }
  listNodeTypesByCategory(category: string): Record<string, string> {
    const result: Record<string, string> = {};
    Object.values(this.nodes)
      .filter((node) => node.category === category)
      .forEach((node) => {
        result[node.nodeType] = node.title;
      });
    return result;
  }
}

// Export singleton instance
export const nodeRegistry = new NodeRegistry();
