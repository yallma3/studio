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
import { WorkspaceData, Task } from "../../types/Types";
import TaskCanvas from "../TaskCanvas";
import { X } from "lucide-react";

interface TasksTabProps {
  workspaceData: WorkspaceData;
  onTabChanges?: () => void;
}


const TasksTab: React.FC<TasksTabProps> = ({ workspaceData, onTabChanges }) => {

  const { t } = useTranslation();

  const [viewMode, setViewMode] = useState<'list' | 'canvas'>('canvas');
  const [showTaskDialog, setShowTaskDialog] = useState(false);
  const [tasks, setTasks] = useState<Task[]>(workspaceData.tasks || []);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);

  // Add sample workflows if none exist in the workspace data
  const [sampleWorkflows] = useState([
    { id: 'workflow-1', name: 'Data Analysis Pipeline', description: 'Analyze and process data with multiple steps' },
    { id: 'workflow-2', name: 'Content Generation', description: 'Generate and review content automatically' },
    { id: 'workflow-3', name: 'Research Assistant', description: 'Search, summarize, and organize research findings' }
  ]);

  // Combine workspace workflows with sample workflows if needed
  const availableWorkflows = workspaceData.workflows && workspaceData.workflows.length > 0 
    ? workspaceData.workflows 
    : sampleWorkflows;

  const [newTask, setNewTask] = useState<{
    name: string;
    description: string;
    expectedOutput: string;
    assignedAgent: string | null;
    executeWorkflow: boolean;
    workflowId: string | null;
    workflowName: string;
  }>({
    name: '',
    description: '',
    expectedOutput: '',
    assignedAgent: null,
    executeWorkflow: false,
    workflowId: null,
    workflowName: ''
  });
  
  const handleTaskEdit = (taskId: string) => {
    // Find the task to edit
    const taskToEdit = tasks.find(task => task.id === taskId);
    if (!taskToEdit) return;
    
    // Set the form values for editing
    setNewTask({
      name: taskToEdit.name,
      description: taskToEdit.description,
      expectedOutput: taskToEdit.expectedOutput,
      assignedAgent: taskToEdit.assignedAgent,
      executeWorkflow: taskToEdit.executeWorkflow,
      workflowId: taskToEdit.workflowId,
      workflowName: taskToEdit.workflowName || ''
    });
    
    // Set editing mode and show dialog
    setEditingTaskId(taskId);
    setShowTaskDialog(true);
  };
  
  const handleTaskDelete = (taskId: string) => {
    // Remove the task from the tasks array
    const updatedTasks = tasks.filter(task => task.id !== taskId);
    setTasks(updatedTasks);
    
    // Update the workspace data
    workspaceData.tasks = updatedTasks;
    
    // Signal that tab has changes
    onTabChanges?.();
  };

  const handleShowTaskDialog = () => {
    // Reset the new task form
    setNewTask({
      name: '',
      description: '',
      expectedOutput: '',
      assignedAgent: null,
      executeWorkflow: false,
      workflowId: null,
      workflowName: ''
    });
    // Clear editing state
    setEditingTaskId(null);
    setShowTaskDialog(true);
  };

  // Generate a simple ID based on timestamp and random number
  const generateId = (): string => {
    return `task-${Date.now()}-${Math.floor(Math.random() * 10000)}`;  
  };

  const handleSaveTask = () => {
    if (!newTask.name.trim()) {
      // Don't save a task without a name
      return;
    }

    let updatedTasks: Task[];

    if (editingTaskId) {
      // Update existing task
      updatedTasks = tasks.map(task => {
        if (task.id === editingTaskId) {
          return {
            ...task,
            name: newTask.name,
            description: newTask.description,
            expectedOutput: newTask.expectedOutput,
            assignedAgent: newTask.assignedAgent,
            executeWorkflow: newTask.executeWorkflow,
            workflowId: newTask.workflowId,
            workflowName: newTask.workflowName
          };
        }
        return task;
      });
    } else {
      // Create a new task with a unique ID
      const task: Task = {
        id: generateId(),
        name: newTask.name,
        description: newTask.description,
        expectedOutput: newTask.expectedOutput,
        assignedAgent: newTask.assignedAgent,
        executeWorkflow: newTask.executeWorkflow,
        workflowId: newTask.workflowId,
        workflowName: newTask.workflowName
      };

      // Add the new task to the tasks array
      updatedTasks = [...tasks, task];
    }

    // Update state and workspace data
    setTasks(updatedTasks);
    workspaceData.tasks = updatedTasks;

    // Signal that tab has changes
    onTabChanges?.();

    // Reset editing state and close the dialog
    setEditingTaskId(null);
    setShowTaskDialog(false);
  };
  
  return (
    <div className="space-y-6">
      <div className="bg-[#121212] rounded-md">
        <div className="flex justify-between items-center  p-6 border-b border-[#FFC72C]/50">
          <div className="flex items-center ">
            <div className="flex bg-[#1d1d1d] rounded-md overflow-hidden">
              <button 
                className={`px-3 py-1 text-sm ${viewMode === 'list' ? 'bg-[#FFC72C] text-black' : 'text-zinc-300 hover:bg-[#2a2a2a]'}`}
                onClick={() => setViewMode('list')}
              >
                {t('workspaces.listView', 'List View')}
              </button>
              <button 
                className={`px-3 py-1 text-sm ${viewMode === 'canvas' ? 'bg-[#FFC72C] text-black' : 'text-zinc-300 hover:bg-[#2a2a2a]'}`}
                onClick={() => setViewMode('canvas')}
              >
                {t('workspaces.canvasView', 'Canvas View')}
              </button>
            </div>
          </div>
          <button onClick={handleShowTaskDialog} className="bg-[#FFC72C] hover:bg-[#E6B428] text-black px-3 py-1 rounded text-sm">
            {t('workspaces.addTask', 'Add Task')}
          </button>
        </div>
        
        {tasks && tasks.length > 0 ? (
          viewMode === 'canvas' ? (
            <TaskCanvas 
              tasks={tasks} 
              onTaskEdit={handleTaskEdit}
              onTaskDelete={handleTaskDelete}
              onshowTaskDialog={handleShowTaskDialog}
              projectData={workspaceData}
            />
          ) : (
            <div className="overflow-y-auto h-[calc(100vh-200px)]">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6">
                {tasks.map((task: Task) => (
                <div key={task.id} className="group bg-gradient-to-br from-[#1a1a1a] to-[#151515] rounded-xl border border-zinc-800/50 hover:border-zinc-700/70 transition-all duration-200 hover:shadow-lg hover:shadow-black/20 p-6 relative overflow-hidden">
                  {/* Subtle background pattern */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.01] to-transparent opacity-50"></div>
                  
                  {/* Header with title and badges */}
                  <div className="flex justify-between items-start mb-4 relative z-10">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        {/* Task type icon */}
                        <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${
                          task.executeWorkflow 
                            ? 'bg-gradient-to-br from-purple-600/20 to-purple-700/20 border border-purple-600/30' 
                            : 'bg-gradient-to-br from-[#FFC72C]/20 to-[#E6B428]/20 border border-[#FFC72C]/30'
                        }`}>
                          {task.executeWorkflow ? (
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-purple-400">
                              <rect width="18" height="18" x="3" y="3" rx="2"/>
                              <path d="M9 9h6v6H9z"/>
                              <path d="m9 12 2 2 4-4"/>
                            </svg>
                          ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#FFC72C]">
                              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
                              <circle cx="9" cy="7" r="4"/>
                              <path d="m22 2-5 10-5-10"/>
                            </svg>
                          )}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <h3 className={`font-semibold text-white text-xl leading-tight truncate  transition-colors duration-200 ${
                            task.executeWorkflow 
                              ? 'group-hover:text-purple-400' 
                              : 'group-hover:text-[#FFC72C]'
                          }`}>
                            {task.name}
                          </h3>
                        </div>
                        
                                                 {/* Type badge with assignment info */}
                         {task.executeWorkflow ? (
                           <div className="flex-shrink-0 text-right">
                             <span className="bg-gradient-to-r from-purple-600/30 to-purple-700/30 text-purple-300 text-xs font-medium px-3 py-1.5 rounded-full border border-purple-600/40 backdrop-blur-sm inline-flex items-center">
                               <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
                                 <path d="M5 12h14"/>
                                 <path d="m12 5 7 7-7 7"/>
                               </svg>
                               {task.workflowName || availableWorkflows.find(w => w.id === task.workflowId)?.name || t('workspaces.unknownWorkflow', 'Unknown workflow')}
                             </span>
                           </div>
                         ) : (
                           <div className="flex-shrink-0 text-right">
                             <span className="bg-gradient-to-r from-[#FFC72C]/30 to-[#E6B428]/30 text-[#FFC72C] text-xs font-medium px-3 py-1.5 rounded-full border border-[#FFC72C]/40 backdrop-blur-sm inline-flex items-center">
                               <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
                                 <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
                                 <circle cx="9" cy="7" r="4"/>
                               </svg>
                               {task.assignedAgent ? 
                                 (workspaceData.agents.find(a => a.id === task.assignedAgent)?.name || task.assignedAgent) : 
                                 t('workspaces.autoAssign', 'Auto-assign')}
                             </span>
                             
                           </div>
                         )}
                      </div>
                    </div>
                    
                    {/* Action buttons */}
                    <div className="flex gap-1 ml-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <button 
                        className="flex items-center justify-center w-8 h-8 text-[#FFC72C] hover:text-[#FFD65C] hover:bg-[#FFC72C]/10 rounded-lg transition-all duration-200"
                        onClick={() => handleTaskEdit(task.id)}
                        title="Edit task"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                        </svg>
                      </button>
                      <button 
                        className="flex items-center justify-center w-8 h-8 text-red-400 hover:text-red-300 hover:bg-red-400/10 rounded-lg transition-all duration-200"
                        onClick={() => handleTaskDelete(task.id)}
                        title="Delete task"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="3 6 5 6 21 6"></polyline>
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                        </svg>
                      </button>
                    </div>
                  </div>
                  
                  {/* Description */}
                  {task.description && (
                    <div className="mb-4 relative z-10">
                      <p className="text-zinc-300 leading-relaxed text-sm">{task.description}</p>
                    </div>
                  )}
                  
                                     {/* Expected Output */}
                   {(task.expectedOutput || task.expectedOutput === '') && (
                     <div className="bg-[#0a0a0a]/50 rounded-lg p-4 border border-zinc-800/50 relative z-10">
                       <div className="flex items-center gap-2 mb-2">
                         <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-400">
                           <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
                           <polyline points="14,2 14,8 20,8"/>
                         </svg>
                         <span className="text-zinc-400 text-xs font-medium uppercase tracking-wide">
                           {t('workspaces.expectedOutput', 'Expected Output')}
                         </span>
                       </div>
                       <p className="text-zinc-200 text-sm leading-relaxed">
                         {task.expectedOutput || (
                           <span className="text-zinc-500 italic">{t('workspaces.none', 'None specified')}</span>
                         )}
                       </p>
                     </div>
                                       )}
                  </div>
                ))}
              </div>
            </div>
          )
        ) : (
          <div className="text-zinc-400 py-8 text-center">
            {t('workspaces.noTasks', 'No tasks have been added to this workspace yet')}
          </div>
        )}
      </div>
      {/* Add Task Dialog */}
      {showTaskDialog && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="fixed inset-0 bg-black/50" onClick={() => setShowTaskDialog(false)}></div>
          <div className="bg-[#1d1d1d] rounded-lg shadow-xl p-4 sm:p-6 w-full max-w-2xl relative z-10 max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-[#1d1d1d] pb-2 mb-2 border-b border-zinc-800">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-white">
                  {editingTaskId ? t('workspaces.editTask', 'Edit Task') : t('workspaces.addTask', 'Add New Task')}
                </h2>
                <button 
                  className="text-zinc-400 hover:text-white" 
                  onClick={() => {
                    setShowTaskDialog(false);
                    setEditingTaskId(null);
                  }}
                  aria-label="Close"
                >
                  <X size={18} />
                </button>
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-1">
                  {t('workspaces.taskName', 'Task Name')} *
                </label>
                <input
                  type="text"
                  className="w-full bg-[#111] border border-zinc-700 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-[#FFC72C]"
                  value={newTask.name}
                  onChange={(e) => setNewTask({...newTask, name: e.target.value})}
                  placeholder={t('workspaces.enterTaskName', 'Enter task name')}
                  autoFocus
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-1">
                  {t('workspaces.description', 'Description')}
                </label>
                <textarea
                  className="w-full bg-[#111] border border-zinc-700 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-[#FFC72C] min-h-[80px] sm:min-h-[100px]"
                  value={newTask.description}
                  onChange={(e) => setNewTask({...newTask, description: e.target.value})}
                  placeholder={t('workspaces.enterDescription', 'Enter task description')}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-1">
                  {t('workspaces.expectedOutput', 'Expected Output')}
                </label>
                <input
                  type="text"
                  className="w-full bg-[#111] border border-zinc-700 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-[#FFC72C]"
                  value={newTask.expectedOutput}
                  onChange={(e) => setNewTask({...newTask, expectedOutput: e.target.value})}
                  placeholder={t('workspaces.enterExpectedOutput', 'Enter expected output')}
                />
              </div>
              
              <div className="border-t border-zinc-700 pt-4 mt-4">
                <div className="text-sm font-medium text-zinc-300 mb-3">
                  {t('workspaces.taskExecution', 'Task Execution')} *
                  <p className="text-xs text-zinc-400 mt-1">
                    {t('workspaces.taskExecutionHelp', 'Choose one of the following execution methods')}
                  </p>
                </div>
                
                <div className="space-y-4">
                  {/* Agent Assignment Option */}
                  <div className={`p-3 rounded-md border ${!newTask.executeWorkflow ? 'border-[#FFC72C] bg-[#FFC72C]/10' : 'border-zinc-700 bg-[#111]'}`}>
                    <div className="flex items-center">
                      <input
                        type="radio"
                        id="assignAgent"
                        name="executionMethod"
                        className="mr-2 h-4 w-4 border-zinc-700 bg-[#111] text-[#FFC72C] focus:ring-[#FFC72C]"
                        checked={!newTask.executeWorkflow}
                        onChange={() => setNewTask({...newTask, executeWorkflow: false, assignedAgent: newTask.assignedAgent || ''})}
                      />
                      <label htmlFor="assignAgent" className="text-sm font-medium text-white">
                        {t('workspaces.assignedAgent', 'Assign Agent')}
                      </label>
                    </div>
                    
                    <div className="mt-2 ml-6">
                      <select
                        className={`w-full bg-[#111] border border-zinc-700 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-[#FFC72C] ${newTask.executeWorkflow ? 'opacity-50' : ''}`}
                        value={newTask.assignedAgent || ''}
                        onChange={(e) => setNewTask({...newTask, assignedAgent: e.target.value, executeWorkflow: false})}
                        disabled={newTask.executeWorkflow}
                      >
                        <option value="">{t('workspaces.autoAssign', 'Auto-assign')}</option>
                        {workspaceData.agents && workspaceData.agents.map(agent => (
                          <option key={agent.id} value={agent.id}>{agent.name}</option>
                        ))}
                      </select>
                      <p className="text-xs text-zinc-400 mt-1">
                        {t('workspaces.agentAssignmentHelp', 'Select an agent to handle this task or choose auto-assignment')}
                      </p>
                    </div>
                  </div>
                  
                  {/* Workflow Execution Option */}
                  <div className={`p-3 rounded-md border ${newTask.executeWorkflow ? 'border-purple-500 bg-purple-500/10' : 'border-zinc-700 bg-[#111]'}`}>
                    <div className="flex items-center">
                      <input
                        type="radio"
                        id="executeWorkflow"
                        name="executionMethod"
                        className="mr-2 h-4 w-4 border-zinc-700 bg-[#111] text-purple-600 focus:ring-purple-500"
                        checked={newTask.executeWorkflow}
                        onChange={() => setNewTask({...newTask, executeWorkflow: true, assignedAgent: null})}
                      />
                      <label htmlFor="executeWorkflow" className="text-sm font-medium text-white">
                        {t('workspaces.executeWorkflow', 'Execute Workflow')}
                      </label>
                    </div>
                    
                    <div className="mt-2 ml-6">
                      <select
                        className={`w-full bg-[#111] border border-zinc-700 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 ${!newTask.executeWorkflow ? 'opacity-50' : ''}`}
                        value={newTask.workflowId || ''}
                        onChange={(e) => {
                          const selectedWorkflow = availableWorkflows.find(w => w.id === e.target.value);
                          setNewTask({
                            ...newTask, 
                            executeWorkflow: true, 
                            assignedAgent: null,
                            workflowId: e.target.value || null,
                            workflowName: selectedWorkflow ? selectedWorkflow.name : ''
                          });
                        }}
                        disabled={!newTask.executeWorkflow}
                      >
                        <option value="">{t('workspaces.selectWorkflow', 'Select a workflow')}</option>
                        {availableWorkflows.map(workflow => (
                          <option key={workflow.id} value={workflow.id}>{workflow.name}</option>
                        ))}
                      </select>
                      <p className="text-xs text-zinc-400 mt-1">
                        {t('workspaces.workflowSelectionHelp', 'Select a workflow to execute for this task')}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end gap-3 mt-6 sticky bottom-0 pt-2 bg-[#1d1d1d] border-t border-zinc-800">
              <button
                className="px-4 py-2 text-sm text-zinc-300 hover:text-white transition-colors"
                onClick={() => setShowTaskDialog(false)}
              >
                {t('common.cancel', 'Cancel')}
              </button>
              <button
                className="px-4 py-2 text-sm bg-[#FFC72C] hover:bg-[#E6B428] text-black rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={handleSaveTask}
                disabled={!newTask.name.trim()}
              >
                {editingTaskId ? t('common.save', 'Save') : t('common.add', 'Add')}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default TasksTab;
