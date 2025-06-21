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
import { ArrowLeft, Save, AlertCircle, CheckCircle, Users, ListTodo, Folder, GitBranch } from "lucide-react";
import { saveWorkspaceToDefaultLocation } from "../utils/storageUtils";
import { useTranslation } from "react-i18next";
import WorkspaceNameDialog from "./WorkspaceNameDialog.tsx";
import { WorkspaceData } from "../types/Types";
import { WorkspaceTab, TasksTab, AgentsTab, AiFlowsTab } from "./tabs";

// Toast notification component
interface ToastProps {
  message: string;
  type: 'success' | 'error';
  onClose: () => void;
  isClosing?: boolean;
}
// Toast notification component
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

type WorkspaceTab = 'workspace' | 'tasks' | 'agents' | 'aiflows';

interface WorkspaceCanvasProps {
  workspaceData: WorkspaceData;
  onReturnToHome: () => void;
}

const WorkspaceCanvas: React.FC<WorkspaceCanvasProps> = ({ workspaceData: initialWorkspaceData, onReturnToHome }) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<WorkspaceTab>('workspace');
  
  // Maintain workspace data in state
  const [workspaceData, setWorkspaceData] = useState<WorkspaceData>(initialWorkspaceData);
  
  // Track if there are unsaved changes
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false);
  
  // Workspace name dialog state
  const [workspaceNameDialogOpen, setWorkspaceNameDialogOpen] = useState<boolean>(false);
  
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
  
  // Handle saving workspace state
  const handleSaveWorkspace = async (workspaceName?: string) => {
    if (!workspaceData) return;
    
    try {
      const updatedWorkspace = { 
        ...workspaceData, 
        name: workspaceName || workspaceData.name,
        updatedAt: Date.now()
      };
      
      // Update state
      setWorkspaceData(updatedWorkspace);
      
      // Save to storage
      await saveWorkspaceToDefaultLocation(updatedWorkspace);
      
      // Clear unsaved changes flag
      setHasUnsavedChanges(false);
      
      showToast(t('workspaces.saved', 'Workspace saved successfully'), 'success');
    } catch (error) {
      console.error("Error saving workspace:", error);
      showToast(t('workspaces.saveError', 'Failed to save workspace'), 'error');
    }
  };
  
  // Handle updating workspace data - only update state, don't save to file
  const handleUpdateWorkspace = async (updatedData: Partial<WorkspaceData>) => {
    if (!workspaceData) return;
    
    try {
      const updatedWorkspace = { 
        ...workspaceData,
        ...updatedData,
        updatedAt: Date.now()
      };
      
      // Update state to reflect changes immediately in UI
      setWorkspaceData(updatedWorkspace);
      
      // Mark that there are unsaved changes
      setHasUnsavedChanges(true);
    } catch (error) {
      console.error("Error updating workspace:", error);
      showToast(t('workspaces.updateError', 'Failed to update workspace'), 'error');
    }
  };
  
  // Handle saving with name
  const handleSaveWithName = async (name: string) => {
    setWorkspaceNameDialogOpen(false);
    await handleSaveWorkspace(name);
  };

  // Tab button component
  const TabButton: React.FC<{ tab: WorkspaceTab; label: string; icon: React.ReactNode }> = ({ tab, label, icon }) => (
    <button
      className={`flex items-center gap-2 px-4 py-2 rounded-t-md font-medium transition-colors
        ${activeTab === tab 
          ? 'bg-[#121212] text-yellow-400 border-t border-l border-r border-gray-700' 
          : 'bg-[#0a0a0a] text-gray-400 hover:text-white'}`}
      onClick={() => setActiveTab(tab)}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
  
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
          {workspaceData.name || t('workspaces.untitled', 'Untitled Workspace')}
        </div>
        
        <div className="flex items-center gap-4">
        {hasUnsavedChanges && (
            <div className="text-gray-500 text-sm font-medium ">
              {t('workspaces.unsavedChanges', 'Unsaved changes')}
            </div>
          )}
          <button
            className="bg-yellow-500 hover:bg-yellow-600 text-black px-3 py-1 rounded text-sm font-medium flex items-center space-x-1"
            onClick={() => setWorkspaceNameDialogOpen(true)}
            title={t('common.save', 'Save')}
          >
            <Save size={14} />
            <span>{t('common.save', 'Save')}</span>
          </button>
        </div>
      </div>
      
      {/* Main canvas area */}
      <div className="absolute inset-0 pt-12 bg-[#0a0a0a]">
        {/* Tabs */}
        <div className="flex border-b border-gray-800 px-4 pt-2 bg-[#0a0a0a]">
          <TabButton 
            tab="workspace" 
            label={t('workspaces.workspace', 'Workspace')} 
            icon={<Folder size={16} />} 
          />
          <TabButton 
            tab="tasks" 
            label={t('workspaces.tasks', 'Tasks')} 
            icon={<ListTodo size={16} />} 
          />
          <TabButton 
            tab="agents" 
            label={t('workspaces.agents', 'Agents')} 
            icon={<Users size={16} />} 
          />
          <TabButton 
            tab="aiflows" 
            label={t('workspaces.aiFlows', 'AI Workflows')} 
            icon={<GitBranch size={16} />} 
          />
        </div>
        
        <div className="w-full h-full overflow-auto p-6">
          {/* Render the appropriate tab component based on activeTab */}
          {activeTab === 'workspace' && <WorkspaceTab workspaceData={workspaceData} onUpdateWorkspace={handleUpdateWorkspace} />}
          {activeTab === 'tasks' && <TasksTab workspaceData={workspaceData} />}
          {activeTab === 'agents' && <AgentsTab workspaceData={workspaceData} />}
          {activeTab === 'aiflows' && <AiFlowsTab workspaceData={workspaceData} />}
        </div>
      </div>
      
      {/* Workspace name dialog */}
      {workspaceNameDialogOpen && (
        <WorkspaceNameDialog
          isOpen={workspaceNameDialogOpen}
          initialName={workspaceData.name}
          onClose={() => setWorkspaceNameDialogOpen(false)}
          onSave={handleSaveWithName}
        />
      )}
      
      {/* Toast notification */}
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

export default WorkspaceCanvas;