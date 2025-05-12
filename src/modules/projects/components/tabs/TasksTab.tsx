import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { ProjectData, Task } from "../../types/Types";
import TaskCanvas from "../TaskCanvas";
import { X } from "lucide-react";

interface TasksTabProps {
  projectData: ProjectData;
}

const TasksTab: React.FC<TasksTabProps> = ({ projectData }) => {
  const { t } = useTranslation();

  const [viewMode, setViewMode] = useState<'list' | 'canvas'>('canvas');
  const [showTaskDialog, setShowTaskDialog] = useState(false);
  const [tasks, setTasks] = useState<Task[]>(projectData.tasks || []);

  const [newTask, setNewTask] = useState({
    name: '',
    description: '',
    expectedOutput: '',
    assignedAgent: '',
    executeWorkflow: false,
    workflowId: null
  });
  
  const handleTaskEdit = (taskId: string) => {
    // Implement task editing functionality
    console.log('Edit task:', taskId);
  };
  
  const handleTaskDelete = (taskId: string) => {
    // Implement task deletion functionality
    console.log('Delete task:', taskId);
  };

  const handleShowTaskDialog = () => {
    // Reset the new task form
    setNewTask({
      name: '',
      description: '',
      expectedOutput: '',
      assignedAgent: '',
      executeWorkflow: false,
      workflowId: null
    });
    setShowTaskDialog(true);
    console.log('Show task dialog');
  };

  // Generate a simple ID based on timestamp and random number
  const generateId = (): string => {
    return `task-${Date.now()}-${Math.floor(Math.random() * 10000)}`;  
  };

  const handleAddTask = () => {
    if (!newTask.name.trim()) {
      // Don't add a task without a name
      return;
    }

    // Create a new task with a unique ID
    const task: Task = {
      id: generateId(),
      name: newTask.name,
      description: newTask.description,
      expectedOutput: newTask.expectedOutput,
      assignedAgent: newTask.assignedAgent || null,
      executeWorkflow: newTask.executeWorkflow,
      workflowId: newTask.workflowId
    };

    // Add the new task to the tasks array
    const updatedTasks = [...tasks, task];
    setTasks(updatedTasks);
    
    // Update the project data (in a real app, this would likely involve an API call)
    projectData.tasks = updatedTasks;

    // Close the dialog
    setShowTaskDialog(false);
    
    console.log('Task added:', task);
  };
  
  return (
    <div className="space-y-6">
      <div className="bg-[#121212] rounded-md p-4">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center">
            <h2 className="text-xl font-bold text-white mr-4">{t('projects.tasks', 'Tasks')}</h2>
            <div className="flex bg-[#1d1d1d] rounded-md overflow-hidden">
              <button 
                className={`px-3 py-1 text-sm ${viewMode === 'list' ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-[#2a2a2a]'}`}
                onClick={() => setViewMode('list')}
              >
                {t('projects.listView', 'List View')}
              </button>
              <button 
                className={`px-3 py-1 text-sm ${viewMode === 'canvas' ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-[#2a2a2a]'}`}
                onClick={() => setViewMode('canvas')}
              >
                {t('projects.canvasView', 'Canvas View')}
              </button>
            </div>
          </div>
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm">
            {t('projects.addTask', 'Add Task')}
          </button>
        </div>
        
        {tasks && tasks.length > 0 ? (
          viewMode === 'canvas' ? (
            <TaskCanvas 
              tasks={tasks} 
              onTaskEdit={handleTaskEdit}
              onTaskDelete={handleTaskDelete}
              onshowTaskDialog={handleShowTaskDialog}
            />
          ) : (
            <div className="space-y-4">
              {tasks.map((task: Task) => (
                <div key={task.id} className="bg-[#1d1d1d] rounded border border-gray-800 p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-medium text-white text-lg">{task.name}</h3>
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
                      <span className="text-gray-400 block">{t('projects.expectedOutput', 'Expected Output')}:</span>
                      <span className="text-gray-300">{task.expectedOutput || t('projects.none', 'None')}</span>
                    </div>
                    <div>
                      <span className="text-gray-400 block">{t('projects.assignedAgent', 'Assigned Agent')}:</span>
                      <span className="text-gray-300">
                        {task.assignedAgent || t('projects.autoAssign', 'Auto-assign')}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : (
          <div className="text-gray-400 py-8 text-center">
            {t('projects.noTasks', 'No tasks have been created for this project')}
          </div>
        )}
      </div>
      {/* Add Task Dialog */}
      {showTaskDialog && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="fixed inset-0 bg-black/50" onClick={() => setShowTaskDialog(false)}></div>
          <div className="bg-[#1d1d1d] rounded-lg shadow-xl p-4 sm:p-6 w-full max-w-md relative z-10 max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-[#1d1d1d] pb-2 mb-2 border-b border-gray-800">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-white">{t('projects.addTask', 'Add New Task')}</h2>
                <button 
                  className="text-gray-400 hover:text-white" 
                  onClick={() => setShowTaskDialog(false)}
                  aria-label="Close"
                >
                  <X size={18} />
                </button>
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  {t('projects.taskName', 'Task Name')} *
                </label>
                <input
                  type="text"
                  className="w-full bg-[#111] border border-gray-700 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={newTask.name}
                  onChange={(e) => setNewTask({...newTask, name: e.target.value})}
                  placeholder={t('projects.enterTaskName', 'Enter task name')}
                  autoFocus
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  {t('projects.description', 'Description')}
                </label>
                <textarea
                  className="w-full bg-[#111] border border-gray-700 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[80px] sm:min-h-[100px]"
                  value={newTask.description}
                  onChange={(e) => setNewTask({...newTask, description: e.target.value})}
                  placeholder={t('projects.enterDescription', 'Enter task description')}
                />
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    {t('projects.expectedOutput', 'Expected Output')}
                  </label>
                  <input
                    type="text"
                    className="w-full bg-[#111] border border-gray-700 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={newTask.expectedOutput}
                    onChange={(e) => setNewTask({...newTask, expectedOutput: e.target.value})}
                    placeholder={t('projects.enterExpectedOutput', 'Enter expected output')}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    {t('projects.assignedAgent', 'Assigned Agent')}
                  </label>
                  <input
                    type="text"
                    className="w-full bg-[#111] border border-gray-700 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={newTask.assignedAgent}
                    onChange={(e) => setNewTask({...newTask, assignedAgent: e.target.value})}
                    placeholder={t('projects.enterAgent', 'Agent name or blank')}
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  {t('projects.executeWorkflow', 'Execute Workflow')}
                </label>
                <div className="flex items-center mt-1">
                  <input
                    type="checkbox"
                    id="executeWorkflow"
                    className="mr-2 h-4 w-4 rounded border-gray-700 bg-[#111] text-blue-600 focus:ring-blue-500"
                    checked={newTask.executeWorkflow}
                    onChange={(e) => setNewTask({...newTask, executeWorkflow: e.target.checked})}
                  />
                  <label htmlFor="executeWorkflow" className="text-sm text-gray-300">
                    {t('projects.executeWorkflowDescription', 'Execute a workflow for this task')}
                  </label>
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
               
                onClick={handleAddTask}
                disabled={!newTask.name.trim()}
              >
                {t('common.add', 'Add')}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default TasksTab;
