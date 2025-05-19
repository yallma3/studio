import React from 'react';
import { useTranslation } from 'react-i18next';
import { Settings, Key, Bell, Server } from 'lucide-react';

type SettingsSection = 'general' | 'api-keys' | 'notifications' | 'advanced';

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
    { id: 'api-keys' as const, icon: Key, label: t('settings.apiKeys', 'API Keys') },
    { id: 'notifications' as const, icon: Bell, label: t('settings.notifications', 'Notifications') },
    { id: 'advanced' as const, icon: Server, label: t('settings.advanced', 'Advanced') },
  ];

  return (
    <div className="w-64 border-r border-gray-700 bg-gray-900 text-white h-full">
      <div className="p-4 border-b border-gray-700">
        <h2 className="text-xl font-semibold">{t('settings.title', 'Settings')}</h2>
      </div>
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
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-300 hover:bg-gray-800 hover:text-white'
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
