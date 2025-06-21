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
}

const TasksTab: React.FC<TasksTabProps> = ({ workspaceData: workspaceData }) => {
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

    // Reset editing state and close the dialog
    setEditingTaskId(null);
    setShowTaskDialog(false);
  };
  
  return (
    <div className="space-y-6">
      <div className="bg-[#121212] rounded-md p-4">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center">
            <h2 className="text-xl font-bold text-white mr-4">{t('workspaces.tasks', 'Tasks')}</h2>
            <div className="flex bg-[#1d1d1d] rounded-md overflow-hidden">
              <button 
                className={`px-3 py-1 text-sm ${viewMode === 'list' ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-[#2a2a2a]'}`}
                onClick={() => setViewMode('list')}
              >
                {t('workspaces.listView', 'List View')}
              </button>
              <button 
                className={`px-3 py-1 text-sm ${viewMode === 'canvas' ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-[#2a2a2a]'}`}
                onClick={() => setViewMode('canvas')}
              >
                {t('workspaces.canvasView', 'Canvas View')}
              </button>
            </div>
          </div>
          <button onClick={handleShowTaskDialog} className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm">
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
            <div className="space-y-4">
              {tasks.map((task: Task) => (
                <div key={task.id} className="bg-[#1d1d1d] rounded border border-gray-800 p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium text-white text-lg">{task.name}</h3>
                      {task.executeWorkflow ? (
                        <span className="bg-purple-600/20 text-purple-400 text-xs px-2 py-0.5 rounded-full border border-purple-600/30">
                          {t('workspaces.workflow', 'Workflow')}
                        </span>
                      ) : (
                        <span className="bg-blue-600/20 text-blue-400 text-xs px-2 py-0.5 rounded-full border border-blue-600/30">
                          {t('workspaces.agent', 'Agent')}
                        </span>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button 
                        className="text-blue-400 hover:text-blue-300 p-1"
                        onClick={() => handleTaskEdit(task.id)}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                        </svg>
                      </button>
                      <button 
                        className="text-red-400 hover:text-red-300 p-1"
                        onClick={() => handleTaskDelete(task.id)}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="3 6 5 6 21 6"></polyline>
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                        </svg>
                      </button>
                    </div>
                  </div>
                  <p className="text-gray-300 mb-3">{task.description}</p>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-400 block">{t('workspaces.expectedOutput', 'Expected Output')}:</span>
                      <span className="text-gray-300">{task.expectedOutput || t('workspaces.none', 'None')}</span>
                    </div>
                    <div>
                      {task.executeWorkflow ? (
                        <>
                          <span className="text-gray-400 block">{t('workspaces.workflow', 'Workflow')}:</span>
                          <span className="text-purple-400">
                            {task.workflowName || availableWorkflows.find(w => w.id === task.workflowId)?.name || t('workspaces.unknownWorkflow', 'Unknown workflow')}
                          </span>
                        </>
                      ) : (
                        <>
                          <span className="text-gray-400 block">{t('workspaces.assignedAgent', 'Assigned Agent')}:</span>
                          <span className="text-blue-400">
                            {task.assignedAgent ? 
                              (workspaceData.agents.find(a => a.id === task.assignedAgent)?.name || task.assignedAgent) : 
                              t('workspaces.autoAssign', 'Auto-assign')}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : (
          <div className="text-gray-400 py-8 text-center">
            {t('workspaces.noTasks', 'No tasks have been created for this workspace')}
          </div>
        )}
      </div>
      {/* Add Task Dialog */}
      {showTaskDialog && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="fixed inset-0 bg-black/50" onClick={() => setShowTaskDialog(false)}></div>
          <div className="bg-[#1d1d1d] rounded-lg shadow-xl p-4 sm:p-6 w-full max-w-2xl relative z-10 max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-[#1d1d1d] pb-2 mb-2 border-b border-gray-800">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-white">
                  {editingTaskId ? t('workspaces.editTask', 'Edit Task') : t('workspaces.addTask', 'Add New Task')}
                </h2>
                <button 
                  className="text-gray-400 hover:text-white" 
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
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  {t('workspaces.taskName', 'Task Name')} *
                </label>
                <input
                  type="text"
                  className="w-full bg-[#111] border border-gray-700 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={newTask.name}
                  onChange={(e) => setNewTask({...newTask, name: e.target.value})}
                  placeholder={t('workspaces.enterTaskName', 'Enter task name')}
                  autoFocus
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  {t('workspaces.description', 'Description')}
                </label>
                <textarea
                  className="w-full bg-[#111] border border-gray-700 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[80px] sm:min-h-[100px]"
                  value={newTask.description}
                  onChange={(e) => setNewTask({...newTask, description: e.target.value})}
                  placeholder={t('workspaces.enterDescription', 'Enter task description')}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  {t('workspaces.expectedOutput', 'Expected Output')}
                </label>
                <input
                  type="text"
                  className="w-full bg-[#111] border border-gray-700 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={newTask.expectedOutput}
                  onChange={(e) => setNewTask({...newTask, expectedOutput: e.target.value})}
                  placeholder={t('workspaces.enterExpectedOutput', 'Enter expected output')}
                />
              </div>
              
              <div className="border-t border-gray-700 pt-4 mt-4">
                <div className="text-sm font-medium text-gray-300 mb-3">
                  {t('workspaces.taskExecution', 'Task Execution')} *
                  <p className="text-xs text-gray-400 mt-1">
                    {t('workspaces.taskExecutionHelp', 'Choose one of the following execution methods')}
                  </p>
                </div>
                
                <div className="space-y-4">
                  {/* Agent Assignment Option */}
                  <div className={`p-3 rounded-md border ${!newTask.executeWorkflow ? 'border-blue-500 bg-blue-500/10' : 'border-gray-700 bg-[#111]'}`}>
                    <div className="flex items-center">
                      <input
                        type="radio"
                        id="assignAgent"
                        name="executionMethod"
                        className="mr-2 h-4 w-4 border-gray-700 bg-[#111] text-blue-600 focus:ring-blue-500"
                        checked={!newTask.executeWorkflow}
                        onChange={() => setNewTask({...newTask, executeWorkflow: false, assignedAgent: newTask.assignedAgent || ''})}
                      />
                      <label htmlFor="assignAgent" className="text-sm font-medium text-white">
                        {t('workspaces.assignedAgent', 'Assign Agent')}
                      </label>
                    </div>
                    
                    <div className="mt-2 ml-6">
                      <select
                        className={`w-full bg-[#111] border border-gray-700 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${newTask.executeWorkflow ? 'opacity-50' : ''}`}
                        value={newTask.assignedAgent || ''}
                        onChange={(e) => setNewTask({...newTask, assignedAgent: e.target.value, executeWorkflow: false})}
                        disabled={newTask.executeWorkflow}
                      >
                        <option value="">{t('workspaces.autoAssign', 'Auto-assign')}</option>
                        {workspaceData.agents && workspaceData.agents.map(agent => (
                          <option key={agent.id} value={agent.id}>{agent.name}</option>
                        ))}
                      </select>
                      <p className="text-xs text-gray-400 mt-1">
                        {t('workspaces.agentAssignmentHelp', 'Select an agent to handle this task or choose auto-assignment')}
                      </p>
                    </div>
                  </div>
                  
                  {/* Workflow Execution Option */}
                  <div className={`p-3 rounded-md border ${newTask.executeWorkflow ? 'border-purple-500 bg-purple-500/10' : 'border-gray-700 bg-[#111]'}`}>
                    <div className="flex items-center">
                      <input
                        type="radio"
                        id="executeWorkflow"
                        name="executionMethod"
                        className="mr-2 h-4 w-4 border-gray-700 bg-[#111] text-purple-600 focus:ring-purple-500"
                        checked={newTask.executeWorkflow}
                        onChange={() => setNewTask({...newTask, executeWorkflow: true, assignedAgent: null})}
                      />
                      <label htmlFor="executeWorkflow" className="text-sm font-medium text-white">
                        {t('workspaces.executeWorkflow', 'Execute Workflow')}
                      </label>
                    </div>
                    
                    <div className="mt-2 ml-6">
                      <select
                        className={`w-full bg-[#111] border border-gray-700 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 ${!newTask.executeWorkflow ? 'opacity-50' : ''}`}
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
                      <p className="text-xs text-gray-400 mt-1">
                        {t('workspaces.workflowSelectionHelp', 'Select a workflow to execute for this task')}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end gap-3 mt-6 sticky bottom-0 pt-2 bg-[#1d1d1d] border-t border-gray-800">
              <button
                className="px-4 py-2 text-sm text-gray-300 hover:text-white transition-colors"
                onClick={() => setShowTaskDialog(false)}
              >
                {t('common.cancel', 'Cancel')}
              </button>
              <button
                className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
