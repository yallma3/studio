import { NodeType } from "../types/NodeTypes";
import { nodeRegistry } from "../types/NodeRegistry";

/**
 * Duplicate a node with new ID and slightly offset position
 */
export const duplicateNode = (
  node: NodeType,
  newId: number,
  positionOffset = { x: 30, y: 30 }
): NodeType | undefined => {
  const offsetPosition = {
    x: node.x + positionOffset.x,
    y: node.y + positionOffset.y,
  };

  // Create a new node based on the original
  const newNode = nodeRegistry.createNode(node.nodeType, newId, offsetPosition);
  if (newNode) {
    // Preserve custom title
    newNode.title = node.title;
    newNode.nodeValue = node.nodeValue;

    return newNode;
  } else {
    return undefined;
  }
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
    return nodes.map((node) => ({
      ...node,
      selected: selectedIds.includes(node.id) ? true : node.selected,
    }));
  } else {
    // Clear all selections and select only the nodes in selectedIds
    return nodes.map((node) => ({
      ...node,
      selected: selectedIds.includes(node.id),
    }));
  }
};
