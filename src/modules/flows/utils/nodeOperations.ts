import { NodeType, NodeValue } from "../types/NodeTypes";
import { 
  createTextNode, 
  createNumberNode, 
  createChatNode, 
  createBooleanNode, 
  createImageNode, 
  createAddNode, 
  createJoinNode 
} from "../types/NodeTypes";

/**
 * Create a node based on its type and position
 */
export const createNodeOfType = (
  id: number, 
  nodeType: string, 
  position: { x: number, y: number },
  defaultValue?: NodeValue
): NodeType => {
  switch(nodeType) {
    case "Text":
      return createTextNode(id, position, String(defaultValue || "{{input}}"));
    case "Number":
      return createNumberNode(id, position, typeof defaultValue === 'number' ? defaultValue : 0);
    case "Chat":
      return createChatNode(id, position, String(defaultValue || "llama-3.1-8b-instant"));
    case "Boolean":
      return createBooleanNode(id, position, !!defaultValue);
    case "Image":
      return createImageNode(id, position, String(defaultValue || ""));
    case "Add":
      return createAddNode(id, position);
    case "Join":
      return createJoinNode(id, position, String(defaultValue || " "));
    default:
      return createTextNode(id, position, String(defaultValue || "{{input}}"));
  }
};

/**
 * Duplicate a node with new ID and slightly offset position
 */
export const duplicateNode = (
  node: NodeType, 
  newId: number, 
  positionOffset = { x: 30, y: 30 }
): NodeType => {
  const offsetPosition = { 
    x: node.x + positionOffset.x, 
    y: node.y + positionOffset.y 
  };
  
  // Create a new node based on the original
  const newNode = createNodeOfType(
    newId, 
    node.nodeType, 
    offsetPosition, 
    node.value
  );
  
  // Preserve custom title
  newNode.title = node.title;
  
  return newNode;
};

/**
 * Update node selection state
 */
export const updateNodeSelection = (
  nodes: NodeType[], 
  selectedIds: number[], 
  addToSelection: boolean = false
): NodeType[] => {
  if (addToSelection) {
    // Update only the nodes in selectedIds
    return nodes.map(node => ({
      ...node,
      selected: selectedIds.includes(node.id)
        ? true
        : node.selected 
    }));
  } else {
    // Clear all selections and select only the nodes in selectedIds
    return nodes.map(node => ({
      ...node,
      selected: selectedIds.includes(node.id)
    }));
  }
}; 