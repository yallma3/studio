/*
* yaLLMa3 - Framework for building AI agents that are capable of learning from their environment and interacting with it.
 
 * Copyright (C) 2025 yaLLMa3
 
 * This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0.
   If a copy of the MPL was not distributed with this file, You can obtain one at https://www.mozilla.org/MPL/2.0/.
 
 * This software is distributed on an "AS IS" basis,
   WITHOUT WARRANTY OF ANY KIND, either express or implied.
   See the Mozilla Public License for the specific language governing rights and limitations under the License.
*/

import React, { useState, useCallback } from "react";
import { ArrowLeft, Save, AlertCircle, CheckCircle } from "lucide-react";
import { AgentState, saveAgentState } from "../utils/storageUtils.ts";
import { useTranslation } from "react-i18next";
import AgentNameDialog from "./AgentNameDialog.tsx";

// Toast notification component
interface ToastProps {
  message: string;
  type: 'success' | 'error';
  onClose: () => void;
  isClosing?: boolean;
}

const Toast: React.FC<ToastProps> = ({ message, type, onClose, isClosing = false }) => {
  React.useEffect(() => {
    if (!isClosing) {
      // Auto-hide toast after a delay if not manually closing
      const autoHideTimer = setTimeout(() => {
        onClose();
      }, 2000); // Show for 2 seconds
      
      return () => clearTimeout(autoHideTimer);
    }
  }, [onClose, isClosing]);

  return (
    <div 
      className={`
        fixed bottom-8 left-1/2 transform -translate-x-1/2 
        py-2 px-4 rounded-md shadow-lg flex items-center gap-2 z-50
        transition-all duration-200 ease-out
        ${isClosing ? 'opacity-0 translate-y-3' : 'opacity-100 translate-y-0'}
        ${type === 'success' ? 'bg-[#27272A] text-[#FFC72C]' : 'bg-[#272724] text-red-400'}
      `}
    >
      {type === 'success' ? 
        <CheckCircle size={18} className="text-green-400" /> : 
        <AlertCircle size={18} className="text-red-400" />
      }
      <span>{message}</span>
    </div>
  );
};

interface AgentCanvasProps {
  agent: AgentState | null;
  onReturnToHome: () => void;
}

const AgentCanvas: React.FC<AgentCanvasProps> = ({ agent, onReturnToHome }) => {
  const { t } = useTranslation();
  
  // Agent name dialog state
  const [agentNameDialogOpen, setAgentNameDialogOpen] = useState<boolean>(false);
  
  // Toast notification state
  const [toast, setToast] = useState<{ visible: boolean; message: string; type: 'success' | 'error'; isClosing: boolean }>({
    visible: false,
    message: "",
    type: "success",
    isClosing: false
  });
  
  // Show toast notification
  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({
      visible: true,
      message,
      type,
      isClosing: false
    });
  };
  
  // Hide toast notification with fade-out animation
  const hideToast = useCallback(() => {
    setToast(prev => ({ ...prev, isClosing: true }));
    setTimeout(() => {
      setToast(prev => ({ ...prev, visible: false }));
    }, 200); // Match with transition duration in Toast component
  }, []);
  
  // Handle saving agent state
  const handleSaveAgentState = async (agentName?: string) => {
    if (!agent) return;
    
    try {
      const name = agentName || agent.agentName;
      await saveAgentState({ ...agent, agentName: name });
      showToast(t('agents.saved', 'Agent saved successfully'), 'success');
    } catch (error) {
      console.error("Error saving agent state:", error);
      showToast(t('agents.saveError', 'Failed to save agent'), 'error');
    }
  };
  
  // Handle saving with name
  const handleSaveWithName = async (name: string) => {
    setAgentNameDialogOpen(false);
    await handleSaveAgentState(name);
  };
  
  return (
    <div className="relative w-full h-screen bg-black overflow-hidden">
      {/* Header toolbar */}
      <div className="absolute top-0 left-0 right-0 h-12 bg-[#111827] border-b border-gray-800 flex items-center justify-between px-4 z-10">
        <div className="flex items-center">
          <button 
            className="text-gray-400 hover:text-white p-2 rounded flex items-center space-x-1"
            onClick={onReturnToHome}
            title={t('common.backToHome', 'Back to Home')}
          >
            <ArrowLeft size={16} />
            <span>{t('common.back', 'Back')}</span>
          </button>
        </div>
        
        <div className="text-white font-mono">
          {agent?.agentName || t('agents.untitled', 'Untitled Agent')}
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            className="bg-yellow-500 hover:bg-yellow-600 text-black px-3 py-1 rounded text-sm font-medium flex items-center space-x-1"
            onClick={() => setAgentNameDialogOpen(true)}
            title={t('common.save', 'Save')}
          >
            <Save size={14} />
            <span>{t('common.save', 'Save')}</span>
          </button>
        </div>
      </div>
      
      {/* Main canvas area */}
      <div className="absolute inset-0 pt-12 bg-[#0a0a0a]">
        <div className="w-full h-full flex items-center justify-center text-gray-400">
          <div className="text-center">
            <h2 className="text-xl font-bold mb-4">{t('agents.canvasTitle', 'Agent Canvas')}</h2>
            <p>{t('agents.canvasDescription', 'This is where you will design and configure your AI agent.')}</p>
            <p className="mt-8 text-yellow-400">{t('agents.comingSoon', 'Agent editor coming soon!')}</p>
          </div>
        </div>
      </div>
      
      {/* Agent name dialog */}
      {agentNameDialogOpen && (
        <AgentNameDialog
          isOpen={agentNameDialogOpen}
          initialName={agent?.agentName || ''}
          onClose={() => setAgentNameDialogOpen(false)}
          onSave={handleSaveWithName}
        />
      )}
      
      {/* Toast notifications */}
      {toast.visible && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={hideToast}
          isClosing={toast.isClosing}
        />
      )}
    </div>
  );
};

export default AgentCanvas; 