/*
* yaLLMa3 - Framework for building AI agents that are capable of learning from their environment and interacting with it.
 
 * Copyright (C) 2025 yaLLMa3
 
 * This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0.
   If a copy of the MPL was not distributed with this file, You can obtain one at https://www.mozilla.org/MPL/2.0/.
 
 * This software is distributed on an "AS IS" basis,
   WITHOUT WARRANTY OF ANY KIND, either express or implied.
   See the Mozilla Public License for the specific language governing rights and limitations under the License.
*/

import React from 'react';
import { useTranslation } from 'react-i18next';
import { Settings, Key, Bell, Server, GitBranch } from 'lucide-react';

type SettingsSection = 'general' | 'api-keys' | 'notifications' | 'advanced' | 'ai-workflows';

interface SettingsSidebarProps {
  activeSection: SettingsSection;
  onSectionChange: (section: SettingsSection) => void;
}

const SettingsSidebar: React.FC<SettingsSidebarProps> = ({
  activeSection,
  onSectionChange,
}) => {
  const { t } = useTranslation();

  const menuItems = [
    { id: 'general' as const, icon: Settings, label: t('settings.general', 'General') },
    { id: 'api-keys' as const, icon: Key, label: t('settings.apiKeys', 'Keys Vault') },
    { id: 'ai-workflows' as const, icon: GitBranch, label: t('settings.aiWorkflows', 'AI Workflows') },
    { id: 'notifications' as const, icon: Bell, label: t('settings.notifications', 'Notifications') },
    { id: 'advanced' as const, icon: Server, label: t('settings.advanced', 'Advanced') },
  ];

  return (
    <div className="w-64 border-r border-zinc-800 bg-zinc-900 text-white h-full">
      
      <nav className="p-2">
        <ul>
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;
            return (
              <li key={item.id} className="mb-1">
                <button
                  onClick={() => onSectionChange(item.id)}
                  className={`flex items-center w-full p-3 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-[#FFC72C] text-black'
                      : 'text-gray-300 hover:bg-zinc-800 hover:text-white'
                  }`}
                >
                  <Icon className="w-5 h-5 mr-3" />
                  <span>{item.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
};

export default SettingsSidebar;
