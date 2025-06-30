/*
* yaLLMa3 - Framework for building AI agents that are capable of learning from their environment and interacting with it.
 
 * Copyright (C) 2025 yaLLMa3
 
 * This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0.
   If a copy of the MPL was not distributed with this file, You can obtain one at https://www.mozilla.org/MPL/2.0/.
 
 * This software is distributed on an "AS IS" basis,
   WITHOUT WARRANTY OF ANY KIND, either express or implied.
   See the Mozilla Public License for the specific language governing rights and limitations under the License.
*/

import React, { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";

interface AgentNameDialogProps {
  isOpen: boolean;
  initialName: string;
  onClose: () => void;
  onSave: (name: string) => void;
}

const AgentNameDialog: React.FC<AgentNameDialogProps> = ({ isOpen, initialName, onClose, onSave }) => {
  const [name, setName] = useState(initialName || "");
  const { t } = useTranslation();
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Focus input when dialog opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);
  
  // Handle submit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onSave(name.trim());
    }
  };
  
  // Handler for clicking outside to close
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };
  
  // Escape key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);
  
  return (
    <div 
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      onClick={handleBackdropClick}
    >
      <div className="bg-[#1f2937] rounded-lg shadow-xl p-6 w-full max-w-md border border-gray-700">
        <h2 className="text-xl font-bold text-white mb-4 font-mono">
          {t('agents.nameDialog.title', 'Save Agent')}
        </h2>
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="agentName" className="block text-sm font-medium text-gray-400 mb-1 font-mono">
              {t('agents.nameDialog.name', 'Agent Name')}
            </label>
            <input
              ref={inputRef}
              type="text"
              id="agentName"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-[#111827] border border-gray-600 rounded px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent font-mono"
              placeholder={t('agents.nameDialog.placeholder', 'Enter a name for your agent')}
            />
          </div>
          
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-transparent border border-gray-600 text-gray-300 hover:bg-gray-700 rounded font-mono"
            >
              {t('common.cancel', 'Cancel')}
            </button>
            <button
              type="submit"
              disabled={!name.trim()}
              className={`px-4 py-2 rounded font-mono ${
                name.trim() 
                  ? 'bg-yellow-500 hover:bg-yellow-600 text-black' 
                  : 'bg-gray-700 text-gray-400 cursor-not-allowed'
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

export default AgentNameDialog; 