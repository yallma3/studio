import { nodeRegistry } from "./NodeRegistry";
import {
  createNumberNode,
  createGroqChatNode,
  createBooleanNode,
  createImageNode,
  createAddNode,
  createJoinNode,
} from "./NodeTypes";

export function registerBuiltInNodes(): void {
  nodeRegistry.registerNodeType("Number", createNumberNode);
  nodeRegistry.registerNodeType("Chat", createGroqChatNode);
  nodeRegistry.registerNodeType("Boolean", createBooleanNode);
  nodeRegistry.registerNodeType("Image", createImageNode);
  nodeRegistry.registerNodeType("Add", createAddNode);
  nodeRegistry.registerNodeType("Join", createJoinNode);
}
