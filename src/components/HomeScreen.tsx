import React from "react";
import { useTranslation } from "react-i18next";
import LanguageSelector from "./LanguageSelector";
import ProjectsTab from "../modules/projects/components/ProjectsTab";
import { ProjectData } from "../modules/projects/types/Types";

interface HomeScreenProps {
  onCreateNew: (type: "projects") => void;
  onOpenFromFile: (type: "projects") => void;
  onOpenFromPath: (path: string, id: string, type: "projects") => void;
  onOpenProject?: (projectData: ProjectData) => void;
}

const HomeScreen: React.FC<HomeScreenProps> = ({ onCreateNew, onOpenFromFile, onOpenFromPath, onOpenProject }) => {
  const { t } = useTranslation();
   
  return (
    <div className="min-h-screen bg-black relative overflow-hidden" dir="auto">
      {/* Header */}
      <header className="relative z-10 px-8 py-6">
        <div className="flex items-center justify-between">
          <div className="text-2xl md:text-3xl font-bold text-white flex items-center font-mono">
            <img src="/yaLLMa3.svg" alt={t('app.title')} className="w-32" />
          </div>
          <LanguageSelector />
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
    </div>
  );
};

export default HomeScreen; 