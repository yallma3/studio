/*
* yaLLMa3 - Framework for building AI agents that are capable of learning from their environment and interacting with it.
 
 * Copyright (C) 2025 yaLLMa3
 
 * This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0.
   If a copy of the MPL was not distributed with this file, You can obtain one at https://www.mozilla.org/MPL/2.0/.
 
 * This software is distributed on an "AS IS" basis,
   WITHOUT WARRANTY OF ANY KIND, either express or implied.
   See the Mozilla Public License for the specific language governing rights and limitations under the License.
*/
import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { WorkspaceData } from "../types/Types";
import NodeCanvas from "../../flow/NodeCanvas";
import { CanvasState, reattachNodeProcessors } from "../../flow/utils/storageUtils";
import { Plus, ArrowRight, Trash2, X, Download, Upload, FolderOpen } from "lucide-react";
import { 
  WorkflowFile, 
  loadAllWorkflowsFromFiles, 
  createNewWorkflow, 
  deleteWorkflowFile, 
  updateWorkflowFile,
  saveWorkflowToFile,
  generateWorkflowId
} from "../utils/workflowStorageUtils";
import { saveWorkspaceToDefaultLocation } from "../utils/storageUtils";
import { open } from '@tauri-apps/plugin-dialog';
import { readTextFile } from '@tauri-apps/plugin-fs';

interface AiFlowsTabProps {
  workspaceData: WorkspaceData;
  onTabChanges?: () => void;
}

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
              {t('workspaces.createNewFlow', 'Create New Workflow')}
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
              {t('workspaces.workflowName', 'Workflow Name')} *
            </label>
            <input
              id="workflow-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={t('workspaces.enterWorkflowName', 'Enter workflow name...')}
              className="w-full px-3 py-2 bg-[#0a0a0a] border border-zinc-700 rounded-md text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              required
              disabled={isSubmitting}
              autoFocus
            />
          </div>

          <div>
            <label htmlFor="workflow-description" className="block text-sm font-medium text-zinc-300 mb-2">
              {t('workspaces.workflowDescription', 'Description')}
            </label>
            <textarea
              id="workflow-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={t('workspaces.enterWorkflowDescription', 'Enter workflow description...')}
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


