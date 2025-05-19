import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import ProjectCanvas from "./modules/projects/components/ProjectCanvas.tsx";
import HomeScreen from "./components/HomeScreen.tsx";
import { loadProjectState, loadProjectStateFromPath } from "./modules/projects/utils/storageUtils.ts";
import { ProjectData } from "./modules/projects/types/Types.ts";

import { initFlowSystem } from "./modules/flows/initFlowSystem.ts";

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<"home" | "canvas">("home");
  const [currentProjectData, setCurrentProjectData] = useState<ProjectData | null>(null);
  const { i18n } = useTranslation();
  
  
  // Setup language direction based on current language
  useEffect(() => {
    initFlowSystem()
    document.documentElement.dir = i18n.language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = i18n.language;
  }, [i18n.language]);
  
  // Handle creating a new graph, agent, or project
  const handleCreateNew = () => {
    
   
      // Generate a unique ID for the new project
      const newProjectId = `project-${Date.now()}`;
      
      // Create a ProjectData object instead of ProjectState
      const projectData: ProjectData = {
        id: newProjectId,
        name: "",
        description: "",
        createdAt: Date.now(),
        updatedAt: Date.now(),
        mainLLM: "",
        apiKey: "",
        useSavedCredentials: false,
        tasks: [],
        agents: [],
        workflows: [],
      };
      
      setCurrentProjectData(projectData);
    
    
    setCurrentView("canvas");
  };
  
  // Handle opening a graph/agent/project from file system
  const handleLoadFromFile = async () => {
    try {
      
        const loadedState = await loadProjectState();
        if (loadedState) {
          console.log('Loaded project state:', loadedState);
          
          // The loadProjectState now returns ProjectData directly
          setCurrentProjectData(loadedState.projectState);
          setCurrentView("canvas");
        }
      
    } catch (error) {
      console.error(`Error loading project state:`, error);
      alert(`Failed to load project state: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  const handleOpenFromPath = async (path: string, id: string) => {
   
    const loadedState = await loadProjectStateFromPath(path, id);
    if (loadedState) {
        console.log('Loaded project state:', loadedState);
        
        // The loadProjectStateFromPath now returns ProjectData directly
        setCurrentProjectData(loadedState);
        setCurrentView("canvas");
      }
    
  };
  
  // Handle opening a project with ProjectData
  const handleOpenProject = (projectData: ProjectData) => {
    // console.log('Opening project with ProjectData:', projectData);
    setCurrentProjectData(projectData);
    setCurrentView("canvas");
  };
  
  // Handle returning to home screen
  const handleReturnToHome = () => {;
    setCurrentProjectData(null);
    setCurrentView("home");
  };
  
  return (
    <div className="app-container">
      {currentView === "home" ? (
        <HomeScreen 
          onCreateNew={handleCreateNew}
          onOpenFromFile={handleLoadFromFile}
          onOpenFromPath={handleOpenFromPath}
          onOpenProject={handleOpenProject}
        />  
      ) : (
        <>
          {currentProjectData && (
            <ProjectCanvas 
              projectData={currentProjectData}
              onReturnToHome={handleReturnToHome}
            />
          )}
        </>
      )}
    </div>
  );
};

export default App;
