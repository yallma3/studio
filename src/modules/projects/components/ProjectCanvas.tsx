import React, { useState, useCallback } from "react";
import { ArrowLeft, Save, AlertCircle, CheckCircle } from "lucide-react";
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


  
  return (
    <div className="w-full h-screen bg-black overflow-hidden flex flex-col">
      {/* Header */}
      <div className="border-b border-zinc-800 bg-zinc-900/50 backdrop-blur-sm relative z-10">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <button 
              className="text-zinc-400 hover:text-white p-2 rounded flex items-center"
              onClick={onReturnToHome}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </button>
            <div>
              <h1 className="text-xl font-semibold text-white">
                {workspaceData.name || t('workspaces.untitled', 'Untitled Workspace')}
              </h1>
          
            </div>
          </div>
          <div className="flex items-center gap-4">
            {hasUnsavedChanges && (
              <div className="text-zinc-500 text-sm font-medium">
                {t('workspaces.unsavedChanges', 'Unsaved changes')}
              </div>
            )}
            <button 
              className="bg-[#FFC72C] hover:bg-[#FFD700] text-black font-medium px-4 py-2 rounded flex items-center gap-2 transition-colors"
              onClick={() => setWorkspaceNameDialogOpen(true)}
            >
              <Save className="h-4 w-4" />
              Save
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="px-6">
          <div className="flex gap-6">
            {[
              { key: 'workspace', label: t('workspaces.workspace', 'Workspace') },
              { key: 'tasks', label: t('workspaces.tasks', 'Tasks') },
              { key: 'agents', label: t('workspaces.agents', 'Agents') },
              { key: 'aiflows', label: t('workspaces.aiFlows', 'AI Workflows') }
            ].map((tab) => (
              <button
                key={tab.key}
                className={`pb-4 px-1 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.key
                    ? "border-[#FFC72C] text-[#FFC72C]"
                    : "border-transparent text-zinc-400 hover:text-white hover:border-zinc-600"
                }`}
                onClick={() => setActiveTab(tab.key as WorkspaceTab)}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>
      
      {/* Main canvas area */}
      <div className="flex-1 bg-[#0a0a0a] overflow-hidden">
        
        <div className="w-full h-full overflow-auto">
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