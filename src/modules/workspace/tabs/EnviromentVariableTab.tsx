
import React, { useState } from 'react';
import { Plus, Edit, Trash2, Eye, EyeOff, Lock, X } from 'lucide-react';
import { WorkspaceData, EnvironmentVariable } from '../types/Types';
import { useTranslation } from 'react-i18next';

interface EnvironmentVariablesTabProps {
  workspaceData: WorkspaceData;
  onTabChanges?: () => void;
  onUpdateWorkspace?: (updatedData: Partial<WorkspaceData>) => void;
}

// Main Tab Component
const EnvironmentVariablesTab: React.FC<EnvironmentVariablesTabProps> = ({
  workspaceData,
  onTabChanges,
  onUpdateWorkspace,
}) => {
  const { t } = useTranslation();
  const [variables, setVariables] = useState<EnvironmentVariable[]>(
    workspaceData.environmentVariables || []
  );
  const [showAddEditModal, setShowAddEditModal] = useState(false);

  // Sync local state with workspace data changes
  React.useEffect(() => {
    setVariables(workspaceData.environmentVariables || []);
  }, [workspaceData.environmentVariables]);
  const [editingVariable, setEditingVariable] = useState<EnvironmentVariable | null>(null);
  const [visibleValues, setVisibleValues] = useState<Set<string>>(new Set());

  const [key, setKey] = useState('');
  const [value, setValue] = useState('');
  const [sensitive, setSensitive] = useState(false);
  const [showValue, setShowValue] = useState(false);
  const [keyError, setKeyError] = useState('');

  const validateKey = (key: string): boolean => {
    const validPattern = /^[A-Z_][A-Z0-9_]*$/;
    if (!key) {
      setKeyError(t('envVars.keyRequired', 'Key is required'));
      return false;
    }
    if (!validPattern.test(key)) {
      setKeyError(
        t(
          'envVars.keyFormat',
          'Key must start with letter/underscore and contain only uppercase letters, numbers, and underscores'
        )
      );
      return false;
    }
    setKeyError('');
    return true;
  };

  const handleKeyChange = (newKey: string) => {
    setKey(newKey.toUpperCase());
    if (newKey) {
      validateKey(newKey.toUpperCase());
    } else {
      setKeyError('');
    }
  };

  const handleAddVariable = () => {
    setEditingVariable(null);
    setKey('');
    setValue('');
    setSensitive(false);
    setShowValue(false);
    setKeyError('');
    setShowAddEditModal(true);
  };

  const handleEditVariable = (variable: EnvironmentVariable) => {
    setEditingVariable(variable);
    setKey(variable.key);
    setValue(variable.value);
    setSensitive(variable.sensitive);
    setShowValue(false);
    setKeyError('');
    setShowAddEditModal(true);
  };

  const handleDeleteVariable = (id: string) => {
    const updatedVariables = variables.filter((v) => v.id !== id);
    setVariables(updatedVariables);
    
    // Update workspace data properly
    if (onUpdateWorkspace) {
      onUpdateWorkspace({ environmentVariables: updatedVariables });
    }
    onTabChanges?.();
  };

  const handleSaveVariable = () => {
    if (!validateKey(key)) {
      return;
    }

    if (!value.trim()) {
      return;
    }

    const now = Date.now();
    
    const savedVariable: EnvironmentVariable = {
      id: editingVariable?.id || `env-${now}`,
      key: key,
      value: value,
      sensitive: sensitive,
      createdAt: editingVariable?.createdAt || now,
      updatedAt: now,
    };

    let updatedVariables: EnvironmentVariable[];

    if (editingVariable) {
      updatedVariables = variables.map((v) =>
        v.id === savedVariable.id ? savedVariable : v
      );
    } else {
      updatedVariables = [...variables, savedVariable];
    }

    setVariables(updatedVariables);
    
    // Update workspace data properly
    if (onUpdateWorkspace) {
      onUpdateWorkspace({ environmentVariables: updatedVariables });
    }
    onTabChanges?.();
    
    setShowAddEditModal(false);
    setEditingVariable(null);
  };

  const handleCancelAddEdit = () => {
    setShowAddEditModal(false);
    setEditingVariable(null);
    setKey('');
    setValue('');
    setSensitive(false);
    setShowValue(false);
    setKeyError('');
  };

  const toggleValueVisibility = (id: string) => {
    setVisibleValues((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const isValueVisible = (id: string) => visibleValues.has(id);

  const maskValue = (value: string) => {
    return '•'.repeat(Math.min(value.length, 20));
  };

  const canSave = key.trim() && value.trim() && !keyError;
  const isEditing = !!editingVariable;

  return (
    <div className="space-y-6">
      <div className="bg-[#121212] rounded-md">
        <div className="flex justify-between items-center p-6 border-b border-[#FFC72C]/50">
          <div className="flex items-center">
            <h2 className="text-xl font-bold text-white">
              {t('envVars.title', 'Environment Variables')}
            </h2>
          </div>
          <button
            className="bg-[#FFC72C] hover:bg-[#E6B428] text-black px-3 py-1 rounded text-sm flex items-center gap-1 cursor-pointer"
            onClick={handleAddVariable}
          >
            <Plus size={16} />
            {t('envVars.addVariable', 'Add Variable')}
          </button>
        </div>

        {variables && variables.length > 0 ? (
          <div className="overflow-y-auto h-[calc(100vh-200px)]">
            <div className="p-6">
              <div className="bg-[#0a0a0a] rounded-lg border border-zinc-800/50 overflow-hidden">
                <table className="w-full table-fixed">
                  <thead>
                    <tr className="border-b border-zinc-800/50 bg-zinc-900/30">
                      <th className="text-left px-6 py-3 text-xs font-medium text-zinc-400 uppercase tracking-wider w-1/4">
                        {t('envVars.key', 'Key')}
                      </th>
                      <th className="text-left px-6 py-3 text-xs font-medium text-zinc-400 uppercase tracking-wider w-1/3">
                        {t('envVars.value', 'Value')}
                      </th>
                      <th className="text-center px-6 py-3 text-xs font-medium text-zinc-400 uppercase tracking-wider w-32">
                        {t('envVars.sensitive', 'Sensitive')}
                      </th>
                      <th className="text-right px-6 py-3 text-xs font-medium text-zinc-400 uppercase tracking-wider w-32">
                        {t('common.actions', 'Actions')}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/30">
                    {variables.map((variable) => (
                      <tr
                        key={variable.id}
                        className="group hover:bg-zinc-900/20 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <code className="text-sm font-mono text-[#FFC72C] truncate">
                              {variable.key}
                            </code>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2 min-w-0">
                            <code className="text-sm font-mono text-zinc-300 truncate flex-shrink min-w-0">
                              {isValueVisible(variable.id)
                                ? variable.value
                                : maskValue(variable.value)}
                            </code>
                            <button
                              onClick={() => toggleValueVisibility(variable.id)}
                              className="text-zinc-400 hover:text-white transition-colors p-1 cursor-pointer flex-shrink-0"
                              title={
                                isValueVisible(variable.id)
                                  ? t('envVars.hide', 'Hide')
                                  : t('envVars.show', 'Show')
                              }
                            >
                              {isValueVisible(variable.id) ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </button>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          {variable.sensitive && (
                            <div className="inline-flex items-center gap-1 text-xs text-yellow-400 bg-yellow-400/10 px-2 py-1 rounded">
                              <Lock className="h-3 w-3" />
                              <span>{t('envVars.sensitive', 'Sensitive')}</span>
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-1 opacity-100 transition-opacity">
                            <button
                              onClick={() => handleEditVariable(variable)}
                              className="text-[#FFC72C] hover:text-[#FFD65C] p-2 hover:bg-[#FFC72C]/10 rounded transition-colors cursor-pointer"
                              title={t('common.edit', 'Edit')}
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteVariable(variable.id)}
                              className="text-red-400 hover:text-red-300 p-2 hover:bg-red-400/10 rounded transition-colors cursor-pointer"
                              title={t('common.delete', 'Delete')}
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-zinc-400 py-16 text-center">
            <Lock className="h-12 w-12 mx-auto mb-4 text-zinc-600" />
            <p className="text-lg font-medium mb-2">
              {t('envVars.noVariables', 'No environment variables')}
            </p>
            <p className="text-sm text-zinc-500">
              {t(
                'envVars.noVariablesHint',
                'Add environment variables to securely store API keys and configuration'
              )}
            </p>
          </div>
        )}
      </div>

      {/* Add/Edit Variable Modal */}
      {showAddEditModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 w-full max-w-lg">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white">
                {isEditing
                  ? t('envVars.editVariable', 'Edit Variable')
                  : t('envVars.addVariable', 'Add Variable')}
              </h2>
              <button
                onClick={handleCancelAddEdit}
                className="text-zinc-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  {t('envVars.key', 'Key')} <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={key}
                  onChange={(e) => handleKeyChange(e.target.value)}
                  placeholder="MY_API_KEY"
                  maxLength={100}
                  className={`w-full bg-zinc-800 border rounded px-3 py-2 text-white font-mono focus:outline-none focus:border-[#FFC72C] ${
                    keyError ? 'border-red-500' : 'border-zinc-700'
                  }`}
                  disabled={isEditing}
                />
                {keyError && <p className="text-xs text-red-400 mt-1">{keyError}</p>}
                {!keyError && (
                  <p className="text-xs text-zinc-500 mt-1">
                    {t('envVars.keyHint', 'Use UPPERCASE_WITH_UNDERSCORES format')}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  {t('envVars.value', 'Value')} <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showValue ? 'text' : 'password'}
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    placeholder={t('envVars.valuePlaceholder', 'Enter value')}
                    maxLength={1000}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 pr-10 text-white font-mono focus:outline-none focus:border-[#FFC72C]
                              [::-ms-reveal]:hidden [::-ms-clear]:hidden"
                  />
                  <button
                    type="button"
                    onClick={() => setShowValue(!showValue)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white transition-colors cursor-pointer"
                  >
                    {showValue ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-zinc-800/50 rounded border border-zinc-700">
                <input
                  type="checkbox"
                  id="sensitive"
                  checked={sensitive}
                  onChange={(e) => setSensitive(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-zinc-600 text-[#FFC72C] focus:ring-[#FFC72C] focus:ring-offset-0 bg-zinc-700 cursor-pointer"
                />
                <div className="flex-1">
                  <label
                    htmlFor="sensitive"
                    className="text-sm font-medium text-white flex items-center gap-2 cursor-pointer"
                  >
                    <Lock className="h-4 w-4" />
                    {t('envVars.markSensitive', 'Mark as Sensitive')}
                  </label>
                  <p className="text-xs text-zinc-400 mt-1">
                    {t(
                      'envVars.sensitiveHint',
                      'Sensitive values will be hidden by default and encrypted when exporting'
                    )}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={handleCancelAddEdit}
                className="flex-1 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded transition-colors cursor-pointer"
              >
                {t('common.cancel', 'Cancel')}
              </button>
              <button
                onClick={handleSaveVariable}
                disabled={!canSave}
                className={`flex-1 px-4 py-2 rounded transition-colors ${
                  canSave
                    ? 'bg-[#FFC72C] hover:bg-[#FFD700] text-black cursor-pointer'
                    : 'bg-zinc-700 text-zinc-500 cursor-not-allowed'
                }`}
              >
                {isEditing ? t('common.update', 'Update') : t('common.add', 'Add')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnvironmentVariablesTab;