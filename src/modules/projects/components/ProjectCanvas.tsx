import React, { useState, useCallback } from "react";
import { ArrowLeft, Save, AlertCircle, CheckCircle, Users, ListTodo, Folder } from "lucide-react";
import { saveProjectToDefaultLocation } from "../utils/storageUtils";
import { useTranslation } from "react-i18next";
import ProjectNameDialog from "./ProjectNameDialog.tsx";
import { ProjectData } from "../types/Types";
import { ProjectTab, TasksTab, AgentsTab } from "./tabs";

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

type TabType = 'project' | 'tasks' | 'agents';

interface ProjectCanvasProps {
  projectData: ProjectData;
  onReturnToHome: () => void;
}

const ProjectCanvas: React.FC<ProjectCanvasProps> = ({ projectData: initialProjectData, onReturnToHome }) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<TabType>('project');
  
  // Maintain project data in state
  const [projectData, setProjectData] = useState<ProjectData>(initialProjectData);
  
  // Track if there are unsaved changes
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false);
  
  // Project name dialog state
  const [projectNameDialogOpen, setProjectNameDialogOpen] = useState<boolean>(false);
  
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
  
  // Handle saving project state
  const handleSaveProject = async (projectName?: string) => {
    if (!projectData) return;
    
    try {
      const updatedProject = { 
        ...projectData, 
        name: projectName || projectData.name,
        updatedAt: Date.now()
      };
      
      // Update state
      setProjectData(updatedProject);
      
      // Save to storage
      await saveProjectToDefaultLocation(updatedProject);
      
      // Clear unsaved changes flag
      setHasUnsavedChanges(false);
      
      showToast(t('projects.saved', 'Project saved successfully'), 'success');
    } catch (error) {
      console.error("Error saving project:", error);
      showToast(t('projects.saveError', 'Failed to save project'), 'error');
    }
  };
  
  // Handle updating project data - only update state, don't save to file
  const handleUpdateProject = async (updatedData: Partial<ProjectData>) => {
    if (!projectData) return;
    
    try {
      const updatedProject = { 
        ...projectData,
        ...updatedData,
        updatedAt: Date.now()
      };
      
      // Update state to reflect changes immediately in UI
      setProjectData(updatedProject);
      
      // Mark that there are unsaved changes
      setHasUnsavedChanges(true);
    } catch (error) {
      console.error("Error updating project:", error);
      showToast(t('projects.updateError', 'Failed to update project'), 'error');
    }
  };
  
  // Handle saving with name
  const handleSaveWithName = async (name: string) => {
    setProjectNameDialogOpen(false);
    await handleSaveProject(name);
  };

  // Tab button component
  const TabButton: React.FC<{ tab: TabType; label: string; icon: React.ReactNode }> = ({ tab, label, icon }) => (
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
          {projectData.name || t('projects.untitled', 'Untitled Project')}
        </div>
        
        <div className="flex items-center gap-4">
        {hasUnsavedChanges && (
            <div className="text-gray-500 text-sm font-medium ">
              {t('projects.unsavedChanges', 'Unsaved changes')}
            </div>
          )}
          <button
            className="bg-yellow-500 hover:bg-yellow-600 text-black px-3 py-1 rounded text-sm font-medium flex items-center space-x-1"
            onClick={() => setProjectNameDialogOpen(true)}
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
            tab="project" 
            label={t('projects.project', 'Project')} 
            icon={<Folder size={16} />} 
          />
          <TabButton 
            tab="tasks" 
            label={t('projects.tasks', 'Tasks')} 
            icon={<ListTodo size={16} />} 
          />
          <TabButton 
            tab="agents" 
            label={t('projects.agents', 'Agents')} 
            icon={<Users size={16} />} 
          />
        </div>
        
        <div className="w-full h-full overflow-auto p-6">
          {/* Render the appropriate tab component based on activeTab */}
          {activeTab === 'project' && <ProjectTab projectData={projectData} onUpdateProject={handleUpdateProject} />}
          {activeTab === 'tasks' && <TasksTab projectData={projectData} />}
          {activeTab === 'agents' && <AgentsTab projectData={projectData} />}
        </div>
      </div>
      
      {/* Project name dialog */}
      {projectNameDialogOpen && (
        <ProjectNameDialog
          isOpen={projectNameDialogOpen}
          initialName={projectData.name}
          onClose={() => setProjectNameDialogOpen(false)}
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

export default ProjectCanvas;