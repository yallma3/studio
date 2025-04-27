import React, { useState, useCallback } from "react";
import { ArrowLeft, Save, AlertCircle, CheckCircle } from "lucide-react";
import { ProjectState, saveProjectState } from "../utils/storageUtils";
import { useTranslation } from "react-i18next";
import ProjectNameDialog from "./ProjectNameDialog.tsx";

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

interface ProjectCanvasProps {
  project: ProjectState | null;
  onReturnToHome: () => void;
}

const ProjectCanvas: React.FC<ProjectCanvasProps> = ({ project, onReturnToHome }) => {
  const { t } = useTranslation();
  
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
  const handleSaveProjectState = async (projectName?: string) => {
    if (!project) return;
    
    try {
      const name = projectName || project.projectName;
      await saveProjectState({ 
        ...project, 
        projectName: name,
        updatedAt: Date.now()
      });
      showToast(t('projects.saved', 'Project saved successfully'), 'success');
    } catch (error) {
      console.error("Error saving project state:", error);
      showToast(t('projects.saveError', 'Failed to save project'), 'error');
    }
  };
  
  // Handle saving with name
  const handleSaveWithName = async (name: string) => {
    setProjectNameDialogOpen(false);
    await handleSaveProjectState(name);
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
          {project?.projectName || t('projects.untitled', 'Untitled Project')}
        </div>
        
        <div className="flex items-center space-x-2">
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
        <div className="w-full h-full flex flex-col p-6">
          {/* Project details section */}
          <div className="bg-[#121212] rounded-md p-4 mb-6">
            <h2 className="text-xl font-bold text-white mb-4">{t('projects.details', 'Project Details')}</h2>
            
            <div className="mb-4">
              <label className="block text-gray-400 mb-1">{t('projects.name', 'Name')}</label>
              <div className="text-white font-medium">{project?.projectName || t('projects.untitled', 'Untitled Project')}</div>
            </div>
            
            <div className="mb-4">
              <label className="block text-gray-400 mb-1">{t('projects.description', 'Description')}</label>
              <div className="text-white">
                {project?.description || t('projects.noDescription', 'No description provided')}
              </div>
            </div>
            
            <div className="mb-4">
              <label className="block text-gray-400 mb-1">{t('projects.id', 'Project ID')}</label>
              <div className="text-gray-300 font-mono text-sm">{project?.projectId}</div>
            </div>
            
            <div className="flex gap-4">
              <div>
                <label className="block text-gray-400 mb-1">{t('projects.created', 'Created')}</label>
                <div className="text-gray-300 text-sm">
                  {project?.createdAt 
                    ? new Date(project.createdAt).toLocaleString() 
                    : t('projects.unknown', 'Unknown')}
                </div>
              </div>
              <div>
                <label className="block text-gray-400 mb-1">{t('projects.updated', 'Last Updated')}</label>
                <div className="text-gray-300 text-sm">
                  {project?.updatedAt 
                    ? new Date(project.updatedAt).toLocaleString() 
                    : t('projects.unknown', 'Unknown')}
                </div>
              </div>
            </div>
          </div>
          
          {/* Associated flows */}
          <div className="bg-[#121212] rounded-md p-4 mb-6">
            <h2 className="text-xl font-bold text-white mb-4">{t('projects.flows', 'Flows')}</h2>
            
            {project?.flows && project.flows.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {project.flows.map(flowId => (
                  <div key={flowId} className="bg-[#1d1d1d] rounded border border-gray-800 p-3">
                    <div className="font-medium text-white">{flowId}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-gray-400">{t('projects.noFlows', 'No flows associated with this project')}</div>
            )}
            
            <button className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm">
              {t('projects.addFlow', 'Add Flow')}
            </button>
          </div>
          
          {/* Associated agents */}
          <div className="bg-[#121212] rounded-md p-4">
            <h2 className="text-xl font-bold text-white mb-4">{t('projects.agents', 'Agents')}</h2>
            
            {project?.agents && project.agents.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {project.agents.map(agentId => (
                  <div key={agentId} className="bg-[#1d1d1d] rounded border border-gray-800 p-3">
                    <div className="font-medium text-white">{agentId}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-gray-400">{t('projects.noAgents', 'No agents associated with this project')}</div>
            )}
            
            <button className="mt-4 bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm">
              {t('projects.addAgent', 'Add Agent')}
            </button>
          </div>
        </div>
      </div>
      
      {/* Project name dialog */}
      {projectNameDialogOpen && (
        <ProjectNameDialog
          isOpen={projectNameDialogOpen}
          initialName={project?.projectName || ''}
          onClose={() => setProjectNameDialogOpen(false)}
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

export default ProjectCanvas; 