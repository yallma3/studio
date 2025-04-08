import React from "react";
import { Copy, Edit, RotateCw, Trash2 } from "lucide-react";

// Define types for the node context menu
interface NodeContextMenuProps {
  x: number;
  y: number;
  onContextMenuAction: (action: string, e: React.MouseEvent) => void;
}

const NodeContextMenu: React.FC<NodeContextMenuProps> = ({
  x,
  y,
  onContextMenuAction,
}) => {
  const menuStyle: React.CSSProperties = {
    position: 'absolute',
    top: y,
    left: x,
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

  return (
    <div style={menuStyle} onClick={e => e.stopPropagation()}>
      <div 
        style={menuItemStyle}
        onClick={(e) => onContextMenuAction('copyNode', e)}
        className="hover:bg-[#222]"
      >
        <Copy size={16} style={iconStyle} />
        <span>Copy</span>
      </div>
      <div 
        style={menuItemStyle}
        onClick={(e) => onContextMenuAction('editNode', e)}
        className="hover:bg-[#222]"
      >
        <Edit size={16} style={iconStyle} />
        <span>Edit</span>
      </div>
      <div 
        style={menuItemStyle}
        onClick={(e) => onContextMenuAction('duplicateNode', e)}
        className="hover:bg-[#222]"
      >
        <RotateCw size={16} style={iconStyle} />
        <span>Duplicate</span>
      </div>
      <div className="border-t border-[#FFC72C]/20 my-1"></div>
      <div 
        style={{...menuItemStyle, color: '#ff6b6b'}}
        onClick={(e) => onContextMenuAction('deleteNode', e)}
        className="hover:bg-[#222]"
      >
        <Trash2 size={16} style={{color: '#ff6b6b', marginRight: '8px'}} />
        <span>Delete</span>
      </div>
    </div>
  );
};

export default NodeContextMenu; 