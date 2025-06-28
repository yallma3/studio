/*
* yaLLMa3 - Framework for building AI agents that are capable of learning from their environment and interacting with it.
 
 * Copyright (C) 2025 yaLLMa3
 
 * This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0.
   If a copy of the MPL was not distributed with this file, You can obtain one at https://www.mozilla.org/MPL/2.0/.
 
 * This software is distributed on an "AS IS" basis,
   WITHOUT WARRANTY OF ANY KIND, either express or implied.
   See the Mozilla Public License for the specific language governing rights and limitations under the License.
*/

import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { WorkspaceData } from "../../types/Types";
import NodeCanvas from "../../../flows/components/NodeCanvas";
import { CanvasState } from "../../../flows/utils/storageUtils";
import { Plus, ArrowRight, Trash2 } from "lucide-react";

interface AiFlowsTabProps {
  workspaceData: WorkspaceData;
}

interface Workflow {
  id: string;
  name: string;
  description: string;
  createdAt?: number;
  updatedAt?: number;
  graph?: CanvasState; // Canvas state for the workflow
}

const AiFlowsTab: React.FC<AiFlowsTabProps> = ({ workspaceData: workspaceData }) => {
  const { t } = useTranslation();
  const [selectedWorkflow, setSelectedWorkflow] = useState<CanvasState | null>(null);



  const [showCanvas, setShowCanvas] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  // Add sample workflows if none exist in the workspace data
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

  // Combine workspace workflows with sample workflows if needed
  const [workflows, setWorkflows] = useState(
    workspaceData.workflows && workspaceData.workflows.length > 0 
      ? workspaceData.workflows 
      : sampleWorkflows
  );

  // Format date for display
  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString();
  };

  const handleCreateNewFlow = () => {
    const newGraphId = `graph-${Date.now()}`;
      const canvasState: CanvasState = {
        graphId: newGraphId,
        graphName: null,
        nodes: [],
        connections: [],
        nextNodeId: 0
      };
    setSelectedWorkflow(canvasState);
    setShowCanvas(true);
  };

  const handleEditFlow = (workflow: CanvasState) => {
    setSelectedWorkflow(workflow);
    console.log(workflow);
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
    
    // Update workspace data
    if (workspaceData.workflows) {
      workspaceData.workflows = updatedWorkflows;
    }
    
    // Close confirmation dialog
    setShowDeleteConfirm(null);
  };

  const cancelDeleteFlow = () => {
    setShowDeleteConfirm(null);
  };

  const handleReturnToList = () => {
    setShowCanvas(false);
    setSelectedWorkflow(null);
  };

  if (showCanvas) {
    return (
      <div className="fixed inset-0 z-50">
        <NodeCanvas 
          graph={selectedWorkflow} 
          onReturnToHome={handleReturnToList} 
        />
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
          <button 
            onClick={handleCreateNewFlow} 
            className="bg-[#FFC72C] hover:bg-[#E6B428] text-black px-3 py-1 rounded text-sm flex items-center gap-1"
          >
            <Plus size={16} />
            {t('workspaces.createFlow', 'Create New Flow')}
          </button>
        </div>
        
        {workflows && workflows.length > 0 ? (
          <div className="overflow-y-auto h-[calc(100vh-200px)]">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6">
              {workflows.map((workflow: Workflow) => (
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
                           {workflow.updatedAt && (
                             <p className="text-zinc-400 text-sm mt-1">
                               {t('workspaces.lastUpdated', 'Last updated')}: {formatDate(workflow.updatedAt)}
                             </p>
                           )}
                         </div>
                       </div>
                     </div>
                     
                     {/* Action buttons */}
                     <div className="flex gap-1 ml-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                       <button 
                         onClick={() => handleEditFlow(workflow.graph|| {graphId: workflow.id, graphName: workflow.name, nodes: [], connections: [], nextNodeId: 0})} 
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
                   {workflow.description && (
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
                       <p className="text-zinc-200 text-sm leading-relaxed">
                         {workflow.description}
                       </p>
                     </div>
                   )}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-zinc-400 py-8 text-center">
            {t('workspaces.noFlows', 'No AI workflows have been created yet')}
          </div>
        )}
      </div>

      {/* Delete confirmation dialog */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-gradient-to-br from-[#1a1a1a] to-[#151515] rounded-xl shadow-2xl border border-zinc-800/50 p-6 max-w-md w-full mx-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-red-600/20 to-red-700/20 border border-red-600/30 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-400">
                  <path d="M3 6h18"/>
                  <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/>
                  <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
                  <line x1="10" y1="11" x2="10" y2="17"/>
                  <line x1="14" y1="11" x2="14" y2="17"/>
                </svg>
              </div>
              <h3 className="text-xl font-bold text-white">
                {t('workspaces.confirmDelete', 'Confirm Delete')}
              </h3>
            </div>
            <p className="text-zinc-300 mb-6 leading-relaxed">
              {t('workspaces.deleteFlowConfirmation', 'Are you sure you want to delete this workflow? This action cannot be undone.')}
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={cancelDeleteFlow}
                className="px-4 py-2 text-sm text-zinc-300 hover:text-white transition-colors"
              >
                {t('common.cancel', 'Cancel')}
              </button>
              <button
                onClick={() => confirmDeleteFlow(showDeleteConfirm)}
                className="px-4 py-2 text-sm bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors"
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