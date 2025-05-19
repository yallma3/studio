import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { ProjectData } from "../../types/Types";
import NodeCanvas from "../../../flows/components/NodeCanvas";
import { CanvasState } from "../../../flows/utils/storageUtils";
import { Plus, ArrowRight, Trash2 } from "lucide-react";

interface AiFlowsTabProps {
  projectData: ProjectData;
}

interface Workflow {
  id: string;
  name: string;
  description: string;
  createdAt?: number;
  updatedAt?: number;
  graph?: CanvasState; // Canvas state for the workflow
}

const AiFlowsTab: React.FC<AiFlowsTabProps> = ({ projectData }) => {
  const { t } = useTranslation();
  // const [selectedWorkflow, setSelectedWorkflow] = useState<string | null>(null);
  const [showCanvas, setShowCanvas] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  // Add sample workflows if none exist in the project data
  const [sampleWorkflows] = useState<Workflow[]>([
    { 
      id: 'workflow-1', 
      name: 'Data Analysis Pipeline', 
      description: 'Analyze and process data with multiple steps',
      createdAt: Date.now() - 86400000 * 3, // 3 days ago
      updatedAt: Date.now() - 86400000 * 1  // 1 day ago
    },
    { 
      id: 'workflow-2', 
      name: 'Content Generation', 
      description: 'Generate and review content automatically',
      createdAt: Date.now() - 86400000 * 5, // 5 days ago
      updatedAt: Date.now() - 86400000 * 2  // 2 days ago
    },
    { 
      id: 'workflow-3', 
      name: 'Research Assistant', 
      description: 'Search, summarize, and organize research findings',
      createdAt: Date.now() - 86400000 * 7, // 7 days ago
      updatedAt: Date.now() - 86400000 * 4  // 4 days ago
    }
  ]);

  // Combine project workflows with sample workflows if needed
  const [workflows, setWorkflows] = useState(
    projectData.workflows && projectData.workflows.length > 0 
      ? projectData.workflows 
      : sampleWorkflows
  );

  // Format date for display
  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString();
  };

  const handleCreateNewFlow = () => {
    // setSelectedWorkflow(null);
    setShowCanvas(true);
  };

  const handleEditFlow = (workflowId: string) => {
    // setSelectedWorkflow(workflowId);
    console.log(workflowId);
    setShowCanvas(true);
  };

  const handleDeleteFlow = (workflowId: string) => {
    setShowDeleteConfirm(workflowId);
  };

  const confirmDeleteFlow = (workflowId: string) => {
    // Filter out the workflow to be deleted
    const updatedWorkflows = workflows.filter(w => w.id !== workflowId);
    
    // Update state
    setWorkflows(updatedWorkflows);
    
    // Update project data
    if (projectData.workflows) {
      projectData.workflows = updatedWorkflows;
    }
    
    // Close confirmation dialog
    setShowDeleteConfirm(null);
  };

  const cancelDeleteFlow = () => {
    setShowDeleteConfirm(null);
  };

  const handleReturnToList = () => {
    setShowCanvas(false);
    // setSelectedWorkflow(null);
  };

  if (showCanvas) {
    // Find the selected workflow if editing
    // const selectedGraph = selectedWorkflow 
    //   ? workflows.find(w => w.id === selectedWorkflow)?.graph || null
    //   : null;
      
    return (
      <div className="h-full w-full overflow-hidden">
        <NodeCanvas 
          graph={null} 
          onReturnToHome={handleReturnToList} 
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-[#121212] rounded-md p-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-white">
            {t('projects.aiFlows', 'AI Workflows')}
          </h2>
          <button 
            onClick={handleCreateNewFlow} 
            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm flex items-center gap-1"
          >
            <Plus size={16} />
            {t('projects.createFlow', 'Create New Flow')}
          </button>
        </div>
        
        {workflows && workflows.length > 0 ? (
          <div className="space-y-4">
            {workflows.map((workflow: Workflow) => (
              <div key={workflow.id} className="bg-[#1d1d1d] rounded border border-gray-800 p-4 hover:border-gray-700 transition-colors">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-medium text-white text-lg">{workflow.name}</h3>
                    <p className="text-gray-400 text-sm mt-1">{workflow.description}</p>
                    {workflow.updatedAt && (
                      <p className="text-gray-500 text-xs mt-2">
                        {t('projects.lastUpdated', 'Last updated')}: {formatDate(workflow.updatedAt)}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => handleDeleteFlow(workflow.id)} 
                      className="text-red-400 hover:text-red-300 flex items-center gap-1 text-sm"
                      title={t('projects.deleteFlow', 'Delete Flow')}
                    >
                      <Trash2 size={14} />
                    </button>
                    <button 
                      onClick={() => handleEditFlow(workflow.id)} 
                      className="text-blue-400 hover:text-blue-300 flex items-center gap-1 text-sm"
                    >
                      {t('projects.editFlow', 'Edit Flow')}
                      <ArrowRight size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-[#1d1d1d] rounded border border-gray-800 p-6 text-center">
            <p className="text-gray-400 mb-4">
              {t('projects.noFlows', 'No AI workflows have been created yet')}
            </p>
            <button 
              onClick={handleCreateNewFlow} 
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm inline-flex items-center gap-2"
            >
              <Plus size={16} />
              {t('projects.createFirstFlow', 'Create Your First Workflow')}
            </button>
          </div>
        )}
      </div>

      {/* Delete confirmation dialog */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-[#1d1d1d] rounded-lg p-6 max-w-md w-full mx-4 shadow-xl border border-gray-800">
            <h3 className="text-xl font-medium text-white mb-4">
              {t('projects.confirmDelete', 'Confirm Delete')}
            </h3>
            <p className="text-gray-300 mb-6">
              {t('projects.deleteFlowConfirmation', 'Are you sure you want to delete this workflow? This action cannot be undone.')}
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={cancelDeleteFlow}
                className="px-4 py-2 rounded bg-gray-700 hover:bg-gray-600 text-white"
              >
                {t('common.cancel', 'Cancel')}
              </button>
              <button
                onClick={() => confirmDeleteFlow(showDeleteConfirm)}
                className="px-4 py-2 rounded bg-red-600 hover:bg-red-700 text-white"
              >
                {t('common.delete', 'Delete')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AiFlowsTab;