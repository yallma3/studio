import React, { useState, useRef, useEffect } from "react";
import { Button } from "../../../components/ui/button";
import { useTranslation } from "react-i18next";
import { Plus, Trash2, ChevronRight, ChevronLeft, Check, X, Key, Edit2 } from "lucide-react";
import { WorkspaceData, LLMOption, Agent, Task } from "../types/Types";
import { openUrl } from '@tauri-apps/plugin-opener'
import { TooltipHelper } from "../../../components/ui/tooltip-helper";
import Select  from "../../../components/ui/select"; 

interface WorkspaceCreationWizardProps {
  onClose: () => void;
  onCreateWorkspace: (workspaceData: WorkspaceData) => void;
}

const WorkspaceCreationWizard: React.FC<WorkspaceCreationWizardProps> = ({
  onClose,
  onCreateWorkspace,
}) => {
  const { t } = useTranslation();
  const [currentStep, setCurrentStep] = useState(1);
  // Placeholder tools
  const availableTools = [{name: "Web Search", isInputChannel: false, isOutputProducer: false, isJudge: false}, {name: "Compile Code", isInputChannel: false, isOutputProducer: false, isJudge: false}, {name: "Api Call", isInputChannel: false, isOutputProducer: false, isJudge: false}]
  
  // Placeholder LLM options
  const availableLLMs: LLMOption[] = [
    {
      id: "gpt-4",
      name: "GPT-4",
      provider: "OpenAI",
      tokenLimit: 8192,
    },
    {
      id: "gpt-3.5-turbo",
      name: "GPT-3.5 Turbo",
      provider: "OpenAI",
      tokenLimit: 4096
    },
    {
      id: "gpt-4o",
      name: "GPT-4o",
      provider: "OpenAI",
      tokenLimit: 8192,
    },
    {
      id: "claude-3-opus",
      name: "Claude 3 Opus",
      provider: "Anthropic",
      tokenLimit: 200000
    },
    {
      id: "claude-3-sonnet",
      name: "Claude 3 Sonnet",
      provider: "Anthropic",
      tokenLimit: 100000
    },
    {
      id: "gemini-pro",
      name: "Gemini Pro",
      provider: "Google",
      tokenLimit: 32768
    },
    {
      id: "llama-3-70b",
      name: "Llama 3 (70B)",
      provider: "Meta",
      tokenLimit: 8192
    },
    {
      id: "mixtral-8x7b",
      name: "Mixtral 8x7B",
      provider: "Groq",
      tokenLimit: 32768
    },
    {
      id: "llama-2-70b",
      name: "Llama 2 (70B)",
      provider: "Groq",
      tokenLimit: 4096
    }
  ];
  
  // Get unique providers from available LLMs
  const llmProviders = [...new Set(availableLLMs.map(llm => llm.provider))];
  
  // workspace data state
  const [workspaceData, setWorkspaceData] = useState<WorkspaceData>({
    id: `workspace-${Date.now()}`,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    // Step 1: workspace Basics
    name: "",
    description: "",
    
    // Step 2: LLM Selection
    mainLLM: "",
    apiKey: "",
    useSavedCredentials: false,
    
    // Step 3: Tasks
    tasks: [],
    
    // Step 4: Agents
    agents: [],
    
    // Workflows
    workflows: []
  });
  
  // State for selected provider
  const [selectedProvider, setSelectedProvider] = useState<string>("Groq");
  
  // State for tool popup
  const [showToolPopup, setShowToolPopup] = useState(false);
  const [selectedToolInPopup, setSelectedToolInPopup] = useState("");
  const [selectedToolPropertyInPopup, setSelectedToolPropertyInPopup] = useState<'none' | 'isInputChannel' | 'isOutputProducer' | 'isJudge'>('none');
  const [editingToolName, setEditingToolName] = useState<string | null>(null);
  const popupRef = useRef<HTMLDivElement>(null);
  
  // Close popup when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
        setShowToolPopup(false);
      }
    };
    
    if (showToolPopup) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showToolPopup]);
  
  // Temporary state for new items
  const [newTask, setNewTask] = useState<Omit<Task, "id">>({
    name: "",
    description: "",
    expectedOutput: "",
    assignedAgent: null,
    executeWorkflow: false,
    workflowId: null
  });
  
  // Task type selection (workflow or agent)
  const [taskType, setTaskType] = useState<'agent' | 'workflow'>('agent');

   // Temporary state for new agents
  const [newAgent, setNewAgent] = useState<Omit<Agent, "id"> & { id?: string }>({
    name: "",
    role: "",
    objective: "",
    background: "",
    capabilities: "",
    tools: [],
    llmId: workspaceData.mainLLM // Default to workspace's main LLM
  });
  
  // Track if we're in edit mode
  const [isEditingAgent, setIsEditingAgent] = useState(false);
 
  
  // Step navigation handlers
  const handleNextStep = () => {
    setCurrentStep(prev => Math.min(prev + 1, 4));
  };

  const handlePrevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };
  
  const handleGoToStep = (step: number) => {
    setCurrentStep(step);
  };

  // Form submission handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      
      // Call the onCreateWorkspace callback
      onCreateWorkspace(workspaceData);
      
      // Reset form
      setWorkspaceData({
        id: `workspace-${Date.now()}`,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        name: "",
        description: "",
        mainLLM: "",
        apiKey: "",
        useSavedCredentials: false,
        tasks: [],
        agents: [],
        workflows: []
      });
      setSelectedProvider("Groq");
      setCurrentStep(1);
      onClose();
    } catch (error) {
      console.error("Error saving workspace:", error);
      // You could add error handling UI here if needed
    }
  };
  
  // Step validation
  const isStep1Valid = workspaceData.name.trim() !== "";
  const isStep2Valid = true; // Can proceed even without tasks
  const isStep3Valid = true; // Can proceed even without agents
  const isStep4Valid = true; 
  

  // Get current step validation status
  const getCurrentStepValidation = () => {
    switch (currentStep) {
      case 1: return isStep1Valid;
      case 2: return isStep2Valid;
      case 3: return isStep3Valid;
      case 4: return isStep4Valid;
      default: return false;
    }
  };

  // Handlers for workspace data changes
  const handleWorkspaceDataChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setWorkspaceData(prev => ({
      ...prev,
      [name]: value
    }));
  }; 

 
 

  // On press of add task to add task to workspace's task list and empty form state
  const handleAddTask = () => {
    if (newTask.name.trim()) {
      const task: Task = {
        id: Date.now().toString(),
        ...newTask
      };
      
      setWorkspaceData(prev => ({
        ...prev,
        tasks: [...prev.tasks, task]
      }));
      
      // Reset form and keep the same task type selected
      setNewTask({
        name: "",
        description: "",
        expectedOutput: "",
        assignedAgent: taskType === 'agent' ? null : null,
        executeWorkflow: taskType === 'workflow',
        workflowId: null
      });
    }
  };

  const handleRemoveTask = (id: string) => {
    setWorkspaceData(prev => ({
      ...prev,
      tasks: prev.tasks.filter(task => task.id !== id)
    }));
  };
  
  // On press of add agent to add agent to workspace's agent list and empty form state
  const handleAddAgent = () => {
    if (newAgent.name.trim()) {
      if (isEditingAgent && newAgent.id) {
        // Update existing agent
        setWorkspaceData(prev => ({
          ...prev,
          agents: prev.agents.map(agent => 
            agent.id === newAgent.id ? { ...newAgent as Agent } : agent
          )
        }));
      } else {
        // Add new agent
        const agent: Agent = {
          id: Date.now().toString(),
          ...newAgent
        };
        
        setWorkspaceData(prev => ({
          ...prev,
          agents: [...prev.agents, agent]
        }));
      }
      
      // Reset form and edit state
      setNewAgent({
        name: "",
        role: "",
        objective: "",
        background: "",
        capabilities: "",
        tools: [],
        llmId: workspaceData.mainLLM // Keep using workspace's main LLM as default
      });
      setIsEditingAgent(false);
    }
  };
  
  // Handle editing an existing agent
  const handleEditAgent = (id: string) => {
    const agentToEdit = workspaceData.agents.find(agent => agent.id === id);
    if (agentToEdit) {
      setNewAgent({
        ...agentToEdit
      });
      setIsEditingAgent(true);
    }
  };

  const handleRemoveAgent = (id: string) => {
    // If we're currently editing this agent, reset the form
    if (isEditingAgent && newAgent.id === id) {
      setNewAgent({
        name: "",
        role: "",
        objective: "",
        background: "",
        capabilities: "",
        tools: [],
        llmId: workspaceData.mainLLM
      });
      setIsEditingAgent(false);
    }
    
    setWorkspaceData(prev => ({
      ...prev,
      agents: prev.agents.filter(agent => agent.id !== id)
    }));
  };
  
  // Add tool to agent's tools list or update existing tool
  const handleAddTool = (tool: string) => {
    if (editingToolName) {
      // Update existing tool
      setNewAgent(prev => ({
        ...prev,
        tools: prev.tools.map(t => {
          if (t.name === editingToolName) {
            // Create updated tool with selected property
            const updatedTool = {
              name: tool,
              isInputChannel: false,
              isOutputProducer: false,
              isJudge: false
            };
            
            // Set the selected property if it's not 'none'
            if (selectedToolPropertyInPopup !== 'none') {
              updatedTool[selectedToolPropertyInPopup] = true;
            }
            
            return updatedTool;
          }
          return t;
        })
      }));
      
      // Reset editing state
      setEditingToolName(null);
    } else {
      // Check if the tool is already added
      if (newAgent.tools.some(t => t.name === tool)) {
        return; // Tool already exists, don't add it again
      }
      
      // Create new tool with selected property
      const newTool = {
        name: tool, 
        isInputChannel: false, 
        isOutputProducer: false, 
        isJudge: false
      };
      
      // Set the selected property if it's not 'none'
      if (selectedToolPropertyInPopup !== 'none') {
        newTool[selectedToolPropertyInPopup] = true;
      }
      
      setNewAgent(prev => ({ 
        ...prev, 
        tools: [...prev.tools, newTool] 
      }));
    }
    
    // Reset selected tool and close popup
    setSelectedToolInPopup("");
    setSelectedToolPropertyInPopup('none');
    setShowToolPopup(false);
  };

  const handleRemoveTool = (tool: string) => {
    setNewAgent(prev => ({
      ...prev,
      tools: prev.tools.filter(t => t.name !== tool)
    }));
  };
  
  // Note: We've removed the handleToolPropertyChange function as it's no longer needed
  // Tool properties are now set directly in the popup dialog
  
  


  //Top Step indicator component
  const renderStepIndicator = () => {
    const steps = [
      { number: 1, title: t('workspaces.workspaceBasics', 'Workspace Setup') },
      { number: 2, title: t('workspaces.createAgents', 'Agents') },
      { number: 3, title: t('workspaces.defineTasks', 'Tasks') },
      { number: 4, title: t('workspaces.review', 'Review & Confirm') }
    ];

    return (
      <div className="flex justify-between mb-10 relative">
        {/* Progress bars */}
        <div className="absolute top-6 left-0 right-0 flex justify-between z-0 px-6 mx-3">
          {steps.slice(0, -1).map((step) => (
            <div key={`progress-${step.number}`} className="flex-1 mx-0">
              <div 
                className={`h-1 ${currentStep > step.number ? "bg-[#FFC72C]" : "bg-zinc-700"} 
                transition-all duration-300 ease-in-out`}
              />
            </div>
          ))}
        </div>
        
        {steps.map((step) => (
          <div key={step.number} className="flex justify-center items-center relative z-10">
           <div className="flex flex-col items-center">
            <div
              className={`flex items-center justify-center w-12 h-12 rounded-full border-2 ${
                currentStep === step.number
                  ? "bg-[#FFC72C] border-[#FFC72C] text-zinc-900"
                  : currentStep > step.number
                    ? "bg-[#FFC72C] border-[#FFC72C] text-zinc-900"
                    : "bg-zinc-800 border-zinc-700 text-zinc-400"
              } font-bold text-lg transition-all duration-300 ease-in-out`}
            >
              {currentStep > step.number ? <Check className="h-6 w-6" /> : step.number}
            </div>
            <span className={`mt-2 text-sm ${currentStep >= step.number ? "text-white" : "text-zinc-500"}`}>
              {step.title}
            </span>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="flex items-center min-h-screen justify-center inset-0 z-50 bg-zinc-900 p-4">
    <div className="flex flex-col w-full max-w-5xl bg-zinc-900 border border-zinc-800 shadow-xl rounded-lg px-4 pb-24 relative">
      <div className="flex justify-between items-center p-6 border-b border-zinc-800">
        <h1 className="text-2xl font-bold text-white ">
          {t('workspaces.createNewWorkspace', 'Create New Workspace')}
        </h1>
        <button 
          onClick={onClose}
          className="text-gray-400 hover:text-white transition-colors"
        >
          <X className="h-6 w-6" />
        </button>
      </div>
      
      <div className="flex-1 overflow-y-auto p-2 ">
        {renderStepIndicator()}
        
        <form onSubmit={(e) => e.preventDefault()} className="w-full mx-auto px-2 max-w-7xl">
          {/* Step 1: Workspace Basics and LLM Selection */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-white mb-4 ">
                  {t('workspaces.workspaceBasics', 'Workspace Setup')}
                </h2>
              </div>
              
              {/* Side-by-side layout */}
              <div className="flex flex-col md:flex-row gap-6 w-full">
                {/* Workspace Info Section */}
                <div className="bg-zinc-800/50 rounded-lg p-5 border border-zinc-700 flex-1">
                  <h3 className="text-lg font-medium text-white mb-4 ">
                    {t('workspaces.workspaceInfo', 'Workspace Information')}
                  </h3>
                  
                  <div className="space-y-4">
                    <div className="flex flex-col gap-2">
                      <label htmlFor="description" className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-1 ">
                        {t('workspaces.workspaceDescription', 'Workspace Description')}
                        <TooltipHelper 
                          text="More detailed explanation about this field." 
                          position="bottom" 
                           
                        />
                      </label>
                      <textarea
                        id="description"
                        name="description"
                        value={workspaceData.description}
                        onChange={handleWorkspaceDataChange}
                        className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-yellow-500 h-32"
                        placeholder={t('workspaces.enterWorkspaceDescription', 'Describe the purpose of this workspace...')}
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-1 ">
                        {t('workspaces.workspaceName', 'Workspace Name')} <span className="text-yellow-500">*</span>
                      </label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        value={workspaceData.name}
                        onChange={handleWorkspaceDataChange}
                        className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
                        placeholder={t('workspaces.enterWorkspaceName', 'Enter workspace name')}
                        required
                      />
                    </div>
                  </div>
                </div>
                
                {/* LLM Selection Section */}
                <div className="bg-zinc-800/50 rounded-lg p-5 border border-zinc-700 flex-1">
                  <h3 className="text-lg font-medium text-white mb-4 ">
                    {t('workspaces.selectLLM', 'Select Main LLM')} <span className="text-gray-400 text-sm">({t('workspaces.optional', 'Optional')})</span>
                  </h3>
              
                  
                  {/* Provider Selection */}
                  <div className="mb-6">
                    <Select
                      id="provider"
                      value={selectedProvider}
                      onChange={(value) => setSelectedProvider(value)}
                      options={llmProviders.map(provider => ({ value: provider, label: provider }))}
                      placeholder={t('workspaces.selectProviderPlaceholder', 'Select a provider...')}
                      label={t('workspaces.selectProvider', 'Select Provider')}
                    />
                  </div>
                  
                  {/* Model Selection */}
                  <div className="mb-6">
                    <Select
                      id="model"
                      value={workspaceData.mainLLM || ''}
                      onChange={(value) => setWorkspaceData(prev => ({ ...prev, mainLLM: value }))}
                      options={[
                        { value: '', label: t('workspaces.selectModelPlaceholder', 'Select a model...'), disabled: true },
                        ...availableLLMs
                          .filter(llm => !selectedProvider || llm.provider === selectedProvider)
                          .map(llm => ({
                            value: llm.id,
                            label: `${llm.name} - ${llm.tokenLimit.toLocaleString()} tokens`
                          }))
                      ]}
                      disabled={!selectedProvider}
                      label={t('workspaces.selectModel', 'Select Model')}
                    />
                  </div>
                  
                  {/* API Key Section */}
                  <div className="mt-8 space-y-4">
                    <label htmlFor="apiKeyOption" className="block text-sm font-medium text-gray-300 mb-2 ">
                      {t('workspaces.apiKey', 'API Key')}
                    </label>
                    
                    {/* API Key Options */}
                    <div className="flex gap-2 mb-4">
                      <button
                        type="button"
                        onClick={() => setWorkspaceData(prev => ({ ...prev, useSavedCredentials: false }))}
                        className={`flex-1 py-2 px-4 rounded-md transition-all ${!workspaceData.useSavedCredentials 
                          ? 'bg-yellow-400 text-black font-medium' 
                          : 'bg-zinc-800 text-white border border-zinc-700 hover:bg-zinc-700'}`}
                      >
                        {t('workspaces.newKey', 'New Key')}
                      </button>
                      <button
                        type="button"
                        onClick={() => setWorkspaceData(prev => ({ ...prev, useSavedCredentials: true }))}
                        className={`flex-1 py-2 px-4 rounded-md transition-all ${workspaceData.useSavedCredentials 
                          ? 'bg-yellow-400 text-black font-medium' 
                          : 'bg-zinc-800 text-white border border-zinc-700 hover:bg-zinc-700'}`}
                      >
                        {t('workspaces.keysVault', 'Keys Vault')}
                      </button>
                    </div>
                    
                    {/* API Key Input Container with fixed height */}
                    <div className="h-24"> {/* Fixed height container */}
                      {!workspaceData.useSavedCredentials ? (
                        <div>
                          <div className="relative">
                            <input
                              type="password"
                              id="apiKey"
                              name="apiKey"
                              value={workspaceData.apiKey}
                              onChange={handleWorkspaceDataChange}
                              className="w-full pl-9 pr-3 py-2 bg-zinc-800 border border-zinc-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
                              placeholder={t('workspaces.enterApiKey', 'Enter API key')}
                            />
                            <Key className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                          </div>
                          <div className="flex items-center mt-1">
                            <p className="text-xs text-gray-400">
                              {t('workspaces.apiKeyInfo', 'Your API key is stored locally and never shared')}
                            </p>
                            {selectedProvider === "Groq" && (
                              <button
                                type="button"
                                onClick={() => openUrl("https://console.groq.com/keys")}
                                className="text-xs text-yellow-400 hover:text-yellow-300 ml-2 underline"
                              >
                                {t('workspaces.getGroqApiKey', 'Get Groq API Key')}
                              </button>
                            )}
                          </div>
                        </div>
                      ) : (
                        /* Keys Vault Selection */
                        <div>
                          <Select
                            id="savedKey"
                            value={workspaceData.apiKey}
                            onChange={(value) => setWorkspaceData(prev => ({ ...prev, apiKey: value }))}
                            options={[
                              { value: '', label: t('workspaces.selectSavedKey', 'Select a saved key...'), disabled: true },
                              { value: 'key1', label: 'Groq API Key' },
                              { value: 'key2', label: 'OpenAI API Key' }
                            ]}
                            label={t('workspaces.savedKey', 'Saved Key')}
                          />
                          <p className="text-xs text-gray-400 mt-1">
                            {t('workspaces.savedKeyInfo', 'Use a previously saved API key from your vault')}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Step 2: Create Agents */}
          {currentStep === 2 && (
            <div className="space-y-6 ">
              <div>
                <h2 className="text-xl font-bold text-white ">
                  {t('workspaces.createAgents', 'Create Agents')}
                </h2>
                <p className="text-gray-400 mb-6">
                  {t('workspaces.createAgentsDescription', 'An agent has a role and can perform tasks based on its capabilities.')}
                </p>
              </div>
              
              {/* Side-by-side layout for agent creation and list */}
              <div className="flex flex-col lg:flex-row gap-6">
                {/* Add Agent Form */}
                <div className="bg-zinc-800/50 rounded-lg p-6 border border-zinc-700 lg:w-4/7">
                  <h3 className="text-lg font-medium text-white mb-4 ">
                    {isEditingAgent 
                      ? t('workspaces.updateAgent', `Update Agent: ${newAgent.name}`) 
                      : t('workspaces.addAgent', `Add Agent`)}
                  </h3>
                  
                  <div className="space-y-4 mb-4">
                  
                    <div className="flex flex-col gap-1">
                      <label htmlFor="agentName" className="block text-sm font-medium text-gray-300 mb-1 ">
                        {t('workspaces.agentName', 'Name')}
                      </label>
                      <input
                        type="text"
                        id="agentName"
                        value={newAgent.name}
                        onChange={(e) => setNewAgent(prev => ({ ...prev, name: e.target.value }))}
                        className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
                        placeholder={t('workspaces.enterAgentName', 'Enter agent name')}
                      />
                    </div>
                    
                    <div className="flex flex-col gap-1">
                      <label htmlFor="agentRole" className="block text-sm font-medium text-gray-300 mb-1 ">
                        {t('workspaces.agentRole', 'Role')}
                      </label>
                      <input
                        type="text"
                        id="agentRole"
                        value={newAgent.role}
                        onChange={(e) => setNewAgent(prev => ({ ...prev, role: e.target.value }))}
                        className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
                        placeholder={t('workspaces.enterAgentRole', 'Enter agent role')}
                      />
                    </div>
                    
                    <div className="flex flex-col gap-1">
                       
                      <Select
                        id="agentLLM"
                        value={newAgent.llmId}
                        onChange={(value) => setNewAgent(prev => ({ ...prev, llmId: value }))}
                        options={[
                          { value: '', label: t('workspaces.useWorkspaceLLM', 'Use workspace default'), disabled: false },
                          ...availableLLMs.map(llm => ({
                            value: llm.id,
                            label: `${llm.name} (${llm.provider})`
                          }))
                        ]}
                        label={t('workspaces.agentLLM', 'Language Model')}
                      />
                      <p className="text-xs text-gray-400 mt-1">
                        {newAgent.llmId 
                          ? t('workspaces.customLLMSelected', 'Custom LLM selected for this agent') 
                          : t('workspaces.usingWorkspaceLLM', `Using workspace's main LLM: ${availableLLMs.find(llm => llm.id === workspaceData.mainLLM)?.name || 'None selected'}`)}
                      </p>
                    </div>
                    
                    {/* <div className="flex flex-col gap-1">
                      <label htmlFor="agentObjective" className="block text-sm font-medium text-gray-300 mb-1 ">
                        {t('workspaces.agentDescription', 'Objective')}
                      </label>
                      <textarea
                        id="agentObjective"
                        value={newAgent.objective}
                        onChange={(e) => setNewAgent(prev => ({ ...prev, objective: e.target.value }))}
                        className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-yellow-500 h-20"
                        placeholder={t('workspaces.enterAgentObjective', 'Enter agent objective')}
                      />
                    </div> */}
                    <div className="flex flex-col gap-1">
                      <label htmlFor="agentBackground" className="block text-sm font-medium text-gray-300 mb-1 ">
                        {t('workspaces.agentDescription', 'Background')}
                      </label>
                      <textarea
                        id="agentBackground"
                        value={newAgent.background}
                        onChange={(e) => setNewAgent(prev => ({ ...prev, background: e.target.value }))}
                        className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-yellow-500 h-20"
                        placeholder={t('workspaces.enterAgentBackground', 'Enter agent background')}
                      />
                    </div>
                    
                    
                    
                    <div className="mb-4">
                      <div className="flex items-center  gap-2 mb-2">
                        <label className="block text-sm font-medium text-gray-300">
                          {t('workspaces.agentTools', 'Agent Tools')}
                        </label>
                        <button
                          onClick={() => setShowToolPopup(true)}
                          className="text-yellow-400 hover:text-yellow-500 transition-colors flex items-center gap-1 text-sm cursor-pointer"
                          title={t('workspaces.addTool', 'Add tool')}
                        >
                          <Plus className="h-4 w-4 " />
                        </button>
                      </div>
                      
                      <div className="flex flex-col gap-4 h-14">
                        
                        {/* Selected Tools */}
                        {newAgent.tools.length > 0 ? (
                          <div className="mt-2">
                            <div className="flex overflow-x-auto pb-2">
                              <div className="flex gap-2">
                              
                              {newAgent.tools.map((tool) => {
                                // Determine badge color based on tool function
                                let badgeColor = "";
                                let functionLabel = "";
                                
                                if (tool.isInputChannel) {
                                  badgeColor = "bg-yellow-400 text-black";
                                  functionLabel = "Input";
                                } else if (tool.isOutputProducer) {
                                  badgeColor = "bg-yellow-400 text-black";
                                  functionLabel = "Output";
                                } else if (tool.isJudge) {
                                  badgeColor = "bg-yellow-400 text-black";
                                  functionLabel = "Judge";
                                }
                                
                                return (
                                  <div 
                                    key={tool.name} 
                                    className="bg-zinc-800 text-white px-2 py-1.5 rounded flex items-center gap-2 border border-zinc-700"
                                  >
                                    <span className="text-sm text-nowrap">{tool.name}</span>
                                    {functionLabel && (
                                      <span className={`${badgeColor} px-1.5 py-0.5 rounded text-xs`}>
                                        {functionLabel}
                                      </span>
                                    )}
                                    <div className="flex gap-1 ml-1">
                                      <button
                                        onClick={() => {
                                          // Open the tool popup for editing
                                          setEditingToolName(tool.name);
                                          setSelectedToolInPopup(tool.name);
                                          
                                          // Set the current tool property
                                          if (tool.isInputChannel) {
                                            setSelectedToolPropertyInPopup('isInputChannel');
                                          } else if (tool.isOutputProducer) {
                                            setSelectedToolPropertyInPopup('isOutputProducer');
                                          } else if (tool.isJudge) {
                                            setSelectedToolPropertyInPopup('isJudge');
                                          } else {
                                            setSelectedToolPropertyInPopup('none');
                                          }
                                          
                                          setShowToolPopup(true);
                                        }}
                                        className="text-gray-400 hover:text-yellow-400 transition-colors"
                                        title={t('workspaces.editTool', 'Edit tool')}
                                      >
                                        <Edit2 className="h-3 w-3" />
                                      </button>
                                      <button
                                        onClick={() => handleRemoveTool(tool.name)}
                                        className="text-gray-400 hover:text-red-500 transition-colors"
                                        title={t('workspaces.removeTool', 'Remove tool')}
                                      >
                                        <X className="h-3 w-3" />
                                      </button>
                                    </div>
                                  </div>
                                );
                              })}
                              </div>
                            </div>
                          </div>
                        ) : (<p className="mt-2 text-sm text-gray-400">{t('workspaces.noToolsSelected', 'No tools selected - Press the plus button to add tools')}</p>)}
                      </div>
                      
                      {/* Tool Selection Popup */}
                      {showToolPopup && (
                        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                          <div 
                            ref={popupRef}
                            className="bg-zinc-900 rounded-lg p-5 border border-zinc-700 w-full max-w-md shadow-xl animate-in fade-in duration-200"
                          >
                            <div className="flex justify-between items-center mb-4">
                              <h3 className="text-lg font-medium text-white">
                                {editingToolName ? t('workspaces.editTool', 'Edit Tool') : t('workspaces.addTool', 'Add Tool')}
                              </h3>
                              <button 
                                onClick={() => {
                                  setShowToolPopup(false);
                                  setEditingToolName(null);
                                  setSelectedToolPropertyInPopup('none');
                                }}
                                className="text-gray-400 hover:text-white"
                              >
                                <X className="h-5 w-5" />
                              </button>
                            </div>
                            
                            <div className="mb-4">
                              <Select
                                id="toolPopupSelect"
                                value={selectedToolInPopup}
                                onChange={(value) => setSelectedToolInPopup(value)}
                                options={[
                                  { value: '', label: t('workspaces.selectTool', 'Select a tool...'), disabled: true },
                                  ...availableTools
                                    .filter(tool => !newAgent.tools.some(t => t.name === tool.name) || tool.name === editingToolName)
                                    .map(tool => ({
                                      value: tool.name,
                                      label: tool.name
                                    }))
                                ]}
                                label={t('workspaces.selectTool', 'Select Tool')}
                              />
                            </div>
                            
                            <div className="mb-4">
                              <label className="block text-sm font-medium text-gray-300 mb-1">
                                {t('workspaces.toolProperty', 'Tool Property')}
                              </label>
                              <div className="grid grid-cols-2 gap-2">
                                <button
                                  onClick={() => setSelectedToolPropertyInPopup('none')}
                                  className={`py-2 px-3 rounded-md text-sm ${selectedToolPropertyInPopup === 'none' ? 'bg-yellow-500 text-white' : 'bg-zinc-700 text-gray-300 hover:bg-zinc-600'}`}
                                >
                                  {t('workspaces.noProperty', 'None')}
                                </button>
                                <button
                                  onClick={() => setSelectedToolPropertyInPopup('isInputChannel')}
                                  className={`py-2 px-3 rounded-md text-sm ${selectedToolPropertyInPopup === 'isInputChannel' ? 'bg-yellow-500 text-white' : 'bg-zinc-700 text-gray-300 hover:bg-zinc-600'}`}
                                >
                                  {t('workspaces.inputChannel', 'Input Channel')}
                                </button>
                                <button
                                  onClick={() => setSelectedToolPropertyInPopup('isOutputProducer')}
                                  className={`py-2 px-3 rounded-md text-sm ${selectedToolPropertyInPopup === 'isOutputProducer' ? 'bg-yellow-500 text-white' : 'bg-zinc-700 text-gray-300 hover:bg-zinc-600'}`}
                                >
                                  {t('workspaces.outputProducer', 'Output Producer')}
                                </button>
                                <button
                                  onClick={() => setSelectedToolPropertyInPopup('isJudge')}
                                  className={`py-2 px-3 rounded-md text-sm ${selectedToolPropertyInPopup === 'isJudge' ? 'bg-yellow-500 text-white' : 'bg-zinc-700 text-gray-300 hover:bg-zinc-600'}`}
                                >
                                  {t('workspaces.judge', 'Judge')}
                                </button>
                              </div>
                            </div>
                            
                            <div className="flex gap-2 justify-end">
                              <Button
                                onClick={() => {
                                  setShowToolPopup(false);
                                  setEditingToolName(null);
                                  setSelectedToolPropertyInPopup('none');
                                }}
                                className="bg-zinc-700 hover:bg-zinc-600 text-white font-medium border-0"
                              >
                                {t('common.cancel', 'Cancel')}
                              </Button>
                              <Button
                                onClick={() => handleAddTool(selectedToolInPopup)}
                                className="bg-yellow-500 hover:bg-yellow-600 text-white font-medium border-0"
                                disabled={!selectedToolInPopup}
                              >
                                {editingToolName ? t('common.update', 'Update') : t('common.add', 'Add')}
                              </Button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {isEditingAgent ? (
                    <div className="flex gap-2">
                      
                      <Button
                        onClick={() => {
                          setNewAgent({
                            name: "",
                            role: "",
                            objective: "",
                            background: "",
                            capabilities: "",
                            tools: [],
                            llmId: workspaceData.mainLLM
                          });
                          setIsEditingAgent(false);
                        }}
                        className="flex-1 bg-zinc-700 hover:bg-zinc-600 text-white font-medium border-0 flex items-center justify-center"
                      >
                        <X className="h-4 w-4" />
                        {t('workspaces.cancelEdit', 'Cancel')}
                      </Button> 
                      <Button
                        onClick={handleAddAgent}
                        className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-black font-medium border-0 flex items-center justify-center"
                        disabled={!newAgent.name.trim()}
                      >
                        <Check className="h-4 w-4" />
                        {t('workspaces.updateAgent', 'Update Agent')}
                      </Button>
                    </div>
                  ) : (
                    <Button
                      onClick={handleAddAgent}
                      className="w-full bg-yellow-500 hover:bg-yellow-600 text-black font-medium border-0 flex items-center justify-center"
                      disabled={!newAgent.name.trim()}
                    >
                      <Plus className="h-4 w-4" />
                      {t('workspaces.addAgent', 'Add Agent')}
                    </Button>
                  )}
                </div>
                
                {/* Agent List */}
                <div className="bg-zinc-800/50 rounded-lg p-6 border border-zinc-700 lg:w-3/7">
                  <h3 className="flex justify-between items-center text-lg font-medium text-white mb-4 ">
                    <span>{t('workspaces.agentList', 'Agent List')}</span> {workspaceData.agents.length > 0 && <span  className="text-gray-400 text-sm"> {workspaceData.agents.length} agent(s) added</span>}
                  </h3>
                  
                  {workspaceData.agents.length > 0 ? (
                    <div className="space-y-3 max-h-[500px] overflow-y-auto">
                      {workspaceData.agents.map((agent) => (
                        <div key={agent.id} className="bg-zinc-800 rounded-lg p-4 flex justify-between items-start">
                          <div>
                            <div className="flex items-center">
                              <h4 className="font-medium text-white">{agent.name}</h4>
                              {agent.role && (
                                <span className="ml-2 text-sm text-yellow-400">{agent.role}</span>
                              )}
                            </div>
                            {agent.objective && (
                              <p className="text-sm text-gray-400 mt-1">{agent.objective}</p>
                            )}
                            {agent.capabilities && (
                              <p className="text-sm text-gray-400 mt-1">{agent.capabilities}</p>
                            )}
                            {agent.llmId && agent.llmId !== workspaceData.mainLLM && (
                              <div className="mt-1 flex items-center">
                                <span className="text-xs text-yellow-400">
                                  LLM: {availableLLMs.find(llm => llm.id === agent.llmId)?.name || agent.llmId}
                                </span>
                              </div>
                            )}
                            {agent.tools.length > 0 && (
                              <div className="mt-2 flex flex-wrap gap-1">
                                {agent.tools.map((tool, index) => {
                                  let roleLabel = "";
                                  let bgColor = "";
                                  
                                  if (tool.isInputChannel) {
                                    roleLabel = "Input";
                                    bgColor = "bg-yellow-400 text-black";
                                  } else if (tool.isOutputProducer) {
                                    roleLabel = "Output";
                                    bgColor = "bg-yellow-400 text-black";
                                  } else if (tool.isJudge) {
                                    roleLabel = "Judge";
                                    bgColor = "bg-yellow-400 text-black";
                                  }
                                  
                                  return (
                                    <span 
                                      key={index} 
                                      className="text-xs bg-zinc-700 text-gray-300 px-2 py-1 rounded flex items-center gap-1.5"
                                    >
                                      {tool.name}
                                      {roleLabel && (
                                        <span className={`${bgColor} px-1.5 py-0.5 rounded text-[10px] text-white`}>
                                          {roleLabel}
                                        </span>
                                      )}
                                    </span>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleEditAgent(agent.id)}
                              className="text-gray-400 hover:text-yellow-400 transition-colors"
                            >
                              <Edit2 className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleRemoveAgent(agent.id)}
                              className="text-gray-400 hover:text-red-500 transition-colors"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center text-gray-400 py-8 bg-zinc-800/30 rounded-lg border border-zinc-700">
                      {t('workspaces.noAgents', 'No agents added yet')}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
          
          {/* Step 3: Define Tasks */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-white mb-4 ">
                  {t('workspaces.defineTasks', 'Define Tasks')}
                </h2>
                <p className="text-gray-400 mb-6">
                  {t('workspaces.defineTasksDescription', 'Add high-level tasks for your workspace')}
                </p>
              </div>
              
              {/* Side-by-side layout for task creation and list */}
              <div className="flex flex-col lg:flex-row gap-6 h-full">
                {/* Add Task Form */}
                <div className="bg-zinc-800/50 rounded-lg p-6 border border-zinc-700 lg:w-3/5 flex flex-col h-full">
                  <h3 className="text-lg font-medium text-white mb-4 ">
                    {t('workspaces.addTask', `Add Task (${workspaceData.tasks.length + 1})`)}
                  </h3>
                  
                  <div className="space-y-4 mb-4">
                    <div>
                      <label htmlFor="taskName" className="block text-sm font-medium text-gray-300 mb-1 ">
                        {t('workspaces.taskName', 'Task Name')}
                      </label>
                      <input
                        type="text"
                        id="taskName"
                        value={newTask.name}
                        onChange={(e) => setNewTask(prev => ({ ...prev, name: e.target.value }))}
                        className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
                        placeholder={t('workspaces.enterTaskName', 'Enter task name')}
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="taskDescription" className="block text-sm font-medium text-gray-300 mb-1 ">
                        {t('workspaces.taskDescription', 'Task Description')}
                      </label>
                      <textarea
                        id="taskDescription"
                        value={newTask.description}
                        onChange={(e) => setNewTask(prev => ({ ...prev, description: e.target.value }))}
                        className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-yellow-500 h-20"
                        placeholder={t('workspaces.enterTaskDescription', 'Enter task description')}
                      />
                    </div>
                    <div>
                      <label htmlFor="taskExpectedOutput" className="block text-sm font-medium text-gray-300 mb-1 ">
                        {t('workspaces.taskExpectedOutput', 'Task Expected Output')}
                      </label>
                      <input
                        type="text"
                        id="taskExpectedOutput"
                        value={newTask.expectedOutput}
                        onChange={(e) => setNewTask(prev => ({ ...prev, expectedOutput: e.target.value }))}
                        className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
                        placeholder={t('workspaces.enterTaskExpectedOutput', 'Enter task expected output')}
                      />
                    </div>
                    <div className="mb-4 border-t border-zinc-700 pt-4">
                      <label className="block text-sm font-medium text-gray-300 mb-3 ">
                        {t('workspaces.taskExecutionType', 'Task Execution Type')}
                      </label>
                      <div className="bg-zinc-800 p-4 rounded-lg border border-zinc-700">
                        <p className="text-xs text-gray-400 mb-3">
                          {t('workspaces.taskTypeDescription', 'Choose how this task will be executed. A task can either be assigned to an agent or execute a workflow, but not both.')}
                        </p>
                        <div className="flex flex-col gap-4">
                          {/* Radio button for Agent option */}
                          <div 
                            className={`flex items-start p-3 rounded-md cursor-pointer ${taskType === 'agent' ? 'bg-zinc-700 border border-yellow-400/50' : 'bg-zinc-800/80 border border-zinc-700 hover:bg-zinc-700/50'}`}
                            onClick={() => {
                              setTaskType('agent');
                              setNewTask(prev => ({
                                ...prev,
                                executeWorkflow: false,
                                workflowId: null
                              }));
                            }}
                          >
                            <div className="flex items-center h-5">
                              <input
                                type="radio"
                                id="taskTypeAgent"
                                name="taskType"
                                checked={taskType === 'agent'}
                                onChange={() => {
                                  setTaskType('agent');
                                  setNewTask(prev => ({
                                    ...prev,
                                    executeWorkflow: false,
                                    workflowId: null
                                  }));
                                }}
                                className="h-4 w-4 text-yellow-400 focus:ring-yellow-500 border-zinc-700 bg-zinc-800"
                              />
                            </div>
                            <div className="ml-3 flex-1">
                              <label htmlFor="taskTypeAgent" className="font-medium text-white cursor-pointer">
                                {t('workspaces.assignToAgent', 'Assign to Agent')}
                              </label>
                              <p className="text-xs text-gray-400 mt-1">
                                {t('workspaces.assignToAgentDescription', 'The task will be handled by a single agent with specific capabilities')}
                              </p>
                              
                              {taskType === 'agent' && (
                                <div className="mt-3 pl-1">
                                  <Select
                                    id="taskAssignedAgent"
                                    value={newTask.assignedAgent || ""}
                                    onChange={(value) => setNewTask(prev => ({ 
                                      ...prev, 
                                      assignedAgent: value ? value : null 
                                    }))}
                                    options={[
                                      { value: '', label: t('workspaces.autoAssignAgent', 'Auto-assign best fit'), disabled: true },
                                      ...workspaceData.agents.map(agent => ({
                                        value: agent.id,
                                        label: agent.name
                                      }))
                                    ]}
                                    label={t('workspaces.agentAssignment', 'Agent Assignment')}
                                  />
                                  <p className="text-xs text-gray-400 mt-1">
                                    {t('workspaces.agentAssignmentInfo', 'Leave empty to auto-assign the best agent for this task')}
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                          
                          {/* Radio button for Workflow option */}
                          <div 
                            className={`flex items-start p-3 rounded-md cursor-pointer ${taskType === 'workflow' ? 'bg-zinc-700 border border-yellow-400/50' : 'bg-zinc-800/80 border border-zinc-700 hover:bg-zinc-700/50'}`}
                            onClick={() => {
                              setTaskType('workflow');
                              setNewTask(prev => ({
                                ...prev,
                                assignedAgent: null,
                                executeWorkflow: true
                              }));
                            }}
                          >
                            <div className="flex items-center h-5">
                              <input
                                type="radio"
                                id="taskTypeWorkflow"
                                name="taskType"
                                checked={taskType === 'workflow'}
                                onChange={() => {
                                  setTaskType('workflow');
                                  setNewTask(prev => ({
                                    ...prev,
                                    assignedAgent: null,
                                    executeWorkflow: true
                                  }));
                                }}
                                className="h-4 w-4 text-yellow-400 focus:ring-yellow-500 border-zinc-700 bg-zinc-800"
                              />
                            </div>
                            <div className="ml-3 flex-1">
                              <label htmlFor="taskTypeWorkflow" className="font-medium text-white cursor-pointer">
                                {t('workspaces.executeWorkflow', 'Execute a Workflow')}
                              </label>
                              <p className="text-xs text-gray-400 mt-1">
                                {t('workspaces.executeWorkflowDescription', 'The task will execute a predefined workflow with multiple steps')}
                              </p>
                              
                              {taskType === 'workflow' && (
                                <div className="mt-3 pl-1">
                                  <Select
                                    id="taskWorkflowId"
                                    value={newTask.workflowId || ""}
                                    onChange={(value) => setNewTask(prev => ({ 
                                      ...prev, 
                                      workflowId: value ? value : null 
                                    }))}
                                    options={[
                                      { value: '', label: t('workspaces.selectWorkflow', 'Select a workflow...'), disabled: true },
                                      // Example workflows - replace with actual workflows data
                                      { value: 'workflow1', label: 'Data Processing Workflow' },
                                      { value: 'workflow2', label: 'Content Generation Workflow' },
                                      { value: 'workflow3', label: 'Analysis Workflow' }
                                    ]}
                                    label={t('workspaces.workflowSelection', 'Workflow Selection')}
                                  />
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <Button
                    onClick={handleAddTask}
                    className="w-full bg-zinc-700 hover:bg-zinc-600 text-white font-medium border-0 flex items-center justify-center mt-auto"
                    disabled={!newTask.name.trim()}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    {t('workspaces.addTask', 'Add Task')}
                  </Button>
                </div>
                
                {/* Task List */}
                <div className="bg-zinc-800/50 rounded-lg p-6 border border-zinc-700 lg:w-2/5 flex flex-col h-full">
                  <h3 className="text-lg font-medium text-white mb-4 ">
                    {t('workspaces.taskList', 'Task List')}
                  </h3>
                  
                  {workspaceData.tasks.length > 0 ? (
                    <div className="space-y-3 flex-grow overflow-y-auto">
                      {workspaceData.tasks.map((task) => (
                        <div key={task.id} className="bg-zinc-800 rounded-lg p-4 flex justify-between items-start w-full">
                          <div className="w-full">
                            <div className="flex items-center justify-between">
                              <h4 className="font-medium text-white">{task.name}</h4>
                              <div className="flex items-center gap-2">
                                {task.executeWorkflow ? (
                                  <span className="text-xs bg-blue-500 text-white px-2 py-1 rounded-full flex items-center gap-1">
                                    <span className="font-medium">Workflow</span>
                                    {task.workflowId && (
                                      <span className="text-[10px] bg-blue-600/60 px-1.5 py-0.5 rounded">
                                        {task.workflowId === 'workflow1' ? 'Data Processing' : 
                                         task.workflowId === 'workflow2' ? 'Content Generation' : 
                                         task.workflowId === 'workflow3' ? 'Analysis' : 'Selected'}
                                      </span>
                                    )}
                                  </span>
                                ) : (
                                  <span className="text-xs bg-green-500 text-white px-2 py-1 rounded-full flex items-center gap-1">
                                    <span className="font-medium">Agent</span>
                                    {task.assignedAgent ? (
                                      <span className="text-[10px] bg-green-600/60 px-1.5 py-0.5 rounded">
                                        {workspaceData.agents.find(a => a.id === task.assignedAgent)?.name || 'Assigned'}
                                      </span>
                                    ) : (
                                      <span className="text-[10px] bg-green-600/60 px-1.5 py-0.5 rounded">
                                        Auto-assign
                                      </span>
                                    )}
                                  </span>
                                )}
                              </div>
                            </div>
                            {task.description && (
                              <div className="mt-2">
                                <span className="text-xs font-medium text-gray-400">Description:</span>
                                <p className="text-sm text-gray-300">{task.description}</p>
                              </div>
                            )}
                            {task.expectedOutput && (
                              <div className="mt-2">
                                <span className="text-xs font-medium text-gray-400">Expected Output:</span>
                                <p className="text-sm text-gray-300">{task.expectedOutput}</p>
                              </div>
                            )}
                            {task.executeWorkflow && task.workflowId && (
                              <div className="mt-2">
                                <span className="text-xs font-medium text-gray-400">Workflow:</span>
                                <p className="text-sm text-gray-300">
                                  {task.workflowId === 'workflow1' ? 'Data Processing Workflow' : 
                                   task.workflowId === 'workflow2' ? 'Content Generation Workflow' : 
                                   task.workflowId === 'workflow3' ? 'Analysis Workflow' : task.workflowId}
                                </p>
                              </div>
                            )}
                            {!task.executeWorkflow && (
                              <div className="mt-2">
                                <span className="text-xs font-medium text-gray-400">Execution:</span>
                                <p className="text-sm text-gray-300">
                                  {task.assignedAgent 
                                    ? `Assigned to ${workspaceData.agents.find(a => a.id === task.assignedAgent)?.name || 'agent'}` 
                                    : 'Will be automatically assigned to the best agent'}
                                </p>
                              </div>
                            )}
                          </div>
                          <button
                            onClick={() => handleRemoveTask(task.id)}
                            className="text-gray-400 hover:text-red-500 transition-colors ml-4 flex-shrink-0"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center text-gray-400 py-8 bg-zinc-800/30 rounded-lg border border-zinc-700 flex-grow flex items-center justify-center">
                      {t('workspaces.noTasks', 'No tasks added yet')}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
          
       
          
          {/* Step 4: Review & Confirm */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-white mb-4 ">
                  {t('workspaces.reviewAndConfirm', 'Review & Confirm')}
                </h2>
                <p className="text-gray-400 mb-6">
                  {t('workspaces.reviewDescription', 'Review your workspace configuration before creating')}
                </p>
              </div>
              
              <div className="space-y-6">
                {/* Workspace Basics */}
                <div className="bg-zinc-800/50 rounded-lg p-4 border border-zinc-700">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="text-lg font-medium text-white ">
                      {t('workspaces.workspaceBasics', 'Workspace Setup')}
                    </h3>
                    <button
                      onClick={() => handleGoToStep(1)}
                      className="text-yellow-400 hover:text-yellow-300 text-sm"
                    >
                      {t('common.edit', 'Edit')}
                    </button>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex">
                      <span className="text-gray-400 w-32">{t('workspaces.workspaceName', 'Workspace Name')}:</span>
                      <span className="text-white font-medium">{workspaceData.name}</span>
                    </div>
                    {workspaceData.description && (
                      <div className="flex">
                        <span className="text-gray-400 w-32">{t('workspaces.description', 'Description')}:</span>
                        <span className="text-white">{workspaceData.description}</span>
                      </div>
                    )}
                    <div className="flex">
                      <span className="text-gray-400 w-32">{t('workspaces.mainLLM', 'Main LLM')}:</span>
                      <span className="text-white font-medium">
                        {availableLLMs.find(llm => llm.id === workspaceData.mainLLM)?.name || workspaceData.mainLLM}
                      </span>
                    </div>
                    <div className="flex">
                      <span className="text-gray-400 w-32">{t('workspaces.credentials', 'Credentials')}:</span>
                      <span className="text-white">
                        {workspaceData.useSavedCredentials 
                          ? t('workspaces.usingSavedCredentials', 'Using saved credentials')
                          : t('workspaces.usingCustomApiKey', 'Using custom API key')
                        }
                      </span>
                    </div>
                  </div>
                </div>
                
                {/* Agents */}
                <div className="bg-zinc-800/50 rounded-lg p-4 border border-zinc-700">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="text-lg font-medium text-white ">
                      {t('workspaces.agents', 'Agents')}
                    </h3>
                    <button
                      onClick={() => handleGoToStep(2)}
                      className="text-yellow-400 hover:text-yellow-300 text-sm"
                    >
                      {t('common.edit', 'Edit')}
                    </button>
                  </div>
                  
                  {workspaceData.agents.length > 0 ? (
                    <div className="space-y-2">
                      {workspaceData.agents.map((agent) => (
                        <div key={agent.id} className="bg-zinc-800 rounded-md p-2">
                          <div className="font-medium text-white">{agent.name}</div>
                          <div className="text-sm text-yellow-400">{agent.role}</div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-gray-400">
                      {t('workspaces.noAgents', 'No agents added yet')}
                    </div>
                  )}
                </div>
                
                {/* Tasks */}
                <div className="bg-zinc-800/50 rounded-lg p-4 border border-zinc-700">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="text-lg font-medium text-white ">
                      {t('workspaces.tasks', 'Tasks')}
                    </h3>
                    <button
                      onClick={() => handleGoToStep(3)}
                      className="text-yellow-400 hover:text-yellow-300 text-sm"
                    >
                      {t('common.edit', 'Edit')}
                    </button>
                  </div>
                  
                  {workspaceData.tasks.length > 0 ? (
                    <div className="space-y-2">
                      {workspaceData.tasks.map((task) => (
                        <div key={task.id} className="bg-zinc-800 rounded-md p-3">
                          <div className="flex justify-between items-start">
                            <div className="font-medium text-white">{task.name}</div>
                            <div className="flex items-center gap-1">
                              {task.executeWorkflow && (
                                <span className="text-xs bg-blue-500 text-white px-2 py-0.5 rounded-full">
                                  Workflow
                                </span>
                              )}
                              {task.assignedAgent ? (
                                <span className="text-xs bg-green-500 text-white px-2 py-0.5 rounded-full">
                                  {workspaceData.agents.find(a => a.id === task.assignedAgent)?.name || 'Assigned'}
                                </span>
                              ) : (
                                <span className="text-xs bg-yellow-400 text-black px-2 py-0.5 rounded-full">
                                  Auto-assign
                                </span>
                              )}
                            </div>
                          </div>
                          {task.description && (
                            <div className="text-sm text-gray-400 mt-1">{task.description}</div>
                          )}
                          {task.expectedOutput && (
                            <div className="text-sm text-gray-400 mt-1">
                              <span className="text-xs font-medium text-gray-300">Expected: </span>
                              {task.expectedOutput}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-gray-400">
                      {t('workspaces.noTasks', 'No tasks added yet')}
                    </div>
                  )}
                </div>
                
                
                
                <div className="bg-green-900/20 rounded-lg p-4 border border-green-800">
                  <p className="text-green-400 text-center">
                    {t('workspaces.readyToCreate', 'Your workspace is ready to be created. Click "Create Workspace" to continue.')}
                  </p>
                </div>
              </div>
            </div>
          )}
        </form>
      </div>
      {/* Navigation and submit buttons - sticky to the bottom */}
      <div className="fixed bottom-0 left-0 right-0 flex justify-center z-50">
        <div className="flex justify-between items-center p-6 border-t border-zinc-800 bg-zinc-900 w-full max-w-5xl shadow-lg">
          {currentStep > 1 ? (
            <Button
              onClick={handlePrevStep}
             className="bg-yellow-400 hover:bg-yellow-500 text-black font-medium border-0 flex items-center"
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              {t('common.back', 'Back')}
            </Button>
          ) : (
            <Button
              onClick={onClose}
              className="bg-yellow-400 hover:bg-yellow-500 text-black font-medium border-0 flex items-center"
            >
              {t('common.cancel', 'Cancel')}
            </Button>
          )}
          
          {currentStep < 4 ? (
            <div className="flex gap-2">
              {currentStep != 1 && (
                <Button
                  onClick={() => handleSubmit(new Event('submit') as unknown as React.FormEvent)}
                  className="bg-red-400 hover:bg-red-500 text-black font-medium border-0 flex items-center"
                >
                  
                  {t('common.finish', 'Finish')}
                </Button>
              )}
              <Button
                onClick={handleNextStep}
                className="bg-yellow-400 hover:bg-yellow-500 text-black font-medium border-0 flex items-center"
                disabled={!getCurrentStepValidation()}
              >
                {t('common.next', 'Next')}
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          ) : (
            <Button
              onClick={() => handleSubmit(new Event('submit') as unknown as React.FormEvent)}
              className="bg-green-500 hover:bg-green-600 text-black font-medium border-0 flex items-center"
              disabled={!isStep4Valid}
            >
              <Check className="h-4 w-4 mr-2" />
              {t('common.finish', 'Finish')}
            </Button>
          )}
        </div>
      </div>
    </div>
    </div>
  );
};

export default WorkspaceCreationWizard;
