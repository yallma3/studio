import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import LanguageSelector from "./LanguageSelector";
import Tabs from "./ui/tabs";
import ProjectsTab from "../modules/projects/components/ProjectsTab";
import AgentsTab from "../modules/agents/components/AgentsTab";
import FlowsTab from "../modules/flows/components/FlowsTab";

interface HomeScreenProps {
  onCreateNew: (type: "flows" | "agents" | "projects") => void;
  onOpenFromFile: (type: "flows" | "agents" | "projects") => void;
  onOpenFromPath: (path: string, id: string, type: "flows" | "agents" | "projects") => void;
}

const HomeScreen: React.FC<HomeScreenProps> = ({ onCreateNew, onOpenFromFile, onOpenFromPath }) => {
  const [activeTab, setActiveTab] = useState<string>("flows");
  const { t } = useTranslation();
  
  const tabs = [
    { id: "projects", label: t('tabs.projects', 'Projects') },
    { id: "agents", label: t('tabs.agents', 'Agents') },
    { id: "flows", label: t('tabs.flows', 'Flows') }
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case "projects":
        return <ProjectsTab 
          onCreateNew={() => onCreateNew("projects")} 
          onOpenFromFile={() => onOpenFromFile("projects")} 
          onOpenFromPath={(path, id) => onOpenFromPath(path, id, "projects")}
        />;
      case "agents":
        return <AgentsTab 
          onCreateNew={() => onCreateNew("agents")} 
          onOpenFromFile={() => onOpenFromFile("agents")} 
          onOpenFromPath={(path, id) => onOpenFromPath(path, id, "agents")} 
        />;
      case "flows":
      default:
        return <FlowsTab 
          onCreateNew={() => onCreateNew("flows")} 
          onOpenFromFile={() => onOpenFromFile("flows")} 
          onOpenFromPath={(path, id) => onOpenFromPath(path, id, "flows")} 
        />;
    }
  };

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

      {/* Tabs */}
      <div className="container mx-auto relative z-10 px-4 mt-4">
        <Tabs 
          activeTab={activeTab} 
          onTabChange={setActiveTab} 
          tabs={tabs} 
        />
      </div>

      {/* Main Content */}
      <main className="relative z-10">
        {renderTabContent()}
      </main>
    </div>
  );
};

export default HomeScreen; 