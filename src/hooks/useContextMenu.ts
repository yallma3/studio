import { useState, useEffect, useRef } from 'react';
import { Node, NodeType } from '../types/NodeTypes';
import { createNodeOfType } from '../utils/nodeOperations';
import { screenToCanvas } from '../utils/canvasTransforms';
import { CanvasTransform } from './useCanvasTransform';

// Context menu state interface
export interface ContextMenuState {
  visible: boolean;
  x: number;
  y: number;
  subMenu: string | null;
  targetNodeId?: number;
}

/**
 * Custom hook for managing context menus
 */
export const useContextMenu = (
  // nodes: Node[],
  setNodes: React.Dispatch<React.SetStateAction<Node[]>>,
  setSelectedNodeIds: React.Dispatch<React.SetStateAction<number[]>>,
  transform: CanvasTransform,
  nextNodeId: React.MutableRefObject<number>
) => {
  // State for context menu
  const [contextMenu, setContextMenu] = useState<ContextMenuState>({
    visible: false,
    x: 0,
    y: 0,
    subMenu: null
  });
  
  // Store canvas position for adding nodes
  const contextMenuCanvasPosition = useRef({ x: 0, y: 0 });
  
  // Add click listener to close context menu when clicking outside
  useEffect(() => {
    const handleGlobalClick = () => {
      if (contextMenu.visible) {
        setContextMenu(prev => ({ ...prev, visible: false, subMenu: null }));
      }
    };
    
    window.addEventListener('click', handleGlobalClick);
    
    return () => {
      window.removeEventListener('click', handleGlobalClick);
    };
  }, [contextMenu.visible]);
  
  // Handle right-click context menu on canvas
  const handleContextMenu = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    // Store the canvas position for node creation
    const canvasPos = screenToCanvas(e.clientX, e.clientY, transform);
    contextMenuCanvasPosition.current = canvasPos;
    
    // Show context menu at mouse position for canvas options
    setContextMenu({
      visible: true,
      x: e.clientX,
      y: e.clientY,
      subMenu: null,
    });
  };
  
  // Handle node-specific context menu
  const handleNodeContextMenu = (e: React.MouseEvent<HTMLDivElement>, nodeId: number) => {
    e.preventDefault();
    // Select the right-clicked node if not already selected
    setNodes(nodes => nodes.map(n => ({ ...n, selected: n.id === nodeId })));
    setSelectedNodeIds([nodeId]);
    
    // Show context menu at mouse position with node-specific options
    setContextMenu({
      visible: true,
      x: e.clientX,
      y: e.clientY,
      subMenu: null,
      targetNodeId: nodeId
    });
  };
  
  // Handle adding a node from the context menu
  const handleAddNodeFromContextMenu = (nodeType: NodeType, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent the menu from closing immediately
    
    // Get the next unique node ID
    const id = nextNodeId.current++;
    
    // Create the node at the stored canvas position
    const newNode = createNodeOfType(
      id, 
      nodeType, 
      contextMenuCanvasPosition.current
    );
    
    // Add the new node and select it
    setNodes(prev => [...prev, { ...newNode, selected: true }]);
    setSelectedNodeIds([id]);
    
    // Close context menu
    setContextMenu(prev => ({ ...prev, visible: false, subMenu: null }));
  };
  
  return {
    contextMenu,
    setContextMenu,
    contextMenuCanvasPosition,
    handleContextMenu,
    handleNodeContextMenu,
    handleAddNodeFromContextMenu
  };
}; 