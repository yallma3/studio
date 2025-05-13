import React, { useState } from "react";
import { Button } from "../../../components/ui/button";
import { useTranslation } from "react-i18next";
import { Plus, Trash2, ChevronRight, ChevronLeft, Check, X, Key } from "lucide-react";
import { ProjectData, LLMOption, Agent, Task } from "../types/Types";
import { openUrl } from '@tauri-apps/plugin-opener'

interface ProjectCreationWizardProps {
  open: boolean;
  onClose: () => void;
  onCreateProject: (projectData: ProjectData) => void;
}

const ProjectCreationWizard: React.FC<ProjectCreationWizardProps> = ({
  open,
  onClose,
  onCreateProject,
}) => {
  const { t } = useTranslation();
  const [currentStep, setCurrentStep] = useState(1);
  const availableTools = [{name: "Web Search", isInputChannel: false, isOutputProducer: false, isJudge: false}, {name: "Compile Code", isInputChannel: false, isOutputProducer: false, isJudge: false}, {name: "Api Call", isInputChannel: false, isOutputProducer: false, isJudge: false}]
  // Available LLM options
  const availableLLMs: LLMOption[] = [
    {
      id: "gpt-4",
      name: "GPT-4",
      provider: "OpenAI",
      tokenLimit: 8192,
      capabilities: ["Advanced reasoning", "Code generation", "Complex instructions"]
    },
    {
      id: "gpt-3.5-turbo",
      name: "GPT-3.5 Turbo",
      provider: "OpenAI",
      tokenLimit: 4096,
      capabilities: ["Fast responses", "General knowledge", "Basic reasoning"]
    },
    {
      id: "claude-3-opus",
      name: "Claude 3 Opus",
      provider: "Anthropic",
      tokenLimit: 200000,
      capabilities: ["Advanced reasoning", "Long context", "Detailed analysis"]
    },
    {
      id: "claude-3-sonnet",
      name: "Claude 3 Sonnet",
      provider: "Anthropic",
      tokenLimit: 100000,
      capabilities: ["Balanced performance", "Long context", "Creative writing"]
    },
    {
      id: "gemini-pro",
      name: "Gemini Pro",
      provider: "Google",
      tokenLimit: 32768,
      capabilities: ["Multimodal understanding", "Research", "Reasoning"]
    },
    {
      id: "llama-3-70b",
      name: "Llama 3 (70B)",
      provider: "Meta",
      tokenLimit: 8192,
      capabilities: ["Open source", "Customizable", "General purpose"]
    },
    {
      id: "mixtral-8x7b",
      name: "Mixtral 8x7B",
      provider: "Groq",
      tokenLimit: 32768,
      capabilities: ["Fast inference", "High throughput", "Balanced performance"]
    },
    {
      id: "llama-2-70b",
      name: "Llama 2 (70B)",
      provider: "Groq",
      tokenLimit: 4096,
      capabilities: ["Open source", "Fast inference", "General purpose"]
    }
  ];
  
  // Get unique providers from available LLMs
  const llmProviders = [...new Set(availableLLMs.map(llm => llm.provider))];
  
  // Project data state
  const [projectData, setProjectData] = useState<ProjectData>({
    id: `project-${Date.now()}`,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    // Step 1: Project Basics
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
  const [newAgent, setNewAgent] = useState<Omit<Agent, "id">>({
    name: "",
    role: "",
    objective: "",
    background: "",
    capabilities: "",
    tools: [],
    llmId: projectData.mainLLM // Default to project's main LLM
  });
 
  
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
      
      // Call the onCreateProject callback
      onCreateProject(projectData);
      
      // Reset form
      setProjectData({
        id: `project-${Date.now()}`,
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
      console.error("Error saving project:", error);
      // You could add error handling UI here if needed
    }
  };
  
  // Step validation
  const isStep1Valid = projectData.name.trim() !== "";
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

  // Handlers for project data changes
  const handleProjectDataChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setProjectData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setProjectData(prev => ({
      ...prev,
      [name]: checked
    }));
  };

 
 

  // Task management
  const handleAddTask = () => {
    if (newTask.name.trim()) {
      const task: Task = {
        id: Date.now().toString(),
        ...newTask
      };
      
      setProjectData(prev => ({
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
    setProjectData(prev => ({
      ...prev,
      tasks: prev.tasks.filter(task => task.id !== id)
    }));
  };
  
  // Agent management
  const handleAddAgent = () => {
    if (newAgent.name.trim()) {
      const agent: Agent = {
        id: Date.now().toString(),
        ...newAgent
      };
      
      setProjectData(prev => ({
        ...prev,
        agents: [...prev.agents, agent]
      }));
      
      setNewAgent({
        name: "",
        role: "",
        objective: "",
        background: "",
        capabilities: "",
        tools: [],
        llmId: projectData.mainLLM // Keep using project's main LLM as default
      });
    }
  };

  const handleRemoveAgent = (id: string) => {
    setProjectData(prev => ({
      ...prev,
      agents: prev.agents.filter(agent => agent.id !== id)
    }));
  };
  
  const handleAddTool = (tool: string) => {
    // Check if the tool is already added
    if (newAgent.tools.some(t => t.name === tool)) {
      return; // Tool already exists, don't add it again
    }
    
    setNewAgent(prev => ({ 
      ...prev, 
      tools: [...prev.tools, {name: tool, isInputChannel: false, isOutputProducer: false, isJudge: false}] 
    }));
  };

  const handleRemoveTool = (tool: string) => {
    setNewAgent(prev => ({
      ...prev,
      tools: prev.tools.filter(t => t.name !== tool)
    }));
  };
  
  const handleToolPropertyChange = (toolName: string, property: 'isInputChannel' | 'isOutputProducer' | 'isJudge', value: boolean) => {
    setNewAgent(prev => ({
      ...prev,
      tools: prev.tools.map(t => {
        if (t.name === toolName) {
          // Reset all properties first
          const updatedTool = {
            ...t,
            isInputChannel: false,
            isOutputProducer: false,
            isJudge: false
          };
          
          // Set only the selected property if value is true
          if (value) {
            updatedTool[property] = true;
          }
          
          return updatedTool;
        }
        return t;
      })
    }));
  };
  
  
  


  // Step indicator component
  const renderStepIndicator = () => {
    const steps = [
      { number: 1, title: t('projects.projectBasics', 'Project Setup') },
      { number: 2, title: t('projects.createAgents', 'Agents') },
      { number: 3, title: t('projects.defineTasks', 'Tasks') },
      { number: 4, title: t('projects.review', 'Review & Confirm') }
    ];

    return (
      <div className="w-full mb-8">
        <div className="flex justify-between items-center">
          {steps.map((step) => (
            <div 
              key={step.number}
              className={`flex flex-col items-center cursor-pointer ${currentStep === step.number ? 'opacity-100' : 'opacity-60'}`}
              onClick={() => handleGoToStep(step.number)}
            >
              <div 
                className={`w-10 h-10 rounded-full flex items-center justify-center text-sm
                  ${currentStep === step.number 
                    ? 'bg-yellow-400 text-black' 
                    : currentStep > step.number 
                      ? 'bg-green-500 text-white' 
                      : 'bg-gray-700 text-gray-300'}`}
              >
                {currentStep > step.number ? <Check className="h-5 w-5" /> : step.number}
              </div>
              <div className="text-xs text-white mt-2 text-center max-w-[80px]">{step.title}</div>
            </div>
          ))}
        </div>
        <div className="relative mt-4">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gray-700"></div>
          <div 
            className="absolute top-0 left-0 h-1 bg-yellow-400 transition-all duration-300"
            style={{ width: `${(currentStep - 1) * 25}%` }}
          ></div>
        </div>
      </div>
    );
  };

  return (
    <div className={`fixed inset-0 z-50 flex flex-col bg-gray-900 ${open ? 'block' : 'hidden'}`}>
      <div className="flex justify-between items-center p-6 border-b border-gray-800">
        <h1 className="text-2xl font-bold text-white font-mono">
          {t('projects.createNewProject', 'Create New Project')}
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
          {/* Step 1: Project Basics and LLM Selection */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-white mb-4 font-mono">
                  {t('projects.projectBasics', 'Project Setup')}
                </h2>
              </div>
              
              {/* Side-by-side layout */}
              <div className="flex flex-col md:flex-row gap-6 w-full">
                {/* Project Info Section */}
                <div className="bg-gray-800/50 rounded-lg p-5 border border-gray-700 flex-1">
                  <h3 className="text-lg font-medium text-white mb-4 font-mono">
                    {t('projects.projectInfo', 'Project Information')}
                  </h3>
                  
                  <div className="space-y-4">
                    
                    
                    <div className="flex flex-col gap-2">
                      <label htmlFor="description" className="block text-sm font-medium text-gray-300 mb-1 font-mono">
                        {t('projects.projectDescription', 'Project Description')}
                      </label>
                      <textarea
                        id="description"
                        name="description"
                        value={projectData.description}
                        onChange={handleProjectDataChange}
                        className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-yellow-500 h-32"
                        placeholder={t('projects.enterProjectDescription', 'Describe the purpose of this project...')}
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-1 font-mono">
                        {t('projects.projectName', 'Project Name')} *
                      </label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        value={projectData.name}
                        onChange={handleProjectDataChange}
                        className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
                        placeholder={t('projects.enterProjectName', 'Enter project name')}
                        required
                      />
                    </div>
                  </div>
                </div>
                
                {/* LLM Selection Section */}
                <div className="bg-gray-800/50 rounded-lg p-5 border border-gray-700 flex-1">
                  <h3 className="text-lg font-medium text-white mb-4 font-mono">
                    {t('projects.selectLLM', 'Select Main LLM')}
                  </h3>
                  <p className="text-gray-400 mb-6">
                    {t('projects.selectLLMDescription', 'Choose the primary language model for your project')}
                  </p>
                  
                  {/* Provider Selection */}
                  <div className="mb-6">
                    <label htmlFor="provider" className="block text-sm font-medium text-gray-300 mb-2 font-mono">
                      {t('projects.selectProvider', 'Select Provider')}
                    </label>
                    <select
                      id="provider"
                      value={selectedProvider}
                      onChange={(e) => setSelectedProvider(e.target.value)}
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
                    >
                      <option disabled value="">{t('projects.selectProviderPlaceholder', 'Select a provider...')}</option>
                      {llmProviders.map(provider => (
                        <option key={provider} value={provider}>
                          {provider}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  {/* Model Selection - Only shown when provider is selected */}
                  {selectedProvider && (
                    <div className="mb-6">
                      <label className="block text-sm font-medium text-gray-300 mb-2 font-mono">
                        {t('projects.selectModel', 'Select Model')}
                      </label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {availableLLMs
                          .filter(llm => llm.provider === selectedProvider)
                          .map(llm => (
                            <div 
                              key={llm.id}
                              className={`border rounded-lg p-4 cursor-pointer transition-all ${
                                projectData.mainLLM === llm.id
                                  ? 'border-yellow-400 bg-gray-800'
                                  : 'border-gray-700 bg-gray-800/50 hover:border-gray-600'
                              }`}
                              onClick={() => setProjectData(prev => ({ ...prev, mainLLM: llm.id }))}
                            >
                              <div className="flex justify-between items-start">
                                <div>
                                  <h3 className="font-medium text-white">{llm.name}</h3>
                                </div>
                                {projectData.mainLLM === llm.id && (
                                  <div className="bg-yellow-400 rounded-full p-1">
                                    <Check className="h-4 w-4 text-black" />
                                  </div>
                                )}
                              </div>
                              
                              <div className="mt-3 flex items-center text-sm text-gray-500">
                                <span className="mr-3">Token limit: {llm.tokenLimit.toLocaleString()}</span>
                              </div>
                              
                              <div className="mt-2 flex flex-wrap gap-1">
                                {llm.capabilities.map((capability, index) => (
                                  <span 
                                    key={index} 
                                    className="text-xs bg-gray-700 text-gray-300 px-2 py-1 rounded"
                                  >
                                    {capability}
                                  </span>
                                ))}
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}
                  
                  {/* API Key Section - Only shown when a model is selected */}
                  {projectData.mainLLM && (
                    <div className="mt-8 space-y-4">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="useSavedCredentials"
                          name="useSavedCredentials"
                          checked={projectData.useSavedCredentials}
                          onChange={handleCheckboxChange}
                          className="mr-2 h-4 w-4 rounded border-gray-700 bg-gray-800 text-yellow-400 focus:ring-yellow-500"
                        />
                        <label htmlFor="useSavedCredentials" className="text-sm text-gray-300">
                          {t('projects.useSavedCredentials', 'Use saved credentials')}
                        </label>
                      </div>
                      
                      {!projectData.useSavedCredentials && (
                        <div>
                          <label htmlFor="apiKey" className="block text-sm font-medium text-gray-300 mb-1 font-mono">
                            {t('projects.apiKey', 'API Key')} 
                          </label>
                          <div className="relative">
                            <input
                              type="password"
                              id="apiKey"
                              name="apiKey"
                              value={projectData.apiKey}
                              onChange={handleProjectDataChange}
                              className="w-full pl-9 pr-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
                              placeholder={t('projects.enterApiKey', 'Enter API key')}
                            />
                            <Key className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                          </div>
                          <div className="flex items-center mt-1">
                            <p className="text-xs text-gray-400">
                              {t('projects.apiKeyInfo', 'Your API key is stored locally and never shared')}
                            </p>
                            {selectedProvider === "Groq" && (
                              <button
                                onClick={() => openUrl("https://console.groq.com/keys")}
                                className="text-xs text-yellow-400 hover:text-yellow-300 ml-2 underline"
                              >
                                {t('projects.getGroqApiKey', 'Get Groq API Key')}
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
          
          {/* Step 2: Create Agents */}
          {currentStep === 2 && (
            <div className="space-y-6 ">
              <div>
                <h2 className="text-xl font-bold text-white font-mono">
                  {t('projects.createAgents', 'Create Agents')}
                </h2>
                <p className="text-gray-400 mb-6">
                  {t('projects.createAgentsDescription', 'An agent has a role and can perform tasks based on its capabilities.')}
                </p>
              </div>
              
              {/* Side-by-side layout for agent creation and list */}
              <div className="flex flex-col lg:flex-row gap-6">
                {/* Add Agent Form */}
                <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700 lg:w-3/5">
                  <h3 className="text-lg font-medium text-white mb-4 font-mono">
                    {t('projects.addAgent', `Add Agent (${projectData.agents.length + 1})`)}
                  </h3>
                  
                  <div className="space-y-4 mb-4">
                  <div className="flex gap-2">
                    <div className="w-1/2 flex flex-col gap-1">
                      <label htmlFor="agentName" className="block text-sm font-medium text-gray-300 mb-1 font-mono">
                        {t('projects.agentName', 'Name')}
                      </label>
                      <input
                        type="text"
                        id="agentName"
                        value={newAgent.name}
                        onChange={(e) => setNewAgent(prev => ({ ...prev, name: e.target.value }))}
                        className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
                        placeholder={t('projects.enterAgentName', 'Enter agent name')}
                      />
                    </div>
                    
                    <div className="w-1/2 flex flex-col gap-1">
                      <label htmlFor="agentRole" className="block text-sm font-medium text-gray-300 mb-1 font-mono">
                        {t('projects.agentRole', 'Role')}
                      </label>
                      <input
                        type="text"
                        id="agentRole"
                        value={newAgent.role}
                        onChange={(e) => setNewAgent(prev => ({ ...prev, role: e.target.value }))}
                        className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
                        placeholder={t('projects.enterAgentRole', 'Enter agent role')}
                      />
                    </div>
                    </div>
                    
                    <div className="flex flex-col gap-1">
                      <label htmlFor="agentLLM" className="block text-sm font-medium text-gray-300 mb-1 font-mono">
                        {t('projects.agentLLM', 'Language Model')}
                      </label>
                      <select
                        id="agentLLM"
                        value={newAgent.llmId}
                        onChange={(e) => setNewAgent(prev => ({ ...prev, llmId: e.target.value }))}
                        className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
                      >
                        <option value="">{t('projects.useProjectLLM', 'Use project default')}</option>
                        {availableLLMs.map(llm => (
                          <option key={llm.id} value={llm.id}>
                            {llm.name} ({llm.provider})
                          </option>
                        ))}
                      </select>
                      <p className="text-xs text-gray-400 mt-1">
                        {newAgent.llmId 
                          ? t('projects.customLLMSelected', 'Custom LLM selected for this agent') 
                          : t('projects.usingProjectLLM', `Using project's main LLM: ${availableLLMs.find(llm => llm.id === projectData.mainLLM)?.name || 'None selected'}`)}
                      </p>
                    </div>
                    
                    <div className="flex flex-col gap-1">
                      <label htmlFor="agentObjective" className="block text-sm font-medium text-gray-300 mb-1 font-mono">
                        {t('projects.agentDescription', 'Objective')}
                      </label>
                      <textarea
                        id="agentObjective"
                        value={newAgent.objective}
                        onChange={(e) => setNewAgent(prev => ({ ...prev, objective: e.target.value }))}
                        className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-yellow-500 h-20"
                        placeholder={t('projects.enterAgentObjective', 'Enter agent objective')}
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label htmlFor="agentBackground" className="block text-sm font-medium text-gray-300 mb-1 font-mono">
                        {t('projects.agentDescription', 'Background')}
                      </label>
                      <textarea
                        id="agentBackground"
                        value={newAgent.background}
                        onChange={(e) => setNewAgent(prev => ({ ...prev, background: e.target.value }))}
                        className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-yellow-500 h-20"
                        placeholder={t('projects.enterAgentBackground', 'Enter agent background')}
                      />
                    </div>
                    
                    
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2 font-mono">
                        {t('projects.agentTools', 'Agent Tools')}
                      </label>
                      
                      <div className="flex space-x-2 mb-4">
                       {availableTools.map((tool) => {
                         // Check if tool is already added to disable the button
                         const isToolAdded = newAgent.tools.some(t => t.name === tool.name);
                         
                         return (
                           <button
                             key={tool.name}
                             onClick={() => handleAddTool(tool.name)}
                             className={`${
                               isToolAdded 
                                 ? 'bg-gray-600 text-gray-400 cursor-not-allowed' 
                                 : 'bg-gray-700 hover:bg-gray-600 text-white'
                             } px-3 py-1.5 rounded-md flex gap-1 items-center transition-colors`}
                             disabled={isToolAdded}
                           >
                             {tool.name}
                             {!isToolAdded && <Plus className="h-3 w-3" />}
                           </button>
                         );
                       })}
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                        {newAgent.tools.map((tool) => (
                          <div 
                            key={tool.name} 
                            className="bg-gray-800 text-white px-3 py-2 rounded-md flex flex-col border border-gray-700"
                          >
                            <div className="flex justify-between items-center mb-3">
                              <span className="font-medium">{tool.name}</span>
                              <button
                                onClick={() => handleRemoveTool(tool.name)}
                                className="text-gray-400 hover:text-red-500 transition-colors"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                            <div className="flex flex-col gap-2">
                              <label className="text-xs text-gray-300 font-medium mb-1">Tool Function:</label>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleToolPropertyChange(tool.name, 'isInputChannel', !tool.isInputChannel)}
                                  className={`px-2 py-1 rounded-md text-xs flex-1 transition-colors ${
                                    tool.isInputChannel 
                                      ? 'bg-yellow-400 text-black' 
                                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                  }`}
                                >
                                  Input Channel
                                </button>
                                <button
                                  onClick={() => handleToolPropertyChange(tool.name, 'isOutputProducer', !tool.isOutputProducer)}
                                  className={`px-2 py-1 rounded-md text-xs flex-1 transition-colors ${
                                    tool.isOutputProducer 
                                      ? 'bg-yellow-400 text-black' 
                                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                  }`}
                                >
                                  Output Producer
                                </button>
                                <button
                                  onClick={() => handleToolPropertyChange(tool.name, 'isJudge', !tool.isJudge)}
                                  className={`px-2 py-1 rounded-md text-xs flex-1 transition-colors ${
                                    tool.isJudge 
                                      ? 'bg-yellow-400 text-black' 
                                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                  }`}
                                >
                                  Judge
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                  </div>
                  
                  <Button
                    onClick={handleAddAgent}
                    className="w-full bg-gray-700 hover:bg-gray-600 text-white font-medium border-0 flex items-center"
                    disabled={!newAgent.name.trim()}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    {t('projects.addAgent', 'Add Agent')}
                  </Button>
                </div>
                
                {/* Agent List */}
                <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700 lg:w-2/5">
                  <h3 className="text-lg font-medium text-white mb-4 font-mono">
                    {t('projects.agentList', 'Agent List')}
                  </h3>
                  
                  {projectData.agents.length > 0 ? (
                    <div className="space-y-3 max-h-[500px] overflow-y-auto">
                      {projectData.agents.map((agent) => (
                        <div key={agent.id} className="bg-gray-800 rounded-lg p-4 flex justify-between items-start">
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
                            {agent.llmId && agent.llmId !== projectData.mainLLM && (
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
                                      className="text-xs bg-gray-700 text-gray-300 px-2 py-1 rounded flex items-center gap-1.5"
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
                          <button
                            onClick={() => handleRemoveAgent(agent.id)}
                            className="text-gray-400 hover:text-red-500 transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center text-gray-400 py-8 bg-gray-800/30 rounded-lg border border-gray-700">
                      {t('projects.noAgents', 'No agents added yet')}
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
                <h2 className="text-xl font-bold text-white mb-4 font-mono">
                  {t('projects.defineTasks', 'Define Tasks')}
                </h2>
                <p className="text-gray-400 mb-6">
                  {t('projects.defineTasksDescription', 'Add high-level tasks for your project')}
                </p>
              </div>
              
              {/* Side-by-side layout for task creation and list */}
              <div className="flex flex-col lg:flex-row gap-6 h-full">
                {/* Add Task Form */}
                <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700 lg:w-3/5 flex flex-col h-full">
                  <h3 className="text-lg font-medium text-white mb-4 font-mono">
                    {t('projects.addTask', `Add Task (${projectData.tasks.length + 1})`)}
                  </h3>
                  
                  <div className="space-y-4 mb-4">
                    <div>
                      <label htmlFor="taskName" className="block text-sm font-medium text-gray-300 mb-1 font-mono">
                        {t('projects.taskName', 'Task Name')}
                      </label>
                      <input
                        type="text"
                        id="taskName"
                        value={newTask.name}
                        onChange={(e) => setNewTask(prev => ({ ...prev, name: e.target.value }))}
                        className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
                        placeholder={t('projects.enterTaskName', 'Enter task name')}
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="taskDescription" className="block text-sm font-medium text-gray-300 mb-1 font-mono">
                        {t('projects.taskDescription', 'Task Description')}
                      </label>
                      <textarea
                        id="taskDescription"
                        value={newTask.description}
                        onChange={(e) => setNewTask(prev => ({ ...prev, description: e.target.value }))}
                        className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-yellow-500 h-20"
                        placeholder={t('projects.enterTaskDescription', 'Enter task description')}
                      />
                    </div>
                    <div>
                      <label htmlFor="taskExpectedOutput" className="block text-sm font-medium text-gray-300 mb-1 font-mono">
                        {t('projects.taskExpectedOutput', 'Task Expected Output')}
                      </label>
                      <input
                        type="text"
                        id="taskExpectedOutput"
                        value={newTask.expectedOutput}
                        onChange={(e) => setNewTask(prev => ({ ...prev, expectedOutput: e.target.value }))}
                        className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
                        placeholder={t('projects.enterTaskExpectedOutput', 'Enter task expected output')}
                      />
                    </div>
                    <div className="mb-4 border-t border-gray-700 pt-4">
                      <label className="block text-sm font-medium text-gray-300 mb-3 font-mono">
                        {t('projects.taskExecutionType', 'Task Execution Type')}
                      </label>
                      <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
                        <p className="text-xs text-gray-400 mb-3">
                          {t('projects.taskTypeDescription', 'Choose how this task will be executed. A task can either be assigned to an agent or execute a workflow, but not both.')}
                        </p>
                        <div className="flex flex-col gap-4">
                          {/* Radio button for Agent option */}
                          <div 
                            className={`flex items-start p-3 rounded-md cursor-pointer ${taskType === 'agent' ? 'bg-gray-700 border border-yellow-400/50' : 'bg-gray-800/80 border border-gray-700 hover:bg-gray-700/50'}`}
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
                                className="h-4 w-4 text-yellow-400 focus:ring-yellow-500 border-gray-700 bg-gray-800"
                              />
                            </div>
                            <div className="ml-3 flex-1">
                              <label htmlFor="taskTypeAgent" className="font-medium text-white cursor-pointer">
                                {t('projects.assignToAgent', 'Assign to Agent')}
                              </label>
                              <p className="text-xs text-gray-400 mt-1">
                                {t('projects.assignToAgentDescription', 'The task will be handled by a single agent with specific capabilities')}
                              </p>
                              
                              {taskType === 'agent' && (
                                <div className="mt-3 pl-1">
                                  <select
                                    id="taskAssignedAgent"
                                    value={newTask.assignedAgent || ""}
                                    onChange={(e) => setNewTask(prev => ({ 
                                      ...prev, 
                                      assignedAgent: e.target.value ? e.target.value : null 
                                    }))}
                                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
                                  >
                                    <option value="">{t('projects.autoAssignAgent', 'Auto-assign best fit')}</option>
                                    {projectData.agents.map(agent => (
                                      <option key={agent.id} value={agent.id}>
                                        {agent.name}
                                      </option>
                                    ))}
                                  </select>
                                  <p className="text-xs text-gray-400 mt-1">
                                    {t('projects.agentAssignmentInfo', 'Leave empty to auto-assign the best agent for this task')}
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                          
                          {/* Radio button for Workflow option */}
                          <div 
                            className={`flex items-start p-3 rounded-md cursor-pointer ${taskType === 'workflow' ? 'bg-gray-700 border border-yellow-400/50' : 'bg-gray-800/80 border border-gray-700 hover:bg-gray-700/50'}`}
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
                                className="h-4 w-4 text-yellow-400 focus:ring-yellow-500 border-gray-700 bg-gray-800"
                              />
                            </div>
                            <div className="ml-3 flex-1">
                              <label htmlFor="taskTypeWorkflow" className="font-medium text-white cursor-pointer">
                                {t('projects.executeWorkflow', 'Execute a Workflow')}
                              </label>
                              <p className="text-xs text-gray-400 mt-1">
                                {t('projects.executeWorkflowDescription', 'The task will execute a predefined workflow with multiple steps')}
                              </p>
                              
                              {taskType === 'workflow' && (
                                <div className="mt-3 pl-1">
                                  <select
                                    id="taskWorkflowId"
                                    value={newTask.workflowId || ""}
                                    onChange={(e) => setNewTask(prev => ({ 
                                      ...prev, 
                                      workflowId: e.target.value ? e.target.value : null 
                                    }))}
                                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
                                  >
                                    <option value="" disabled>{t('projects.selectWorkflow', 'Select a workflow...')}</option>
                                    {/* Example workflows - replace with actual workflows data */}
                                    <option value="workflow1">Data Processing Workflow</option>
                                    <option value="workflow2">Content Generation Workflow</option>
                                    <option value="workflow3">Analysis Workflow</option>
                                  </select>
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
                    className="w-full bg-gray-700 hover:bg-gray-600 text-white font-medium border-0 flex items-center justify-center mt-auto"
                    disabled={!newTask.name.trim()}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    {t('projects.addTask', 'Add Task')}
                  </Button>
                </div>
                
                {/* Task List */}
                <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700 lg:w-2/5 flex flex-col h-full">
                  <h3 className="text-lg font-medium text-white mb-4 font-mono">
                    {t('projects.taskList', 'Task List')}
                  </h3>
                  
                  {projectData.tasks.length > 0 ? (
                    <div className="space-y-3 flex-grow overflow-y-auto">
                      {projectData.tasks.map((task) => (
                        <div key={task.id} className="bg-gray-800 rounded-lg p-4 flex justify-between items-start w-full">
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
                                        {projectData.agents.find(a => a.id === task.assignedAgent)?.name || 'Assigned'}
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
                                    ? `Assigned to ${projectData.agents.find(a => a.id === task.assignedAgent)?.name || 'agent'}` 
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
                    <div className="text-center text-gray-400 py-8 bg-gray-800/30 rounded-lg border border-gray-700 flex-grow flex items-center justify-center">
                      {t('projects.noTasks', 'No tasks added yet')}
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
                <h2 className="text-xl font-bold text-white mb-4 font-mono">
                  {t('projects.reviewAndConfirm', 'Review & Confirm')}
                </h2>
                <p className="text-gray-400 mb-6">
                  {t('projects.reviewDescription', 'Review your project configuration before creating')}
                </p>
              </div>
              
              <div className="space-y-6">
                {/* Project Basics */}
                <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="text-lg font-medium text-white font-mono">
                      {t('projects.projectBasics', 'Project Setup')}
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
                      <span className="text-gray-400 w-32">{t('projects.projectName', 'Project Name')}:</span>
                      <span className="text-white font-medium">{projectData.name}</span>
                    </div>
                    {projectData.description && (
                      <div className="flex">
                        <span className="text-gray-400 w-32">{t('projects.description', 'Description')}:</span>
                        <span className="text-white">{projectData.description}</span>
                      </div>
                    )}
                    <div className="flex">
                      <span className="text-gray-400 w-32">{t('projects.mainLLM', 'Main LLM')}:</span>
                      <span className="text-white font-medium">
                        {availableLLMs.find(llm => llm.id === projectData.mainLLM)?.name || projectData.mainLLM}
                      </span>
                    </div>
                    <div className="flex">
                      <span className="text-gray-400 w-32">{t('projects.credentials', 'Credentials')}:</span>
                      <span className="text-white">
                        {projectData.useSavedCredentials 
                          ? t('projects.usingSavedCredentials', 'Using saved credentials')
                          : t('projects.usingCustomApiKey', 'Using custom API key')
                        }
                      </span>
                    </div>
                  </div>
                </div>
                
                {/* Agents */}
                <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="text-lg font-medium text-white font-mono">
                      {t('projects.agents', 'Agents')}
                    </h3>
                    <button
                      onClick={() => handleGoToStep(2)}
                      className="text-yellow-400 hover:text-yellow-300 text-sm"
                    >
                      {t('common.edit', 'Edit')}
                    </button>
                  </div>
                  
                  {projectData.agents.length > 0 ? (
                    <div className="space-y-2">
                      {projectData.agents.map((agent) => (
                        <div key={agent.id} className="bg-gray-800 rounded-md p-2">
                          <div className="font-medium text-white">{agent.name}</div>
                          <div className="text-sm text-yellow-400">{agent.role}</div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-gray-400">
                      {t('projects.noAgents', 'No agents added yet')}
                    </div>
                  )}
                </div>
                
                {/* Tasks */}
                <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="text-lg font-medium text-white font-mono">
                      {t('projects.tasks', 'Tasks')}
                    </h3>
                    <button
                      onClick={() => handleGoToStep(3)}
                      className="text-yellow-400 hover:text-yellow-300 text-sm"
                    >
                      {t('common.edit', 'Edit')}
                    </button>
                  </div>
                  
                  {projectData.tasks.length > 0 ? (
                    <div className="space-y-2">
                      {projectData.tasks.map((task) => (
                        <div key={task.id} className="bg-gray-800 rounded-md p-3">
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
                                  {projectData.agents.find(a => a.id === task.assignedAgent)?.name || 'Assigned'}
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
                      {t('projects.noTasks', 'No tasks added yet')}
                    </div>
                  )}
                </div>
                
                
                
                <div className="bg-green-900/20 rounded-lg p-4 border border-green-800">
                  <p className="text-green-400 text-center">
                    {t('projects.readyToCreate', 'Your project is ready to be created. Click "Create Project" to continue.')}
                  </p>
                </div>
              </div>
            </div>
          )}
        </form>
      </div>
      
      <div className="flex justify-between items-center p-6 border-t border-gray-800">
        {currentStep > 1 ? (
          <Button
            onClick={handlePrevStep}
            className="bg-transparent hover:bg-gray-800 text-black border border-gray-700 font-medium flex items-center"
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            {t('common.back', 'Back')}
          </Button>
        ) : (
          <Button
            onClick={onClose}
            className="bg-transparent hover:bg-gray-800 text-black border border-gray-700"
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
  );
};

export default ProjectCreationWizard;
