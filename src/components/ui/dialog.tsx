import React from "react";
import { createPortal } from "react-dom";

interface DialogProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

export const Dialog: React.FC<DialogProps> = ({ open, onClose, children }) => {
  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto">
      <div 
        className="fixed inset-0 bg-black/50" 
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="relative bg-gray-900 rounded-lg shadow-xl max-w-md w-full mx-4 z-10 p-6 my-8 max-h-[90vh] flex flex-col">
        {children}
      </div>
    </div>,
    document.body
  );
};

interface DialogTitleProps {
  children: React.ReactNode;
}

export const DialogTitle: React.FC<DialogTitleProps> = ({ children }) => {
  return (
    <h2 className="text-xl font-bold text-white mb-4 font-mono">
      {children}
    </h2>
  );
};

interface DialogContentProps {
  children: React.ReactNode;
}

export const DialogContent: React.FC<DialogContentProps> = ({ children }) => {
  return (
    <div className="text-gray-300 mb-6 overflow-y-auto flex-1 pr-1 custom-scrollbar">
      {children}
    </div>
  );
};

interface DialogActionsProps {
  children: React.ReactNode;
}

export const DialogActions: React.FC<DialogActionsProps> = ({ children }) => {
  return (
    <div className="flex justify-end space-x-2 mt-auto">
      {children}
    </div>
  );
};
