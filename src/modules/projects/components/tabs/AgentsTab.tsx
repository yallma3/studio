import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { WorkspaceData, Agent, LLMOption } from "../../types/Types";
import { X, Plus, Trash2, Edit } from "lucide-react";

interface AgentsTabProps {
  workspaceData: WorkspaceData;
}

const AgentsTab: React.FC<AgentsTabProps> = ({ workspaceData: workspaceData }) => {
  const { t } = useTranslation();

  const [agents, setAgents] = useState<Agent[]>(workspaceData.agents || []);
  const [showAgentDialog, setShowAgentDialog] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentAgentId, setCurrentAgentId] = useState<string | null>(null);
  
  // Available LLM options
  const availableLLMs: LLMOption[] = [
    {
      id: "gpt-4",
      name: "GPT-4",
      provider: "OpenAI",
      tokenLimit: 8192
    },
    {
      id: "gpt-3.5-turbo",
      name: "GPT-3.5 Turbo",
      provider: "OpenAI",
      tokenLimit: 4096
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

  const [agentForm, setAgentForm] = useState<Omit<Agent, 'id'>>({
    name: '',
    role: '',
    objective: '',
    background: '',
    capabilities: '',
    tools: [],
    llmId: workspaceData.mainLLM || '' // Default to workspace's main LLM
  });

  // Generate a simple ID based on timestamp and random number
  const generateId = (): string => {
    return `agent-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
  };

  const handleShowAgentDialog = (isEdit: boolean = false, agentId: string | null = null) => {
    setIsEditing(isEdit);
    setCurrentAgentId(agentId);

    if (isEdit && agentId) {
      // Find the agent to edit
      const agentToEdit = agents.find(agent => agent.id === agentId);
      if (agentToEdit) {
        setAgentForm({
          name: agentToEdit.name,
          role: agentToEdit.role,
          objective: agentToEdit.objective,
          background: agentToEdit.background,
          capabilities: agentToEdit.capabilities,
          tools: [...agentToEdit.tools],
          llmId: agentToEdit.llmId
        });
      }
    } else {
      // Reset form for new agent
      setAgentForm({
        name: '',
        role: '',
        objective: '',
        background: '',
        capabilities: '',
        tools: [],
        llmId: workspaceData.mainLLM || ''
      });
    }

    setShowAgentDialog(true);
  };

  const handleAgentDelete = (agentId: string) => {
    const updatedAgents = agents.filter(agent => agent.id !== agentId);
    setAgents(updatedAgents);

    // Update the workspace data
    workspaceData.agents = updatedAgents;
  };

  const handleSaveAgent = () => {
    if (!agentForm.name.trim()) {
      // Don't add an agent without a name
      return;
    }

    let updatedAgents;

    if (isEditing && currentAgentId) {
      // Update existing agent
      updatedAgents = agents.map(agent => {
        if (agent.id === currentAgentId) {
          return {
            ...agent,
            name: agentForm.name,
            role: agentForm.role,
            objective: agentForm.objective,
            background: agentForm.background,
            capabilities: agentForm.capabilities,
            tools: agentForm.tools,
            llmId: agentForm.llmId
          };
        }
        return agent;
      });
    } else {
      // Create a new agent with a unique ID
      const newAgent: Agent = {
        id: generateId(),
        name: agentForm.name,
        role: agentForm.role,
        objective: agentForm.objective,
        background: agentForm.background,
        capabilities: agentForm.capabilities,
        tools: agentForm.tools,
        llmId: agentForm.llmId
      };

      updatedAgents = [...agents, newAgent];
    }

    setAgents(updatedAgents);

    // Update the workspace data
    workspaceData.agents = updatedAgents;

    // Close the dialog
    setShowAgentDialog(false);
  };

  return (
    <div className="space-y-6">
      <div className="bg-[#121212] rounded-md p-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-white">{t('workspaces.agents', 'Agents')}</h2>
          <button 
            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm flex items-center gap-1"
            onClick={() => handleShowAgentDialog()}
          >
            <Plus size={16} />
            {t('workspaces.addAgent', 'Add Agent')}
          </button>
        </div>
        
        {agents && agents.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {agents.map((agent: Agent) => (
              <div key={agent.id} className="bg-[#1d1d1d] rounded border border-gray-800 p-4">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-medium text-white text-lg">{agent.name}</h3>
                  <div className="flex gap-2">
                    <button 
                      className="text-blue-400 hover:text-blue-300 p-1"
                      onClick={() => handleShowAgentDialog(true, agent.id)}
                      aria-label="Edit agent"
                    >
                      <Edit size={16} />
                    </button>
                    <button 
                      className="text-red-400 hover:text-red-300 p-1"
                      onClick={() => handleAgentDelete(agent.id)}
                      aria-label="Delete agent"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-yellow-400 text-sm font-medium">{agent.role}</span>
                  <span className={`text-xs px-2 py-1 rounded-full ${agent.llmId ? 'bg-blue-900/50 text-blue-300' : 'bg-gray-800 text-gray-400'}`}>
                    {agent.llmId 
                      ? `LLM: ${availableLLMs.find(llm => llm.id === agent.llmId)?.name || agent.llmId}` 
                      : `Using workspace default LLM`
                    }
                  </span>
                </div>
                <p className="text-gray-300 mb-3">{agent.objective}</p>
                <div className="text-sm">
                  <div className="mb-2">
                    <span className="text-gray-400 block">{t('workspaces.background', 'Background')}:</span>
                    <span className="text-gray-300">{agent.background}</span>
                  </div>
                  <div className="mb-2">
                    <span className="text-gray-400 block">{t('workspaces.capabilities', 'Capabilities')}:</span>
                    <span className="text-gray-300">{agent.capabilities}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-gray-400 py-8 text-center">
            {t('workspaces.noAgents', 'No agents have been created for this workspace')}
          </div>
        )}
      </div>
      
      {/* Agent Dialog */}
      {showAgentDialog && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="fixed inset-0 bg-black/50" onClick={() => setShowAgentDialog(false)}></div>
          <div className="bg-[#1d1d1d] rounded-lg shadow-xl p-4 sm:p-6 w-full max-w-2xl relative z-10 max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-[#1d1d1d] pb-2 mb-2 border-b border-gray-800">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-white">
                  {isEditing ? t('workspaces.editAgent', 'Edit Agent') : t('workspaces.addAgent', 'Add New Agent')}
                </h2>
                <button 
                  className="text-gray-400 hover:text-white" 
                  onClick={() => setShowAgentDialog(false)}
                  aria-label="Close"
                >
                  <X size={18} />
                </button>
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  {t('workspaces.agentName', 'Agent Name')} *
                </label>
                <input
                  type="text"
                  className="w-full bg-[#111] border border-gray-700 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={agentForm.name}
                  onChange={(e) => setAgentForm({...agentForm, name: e.target.value})}
                  placeholder={t('workspaces.enterAgentName', 'Enter agent name')}
                  autoFocus
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  {t('workspaces.role', 'Role')}
                </label>
                <input
                  type="text"
                  className="w-full bg-[#111] border border-gray-700 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={agentForm.role}
                  onChange={(e) => setAgentForm({...agentForm, role: e.target.value})}
                  placeholder={t('workspaces.enterRole', 'Enter agent role')}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  {t('workspaces.objective', 'Objective')}
                </label>
                <textarea
                  className="w-full bg-[#111] border border-gray-700 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[80px] sm:min-h-[100px]"
                  value={agentForm.objective}
                  onChange={(e) => setAgentForm({...agentForm, objective: e.target.value})}
                  placeholder={t('workspaces.enterObjective', 'Enter agent objective')}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  {t('workspaces.background', 'Background')}
                </label>
                <textarea
                  className="w-full bg-[#111] border border-gray-700 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[80px]"
                  value={agentForm.background}
                  onChange={(e) => setAgentForm({...agentForm, background: e.target.value})}
                  placeholder={t('workspaces.enterBackground', 'Enter agent background')}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  {t('workspaces.capabilities', 'Capabilities')}
                </label>
                <textarea
                  className="w-full bg-[#111] border border-gray-700 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[80px]"
                  value={agentForm.capabilities}
                  onChange={(e) => setAgentForm({...agentForm, capabilities: e.target.value})}
                  placeholder={t('workspaces.enterCapabilities', 'Enter agent capabilities')}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  {t('workspaces.agentLLM', 'Language Model')}
                </label>
                <select
                  className="w-full bg-[#111] border border-gray-700 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={agentForm.llmId}
                  onChange={(e) => setAgentForm({...agentForm, llmId: e.target.value})}
                >
                  <option value="">{t('workspaces.useWorkspaceLLM', 'Use workspace default')}</option>
                  {availableLLMs.map(llm => (
                    <option key={llm.id} value={llm.id}>
                      {llm.name} ({llm.provider})
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-400 mt-1">
                  {agentForm.llmId 
                    ? t('workspaces.customLLMSelected', 'Custom LLM selected for this agent') 
                    : t('workspaces.usingWorkspaceLLM', `Using workspace's main LLM: ${availableLLMs.find(llm => llm.id === workspaceData.mainLLM)?.name || 'None selected'}`)}
                </p>
              </div>
            </div>
            
            <div className="flex justify-end gap-3 mt-6 sticky bottom-0 pt-2 bg-[#1d1d1d] border-t border-gray-800">
              <button
                className="px-4 py-2 text-sm text-gray-300 hover:text-white transition-colors"
                onClick={() => setShowAgentDialog(false)}
              >
                {t('common.cancel', 'Cancel')}
              </button>
              <button
                className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={handleSaveAgent}
                disabled={!agentForm.name.trim()}
              >
                {isEditing ? t('common.save', 'Save') : t('common.add', 'Add')}
              </button>
            </div>
          </div>
        </div>
      )}
      
    </div>
  );
};

export default AgentsTab;
