import React, { MouseEvent, useState, useEffect, useRef } from "react";
import { NodeType, Connection, NodeValue, Socket } from "../types/NodeTypes";
import { Loader2, Settings, FileText } from "lucide-react";
import { SOCKET_SPACING, SOCKET_SIZE } from "../vars";
// Node Component Props
export interface NodeComponentProps {
  node: NodeType;
  connections: Connection[];
  onMouseDown: (e: MouseEvent<HTMLDivElement>, id: number) => void;
  onSocketDragStart: (e: MouseEvent<HTMLDivElement>, socketId: number, isRemovingConnection?: boolean) => void;
  onNodeContextMenu: (e: MouseEvent<HTMLDivElement>, id: number) => void;
  onEditNode?: (nodeId: number) => void;
  onShowResult: (node: NodeType) => void;
  isBeingEdited?: boolean; // New prop to indicate if this node is being edited
}

// Node Component
export const NodeComponent: React.FC<NodeComponentProps> = ({ 
  node, 
  connections, 
  onMouseDown, 
  onSocketDragStart,
  onNodeContextMenu,
  onEditNode,
  onShowResult,
  isBeingEdited = false
}) => {
  
  // Add state for animation
  const [isAnimating, setIsAnimating] = useState(false);
  const prevResultRef = useRef<unknown>(node.result);
  
  // Detect result changes and trigger animation
  useEffect(() => {
    // Always animate when there's a result, ensuring it runs on every update
    if (node.result) {
      setIsAnimating(true);
      const timer = setTimeout(() => setIsAnimating(false), 800); // Extended animation duration
      return () => clearTimeout(timer);
    }
    prevResultRef.current = node.result;
  }, [node.result]);
  
  // Filter input and output sockets
  const inputSockets = node.sockets.filter(
    (socket): socket is Socket & { type: "input" } => socket.type === "input"
  );
  const outputSockets = node.sockets.filter(
    (socket): socket is Socket & { type: "output" } => socket.type === "output"
  );
  
  
  // Calculate vertical offset for centering sockets
  const getSocketsVerticalOffset = (socketsCount: number) => {
    // If only one socket, place it at 80% height
    if (socketsCount === 1) return node.height * 0.8;
    
    // For multiple sockets, calculate center position to distribute sockets evenly
    const totalSpacing = SOCKET_SPACING * (socketsCount - 1);
    const startY = (node.height - totalSpacing) / 2;
    return startY;
  };
  
  // Calculate positions for input sockets
  const inputSocketsStartY = getSocketsVerticalOffset(inputSockets.length);
  
  // Calculate positions for output sockets
  const outputSocketsStartY = getSocketsVerticalOffset(outputSockets.length);

  // Render node value based on node type
  const renderNodeValue = () => {
    // Extract values outside of case to avoid lexical declaration in case block
    const imageUrl = node.nodeType === "Image" ? String(node.value) : "";
    const boolValue = node.nodeType === "Boolean" ? !!node.value : false;
    
    switch (node.nodeType) {
      case "Text":
        return (
          <div 
            className="text-[#FFC72C] font-mono text-sm bg-[#FFC72C11] p-2 rounded text-left m-2.5" 
            data-testid="text-value"
          >
            {String(node.value)}
          </div>
        );
      case "Number":
        return (
          <div className="flex flex-col items-center justify-center m-2.5">
            <input
              type="number"
              value={Number(node.value)}
              className="text-[#FFC72C] font-mono text-sm bg-[#FFC72C11] p-2 rounded w-full"
              readOnly
            />
          </div>
        );
      case "Boolean":
        return (
          <div className="flex items-center justify-center m-2.5">
            <span className="text-[#FFC72C] font-mono text-sm bg-[#FFC72C11] p-2 rounded w-full">{boolValue ? 'TRUE' : 'FALSE'}</span>
          </div>
        );
      case "Chat":
        return (
          <div className="text-[#FFC72C] font-mono text-sm bg-[#FFC72C11] p-2 rounded text-left m-2.5 max-h-[120px] overflow-auto">
            {typeof node.value === 'object' && node.value !== null 
              ? String((node.value as Record<number, NodeValue>)[node.id * 100 + 3] || 'Start typing...') 
              : String(node.value || 'Start typing...')}
          </div>
        );
      case "Image":
        return (
          <div className="flex flex-col items-center justify-center m-2.5">
            {imageUrl ? (
              <div className="w-full h-[120px] overflow-hidden rounded bg-[#FFC72C11] flex items-center justify-center">
                <img 
                  src={imageUrl} 
                  alt="Node image" 
                  className="max-w-full max-h-full object-contain"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgZmlsbD0ibm9uZSI+PHBhdGggZD0iTTEyIDIyYzUuNTIzIDAgMTAtNC40NzcgMTAtMTBTMTcuNTIzIDIgMTIgMiAyIDYuNDc3IDIgMTJzNC40NzcgMTAgMTAgMTB6IiBzdHJva2U9IiNGRkM3MkMiIHN0cm9rZS13aWR0aD0iMiIvPjxwYXRoIGQ9Ik0xNSA5bC02IDYiIHN0cm9rZT0iI0ZGQzcyQyIgc3Ryb2tlLXdpZHRoPSIyIi8+PHBhdGggZD0iTTkgOWw2IDYiIHN0cm9rZT0iI0ZGQzcyQyIgc3Ryb2tlLXdpZHRoPSIyIi8+PC9zdmc+';
                  }}
                />
              </div>
            ) : (
              <div className="w-full h-[120px] bg-[#FFC72C11] rounded flex items-center justify-center text-[#FFC72C66]">
                No image
              </div>
            )}
          </div>
        );
      default:
        // Generic/fallback rendering for any node type
        return (
          <div 
            className="text-[#FFC72C] font-mono text-sm bg-[#FFC72C11] p-2 rounded text-left m-2.5" 
            data-testid="text-value"
          >
            {typeof node.value === 'object' ? JSON.stringify(node.value, null, 2) : String(node.value)}
          </div>
        );
    }
  };

  const renderResult = () => {
    if(node.result) {
      return (
        <div className="absolute -bottom-3 -right-3 z-50">
          <button 
            onClick={(e) => {
              e.stopPropagation();
              onShowResult(node)
            }}
            className={`bg-[#FFC72C] hover:bg-[#FFB300] text-black rounded-full w-7 h-7 flex items-center justify-center shadow-md border border-[#FFB300] ${isAnimating ? 'animate-ping-once scale-110' : 'animate-pulse-once'} relative`}
            title="View Result"
            data-testid="view-result-button"
          >
            <FileText size={14} className={isAnimating ? 'animate-spin-slow' : ''} />
            
            {/* Multiple animated rings for a more pronounced effect */}
            {isAnimating && (
              <>
                <span className="absolute w-full h-full rounded-full bg-[#FFC72C]/40 animate-ripple"></span>
                <span className="absolute w-full h-full rounded-full bg-[#FFC72C]/30 animate-ripple-delayed"></span>
                <span className="absolute w-16 h-16 -top-4 -left-4 rounded-full border-2 border-[#FFC72C]/20 animate-ping"></span>
              </>
            )}
          </button>
        </div>
      );
    } else {
      return null;
    }
  }

  // Handle right-click on the node
  const handleContextMenu = (e: MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    // Call the parent handler with the node ID
    onNodeContextMenu(e, node.id);
  };
  
  // Handle click on settings icon
  const handleEditClick = (e: MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    console.log("Edit button clicked for node:", node.id);
    if (onEditNode) {
      onEditNode(node.id);
    }
  };
  
  return (
    <div
      onMouseDown={(e) => {
        e.stopPropagation();
        onMouseDown(e, node.id);
      }}
      onContextMenu={handleContextMenu}
      className={`flex flex-col text-white rounded-md bg-black hover:bg-[#111] absolute border transition-colors duration-200 
        ${node.selected 
          ? 'border-[#FFC72C] shadow-[0_0_10px_rgba(255,199,44,0.6)]' 
          : isBeingEdited 
            ? 'border-[#FFC72C] shadow-[0_0_8px_rgba(255,199,44,0.5)] outline-1 outline-[#FFC72C]/30 outline-offset-1' 
            : 'border-gray-600'
        } shadow-xl`}
      style={{
        width: node.width,
        height: node.height,
        left: node.x,
        top: node.y,
        cursor: "move",
        userSelect: "none",
        position: "absolute",
        zIndex: isBeingEdited ? 40 : node.selected ? 30 : 10, // Bring edited nodes to the very front
        opacity: isBeingEdited ? 0.8 : 1, // Slightly fade edited nodes
      }}
    >
     
       
      {/* Input sockets (left side) */}
      {inputSockets.map((socket, index) => {
        // Check if this input socket has a connection
        const hasConnection = connections.some(conn => conn.toSocket === socket.id);
        
        // Calculate vertical position based on index
        const socketY = inputSockets.length === 1 
          ? node.height * 0.8 // Single socket at 80% height
          : inputSocketsStartY + (index * SOCKET_SPACING) + node.height * 0.2; // Multiple sockets distributed vertically
        
        return (
          <div className="flex flex-col items-center justify-center" key={socket.id}>
          <div
            onMouseDown={(e) => onSocketDragStart(e, socket.id, true)}
            className={hasConnection ? "bg-[#FFC72C]  border-2 border-[#FFB300]" : "bg-[#111] border-2 border-[#FFB30088] hover:border-[#FFB300]"} 
            style={{
              position: "absolute",
              left: 0,
              top: socketY,
              transform: "translate(-60%, -50%)",
              width: SOCKET_SIZE,
              height: SOCKET_SIZE,
              borderRadius: "50%",
              cursor: hasConnection ? "grab" : "pointer",
              zIndex: 20
            }}
          />
          <p className="text-xs text-[#FFC72C]/80 font-mono " style={{position: "absolute", fontSize: SOCKET_SIZE * 0.5 ,  left: 18,
              top: socketY,
               }}>{socket.title}</p>
          </div>
        );
      })}
      
      {/* Output sockets (right side) */}
      {outputSockets.map((socket, index) => {
        // Check if this output socket has any connections
        const connectionCount = connections.filter(conn => conn.fromSocket === socket.id).length;
        
        // Calculate vertical position based on index
        const socketY = outputSockets.length === 1 
          ? node.height * 0.8 // Single socket at 80% height
          : outputSocketsStartY + (index * SOCKET_SPACING) + node.height * 0.2; // Multiple sockets distributed vertically
        
        return (
          <div className="flex flex-col items-center justify-center" key={socket.id}>
          <div
            onMouseDown={(e) => onSocketDragStart(e, socket.id)}
            className={connectionCount > 0 ? "bg-[#FFC72C]  border-2 border-[#FFB300]" : "bg-[#111] border-2 border-[#FFB30088] hover:border-[#FFB300]"} 
            style={{
              position: "absolute",
              right: 0,
              top: socketY,
              transform: "translate(60%, -50%)",
              width: SOCKET_SIZE,
              height: SOCKET_SIZE,
              borderRadius: "50%",
              cursor: "pointer", // Always allow creating new connections from outputs
              zIndex: 20
            }}
          />
          <p className="text-xs text-[#FFC72C]/80 font-mono " style={{position: "absolute", fontSize: SOCKET_SIZE * 0.5 ,  right: 18,
              top: socketY }}>{socket.title}</p>
          </div>
        );
      })}
    <div className="z-3 rounded-md">
      <div className={`flex items-center justify-between px-4 py-3 
        ${isBeingEdited 
          ? 'bg-[#FFC72C]/25' 
          : node.selected 
            ? 'bg-[#FFC72C]/30' 
            : 'bg-[#FFC72C]/20'
        } border-b border-[#FFC72C]/30 rounded-t-md`}>
        <div className="flex items-center gap-2">
          <div className={`w-2.5 h-2.5 rounded-full bg-[#FFC72C] ${node.selected || isBeingEdited ? 'shadow-[0_0_15px_rgba(255,199,44,0.9)] animate-pulse' : 'shadow-[0_0_10px_rgba(255,199,44,0.7)]'}`} />
          <h3 className="font-bold text-sm text-white">{node.title}</h3>
        </div>
        <div className="flex items-center gap-2">
          <div className="text-xs text-[#FFC72C]/80 uppercase font-mono">{node.nodeType}</div>
          <button
            onClick={handleEditClick}
            className={`${isBeingEdited ? 'text-[#FFC72C]' : 'text-[#FFC72C88] hover:text-[#FFC72C]'} ml-1 cursor-pointer`}
            title="Edit Node"
          >
            {node.processing ? <Loader2 className="animate-spin" size={14} /> : <Settings size={14} />}
          </button>
        </div>
      </div>
      
      {renderNodeValue()}
      {renderResult()}
    </div>
    </div>
  );
}; 