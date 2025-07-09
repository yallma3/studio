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

interface GraphNameDialogProps {
  isOpen: boolean;
  initialName?: string;
  onClose: () => void;
  onSave: (name: string) => void;
}

const GraphNameDialog: React.FC<GraphNameDialogProps> = ({
  isOpen,
  initialName = "",
  onClose,
  onSave,
}) => {
  const { t } = useTranslation();
  const [name, setName] = useState(initialName);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus the input when the dialog opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate the input
    if (!name.trim()) {
      setError(t('dialog.nameRequired'));
      return;
    }
    
    onSave(name.trim());
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in">
      <div 
        className="bg-[#111] border border-[#FFB30055] rounded-md max-w-md w-full p-6 shadow-xl animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-semibold text-white mb-4">
          {t('dialog.nameYourGraph')}
        </h2>
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="graph-name" className="block text-sm font-medium text-gray-300 mb-1">
              {t('dialog.graphName')}
            </label>
            <input
              ref={inputRef}
              id="graph-name"
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (error) setError("");
              }}
              className="w-full p-2 bg-[#222] border border-[#444] rounded-md text-white focus:border-[#FFC72C] focus:outline-none focus:ring-1 focus:ring-[#FFC72C]"
              placeholder={t('dialog.enterGraphName')}
            />
            {error && (
              <p className="mt-1 text-sm text-red-400">{error}</p>
            )}
          </div>
          
          <div className="flex justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-white bg-[#333] rounded-md hover:bg-[#444] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#111] focus:ring-[#FFC72C]"
            >
              {t('dialog.cancel')}
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-black bg-[#FFC72C] rounded-md hover:bg-[#FFB300] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#111] focus:ring-[#FFC72C]"
            >
              {t('dialog.save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default GraphNameDialog; 