import { nodeRegistry } from './NodeRegistry';
import { 
  createTextNode, 
  createNumberNode, 
  createChatNode, 
  createBooleanNode,
  createImageNode,
  createAddNode,
  createJoinNode
} from './NodeTypes';

export function registerBuiltInNodes(): void {
  nodeRegistry.registerNodeType("Text", createTextNode);
  nodeRegistry.registerNodeType("Number", createNumberNode);
  nodeRegistry.registerNodeType("Chat", createChatNode);
  nodeRegistry.registerNodeType("Boolean", createBooleanNode);
  nodeRegistry.registerNodeType("Image", createImageNode);
  nodeRegistry.registerNodeType("Add", createAddNode);
  nodeRegistry.registerNodeType("Join", createJoinNode);
}