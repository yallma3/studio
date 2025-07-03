import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Trash2, GitBranch, Clock, Layers, Link2, Plus, Download, X, Edit3 } from 'lucide-react';
import { 
  WorkflowFile, 
  loadAllWorkflowsFromFiles, 
  deleteWorkflowFile, 
  createNewWorkflow,
  saveWorkflowToFile,
  generateWorkflowId,
  updateWorkflowFile
} from '../../../modules/workspace/utils/workflowStorageUtils';
import { CanvasState } from '../../../modules/flow/utils/storageUtils';
import { open } from '@tauri-apps/plugin-dialog';
import { readTextFile } from '@tauri-apps/plugin-fs';
import NodeCanvas from '../../../modules/flow/NodeCanvas';

// Generate clean, short random string
const generateCleanId = (length: number = 6): string => {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

// Generate unique graph ID
const generateGraphId = (): string => {
  const shortDate = Date.now().toString().slice(-6);
  const randomPart = generateCleanId(3);
  return `gf-${shortDate}${randomPart}`;
};

// Workflow Creation Dialog Component
const WorkflowCreationDialog: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string, description: string) => void;
}> = ({ isOpen, onClose, onSave }) => {
  const { t } = useTranslation();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset form when dialog opens
  useEffect(() => {
    if (isOpen) {
      setName("");
      setDescription("");
      setIsSubmitting(false);
    }
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    
    setIsSubmitting(true);
    onSave(name.trim(), description.trim());
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 backdrop-blur-sm">
      <div className="bg-gradient-to-br from-[#1a1a1a] to-[#151515] rounded-xl shadow-2xl border border-zinc-800/50 p-6 max-w-md w-full mx-4">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-600/20 to-purple-700/20 border border-purple-600/30 flex items-center justify-center">
              <Plus size={16} className="text-purple-400" />
            </div>
            <h3 className="text-xl font-bold text-white">
              {t('settings.createNewWorkflow', 'Create New Workflow')}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white transition-colors p-1"
            disabled={isSubmitting}
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="workflow-name" className="block text-sm font-medium text-zinc-300 mb-2">
              {t('settings.workflowName', 'Workflow Name')} *
            </label>
            <input
              id="workflow-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={t('settings.enterWorkflowName', 'Enter workflow name...')}
              className="w-full px-3 py-2 bg-[#0a0a0a] border border-zinc-700 rounded-md text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              required
              disabled={isSubmitting}
              autoFocus
            />
          </div>

          <div>
            <label htmlFor="workflow-description" className="block text-sm font-medium text-zinc-300 mb-2">
              {t('settings.workflowDescription', 'Description')}
            </label>
            <textarea
              id="workflow-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={t('settings.enterWorkflowDescription', 'Enter workflow description...')}
              className="w-full px-3 py-2 bg-[#0a0a0a] border border-zinc-700 rounded-md text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
              rows={3}
              disabled={isSubmitting}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-zinc-300 hover:text-white transition-colors"
              disabled={isSubmitting}
            >
              {t('common.cancel', 'Cancel')}
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm bg-purple-600 hover:bg-purple-700 text-white rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={!name.trim() || isSubmitting}
            >
              {isSubmitting ? t('common.creating', 'Creating...') : t('common.create', 'Create')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};



const AIWorkflowsSection: React.FC = () => {
  const { t } = useTranslation();
  const [workflows, setWorkflows] = useState<WorkflowFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedWorkflow, setSelectedWorkflow] = useState<CanvasState | null>(null);
  const [selectedWorkflowMeta, setSelectedWorkflowMeta] = useState<WorkflowFile | null>(null);
  const [showCanvas, setShowCanvas] = useState(false);

  // Load all workflows from AppData/flow
  const loadWorkflows = async () => {
    try {
      setLoading(true);
      const allWorkflows = await loadAllWorkflowsFromFiles();
      setWorkflows(allWorkflows);
    } catch (error) {
      console.error('Error loading workflows:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWorkflows();
  }, []);

  const handleCreateWorkflow = async (name: string, description: string) => {
    try {
      const newGraphId = generateGraphId();
      const canvasState: CanvasState = {
        graphId: newGraphId,
        graphName: name,
        nodes: [],
        connections: [],
        nextNodeId: 0
      };

      // Create new workflow file
      await createNewWorkflow(
        name,
        description,
        canvasState
      );

      // Refresh the list
      await loadWorkflows();
      setShowCreateDialog(false);
    } catch (error) {
      console.error('Error creating new workflow:', error);
    }
  };

  const handleImportFromDevice = async () => {
    try {
      const filePath = await open({
        title: 'Import Workflow',
        multiple: false,
        filters: [{
          name: 'JSON Files',
          extensions: ['json']
        }]
      });

      if (!filePath || typeof filePath !== 'string') return;

      const fileContent = await readTextFile(filePath);
      const originalWorkflowData = JSON.parse(fileContent) as WorkflowFile;

      // Validate the workflow data - must be WorkflowFile format
      if (!originalWorkflowData.id || !originalWorkflowData.name || !originalWorkflowData.canvasState) {
        alert('Invalid workflow file format.');
        return;
      }

      // Generate new unique ID for the imported workflow
      const newWorkflowId = generateWorkflowId();

      // Create new workflow with new ID and updated timestamps
      const newWorkflowData: WorkflowFile = {
        ...originalWorkflowData,
        id: newWorkflowId,
        createdAt: Date.now(),
        updatedAt: Date.now()
      };

      // Save the workflow to flows directory with new ID
      await saveWorkflowToFile(newWorkflowData);
      
      // Refresh the list
      await loadWorkflows();
    } catch (error) {
      console.error('Error importing workflow from device:', error);
      alert('Error importing workflow file. Please check the file format.');
    }
  };

  const handleEditWorkflow = (workflow: WorkflowFile) => {
    setSelectedWorkflow(workflow.canvasState);
    setSelectedWorkflowMeta(workflow);
    setShowCanvas(true);
  };

  const handleReturnFromCanvas = async (updatedCanvasState?: CanvasState) => {
    // If canvas state was updated, save it
    if (updatedCanvasState && selectedWorkflowMeta) {
      try {
        const updatedWorkflow = await updateWorkflowFile(selectedWorkflowMeta.id, {
          canvasState: updatedCanvasState,
          name: updatedCanvasState.graphName || selectedWorkflowMeta.name
        });

        if (updatedWorkflow) {
          // Update local state
          setWorkflows(prev => prev.map(w => 
            w.id === updatedWorkflow.id ? updatedWorkflow : w
          ));
        }
      } catch (error) {
        console.error('Error updating workflow:', error);
      }
    }

    setShowCanvas(false);
    setSelectedWorkflow(null);
    setSelectedWorkflowMeta(null);
  };

  const handleDeleteWorkflow = async (workflowId: string) => {
    try {
      await deleteWorkflowFile(workflowId);
      setWorkflows(prev => prev.filter(w => w.id !== workflowId));
      setDeleteConfirm(null);
    } catch (error) {
      console.error('Error deleting workflow:', error);
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString(undefined, {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (showCanvas) {
    return (
      <div className="fixed inset-0 z-50">
        <NodeCanvas 
          graph={selectedWorkflow} 
          onReturnToHome={handleReturnFromCanvas}
          workflowMeta={selectedWorkflowMeta}
        />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-6">
        <h2 className="text-2xl font-semibold text-white mb-6">
          {t('settings.aiWorkflows', 'AI Workflows')}
        </h2>
        <div className="flex items-center justify-center py-8">
          <div className="text-gray-400 text-sm">
            {t('common.loading', 'Loading...')}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-semibold text-white mb-2">
              {t('settings.aiWorkflows', 'AI Workflows')}
            </h2>
            <p className="text-gray-400 text-sm">
              {t('settings.aiWorkflowsDescription', 'Manage your saved AI workflows. These are stored locally in your application data folder.')}
            </p>
            <div className="mt-2 text-xs text-gray-500">
              {workflows.length} {workflows.length === 1 ? 'workflow' : 'workflows'} found
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={handleImportFromDevice} 
              className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-sm flex items-center gap-2 transition-colors"
            >
              <Download size={16} />
              {t('settings.importWorkflow', 'Import')}
            </button>
            <button 
              onClick={() => setShowCreateDialog(true)} 
              className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-2 rounded-lg text-sm flex items-center gap-2 transition-colors"
            >
              <Plus size={16} />
              {t('settings.createWorkflow', 'Create New')}
            </button>
          </div>
        </div>
      </div>

      {workflows.length === 0 ? (
        <div className="bg-zinc-900/20 rounded-lg border border-zinc-800/30 p-8 text-center">
          <GitBranch className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
          <h3 className="text-zinc-400 font-medium mb-1">
            {t('settings.noWorkflows', 'No workflows found')}
          </h3>
          <p className="text-zinc-500 text-sm">
            {t('settings.noWorkflowsDescription', 'Create workflows in your projects to see them here.')}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {workflows.map((workflow) => (
            <div
              key={workflow.id}
              className="group bg-zinc-900/20 hover:bg-zinc-900/40 rounded-lg border border-zinc-800/30 hover:border-zinc-700/50 transition-all duration-200 p-4"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  {/* Workflow Icon */}
                  <div className="mt-1 flex-shrink-0">
                    <div className="w-8 h-8 rounded-md bg-zinc-800/50 border border-zinc-700/50 flex items-center justify-center">
                      <GitBranch className="w-4 h-4 text-zinc-400" />
                    </div>
                  </div>
                  
                  {/* Workflow Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-white text-sm mb-1 truncate">
                      {workflow.name}
                    </h3>
                    
                    <p className="text-zinc-400 text-xs mb-2 line-clamp-2">
                      {workflow.description || t('settings.noDescriptionProvided', 'No description provided')}
                    </p>
                    
                    {/* Metadata */}
                    <div className="flex items-center gap-4 text-xs text-zinc-500">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>{formatDate(workflow.updatedAt)}</span>
                        <span className="text-zinc-600">at {formatTime(workflow.updatedAt)}</span>
                      </div>
                      
                      <div className="flex items-center gap-1">
                        <Layers className="w-3 h-3" />
                        <span>{workflow.canvasState.nodes.length} nodes</span>
                      </div>
                      
                      <div className="flex items-center gap-1">
                        <Link2 className="w-3 h-3" />
                        <span>{workflow.canvasState.connections.length} connections</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Action Buttons */}
                <div className="flex-shrink-0 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <button
                    onClick={() => handleEditWorkflow(workflow)}
                    className="p-2 text-zinc-500 hover:text-blue-400 hover:bg-blue-400/10 rounded-md transition-colors"
                    title={t('settings.editWorkflow', 'Edit workflow')}
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setDeleteConfirm(workflow.id)}
                    className="p-2 text-zinc-500 hover:text-red-400 hover:bg-red-400/10 rounded-md transition-colors"
                    title={t('settings.deleteWorkflow', 'Delete workflow')}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-zinc-900 rounded-xl shadow-2xl border border-zinc-700 p-6 max-w-md w-full mx-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-red-500/20 border border-red-500/30 flex items-center justify-center">
                <Trash2 className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">
                  {t('settings.deleteWorkflow', 'Delete Workflow')}
                </h3>
                <p className="text-zinc-400 text-sm">
                  {t('settings.deleteWorkflowConfirm', 'This action cannot be undone.')}
                </p>
              </div>
            </div>
            
            <div className="bg-zinc-800/50 rounded-lg p-3 mb-6">
              <p className="text-zinc-300 text-sm">
                <span className="font-medium">
                  {workflows.find(w => w.id === deleteConfirm)?.name}
                </span>
              </p>
              <p className="text-zinc-500 text-xs mt-1">
                {t('settings.deleteWorkflowWarning', 'This will permanently delete the workflow file from your system.')}
              </p>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 px-4 py-2 text-zinc-300 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors"
              >
                {t('common.cancel', 'Cancel')}
              </button>
              <button
                onClick={() => handleDeleteWorkflow(deleteConfirm)}
                className="flex-1 px-4 py-2 text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
              >
                {t('common.delete', 'Delete')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Workflow Creation Dialog */}
      <WorkflowCreationDialog
        isOpen={showCreateDialog}
        onClose={() => setShowCreateDialog(false)}
        onSave={handleCreateWorkflow}
      />
    </div>
  );
};

export default AIWorkflowsSection; 