import React, { useState, useEffect, MouseEvent, useRef } from "react";
import { Node, NodeValue } from "../types/NodeTypes";
import { X } from "lucide-react";
import { useTranslation } from "react-i18next";

interface NodeEditPanelProps {
  node: Node | null;
  onClose: () => void;
  onSave: (updatedNode: Partial<Node>) => void;
}

const NodeEditPanel: React.FC<NodeEditPanelProps> = ({ node, onClose, onSave }) => {
  const [title, setTitle] = useState<string>("");
  const [value, setValue] = useState<NodeValue>("");
  const [isVisible, setIsVisible] = useState<boolean>(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const { t, i18n } = useTranslation();
  
  // Initialize form values when node changes
  useEffect(() => {
    if (node) {
      setTitle(node.title);
      setValue(node.value);
      // Trigger slide-in animation after component mounts
      requestAnimationFrame(() => {
        setIsVisible(true);
      });
    }
  }, [node]);
  
  // Add global click listener to close panel when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: globalThis.MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(event.target as Element)) {
        // Only handle clicks outside when panel is visible
        if (isVisible) {
          handleClose();
        }
      }
    };
    
    // Add the event listener
    document.addEventListener('mousedown', handleClickOutside);
    
    // Clean up
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isVisible]);

  // Handle close with animation
  const handleClose = () => {
    setIsVisible(false);
    // Wait for animation to complete before calling onClose
    setTimeout(() => {
      onClose();
    }, 300); // Match this duration with the CSS transition
  };

  // Handle submit with animation
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation(); // Stop event propagation explicitly
    console.log("Form submitted", { title, value });
    
    if (!node) return;
    
    setIsVisible(false);
    // Wait for animation to complete before saving
    setTimeout(() => {
      onSave({
        title,
        value
      });
    }, 300); // Match this duration with the CSS transition
  };

  const getValueLabel = () => {
    if (!node) return t('nodeEdit.valueLabels.default');
    
    switch (node.nodeType) {
      case "Chat":
        return t('nodeEdit.valueLabels.chat');
      case "Image":
        return t('nodeEdit.valueLabels.image');
      case "Boolean":
        return t('nodeEdit.valueLabels.boolean');
      case "Number":
        return t('nodeEdit.valueLabels.number');
      case "Text":
        return t('nodeEdit.valueLabels.text');
      case "Add":
        return t('nodeEdit.valueLabels.add');
      case "Join":
        return t('nodeEdit.valueLabels.join');
      case "Generic":
        return t('nodeEdit.valueLabels.generic');
      default:
        return t('nodeEdit.valueLabels.default');
    }
  };

  // Handle different value inputs based on node type
  const renderValueInput = () => {
    if (!node) return null;

    // Get text alignment class based on language direction
    const textAlignClass = i18n.language === 'ar' ? 'text-right' : 'text-left';

    switch (node.nodeType) {
      case "Text":
        return (
          <textarea
            id="node-value-textarea"
            className={`w-full h-32 bg-[#161616] text-white border border-[#FFC72C]/30 rounded-md p-2 font-mono text-sm focus:border-[#FFC72C] focus:outline-none resize-none ${textAlignClass}`}
            value={String(value)}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Text value..."
          />
        );
      case "Chat":
        // Replace textarea with a dropdown for Chat nodes
        return (
          <div className="space-y-4">
            <select
              id="node-value-dropdown"
              className={`w-full bg-[#161616] text-white border border-[#FFC72C]/30 rounded-md p-2 font-mono text-sm focus:border-[#FFC72C] focus:outline-none ${textAlignClass}`}
              value={String(value) ? String(value) : "llama-3.1-8b-instant"}
              onChange={(e) => setValue(e.target.value)}
            >
              <option value="deepseek-r1-distill-llama-70b">deepseek-r1-distill-llama-70b (reasoning)</option>
              <option value="deepseek-r1-distill-qwen-32b">deepseek-r1-distill-qwen-32b (reasoning)</option>
              <option value="gemma2-9b-it">gemma2-9b-it</option>
              <option value="llama-3.1-8b-instant">llama-3.1-8b-instant</option>
              <option value="llama-3.2-1b-preview">llama-3.2-1b-preview</option>
              <option value="llama-3.2-3b-preview">llama-3.2-3b-preview</option>
              <option value="llama-3.2-11b-vision-preview">llama-3.2-11b-vision-preview</option>
              <option value="llama-3.2-90b-vision-preview">llama-3.2-90b-vision-preview</option>
              <option value="llama-3.3-70b-specdec">llama-3.3-70b-specdec (reasoning)</option>
              <option value="llama-3.3-70b-versatile">llama-3.3-70b-versatile (reasoning)</option>
              <option value="llama-guard-3-8b">llama-guard-3-8b</option>
              <option value="llama3-8b-8192">llama3-8b-8192</option>
              <option value="llama3-70b-8192">llama3-70b-8192 (reasoning)</option>
              <option value="mistral-saba-24b">mistral-saba-24b (reasoning)</option>
              <option value="qwen-2.5-32b">qwen-2.5-32b (reasoning)</option>
              <option value="qwen-2.5-coder-32b">qwen-2.5-coder-32b</option>
              <option value="qwen-qwq-32b">qwen-qwq-32b (reasoning)</option>
            </select>
          </div>
        );
      case "Number":
        return (
          <input
            id="node-value-number"
            type="number"
            className={`w-full bg-[#161616] text-white border border-[#FFC72C]/30 rounded-md p-2 font-mono text-sm focus:border-[#FFC72C] focus:outline-none ${textAlignClass}`}
            value={Number(value)}
            onChange={(e) => setValue(Number(e.target.value))}
          />
        );
      case "Boolean":
        return (
          <div className="flex items-center space-x-2">
            <label className={`text-white cursor-pointer ${textAlignClass}`}>
              <input
                id="node-value-checkbox"
                type="checkbox"
                className="mr-2 accent-[#FFC72C]"
                checked={value === true}
                onChange={(e) => setValue(e.target.checked)}
              />
              {value === true ? "TRUE" : "FALSE"}
            </label>
          </div>
        );
      case "Image":
        return (
          <div className="space-y-4">
            <input
              id="node-value-image"
              type="text"
              className={`w-full bg-[#161616] text-white border border-[#FFC72C]/30 rounded-md p-2 font-mono text-sm focus:border-[#FFC72C] focus:outline-none ${textAlignClass}`}
              value={String(value)}
              onChange={(e) => setValue(e.target.value)}
              placeholder="Image URL or base64 string..."
            />
            
            {/* Image preview */}
            <div className="w-full h-48 bg-[#1A1A1A] rounded-md flex items-center justify-center overflow-hidden">
              {value ? (
                <img 
                  src={String(value)} 
                  alt="Preview" 
                  className="max-w-full max-h-full object-contain"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgZmlsbD0ibm9uZSI+PHBhdGggZD0iTTEyIDIyYzUuNTIzIDAgMTAtNC40NzcgMTAtMTBTMTcuNTIzIDIgMTIgMiAyIDYuNDc3IDIgMTJzNC40NzcgMTAgMTAgMTB6IiBzdHJva2U9IiNGRkM3MkMiIHN0cm9rZS13aWR0aD0iMiIvPjxwYXRoIGQ9Ik0xNSA5bC02IDYiIHN0cm9rZT0iI0ZGQzcyQyIgc3Ryb2tlLXdpZHRoPSIyIi8+PHBhdGggZD0iTTkgOWw2IDYiIHN0cm9rZT0iI0ZGQzcyQyIgc3Ryb2tlLXdpZHRoPSIyIi8+PC9zdmc+';
                  }}
                />
              ) : (
                <span className={`text-[#FFC72C]/50 ${textAlignClass}`}>{t('nodeEdit.noImagePreview')}</span>
              )}
            </div>
          </div>
        );
      default:
        return (
          <input
            id="node-value-text"
            type="text"
            className={`w-full bg-[#161616] text-white border border-[#FFC72C]/30 rounded-md p-2 font-mono text-sm focus:border-[#FFC72C] focus:outline-none ${textAlignClass}`}
            value={String(value)}
            onChange={(e) => setValue(e.target.value)}
          />
        );
    }
  };

  if (!node) return null;

  // Get text alignment class based on language direction
  const textAlignClass = i18n.language === 'ar' ? 'text-right' : 'text-left';

  return (
    <div 
      ref={panelRef}
      className="fixed right-0 top-0 h-full w-[350px] bg-[#0D0D0D] text-white shadow-[-5px_0_15px_rgba(0,0,0,0.5)] z-50 flex flex-col overflow-auto border-l border-[#FFC72C]/20 transition-transform duration-300 ease-in-out" 
      style={{ 
        zIndex: 9999,
        transform: isVisible ? 'translateX(0)' : 'translateX(100%)'
      }}
      onClick={(e: MouseEvent<HTMLDivElement>) => e.stopPropagation()}
      onMouseDown={(e: MouseEvent<HTMLDivElement>) => e.stopPropagation()} 
      onMouseMove={(e: MouseEvent<HTMLDivElement>) => e.stopPropagation()}
      onMouseUp={(e: MouseEvent<HTMLDivElement>) => e.stopPropagation()}
      onWheel={(e) => e.stopPropagation()}
      dir="ltr" // Always keep the panel in LTR mode for consistency
    >
      <div className="sticky top-0 bg-[#0D0D0D] z-10">
        <div className="flex items-center justify-between p-4 border-b border-[#FFC72C]/20">
          <h2 className={`text-[#FFC72C] text-lg font-bold ${textAlignClass}`}>{t('nodeEdit.title')}</h2>
          <button 
            onClick={handleClose}
            className="text-gray-400 hover:text-white p-1 rounded-full hover:bg-gray-800 transition-colors"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="p-4 bg-[#121212] border-b border-[#FFC72C]/20">
          <div className="flex items-center space-x-3">
            <div className="w-3 h-3 rounded-full bg-[#FFC72C] shadow-[0_0_10px_rgba(255,199,44,0.7)]"></div>
            <span className="text-sm font-medium">{node.nodeType}</span>
            <span className="bg-[#FFC72C]/10 text-[#FFC72C] text-xs px-2 py-1 rounded">ID: {node.id}</span>
          </div>
        </div>
      </div>

      <form id="node-edit-form" onSubmit={handleSubmit} className="p-4 space-y-6 flex-grow">
        <div className="space-y-2">
          <label htmlFor="node-title-input" className={`block text-sm font-medium text-gray-300 ${textAlignClass}`}>{t('nodeEdit.nodeTitle')}</label>
          <input
            id="node-title-input"
            type="text"
            className={`w-full bg-[#161616] text-white border border-[#FFC72C]/30 rounded-md p-2 font-mono text-sm focus:border-[#FFC72C] focus:outline-none ${textAlignClass}`}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="node-value-input" className={`block text-sm font-medium text-gray-300 ${textAlignClass}`}>{getValueLabel()}</label>
          {renderValueInput()}
        </div>

        <div className="space-y-2">
          <label className={`block text-sm font-medium text-gray-300 ${textAlignClass}`}>{t('nodeEdit.socketInfo')}</label>
          <div className="bg-[#161616] border border-[#FFC72C]/20 rounded-md p-3">
            <ul className="space-y-2">
              {node.sockets.map(socket => (
                <li key={socket.id} className="flex items-center justify-between text-sm">
                  <div className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${socket.position === 'input' ? 'bg-blue-400' : 'bg-[#FFC72C]'}`}></div>
                    <span>{socket.title}</span>
                  </div>
                  <div className="text-xs text-gray-400">
                    <span className="uppercase">{t(`nodeEdit.${socket.position}`)}</span>
                    {socket.dataType && <span className="ml-1">- {socket.dataType}</span>}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="pt-4 mt-auto">
          <div className="flex space-x-3">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-4 py-2 border border-gray-600 text-gray-300 rounded-md hover:bg-gray-800 transition-colors"
            >
              {t('nodeEdit.cancel')}
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-[#FFC72C] text-black font-medium rounded-md hover:bg-[#FFB300] transition-colors"
            >
              {t('nodeEdit.saveChanges')}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default NodeEditPanel;