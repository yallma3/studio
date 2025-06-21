/*
* yaLLMa3 - Framework for building AI agents that are capable of learning from their environment and interacting with it.
 
 * Copyright (C) 2025 yaLLMa3
 
 * This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0.
   If a copy of the MPL was not distributed with this file, You can obtain one at https://www.mozilla.org/MPL/2.0/.
 
 * This software is distributed on an "AS IS" basis,
   WITHOUT WARRANTY OF ANY KIND, either express or implied.
   See the Mozilla Public License for the specific language governing rights and limitations under the License.
*/

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
