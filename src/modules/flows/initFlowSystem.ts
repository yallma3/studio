import { registerBuiltInNodes } from './types/RegisterBuiltInNodes.ts';
// @ts-expect-error Missing type declarations for custom node module
import {register} from "./types/Example/customNode.js"
import { nodeRegistry } from './types/NodeRegistry.ts';

export function initFlowSystem() {
  // Register all built-in node types
  registerBuiltInNodes();

  
  // Additional initialization can go here
  console.log('Flow system initialized');

  console.log('registering custom node')
  register(nodeRegistry)

}