// Workflow Import Dialog Component
const WorkflowImportDialog: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onImport: (workflowIds: string[]) => void;
  currentWorkspaceWorkflows: string[];
}> = ({ isOpen, onClose, onImport, currentWorkspaceWorkflows }) => {

  const { t } = useTranslation();
  const [availableWorkflows, setAvailableWorkflows] = useState<WorkflowFile[]>([]);
  const [selectedWorkflows, setSelectedWorkflows] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  // Load available workflows when dialog opens
  useEffect(() => {
    if (isOpen) {
      loadAvailableWorkflows();
      setSelectedWorkflows([]);
    }
  }, [isOpen, currentWorkspaceWorkflows]);

  const loadAvailableWorkflows = async () => {
    try {
      setIsLoading(true);
      const allWorkflows = await loadAllWorkflowsFromFiles();
      // Filter out workflows already in the current workspace
      const filteredWorkflows = allWorkflows.filter(workflow => 
        !currentWorkspaceWorkflows.includes(workflow.id)
      );
      setAvailableWorkflows(filteredWorkflows);
    } catch (error) {
      console.error('Error loading available workflows:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleWorkflowToggle = (workflowId: string) => {
    setSelectedWorkflows(prev => 
      prev.includes(workflowId) 
        ? prev.filter(id => id !== workflowId)
        : [...prev, workflowId]
    );
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
      
      // Import the new workflow
      onImport([newWorkflowId]);
      onClose();
    } catch (error) {
      console.error('Error importing workflow from device:', error);
      alert('Error importing workflow file. Please check the file format.');
    }
  };

  const handleImportSelected = () => {
    if (selectedWorkflows.length === 0) return;
    setIsImporting(true);
    onImport(selectedWorkflows);
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 backdrop-blur-sm">
      <div className="bg-gradient-to-br from-[#1c1c1c] to-[#161616] rounded-2xl shadow-2xl border border-zinc-700/50 p-6 max-w-2xl w-full mx-4 h-[600px] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-600/10 border border-blue-600/20 flex items-center justify-center">
              <Download size={14} className="text-blue-400" />
            </div>
            <h3 className="text-lg font-semibold text-white">
              {t('workspaces.importWorkflows', 'Import Workflows')}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white transition-colors p-1"
            disabled={isImporting}
          >
            <X size={18} />
          </button>
        </div>

        {/* Import Options */}
        <div className="mb-6">
          <button
            onClick={handleImportFromDevice}
            className="w-full flex items-center gap-3 p-3 bg-zinc-900/20 rounded-lg border border-zinc-800/40 hover:border-zinc-700/60 hover:bg-zinc-900/30 transition-all duration-200 text-left"
            disabled={isImporting}
          >
            <div className="w-8 h-8 rounded-md bg-zinc-800/50 border border-zinc-700/50 flex items-center justify-center">
              <Upload size={14} className="text-zinc-400" />
            </div>
            <div>
              <div className="text-zinc-200 font-medium text-sm">
                {t('workspaces.importFromDevice', 'Import from Device')}
              </div>
              <div className="text-xs text-zinc-500">
                {t('workspaces.importFromDeviceDescription', 'Browse and select a workflow file from your computer')}
              </div>
            </div>
          </button>
        </div>

        {/* Available Workflows */}
        <div className="flex-1 min-h-0 flex flex-col">
          <div className="flex items-center gap-2 mb-3">
            <FolderOpen size={14} className="text-zinc-500" />
            <h4 className="text-sm font-medium text-zinc-300">
              {t('workspaces.availableWorkflows', 'Available Workflows')}
            </h4>
            <span className="text-xs text-zinc-500">
              ({availableWorkflows.length} available)
            </span>
          </div>

          <div className="flex-1 overflow-y-auto pr-2 space-y-1.5">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-zinc-500 text-sm">{t('common.loading', 'Loading...')}</div>
              </div>
            ) : availableWorkflows.length === 0 ? (
              <div className="text-center py-8 text-zinc-500 text-sm">
                {t('workspaces.noAvailableWorkflows', 'No workflows available to import')}
              </div>
            ) : (
              availableWorkflows.map((workflow) => (
                <label key={workflow.id} className="flex items-start gap-2.5 p-2.5 bg-zinc-900/20 rounded-md border border-zinc-800/30 hover:border-zinc-700/50 hover:bg-zinc-900/30 cursor-pointer transition-colors group">
                  <input
                    type="checkbox"
                    checked={selectedWorkflows.includes(workflow.id)}
                    onChange={() => handleWorkflowToggle(workflow.id)}
                    className="w-3.5 h-3.5 mt-0.5 text-blue-600 bg-zinc-800 border-zinc-600 rounded focus:ring-blue-500 focus:ring-1"
                    disabled={isImporting}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <h5 className="font-medium text-zinc-200 text-sm truncate group-hover:text-white transition-colors">{workflow.name}</h5>
                      <span className="text-xs text-zinc-600">
                        {formatDate(workflow.updatedAt)}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-500 mb-1.5 line-clamp-1">
                      {workflow.description || t('workspaces.noDescriptionProvided', 'No description provided')}
                    </p>
                    <div className="flex items-center gap-3 text-xs text-zinc-600">
                      <span>{workflow.canvasState.nodes.length} nodes</span>
                      <span>{workflow.canvasState.connections.length} connections</span>
                    </div>
                  </div>
                </label>
              ))
            )}
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex justify-between items-center pt-4 border-t border-zinc-800/50 mt-4">
          <div className="text-xs text-zinc-500">
            {selectedWorkflows.length > 0 && (
              <span>{selectedWorkflows.length} workflow(s) selected</span>
            )}
          </div>
          <div className="flex gap-2.5">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50 rounded-md transition-colors duration-200 border border-zinc-700/50 hover:border-zinc-600/50"
              disabled={isImporting}
            >
              {t('common.cancel', 'Cancel')}
            </button>
            <button
              onClick={handleImportSelected}
              className="px-4 py-2 text-xs font-medium bg-blue-600/10 text-blue-400 border border-blue-600/30 hover:bg-blue-600/20 hover:border-blue-500/40 hover:text-blue-300 rounded-md transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={selectedWorkflows.length === 0 || isImporting}
            >
              {isImporting ? t('common.importing', 'Importing...') : t('common.import', 'Import Selected')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Generate clean, short random string
const generateCleanId = (length: number = 6): string => {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

// Generate unique graph ID - updated format
const generateGraphId = (): string => {
  const shortDate = Date.now().toString().slice(-6);
  const randomPart = generateCleanId(3);
  return `gf-${shortDate}${randomPart}`;
};

const AiFlowsTab: React.FC<AiFlowsTabProps> = ({ workspaceData, onTabChanges }) => {
  const { t } = useTranslation();
  const [selectedWorkflow, setSelectedWorkflow] = useState<CanvasState | null>(null);
  const [selectedWorkflowMeta, setSelectedWorkflowMeta] = useState<WorkflowFile | null>(null);
  const [showCanvas, setShowCanvas] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [deleteCompletely, setDeleteCompletely] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [workflows, setWorkflows] = useState<WorkflowFile[]>([]);
  const [loading, setLoading] = useState(true);

  // Load workflows from file system on component mount
  useEffect(() => {
    const loadWorkflows = async () => {
      try {
        setLoading(true);
        
        // If workspace has no workflows, don't load any
        if (!workspaceData.workflows || workspaceData.workflows.length === 0) {
          setWorkflows([]);
          return;
        }
        
        // Load all workflows from file system
        const allWorkflows = await loadAllWorkflowsFromFiles();
        
        // Filter to only include workflows that are referenced in this workspace
        const workspaceWorkflowIds = workspaceData.workflows.map(w => w.id);
        const filteredWorkflows = allWorkflows.filter(workflow => 
          workspaceWorkflowIds.includes(workflow.id)
        );
        
        setWorkflows(filteredWorkflows);
      } catch (error) {
        console.error('Error loading workflows:', error);
      } finally {
        setLoading(false);
      }
    };

    loadWorkflows();
  }, [workspaceData.workflows]);

  // Update workspace data with workflow references
  const updateWorkspaceWorkflows = async (updatedWorkflows: WorkflowFile[]) => {
    try {
      // Update workspace data workflows array to reference the saved workflows
      workspaceData.workflows = updatedWorkflows.map(workflow => ({
        id: workflow.id,
        name: workflow.name,
        description: workflow.description
      }));

      // Save the updated workspace data
      await saveWorkspaceToDefaultLocation(workspaceData);
      
      // Signal that tab has changes
      onTabChanges?.();
    } catch (error) {
      console.error('Error updating workspace workflows:', error);
    }
  };

  // Format date for display
  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString();
  };

  const handleCreateNewFlow = () => {

    setShowCreateDialog(true);
  };

  const handleImportFlow = () => {
    setShowImportDialog(true);
  };

  const handleImportWorkflows = async (workflowIds: string[]) => {
    try {
      // Load the workflows to be imported
      const allWorkflows = await loadAllWorkflowsFromFiles();
      const workflowsToImport = allWorkflows.filter(w => workflowIds.includes(w.id));
      
      // Add to current workflows
      const updatedWorkflows = [...workflows, ...workflowsToImport];
      setWorkflows(updatedWorkflows);
      
      // Update workspace data
      await updateWorkspaceWorkflows(updatedWorkflows);
      
      // Close dialog
      setShowImportDialog(false);
    } catch (error) {
      console.error('Error importing workflows:', error);
    }
  };

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
      const newWorkflow = await createNewWorkflow(
        name,
        description,
        canvasState
      );

      // Update local state
      const updatedWorkflows = [newWorkflow, ...workflows];
      setWorkflows(updatedWorkflows);
      
      // Update workspace data
      await updateWorkspaceWorkflows(updatedWorkflows);

      // Close dialog
      setShowCreateDialog(false);

      // Open the canvas with the new workflow
      setSelectedWorkflow(canvasState);
      setSelectedWorkflowMeta(newWorkflow);
      setShowCanvas(true);
    } catch (error) {
      console.error('Error creating new workflow:', error);
      // Keep dialog open on error so user can retry
    }
  };

  const handleEditFlow = (workflow: WorkflowFile) => {
    const reattachedNodes = reattachNodeProcessors(workflow.canvasState.nodes);
    workflow.canvasState.nodes = reattachedNodes;
    setSelectedWorkflow(workflow.canvasState);
    setSelectedWorkflowMeta(workflow);
    setShowCanvas(true);
  };

  const handleDeleteFlow = (workflowId: string) => {
    setShowDeleteConfirm(workflowId);
  };

  const confirmDeleteFlow = async (workflowId: string) => {
    try {
      if (deleteCompletely) {
        // Delete workflow file completely
        await deleteWorkflowFile(workflowId);
      }
      
      // Remove workflow from workspace (always done, regardless of deleteCompletely)
      const updatedWorkflows = workflows.filter(w => w.id !== workflowId);
      setWorkflows(updatedWorkflows);
      
      // Update workspace data
      await updateWorkspaceWorkflows(updatedWorkflows);
      
      // Close confirmation dialog and reset state
      setShowDeleteConfirm(null);
      setDeleteCompletely(false);
    } catch (error) {
      console.error('Error deleting workflow:', error);
    }

    
    // Signal that tab has changes
    onTabChanges?.();
    
    // Close confirmation dialog
    setShowDeleteConfirm(null);

  };

  const cancelDeleteFlow = () => {
    setShowDeleteConfirm(null);
    setDeleteCompletely(false);
  };

  const handleReturnToList = async (updatedCanvasState?: CanvasState) => {
    // If canvas state was updated, save it
    if (updatedCanvasState && selectedWorkflowMeta) {
      try {
        const updatedWorkflow = await updateWorkflowFile(selectedWorkflowMeta.id, {
          canvasState: updatedCanvasState,
          name: updatedCanvasState.graphName || selectedWorkflowMeta.name
        });

        if (updatedWorkflow) {
          // Update local state
          const updatedWorkflows = workflows.map(w => 
            w.id === updatedWorkflow.id ? updatedWorkflow : w
          );
          setWorkflows(updatedWorkflows);
          
          // Update workspace data
          await updateWorkspaceWorkflows(updatedWorkflows);
        }
      } catch (error) {
        console.error('Error updating workflow:', error);
      }
    }

    setShowCanvas(false);
    setSelectedWorkflow(null);
    setSelectedWorkflowMeta(null);
  };

  if (showCanvas) {
    return (
      <div className="fixed inset-0 z-50">
        <NodeCanvas 
          graph={selectedWorkflow} 
          onReturnToHome={handleReturnToList}
          workflowMeta={selectedWorkflowMeta}
        />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-zinc-400">{t('common.loading', 'Loading...')}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-[#121212] rounded-md">
        <div className="flex justify-between items-center p-6 border-b border-[#FFC72C]/50">
          <div className="flex items-center">
            <h2 className="text-xl font-bold text-white">
              {t('workspaces.aiFlows', 'AI Workflows')}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={handleImportFlow} 
              className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm flex items-center gap-1"
            >
              <Download size={16} />
              {t('workspaces.importFlow', 'Import')}
            </button>
            <button 
              onClick={handleCreateNewFlow} 
              className="bg-[#FFC72C] hover:bg-[#E6B428] text-black px-3 py-1 rounded text-sm flex items-center gap-1"
            >
              <Plus size={16} />
              {t('workspaces.createFlow', 'Create New Flow')}
            </button>
          </div>
        </div>
        
        {workflows && workflows.length > 0 ? (
          <div className="overflow-y-auto h-[calc(100vh-200px)]">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6">
              {workflows.map((workflow: WorkflowFile) => (
                <div key={workflow.id} className="group bg-gradient-to-br from-[#1a1a1a] to-[#151515] rounded-xl border border-zinc-800/50 hover:border-zinc-700/70 transition-all duration-200 hover:shadow-lg hover:shadow-black/20 p-6 relative overflow-hidden">
                  {/* Subtle background pattern */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.01] to-transparent opacity-50"></div>
                  
                  {/* Header with title and actions */}
                  <div className="flex justify-between items-start mb-4 relative z-10">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        {/* Workflow icon */}
                        <div className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center bg-gradient-to-br from-purple-600/20 to-purple-700/20 border border-purple-600/30">
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-purple-400">
                            <rect width="18" height="18" x="3" y="3" rx="2"/>
                            <path d="M9 9h6v6H9z"/>
                            <path d="m9 12 2 2 4-4"/>
                          </svg>
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-white text-xl leading-tight truncate group-hover:text-purple-400 transition-colors duration-200">
                            {workflow.name}
                          </h3>
                          <p className="text-zinc-400 text-sm mt-1">
                            {t('workspaces.lastUpdated', 'Last updated')}: {formatDate(workflow.updatedAt)}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    {/* Action buttons */}
                    <div className="flex gap-1 ml-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <button 
                        onClick={() => handleEditFlow(workflow)} 
                        className="flex items-center justify-center w-8 h-8 text-purple-400 hover:text-purple-300 hover:bg-purple-400/10 rounded-lg transition-all duration-200"
                        title={t('workspaces.editFlow', 'Edit Flow')}
                      >
                        <ArrowRight size={14} />
                      </button>
                      <button 
                        onClick={() => handleDeleteFlow(workflow.id)} 
                        className="flex items-center justify-center w-8 h-8 text-red-400 hover:text-red-300 hover:bg-red-400/10 rounded-lg transition-all duration-200"
                        title={t('workspaces.deleteFlow', 'Delete Flow')}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                  
                  {/* Description */}
                  <div className="bg-[#0a0a0a]/50 rounded-lg p-4 border border-zinc-800/50 relative z-10">
                    <div className="flex items-center gap-2 mb-2">
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-400">
                        <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
                        <polyline points="14,2 14,8 20,8"/>
                      </svg>
                      <span className="text-zinc-400 text-xs font-medium uppercase tracking-wide">
                        {t('workspaces.description', 'Description')}
                      </span>
                    </div>
                    <p className={`text-sm leading-relaxed ${
                      workflow.description ? 'text-zinc-200' : 'text-zinc-500 italic'
                    }`}>
                      {workflow.description || t('workspaces.noDescriptionProvided', 'No description provided')}
                    </p>
                  </div>
                  
                  {/* Workflow Stats */}
                  <div className="mt-4 flex items-center gap-4 text-xs text-zinc-500 relative z-10">
                    <div className="flex items-center gap-1">
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect width="18" height="18" x="3" y="3" rx="2"/>
                        <path d="M9 9h6v6H9z"/>
                      </svg>
                      <span>{workflow.canvasState.nodes.length} nodes</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
                        <polyline points="7.5,4.21 12,6.81 16.5,4.21"/>
                        <polyline points="7.5,19.79 7.5,14.6 3,12"/>
                        <polyline points="21,12 16.5,14.6 16.5,19.79"/>
                      </svg>
                      <span>{workflow.canvasState.connections.length} connections</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-zinc-400 py-8 text-center">
            {t('workspaces.noFlows', 'No AI workflows have been added to this workspace yet')}
          </div>
        )}
      </div>

      {/* Workflow Creation Dialog */}
      <WorkflowCreationDialog
        isOpen={showCreateDialog}
        onClose={() => setShowCreateDialog(false)}
        onSave={handleCreateWorkflow}
      />

      {/* Workflow Import Dialog */}
      <WorkflowImportDialog
        isOpen={showImportDialog}
        onClose={() => setShowImportDialog(false)}
        onImport={handleImportWorkflows}
        currentWorkspaceWorkflows={workspaceData.workflows?.map(w => w.id) || []}
      />

      {/* Delete confirmation dialog */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-gradient-to-br from-[#1c1c1c] to-[#161616] rounded-2xl shadow-2xl border border-zinc-700/50 p-8 max-w-lg w-full mx-4 transform transition-all">
            {/* Header */}
            <div className="flex items-start gap-4 mb-6">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${
                deleteCompletely 
                  ? 'bg-gradient-to-br from-red-500/20 to-red-600/20 border border-red-500/30' 
                  : 'bg-gradient-to-br from-orange-500/20 to-orange-600/20 border border-orange-500/30'
              }`}>
                {deleteCompletely ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-400">
                    <path d="M3 6h18"/>
                    <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/>
                    <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
                    <line x1="10" y1="11" x2="10" y2="17"/>
                    <line x1="14" y1="11" x2="14" y2="17"/>
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-orange-400">
                    <path d="M9 12l2 2 4-4"/>
                    <path d="M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9S7.03 3 12 3s9 4.03 9 9z"/>
                  </svg>
                )}
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-white mb-1">
                  {deleteCompletely 
                    ? t('workspaces.deleteWorkflow', 'Delete Workflow Forever?')
                    : t('workspaces.removeWorkflow', 'Remove from Workspace?')
                  }
                </h3>
                <div className="text-sm text-zinc-400">
                  {workflows.find(w => w.id === showDeleteConfirm)?.name || 'Unknown Workflow'}
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="mb-8">
              <div className={`p-4 rounded-xl border-l-4 ${
                deleteCompletely 
                  ? 'bg-red-500/5 border-red-500 border-l-red-500' 
                  : 'bg-orange-500/5 border-orange-500 border-l-orange-500'
              }`}>
                <p className="text-zinc-200 leading-relaxed">
                  {deleteCompletely 
                    ? t('workspaces.deleteFlowCompletely', '⚠️ This will permanently delete the workflow and all its data. You won\'t be able to recover it or use it in other workspaces.')
                    : t('workspaces.removeFlowFromWorkspace', '✅ This will only remove the workflow from this workspace. You can still use it in other workspaces or add it back later.')
                  }
                </p>
              </div>
            </div>
              
            {/* Checkbox for complete deletion */}
            <div className="mb-8">
              <label className="group flex items-start gap-4 p-4 bg-gradient-to-r from-zinc-900/50 to-zinc-800/30 rounded-xl border border-zinc-700/50 cursor-pointer hover:border-zinc-600/70 transition-all duration-200">
                <div className="relative flex items-center justify-center mt-0.5">
                  <input
                    type="checkbox"
                    checked={deleteCompletely}
                    onChange={(e) => setDeleteCompletely(e.target.checked)}
                    className="w-5 h-5 text-red-600 bg-zinc-800 border-2 border-zinc-600 rounded-md focus:ring-red-500 focus:ring-2 focus:ring-offset-0 transition-colors cursor-pointer"
                  />
                </div>
                <div className="flex-1">
                  <div className="text-base font-medium text-white group-hover:text-zinc-100 transition-colors">
                    {t('workspaces.deleteCompletely', 'Delete workflow file forever')}
                  </div>
                  <div className="text-sm text-zinc-400 mt-1 leading-relaxed">
                    {t('workspaces.deleteCompletelyDescription', 'Check this box if you want to permanently delete the workflow file from your computer. This cannot be undone.')}
                  </div>
                </div>
              </label>
            </div>
            
            {/* Action buttons */}
            <div className="flex justify-end gap-3">
              <button
                onClick={cancelDeleteFlow}
                className="px-5 py-2.5 text-sm font-medium text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50 rounded-lg transition-colors duration-200 border border-zinc-700/50 hover:border-zinc-600/50"
              >
                {t('common.cancel', 'Cancel')}
              </button>
              <button
                onClick={() => confirmDeleteFlow(showDeleteConfirm)}
                className={`px-5 py-2.5 text-sm font-medium rounded-lg transition-colors duration-200 border ${
                  deleteCompletely 
                    ? 'bg-red-600/10 text-red-400 border-red-600/30 hover:bg-red-600/20 hover:border-red-500/40 hover:text-red-300' 
                    : 'bg-orange-600/10 text-orange-400 border-orange-600/30 hover:bg-orange-600/20 hover:border-orange-500/40 hover:text-orange-300'
                }`}
              >
                {deleteCompletely 
                  ? (
                    <span className="flex items-center gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 6h18"/>
                        <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/>
                      </svg>
                      {t('common.deleteForever', 'Delete Forever')}
                    </span>
                  )
                  : (
                    <span className="flex items-center gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M9 12l2 2 4-4"/>
                        <circle cx="12" cy="12" r="10"/>
                      </svg>
                      {t('common.removeFromWorkspace', 'Remove from Workspace')}
                    </span>
                  )
                }
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AiFlowsTab;