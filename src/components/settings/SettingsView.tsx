/*
* yaLLMa3 - Framework for building AI agents that are capable of learning from their environment and interacting with it.
 
 * Copyright (C) 2025 yaLLMa3
 
 * This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0.
   If a copy of the MPL was not distributed with this file, You can obtain one at https://www.mozilla.org/MPL/2.0/.
 
 * This software is distributed on an "AS IS" basis,
   WITHOUT WARRANTY OF ANY KIND, either express or implied.
   See the Mozilla Public License for the specific language governing rights and limitations under the License.
*/

import React, { useState } from 'react';
import { X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import SettingsSidebar from './SettingsSidebar';
import ApiKeysSection from './ApiKeysSection';
import AIWorkflowsSection from './AIWorkflowsSection';

type SettingsSection = 'general' | 'api-keys' | 'notifications' | 'advanced' | 'ai-workflows';

interface SettingsViewProps {
  onClose: () => void;
}

const SettingsView: React.FC<SettingsViewProps> = ({ onClose }) => {
  const { t } = useTranslation();
  const [activeSection, setActiveSection] = useState<SettingsSection>('general');

  const renderSection = () => {
    switch (activeSection) {
      case 'api-keys':
        return <ApiKeysSection />;
      case 'ai-workflows':
        return <AIWorkflowsSection />;
      case 'notifications':
        return (
          <div className="p-6">
            <h2 className="text-2xl font-semibold text-white mb-6">
              {t('settings.notifications', 'Notifications')}
            </h2>
            <p className="text-gray-400">
              {t('settings.notificationsDescription', 'Manage your notification preferences here.')}
            </p>
          </div>
        );
      case 'advanced':
        return (
          <div className="p-6">
            <h2 className="text-2xl font-semibold text-white mb-6">
              {t('settings.advanced', 'Advanced')}
            </h2>
            <p className="text-gray-400">
              {t('settings.advancedDescription', 'Advanced application settings.')}
            </p>
          </div>
        );
      case 'general':
      default:
        return (
          <div className="p-6">
            <h2 className="text-2xl font-semibold text-white mb-6">
              {t('settings.general', 'General')}
            </h2>
            <p className="text-gray-400">
              {t('settings.generalDescription', 'Configure general application settings.')}
            </p>
          </div>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="absolute inset-0 flex">
        <div className="relative w-full">
          <div className="flex h-full flex-col bg-zinc-950 shadow-xl">
            <div className="flex items-center justify-between border-b border-gray-800 p-4">
              <h2 className="text-xl font-semibold text-white">
                {t('settings.title', 'Settings')}
              </h2>
              <button
                type="button"
                className="rounded-md text-gray-400 hover:text-white focus:outline-none"
                onClick={onClose}
              >
                <X className="h-6 w-6" aria-hidden="true" />
              </button>
            </div>
            <div className="flex flex-1 overflow-hidden">
              <SettingsSidebar
                activeSection={activeSection}
                onSectionChange={setActiveSection}
              />
              <div className="flex-1 overflow-y-auto">
                {renderSection()}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsView;
