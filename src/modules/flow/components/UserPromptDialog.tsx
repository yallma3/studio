// studio/src/modules/flow/components/UserPromptDialog.tsx

import React, { useState, useEffect } from "react";
import { X, MessageCircle, Send } from "lucide-react";

interface UserPromptDialogProps {
  isOpen: boolean;
  promptId: string;
  nodeId: number;
  nodeTitle: string;
  message: string;
  onSubmit: (promptId: string, response: string) => void;
  onClose: () => void;
}

const UserPromptDialog: React.FC<UserPromptDialogProps> = ({
  isOpen,
  promptId,
  nodeTitle,
  message,
  onSubmit,
  onClose,
}) => {
  const [userInput, setUserInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset input when dialog opens/closes
  useEffect(() => {
    if (isOpen) {
      setUserInput("");
      setIsSubmitting(false);
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userInput.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await onSubmit(promptId, userInput.trim());
      onClose();
    } catch (error) {
      console.error("Error submitting user prompt:", error);
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Submit on Ctrl/Cmd + Enter
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault(); 
      handleSubmit(e as React.FormEvent);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Dialog */}
      <div className="relative bg-[#1A1A1A] border border-[#FFC72C]/30 rounded-lg shadow-2xl w-full max-w-lg mx-4 animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <div className="flex items-center gap-3">
            <div className="bg-[#FFC72C]/20 p-2 rounded-lg">
              <MessageCircle size={20} className="text-[#FFC72C]" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">User Input Required</h2>
              <p className="text-sm text-gray-400">{nodeTitle}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors p-1 hover:bg-gray-800 rounded"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6">
          {/* Prompt Message */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              {message || "Please provide your input:"}
            </label>
            <textarea
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your response here..."
              className="w-full px-4 py-3 bg-[#111] border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#FFC72C]/50 focus:border-[#FFC72C] transition-all resize-none"
              rows={4}
              autoFocus
              disabled={isSubmitting}
            />
            <p className="text-xs text-gray-500 mt-2">
              Press <kbd className="px-1.5 py-0.5 bg-gray-800 rounded text-[#FFC72C]">Ctrl</kbd> + <kbd className="px-1.5 py-0.5 bg-gray-800 rounded text-[#FFC72C]">Enter</kbd> to submit
            </p>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!userInput.trim() || isSubmitting}
              className={`
                flex items-center gap-2 px-6 py-2 rounded-lg font-medium transition-all
                ${
                  !userInput.trim() || isSubmitting
                    ? "bg-gray-700 text-gray-500 cursor-not-allowed"
                    : "bg-[#FFC72C] text-black hover:bg-[#FFB300] hover:shadow-lg hover:shadow-[#FFC72C]/20"
                }
              `}
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send size={16} />
                  Submit
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UserPromptDialog;
