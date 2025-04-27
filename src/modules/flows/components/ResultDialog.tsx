import { FileText } from "lucide-react";
import { NodeType } from "../types/NodeTypes";
import { useEffect } from "react";


// Result Dialog Component
interface ResultDialogProps {
    node: NodeType;
    onClose: () => void;
  }
  
  export const ResultDialog: React.FC<ResultDialogProps> = ({ node, onClose }) => {
    // Add escape key handler
    useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          onClose();
        }
      };
      
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onClose]);
    
    // Safely access the result
    const result = node.result || "No result data available";
    
    return (
      <div 
        className="fixed inset-0 bg-black/80 flex items-center justify-center z-50"
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
      >
        <div 
          className="bg-[#111] border border-[#FFC72C]/50 rounded-md max-w-2xl max-h-[80vh] w-full mx-4 overflow-hidden animate-slide-up shadow-lg"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex justify-between items-center p-4 bg-gradient-to-r from-[#111] to-[#FFC72C22] border-b border-[#FFC72C]/30">
            <h3 className="text-[#FFC72C] font-bold flex gap-2 items-center">
              <FileText size={16} />
              {node.title} Result
            </h3>
            <button 
              className="text-gray-400 hover:text-white hover:bg-[#FFC72C33] rounded-full w-6 h-6 flex items-center justify-center transition-colors"
              onClick={onClose}
              aria-label="Close"
            >
              &times;
            </button>
          </div>
          <div className="p-4">
            <div className="text-white font-mono text-sm bg-[#FFC72C11] p-4 rounded border border-[#FFC72C]/30 overflow-auto max-h-[60vh]">
              {typeof result === 'object' 
                ? <pre>{JSON.stringify(result, null, 2)}</pre>
                : result.toString()}
            </div>
          </div>
          <div className="flex justify-end p-3 border-t border-[#FFC72C]/20 bg-[#FFC72C11]">
            <button 
              className="bg-[#FFC72C33] hover:bg-[#FFC72C44] text-[#FFC72C] px-4 py-2 rounded transition-colors"
              onClick={onClose}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }; 