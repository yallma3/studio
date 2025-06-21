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
      <div className="bg-[#121212] rounded-md">
        <div className="flex justify-between items-center p-6 border-b border-[#FFC72C]/50">
          <div className="flex items-center">
            <h2 className="text-xl font-bold text-white">{t('workspaces.agents', 'Agents')}</h2>
          </div>
          <button 
            className="bg-[#FFC72C] hover:bg-[#E6B428] text-black px-3 py-1 rounded text-sm flex items-center gap-1"
            onClick={() => handleShowAgentDialog()}
          >
            <Plus size={16} />
            {t('workspaces.addAgent', 'Add Agent')}
          </button>
        </div>
        
        {agents && agents.length > 0 ? (
          <div className="overflow-y-auto h-[calc(100vh-200px)]">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6">
              {agents.map((agent: Agent) => (
              <div key={agent.id} className="group bg-gradient-to-br from-[#1a1a1a] to-[#151515] rounded-xl border border-zinc-800/50 hover:border-zinc-700/70 transition-all duration-200 hover:shadow-lg hover:shadow-black/20 p-6 relative overflow-hidden">
                {/* Subtle background pattern */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.01] to-transparent opacity-50"></div>
                
                {/* Header with title and actions */}
                <div className="flex justify-between items-start mb-4 relative z-10">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      {/* Agent icon */}
                      <div className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center bg-gradient-to-br from-[#FFC72C]/20 to-[#E6B428]/20 border border-[#FFC72C]/30">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#FFC72C]">
                          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
                          <circle cx="9" cy="7" r="4"/>
                          <path d="m22 2-5 10-5-10"/>
                        </svg>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-white text-xl leading-tight truncate group-hover:text-[#FFC72C] transition-colors duration-200">
                          {agent.name}
                        </h3>
                        {agent.role && (
                          <p className="text-yellow-400 text-sm font-medium mt-1">{agent.role}</p>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Action buttons */}
                  <div className="flex gap-1 ml-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <button 
                      className="flex items-center justify-center w-8 h-8 text-[#FFC72C] hover:text-[#FFD65C] hover:bg-[#FFC72C]/10 rounded-lg transition-all duration-200"
                      onClick={() => handleShowAgentDialog(true, agent.id)}
                      title="Edit agent"
                    >
                      <Edit size={14} />
                    </button>
                    <button 
                      className="flex items-center justify-center w-8 h-8 text-red-400 hover:text-red-300 hover:bg-red-400/10 rounded-lg transition-all duration-200"
                      onClick={() => handleAgentDelete(agent.id)}
                      title="Delete agent"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
                
                {/* LLM Badge */}
                <div className="mb-4 relative z-10">
                  <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full ${
                    agent.llmId 
                      ? 'bg-gradient-to-r from-[#FFC72C]/30 to-[#E6B428]/30 text-[#FFC72C] border border-[#FFC72C]/40' 
                      : 'bg-gradient-to-r from-zinc-700/30 to-zinc-800/30 text-zinc-400 border border-zinc-700/40'
                  } backdrop-blur-sm`}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9 12l2 2 4-4"/>
                      <path d="M21 12c.552 0 1-.448 1-1V5c0-.552-.448-1-1-1H3c-.552 0-1 .448-1 1v6c0 .552.448 1 1 1"/>
                      <path d="M3 19h18"/>
                    </svg>
                    {agent.llmId 
                      ? `${availableLLMs.find(llm => llm.id === agent.llmId)?.name || agent.llmId}` 
                      : `Workspace Default`
                    }
                  </span>
                </div>
                
                {/* Objective */}
                {agent.objective && (
                  <div className="mb-4 relative z-10">
                    <p className="text-zinc-300 leading-relaxed text-sm">{agent.objective}</p>
                  </div>
                )}
                
                {/* Details grid */}
                <div className="space-y-3 relative z-10">
                  {/* Background */}
                  {agent.background && (
                    <div className="bg-[#0a0a0a]/50 rounded-lg p-4 border border-zinc-800/50">
                      <div className="flex items-center gap-2 mb-2">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-400">
                          <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
                          <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
                        </svg>
                        <span className="text-zinc-400 text-xs font-medium uppercase tracking-wide">
                          {t('workspaces.background', 'Background')}
                        </span>
                      </div>
                      <p className="text-zinc-200 text-sm leading-relaxed">
                        {agent.background}
                      </p>
                    </div>
                  )}
                  
                  {/* Capabilities */}
                  {agent.capabilities && (
                    <div className="bg-[#0a0a0a]/50 rounded-lg p-4 border border-zinc-800/50">
                      <div className="flex items-center gap-2 mb-2">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-400">
                          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                        </svg>
                        <span className="text-zinc-400 text-xs font-medium uppercase tracking-wide">
                          {t('workspaces.capabilities', 'Capabilities')}
                        </span>
                      </div>
                      <p className="text-zinc-200 text-sm leading-relaxed">
                        {agent.capabilities}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ))}
            </div>
          </div>
        ) : (
          <div className="text-zinc-400 py-8 text-center">
            {t('workspaces.noAgents', 'No agents have been created for this workspace')}
          </div>
        )}
      </div>
      
      {/* Agent Dialog */}
      {showAgentDialog && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="fixed inset-0 bg-black/50" onClick={() => setShowAgentDialog(false)}></div>
          <div className="bg-[#1d1d1d] rounded-lg shadow-xl  w-full max-w-2xl relative z-10 max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-[#1d1d1d] p-6 mb-2 border-b border-zinc-800">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-white">
                  {isEditing ? t('workspaces.editAgent', 'Edit Agent') : t('workspaces.addAgent', 'Add New Agent')}
                </h2>
                <button 
                  className="text-zinc-400 hover:text-white" 
                  onClick={() => setShowAgentDialog(false)}
                  aria-label="Close"
                >
                  <X size={18} />
                </button>
              </div>
            </div>
            
            <div className="space-y-4 p-6">
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-1">
                  {t('workspaces.agentName', 'Agent Name')} *
                </label>
                <input
                  type="text"
                  className="w-full bg-[#111] border border-zinc-700 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-[#FFC72C]"
                  value={agentForm.name}
                  onChange={(e) => setAgentForm({...agentForm, name: e.target.value})}
                  placeholder={t('workspaces.enterAgentName', 'Enter agent name')}
                  autoFocus
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-1">
                  {t('workspaces.role', 'Role')}
                </label>
                <input
                  type="text"
                  className="w-full bg-[#111] border border-zinc-700 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-[#FFC72C]"
                  value={agentForm.role}
                  onChange={(e) => setAgentForm({...agentForm, role: e.target.value})}
                  placeholder={t('workspaces.enterRole', 'Enter agent role')}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-1">
                  {t('workspaces.objective', 'Objective')}
                </label>
                <textarea
                  className="w-full bg-[#111] border border-zinc-700 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-[#FFC72C] min-h-[80px] sm:min-h-[100px]"
                  value={agentForm.objective}
                  onChange={(e) => setAgentForm({...agentForm, objective: e.target.value})}
                  placeholder={t('workspaces.enterObjective', 'Enter agent objective')}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-1">
                  {t('workspaces.background', 'Background')}
                </label>
                <textarea
                  className="w-full bg-[#111] border border-zinc-700 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-[#FFC72C] min-h-[80px]"
                  value={agentForm.background}
                  onChange={(e) => setAgentForm({...agentForm, background: e.target.value})}
                  placeholder={t('workspaces.enterBackground', 'Enter agent background')}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-1">
                  {t('workspaces.capabilities', 'Capabilities')}
                </label>
                <textarea
                  className="w-full bg-[#111] border border-zinc-700 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-[#FFC72C] min-h-[80px]"
                  value={agentForm.capabilities}
                  onChange={(e) => setAgentForm({...agentForm, capabilities: e.target.value})}
                  placeholder={t('workspaces.enterCapabilities', 'Enter agent capabilities')}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-1">
                  {t('workspaces.agentLLM', 'Language Model')}
                </label>
                <select
                  className="w-full bg-[#111] border border-zinc-700 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-[#FFC72C]"
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
                <p className="text-xs text-zinc-400 mt-1">
                  {agentForm.llmId 
                    ? t('workspaces.customLLMSelected', 'Custom LLM selected for this agent') 
                    : t('workspaces.usingWorkspaceLLM', `Using workspace's main LLM: ${availableLLMs.find(llm => llm.id === workspaceData.mainLLM)?.name || 'None selected'}`)}
                </p>
              </div>
            </div>
            
            <div className="flex justify-end gap-3 mt-6 sticky bottom-0 pt-2 bg-[#1d1d1d] border-t border-zinc-800 p-6">
              <button
                className="px-4 py-2 text-sm text-zinc-300 hover:text-white transition-colors"
                onClick={() => setShowAgentDialog(false)}
              >
                {t('common.cancel', 'Cancel')}
              </button>
              <button
                className="px-4 py-2 text-sm bg-[#FFC72C] hover:bg-[#E6B428] text-black rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
