import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import WorkspaceCanvas from "./modules/projects/components/ProjectCanvas.tsx";
import HomeScreen from "./components/HomeScreen.tsx";
import { loadWorkspaceState, loadWorkspaceStateFromPath } from "./modules/projects/utils/storageUtils.ts";
import { WorkspaceData } from "./modules/projects/types/Types.ts";

import { initFlowSystem } from "./modules/flows/initFlowSystem.ts";

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<"home" | "canvas">("home");
  const [currentWorkspaceData, setCurrentWorkspaceData] = useState<WorkspaceData | null>(null);
  const { i18n } = useTranslation();
  
  
  // Setup language direction based on current language
  useEffect(() => {
    initFlowSystem()
    document.documentElement.dir = i18n.language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = i18n.language;
  }, [i18n.language]);
  
  // Handle creating a new graph, agent, or workspace
  const handleCreateNew = () => {
    
   
      // Generate a unique ID for the new workspace
      const newWorkspaceId = `workspace-${Date.now()}`;
      
      // Create a workspaceData object instead of workspaceState
      const workspaceData: WorkspaceData = {
        id: newWorkspaceId,
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
      
      setCurrentWorkspaceData(workspaceData);
    
    
    setCurrentView("canvas");
  };
  
  // Handle opening a graph/agent/workspace from file system
  const handleLoadFromFile = async () => {
    try {
      
        const loadedState = await loadWorkspaceState();
        if (loadedState) {
          console.log('Loaded workspace state:', loadedState);
          
          // The loadWorkspaceState now returns workspaceData directly
          setCurrentWorkspaceData(loadedState.workspaceState);
          setCurrentView("canvas");
        }
      
    } catch (error) {
      console.error(`Error loading workspace state:`, error);
      alert(`Failed to load workspace state: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  const handleOpenFromPath = async (path: string, id: string) => {
   
    const loadedState = await loadWorkspaceStateFromPath(path, id);
    if (loadedState) {
        console.log('Loaded workspace state:', loadedState);
        
        // The loadWorkspaceStateFromPath now returns workspaceData directly
        setCurrentWorkspaceData(loadedState);
        setCurrentView("canvas");
      }
    
  };
  
  // Handle opening a workspace with workspaceData
  const handleOpenWorkspace = (workspaceData: WorkspaceData) => {
    // console.log('Opening workspace with workspaceData:', workspaceData);
    setCurrentWorkspaceData(workspaceData);
    setCurrentView("canvas");
  };
  
  // Handle returning to home screen
  const handleReturnToHome = () => {;
    setCurrentWorkspaceData(null);
    setCurrentView("home");
  };
  
  return (
    <div className="app-container">
      {currentView === "home" ? (
        <HomeScreen 
          onCreateNew={handleCreateNew}
          onOpenFromFile={handleLoadFromFile}
          onOpenFromPath={handleOpenFromPath}
          onOpenWorkspace={handleOpenWorkspace}
        />  
      ) : (
        <>
          {currentWorkspaceData && (
            <WorkspaceCanvas 
              workspaceData={currentWorkspaceData}
              onReturnToHome={handleReturnToHome}
            />
          )}
        </>
      )}
    </div>
  );
};

export default App;
