import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { WorkspaceData, LLMOption } from "../../types/Types";
import { Edit2, Save, X, Check, Key } from "lucide-react";
import { openUrl } from '@tauri-apps/plugin-opener';

interface WorkspaceTabProps {
  workspaceData: WorkspaceData;
  onUpdateWorkspace?: (updatedData: Partial<WorkspaceData>) => Promise<void>;
}

const WorkspaceTab: React.FC<WorkspaceTabProps> = ({ workspaceData: workspaceData, onUpdateWorkspace: onUpdateWorkspace }) => {
  const { t } = useTranslation();
  
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
  
  // Helper function to determine provider from LLM ID
  const getProviderFromLLM = (llmId: string): string | null => {
    if (!llmId) return null;
    const llm = availableLLMs.find(llm => llm.id === llmId);
    return llm ? llm.provider : null;
  };
  
  // Get unique providers from available LLMs
  const llmProviders = [...new Set(availableLLMs.map(llm => llm.provider))];
  
  // State for editing mode
  const [isEditing, setIsEditing] = useState<boolean>(false);
  
  // State for form values
  const [formValues, setFormValues] = useState({
    name: workspaceData.name || '',
    description: workspaceData.description || '',
    mainLLM: workspaceData.mainLLM || '',
    apiKey: workspaceData.apiKey || '',
    useSavedCredentials: workspaceData.useSavedCredentials || false
  });
  
  // State for selected provider
  const [selectedProvider, setSelectedProvider] = useState<string>(
    // Try to determine the provider from the mainLLM
    getProviderFromLLM(workspaceData.mainLLM) || "Groq"
  );
  
  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormValues(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Handle checkbox changes
  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormValues(prev => ({
      ...prev,
      [name]: checked
    }));
  };
  
  // Handle save
  const handleSave = async () => {
    if (onUpdateWorkspace) {
      await onUpdateWorkspace({
        name: formValues.name,
        description: formValues.description,
        mainLLM: formValues.mainLLM,
        apiKey: formValues.apiKey,
        useSavedCredentials: formValues.useSavedCredentials
      });
    }
    setIsEditing(false);
  };
  
  // Handle cancel
  const handleCancel = () => {
    // Reset form values to original data
    setFormValues({
      name: workspaceData.name || '',
      description: workspaceData.description || '',
      mainLLM: workspaceData.mainLLM || '',
      apiKey: workspaceData.apiKey || '',
      useSavedCredentials: workspaceData.useSavedCredentials || false
    });
    // Reset provider selection
    setSelectedProvider(getProviderFromLLM(workspaceData.mainLLM) || "Groq");
    setIsEditing(false);
  };  

  return (
    <div className="space-y-6 overflow-y-auto pb-20 h-full">
      {/* workspace details section */}
      <div className="bg-[#121212] rounded-md p-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-white">{t('workspaces.details', 'Workspace Details')}</h2>
          
          {isEditing ? (
            <div className="flex gap-2">
              <button 
                onClick={handleSave}
                className="flex items-center gap-1 bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm"
              >
                <Save size={14} />
                <span>{t('common.save', 'Save')}</span>
              </button>
              <button 
                onClick={handleCancel}
                className="flex items-center gap-1 bg-gray-600 hover:bg-gray-700 text-white px-3 py-1 rounded text-sm"
              >
                <X size={14} />
                <span>{t('common.cancel', 'Cancel')}</span>
              </button>
            </div>
          ) : (
            <button 
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm"
            >
              <Edit2 size={14} />
              <span>{t('common.edit', 'Edit')}</span>
            </button>
          )}
        </div>
        
        <div className="mb-4">
          <label className="block text-gray-400 mb-1">{t('workspaces.name', 'Name')}</label>
          {isEditing ? (
            <input
              type="text"
              name="name"
              value={formValues.name}
              onChange={handleInputChange}
              className="w-full bg-[#1d1d1d] border border-gray-700 rounded px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-yellow-500"
              placeholder={t('workspaces.enterName', 'Enter workspace name')}
            />
          ) : (
            <div className="text-white font-medium">{workspaceData.name || t('workspaces.untitled', 'Untitled workspace')}</div>
          )}
        </div>
        
        <div className="mb-4">
          <label className="block text-gray-400 mb-1">{t('workspaces.description', 'Description')}</label>
          {isEditing ? (
            <textarea
              name="description"
              value={formValues.description}
              onChange={handleInputChange}
              className="w-full bg-[#1d1d1d] border border-gray-700 rounded px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-yellow-500 min-h-[80px]"
              placeholder={t('workspaces.enterDescription', 'Enter workspace description')}
            />
          ) : (
            <div className="text-white">
              {workspaceData.description || t('workspaces.noDescription', 'No description provided')}
            </div>
          )}
        </div>
        
        <div className="mb-4">
          <label className="block text-gray-400 mb-1">{t('workspaces.id', 'workspace ID')}</label>
          <div className="text-gray-300 font-mono text-sm">{workspaceData.id}</div>
        </div>
        
        <div className="mb-4">
          <label className="block text-gray-400 mb-1">{t('workspaces.mainLLM', 'Main LLM')}</label>
          {isEditing ? (
            <div className="space-y-4 bg-[#1d1d1d] border border-gray-700 rounded p-4">
              {/* Provider Selection */}
              <div className="mb-4">
                <label htmlFor="provider" className="block text-sm font-medium text-gray-400 mb-2">
                  {t('workspaces.selectProvider', 'Select Provider')}
                </label>
                <select
                  id="provider"
                  value={selectedProvider}
                  onChange={(e) => setSelectedProvider(e.target.value)}
                  className="w-full px-3 py-2 bg-[#252525] border border-gray-700 rounded text-white focus:outline-none focus:ring-1 focus:ring-yellow-500"
                >
                  <option disabled value="">{t('workspaces.selectProviderPlaceholder', 'Select a provider...')}</option>
                  {llmProviders.map(provider => (
                    <option key={provider} value={provider}>
                      {provider}
                    </option>
                  ))}
                </select>
              </div>
              
              {/* Model Selection */}
              {selectedProvider && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    {t('workspaces.selectModel', 'Select Model')}
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {availableLLMs
                      .filter(llm => llm.provider === selectedProvider)
                      .map(llm => (
                        <div 
                          key={llm.id}
                          className={`border rounded p-3 cursor-pointer transition-all ${formValues.mainLLM === llm.id
                            ? 'border-yellow-400 bg-[#252525]'
                            : 'border-gray-700 bg-[#1d1d1d] hover:border-gray-600'}`}
                          onClick={() => setFormValues(prev => ({ ...prev, mainLLM: llm.id }))}
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="font-medium text-white">{llm.name}</h3>
                            </div>
                            {formValues.mainLLM === llm.id && (
                              <div className="bg-yellow-400 rounded-full p-1">
                                <Check className="h-3 w-3 text-black" />
                              </div>
                            )}
                          </div>
                          
                          <div className="mt-2 text-xs text-gray-400">
                            <span>Token limit: {llm.tokenLimit.toLocaleString()}</span>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}
              
              {/* API Key Section */}
              {formValues.mainLLM && (
                <div className="mt-4 space-y-3">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="useSavedCredentials"
                      name="useSavedCredentials"
                      checked={formValues.useSavedCredentials}
                      onChange={handleCheckboxChange}
                      className="mr-2 h-4 w-4 rounded border-gray-700 bg-[#252525] text-yellow-400 focus:ring-yellow-500"
                    />
                    <label htmlFor="useSavedCredentials" className="text-sm text-gray-300">
                      {t('workspaces.useSavedCredentials', 'Use saved credentials')}
                    </label>
                  </div>
                  
                  {!formValues.useSavedCredentials && (
                    <div>
                      <label htmlFor="apiKey" className="block text-sm font-medium text-gray-400 mb-1">
                        {t('workspaces.apiKey', 'API Key')} 
                      </label>
                      <div className="relative">
                        <input
                          type="password"
                          id="apiKey"
                          name="apiKey"
                          value={formValues.apiKey}
                          onChange={handleInputChange}
                          className="w-full pl-9 pr-3 py-2 bg-[#252525] border border-gray-700 rounded text-white focus:outline-none focus:ring-1 focus:ring-yellow-500"
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
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="text-white">{workspaceData.mainLLM || t('workspaces.noLLM', 'No LLM selected')}</div>
          )}
        </div>
        
        <div className="flex gap-4 mt-4">
          <div>
            <label className="block text-gray-400 mb-1">{t('workspaces.created', 'Created')}</label>
            <div className="text-gray-300 text-sm">
              {workspaceData.createdAt 
                ? new Date(workspaceData.createdAt).toLocaleString() 
                : t('workspaces.unknown', 'Unknown')}
            </div>
          </div>
          <div>
            <label className="block text-gray-400 mb-1">{t('workspaces.updated', 'Last Updated')}</label>
            <div className="text-gray-300 text-sm">
              {workspaceData.updatedAt 
                ? new Date(workspaceData.updatedAt).toLocaleString() 
                : t('workspaces.unknown', 'Unknown')}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkspaceTab;
