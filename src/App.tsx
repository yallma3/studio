import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import NodeCanvas from "./components/NodeCanvas.tsx";
import HomeScreen from "./components/HomeScreen.tsx";
import { loadCanvasState, loadCanvasStateFromPath } from "./utils/storageUtils.ts";
import { CanvasState } from "./utils/storageUtils.ts";


const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<"home" | "canvas">("home");
  const [currentGraph, setCurrentGraph] = useState<CanvasState | null>(null);
  const { i18n } = useTranslation();
  
  // Setup language direction based on current language
  useEffect(() => {
    document.documentElement.dir = i18n.language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = i18n.language;
  }, [i18n.language]);
  
  // Handle creating a new graph
  const handleCreateNewGraph = () => {
    // Generate a unique ID for the new graph
    const newGraphId = `graph-${Date.now()}`;
    const canvasState: CanvasState = {
      graphId: newGraphId,
      graphName: null,
      nodes: [],
      connections: [],
      nextNodeId: 0
    };
    setCurrentGraph(canvasState);
    setCurrentView("canvas");
  };
   // Handle opening a graph from file system
   const handleLoadFromFile = async () => {
    try {
      const loadedState = await loadCanvasState();
      if (loadedState) {
        console.log('Loaded state:', loadedState);
       
        setCurrentGraph(loadedState.canvasState);
        setCurrentView("canvas");
      }
    } catch (error) {
      console.error("Error loading canvas state:", error);
      alert(`Failed to load canvas state: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  const handleOpenFromPath = async (path: string, id: string) => {
    const loadedState = await loadCanvasStateFromPath(path, id);
    if (loadedState) {
      console.log('Loaded state:', loadedState);
      setCurrentGraph(loadedState);
      setCurrentView("canvas");
    }
  };
  
  // Handle returning to home screen
  const handleReturnToHome = () => {
    setCurrentGraph(null);
    setCurrentView("home");
  };
  
  return (
    <div className="app-container">
      {currentView === "home" ? (
        <HomeScreen 
          onCreateNew={handleCreateNewGraph}
          onOpenFromFile={handleLoadFromFile}
          onOpenFromPath={handleOpenFromPath}
        />  
      ) : (
        <NodeCanvas 
          graph={currentGraph}
          onReturnToHome={handleReturnToHome}
        />
      )}
    </div>
  );
};

export default App;
