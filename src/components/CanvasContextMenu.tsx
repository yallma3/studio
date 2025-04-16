import React, { useRef } from "react";
import { Plus, Settings, Trash2, Type, MessageSquare, Hash, ToggleLeft, Image, ChevronRight, PlusCircle, Link } from "lucide-react";
// Define types for the context menu
interface ContextMenuPosition {
  visible: boolean;
  x: number;
  y: number;
  subMenu: string | null;
  targetNodeId?: number;
}

interface CanvasContextMenuProps {
  contextMenu: ContextMenuPosition;
  onAddNode: (nodeType: string, e: React.MouseEvent) => void;
  onContextMenuAction: (action: string, e: React.MouseEvent) => void;
}

const CanvasContextMenu: React.FC<CanvasContextMenuProps> = ({
  contextMenu,
  onAddNode,
  onContextMenuAction,
}) => {
  // Use refs for hover timers to prevent showing submenus immediately
  const hoverTimerRef = useRef<number | null>(null);
  
  // Function to handle menu item hover with delay
  const handleMenuItemHover = (action: string, e: React.MouseEvent) => {
    // Clear any existing timer
    if (hoverTimerRef.current !== null) {
      window.clearTimeout(hoverTimerRef.current);
    }
    
    // Set a new timer to show the submenu after a short delay
    hoverTimerRef.current = window.setTimeout(() => {
      onContextMenuAction(action, e);
      hoverTimerRef.current = null;
    }, 0); // 200ms delay before showing submenu
  };
  
  // Function to handle mouse leave
  const handleMenuItemLeave = () => {
    // Clear the timer if mouse leaves before the delay
    if (hoverTimerRef.current !== null) {
      window.clearTimeout(hoverTimerRef.current);
      hoverTimerRef.current = null;
    }
  };
  
  if (!contextMenu.visible) return null;
  
  const menuStyle: React.CSSProperties = {
    position: 'absolute',
    top: contextMenu.y,
    left: contextMenu.x,
    zIndex: 1000,
    backgroundColor: 'rgba(17, 17, 17, 0.95)',
    borderRadius: '8px',
    boxShadow: '0 4px 15px rgba(0, 0, 0, 0.3)',
    padding: '8px 0',
    minWidth: '180px',
    borderLeft: '1px solid rgba(255, 199, 44, 0.2)',
    backdropFilter: 'blur(10px)',
  };
  
  const subMenuStyle: React.CSSProperties = {
    position: 'absolute',
    top: 0,
    left: '100%',
    zIndex: 1000,
    backgroundColor: 'rgba(17, 17, 17, 0.95)',
    borderRadius: '8px',
    boxShadow: '0 4px 15px rgba(0, 0, 0, 0.3)',
    padding: '8px 0',
    minWidth: '180px',
    borderLeft: '1px solid rgba(255, 199, 44, 0.2)',
    backdropFilter: 'blur(10px)',
  };
  
  const menuItemStyle: React.CSSProperties = {
    padding: '8px 16px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    color: 'white',
    fontSize: '14px',
    transition: 'background-color 0.2s',
  };

  // Common icon style
  const iconStyle: React.CSSProperties = {
    color: '#FFC72C',
    marginRight: '8px',
  };

  // Default canvas context menu
  return (
    <div style={menuStyle} onClick={e => e.stopPropagation()}>
      <div 
        style={{...menuItemStyle, justifyContent: 'space-between'}}
        onMouseEnter={(e) => handleMenuItemHover('showAddNodeSubmenu', e)}
        onMouseLeave={handleMenuItemLeave}
        onClick={(e) => onContextMenuAction('addNode', e)}
        className="hover:bg-[#222]"
      >
        <div style={{display: 'flex', alignItems: 'center'}}>
          <Plus size={16} style={iconStyle} />
          <span>Add</span>
        </div>
        <ChevronRight size={16} style={iconStyle} />
      </div>
      <div 
        style={{...menuItemStyle, justifyContent: 'space-between'}}
        onMouseEnter={(e) => handleMenuItemHover('showSettingsSubmenu', e)}
        onMouseLeave={handleMenuItemLeave}
        onClick={(e) => onContextMenuAction('settings', e)}
        className="hover:bg-[#222]"
      >
        <div style={{display: 'flex', alignItems: 'center'}}>
          <Settings size={16} style={iconStyle} />
          <span>Settings</span>
        </div>
        <ChevronRight size={16} style={iconStyle} />
      </div>
      
      {/* Add Node submenu */}
      {contextMenu.subMenu === 'addNode' && (
        <div style={subMenuStyle}>
          <p className="text-xs text-[#FFC72C]/80 font-mono p-2">Add Node</p>
          <div 
            style={menuItemStyle}
            onClick={(e) => onAddNode("Text", e)}
            className="hover:bg-[#222]"
          >
            <Type size={16} style={iconStyle} />
            <span>Text Node</span>
          </div>
          <div 
            style={menuItemStyle}
            onClick={(e) => onAddNode("Chat", e)}
            className="hover:bg-[#222]"
          >
            <MessageSquare size={16} style={iconStyle} />
            <span>Chat Node</span>
          </div>
          <div 
            style={menuItemStyle}
            onClick={(e) => onAddNode("Number", e)}
            className="hover:bg-[#222]"
          >
            <Hash size={16} style={iconStyle} />
            <span>Number Node</span>
          </div>
          <div 
            style={menuItemStyle}
            onClick={(e) => onAddNode("Boolean", e)}
            className="hover:bg-[#222]"
          >
            <ToggleLeft size={16} style={iconStyle} />
            <span>Boolean Node</span>
          </div>
          <div 
            style={menuItemStyle}
            onClick={(e) => onAddNode("Image", e)}
            className="hover:bg-[#222]"
          >
            <Image size={16} style={iconStyle} />
            <span>Image Node</span>
          </div>
          <div 
            style={menuItemStyle}
            onClick={(e) => onAddNode("Add", e)}
            className="hover:bg-[#222]"
          >
            <PlusCircle size={16} style={iconStyle} />
            <span>Add Node</span>
          </div>
          <div 
            style={menuItemStyle}
            onClick={(e) => onAddNode("Join", e)}
            className="hover:bg-[#222]"
          >
            <Link size={16} style={iconStyle} />
            <span>Join Node</span>
          </div>
        </div>
      )}
      
      {/* Settings submenu */}
      {contextMenu.subMenu === 'settings' && (
        <div style={subMenuStyle}>
          <p className="text-xs text-[#FFC72C]/80 font-mono p-2">Settings</p>
          <div 
            style={{...menuItemStyle, color: '#ff6b6b'}}
            onClick={(e) => onContextMenuAction('clearView', e)}
            className="hover:bg-[#222]"
          >
            <Trash2 size={16} style={{color: '#ff6b6b', marginRight: '8px'}} />
            <span>Clear View</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default CanvasContextMenu; 