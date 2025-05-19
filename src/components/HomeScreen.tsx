import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Settings } from "lucide-react";
import LanguageSelector from "./LanguageSelector";
import ProjectsTab from "../modules/projects/components/ProjectsTab";
import { ProjectData } from "../modules/projects/types/Types";
import SettingsView from "./settings/SettingsView";

interface HomeScreenProps {
  onCreateNew: (type: "projects") => void;
  onOpenFromFile: (type: "projects") => void;
  onOpenFromPath: (path: string, id: string, type: "projects") => void;
  onOpenProject?: (projectData: ProjectData) => void;
}

const HomeScreen: React.FC<HomeScreenProps> = ({ onCreateNew, onOpenFromFile, onOpenFromPath, onOpenProject }) => {
  const { t } = useTranslation();
  const [showSettings, setShowSettings] = useState(false);
   
  return (
    <div className="min-h-screen bg-black relative overflow-hidden" dir="auto">
      {/* Header */}
      <header className="relative z-10 px-8 py-6">
        <div className="flex items-center justify-between">
          <div className="text-2xl md:text-3xl font-bold text-white flex items-center font-mono">
            <img src="/yaLLMa3.svg" alt={t('app.title')} className="w-32" />
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setShowSettings(true)}
              className="p-2 text-gray-400 hover:text-white transition-colors"
              title={t('settings.title', 'Settings')}
            >
              <Settings className="w-5 h-5" />
            </button>
            <LanguageSelector />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10">
        <ProjectsTab 
          onCreateNew={() => onCreateNew("projects")} 
          onOpenFromFile={() => onOpenFromFile("projects")} 
          onOpenFromPath={(path, id) => onOpenFromPath(path, id, "projects")}
          onOpenProject={onOpenProject}
        />
      </main>

      {/* Settings Modal */}
      {showSettings && (
        <SettingsView onClose={() => setShowSettings(false)} />
      )}
    </div>
  );
};

export default HomeScreen;