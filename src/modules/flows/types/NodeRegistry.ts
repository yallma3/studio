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
