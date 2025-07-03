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
  private nodeFactories: Record<string, NodeFactory> = {};

  registerNodeType(name: string, factory: NodeFactory): void {
    this.nodeFactories[name] = factory;
  }

  createNode(
    name: string,
    id: number,
    position: { x: number; y: number }
  ): BaseNode | undefined {
    const factory = this.nodeFactories[name];
    if (!factory) {
      console.error(`Node type "${name}" not registered.`);
      return undefined;
    }
    return factory(id, position);
  }

  getFactory(nodeType: string): NodeFactory | undefined {
    return this.nodeFactories[nodeType];
  }

  listNodeTypes(): string[] {
    return Object.keys(this.nodeFactories);
  }
}

// Export singleton instance
export const nodeRegistry = new NodeRegistry();
