import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Trash2, Key, Edit2, Eye, EyeOff, Check, X } from 'lucide-react';

interface ApiKey {
  id: string;
  provider: string;
  key: string;
  lastModified: string;
}

const ApiKeysSection: React.FC = () => {
  const { t } = useTranslation();
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [newProvider, setNewProvider] = useState('');
  const [newApiKey, setNewApiKey] = useState('');
  const [showNewKeyForm, setShowNewKeyForm] = useState(false);
  const [editingKeyId, setEditingKeyId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [hiddenKeys, setHiddenKeys] = useState<Set<string>>(new Set());
  
  // Load API keys from localStorage on component mount
  useEffect(() => {
    const savedKeys = localStorage.getItem('externalApiKeys');
    if (savedKeys) {
      try {
        setApiKeys(JSON.parse(savedKeys));
      } catch (e) {
        console.error('Failed to parse saved API keys', e);
      }
    }
  }, []);
  
  // Save API keys to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('externalApiKeys', JSON.stringify(apiKeys));
  }, [apiKeys]);

  const addNewApiKey = () => {
    if (!newProvider.trim() || !newApiKey.trim()) return;
    
    const newKey: ApiKey = {
      id: Date.now().toString(),
      provider: newProvider.trim(),
      key: newApiKey.trim(),
      lastModified: new Date().toISOString(),
    };
    
    setApiKeys([...apiKeys, newKey]);
    setNewProvider('');
    setNewApiKey('');
    setShowNewKeyForm(false);
    // Automatically hide the new key
    setHiddenKeys(new Set(hiddenKeys).add(newKey.id));
  };

  const deleteKey = (id: string) => {
    setApiKeys(apiKeys.filter(key => key.id !== id));
    // Remove from hidden keys if present
    if (hiddenKeys.has(id)) {
      const newHiddenKeys = new Set(hiddenKeys);
      newHiddenKeys.delete(id);
      setHiddenKeys(newHiddenKeys);
    }
    // Cancel editing if this key was being edited
    if (editingKeyId === id) {
      setEditingKeyId(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };
  
  const toggleKeyVisibility = (id: string) => {
    const newHiddenKeys = new Set(hiddenKeys);
    if (newHiddenKeys.has(id)) {
      newHiddenKeys.delete(id);
    } else {
      newHiddenKeys.add(id);
    }
    setHiddenKeys(newHiddenKeys);
  };
  
  const startEditing = (key: ApiKey) => {
    setEditingKeyId(key.id);
    setEditValue(key.key);
  };
  
  const saveEdit = () => {
    if (!editingKeyId) return;
    
    setApiKeys(apiKeys.map(key => {
      if (key.id === editingKeyId) {
        return {
          ...key,
          key: editValue,
          lastModified: new Date().toISOString()
        };
      }
      return key;
    }));
    
    setEditingKeyId(null);
    setEditValue('');
  };
  
  const cancelEdit = () => {
    setEditingKeyId(null);
    setEditValue('');
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold text-white">
          {t('settings.apiKeys', 'External API Keys')}
        </h2>
        <button
          onClick={() => setShowNewKeyForm(true)}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4 mr-2" />
          {t('settings.addApiKey', 'Add API Key')}
        </button>
      </div>

      {showNewKeyForm && (
        <div className="bg-gray-800 p-4 rounded-lg mb-6">
          <h3 className="text-lg font-medium text-white mb-4">
            {t('settings.addApiKey', 'Add External API Key')}
          </h3>
          <div className="space-y-4">
            <div>
              <label htmlFor="provider" className="block text-sm font-medium text-gray-300 mb-1">
                {t('settings.provider', 'API Provider')}
              </label>
              <input
                type="text"
                id="provider"
                value={newProvider}
                onChange={(e) => setNewProvider(e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder={t('settings.enterProvider', 'e.g., OpenAI, Anthropic, Cohere')}
              />
            </div>
            <div>
              <label htmlFor="apiKey" className="block text-sm font-medium text-gray-300 mb-1">
                {t('settings.apiKeyValue', 'API Key')}
              </label>
              <input
                type="password"
                id="apiKey"
                value={newApiKey}
                onChange={(e) => setNewApiKey(e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder={t('settings.enterApiKey', 'Enter the API key')}
              />
            </div>
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setShowNewKeyForm(false)}
                className="px-4 py-2 text-gray-300 hover:text-white"
              >
                {t('common.cancel', 'Cancel')}
              </button>
              <button
                onClick={addNewApiKey}
                disabled={!newProvider.trim() || !newApiKey.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {t('settings.addKey', 'Add Key')}
              </button>
            </div>
          </div>
        </div>
      )}



      <div className="space-y-4">
        {apiKeys.length === 0 ? (
          <div className="text-center py-12">
            <Key className="w-12 h-12 mx-auto text-gray-500 mb-4" />
            <h3 className="text-lg font-medium text-gray-300">
              {t('settings.noApiKeys', 'No External API Keys')}
            </h3>
            <p className="text-gray-500 mt-1">
              {t('settings.noApiKeysDescription', 'Add your external API keys to integrate with various services')}
            </p>
          </div>
        ) : (
          <div className="bg-gray-800 rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-700">
              <thead className="bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    {t('settings.provider', 'Provider')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    {t('settings.apiKeyValue', 'API Key')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    {t('settings.lastModified', 'Last Modified')}
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">
                    {t('common.actions', 'Actions')}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-gray-800 divide-y divide-gray-700">
                {apiKeys.map((apiKey) => (
                  <tr key={apiKey.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Key className="w-4 h-4 text-gray-400 mr-2" />
                        <div className="text-sm font-medium text-white">{apiKey.provider}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {editingKeyId === apiKey.id ? (
                        <div className="flex items-center space-x-2">
                          <input
                            type="text"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            className="px-2 py-1 bg-gray-700 text-white rounded border border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                          <button onClick={saveEdit} className="text-green-400 hover:text-green-300" title={t('common.save', 'Save')}>
                            <Check className="w-4 h-4" />
                          </button>
                          <button onClick={cancelEdit} className="text-red-400 hover:text-red-300" title={t('common.cancel', 'Cancel')}>
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-2">
                          <div className="text-sm text-gray-300 font-mono">
                            {hiddenKeys.has(apiKey.id) ? 
                              '••••••••••••••••••••••••' : 
                              apiKey.key}
                          </div>
                          <button 
                            onClick={() => toggleKeyVisibility(apiKey.id)}
                            className="text-gray-400 hover:text-white"
                            title={hiddenKeys.has(apiKey.id) ? t('settings.show', 'Show') : t('settings.hide', 'Hide')}
                          >
                            {hiddenKeys.has(apiKey.id) ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                          </button>
                          <button 
                            onClick={() => navigator.clipboard.writeText(apiKey.key)}
                            className="text-gray-400 hover:text-white"
                            title={t('common.copyToClipboard', 'Copy to clipboard')}
                          >
                            📋
                          </button>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                      {formatDate(apiKey.lastModified)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        {editingKeyId !== apiKey.id && (
                          <button
                            onClick={() => startEditing(apiKey)}
                            className="text-blue-400 hover:text-blue-300"
                            title={t('common.edit', 'Edit')}
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => deleteKey(apiKey.id)}
                          className="text-red-400 hover:text-red-300"
                          title={t('common.delete', 'Delete')}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default ApiKeysSection;
