import React, { useState } from "react";
import { X } from "lucide-react";
import { useTranslation } from "react-i18next";

interface WorkspaceNameDialogProps {
  isOpen: boolean;
  initialName: string;
  onClose: () => void;
  onSave: (name: string) => void;
}

const WorkspaceNameDialog: React.FC<WorkspaceNameDialogProps> = ({
  isOpen,
  initialName,
  onClose,
  onSave
}) => {
  const { t } = useTranslation();
  const [name, setName] = useState(initialName);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onSave(name.trim());
    }
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
      <div className="bg-[#1E1E1E] rounded-lg shadow-lg w-full max-w-md overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700">
          <h3 className="text-lg font-medium text-white">
            {t('workspaces.saveWorkspace', 'Save Workspace')}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white"
          >
            <X size={18} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-4">
          <div className="mb-4">
            <label htmlFor="workspace-name" className="block text-sm font-medium text-gray-300 mb-2">
              {t('workspaces.workspaceName', 'Workspace Name')}
            </label>
            <input
              type="text"
              id="workspace-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('workspaces.enterWorkspaceName', 'Enter workspace name...')}
              className="w-full px-3 py-2 bg-[#2A2A2A] text-white rounded border border-gray-700 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
              autoFocus
            />
          </div>
          
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-300 hover:text-white bg-transparent border border-gray-700 rounded focus:outline-none"
            >
              {t('common.cancel', 'Cancel')}
            </button>
            <button
              type="submit"
              disabled={!name.trim()}
              className={`px-4 py-2 text-sm font-medium text-black rounded focus:outline-none ${
                name.trim()
                  ? 'bg-yellow-500 hover:bg-yellow-600'
                  : 'bg-gray-600 cursor-not-allowed'
              }`}
            >
              {t('common.save', 'Save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default WorkspaceNameDialog; 