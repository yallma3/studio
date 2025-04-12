import React, { useState } from "react";
import NodeCanvas from "./components/NodeCanvas.tsx";
import HomeScreen from "./components/HomeScreen.tsx";
import { loadCanvasState, loadCanvasStateFromPath } from "./utils/storageUtils.ts";
import { CanvasState } from "./utils/storageUtils.ts";


const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<"home" | "canvas">("home");
  const [currentGraphId, setCurrentGraphId] = useState<string>("");
  const [currentGraph, setCurrentGraph] = useState<CanvasState | null>(null);
  
  // Handle creating a new graph
  const handleCreateNewGraph = () => {
    // Generate a unique ID for the new graph
    const newGraphId = `graph-${Date.now()}`;
    
    // Set the current graph ID and navigate to canvas
    // setCurrentGraph(initialState);
    setCurrentGraphId(newGraphId);
    setCurrentView("canvas");
  };
  
  //  // Handle opening an existing graph from localStorage by ID
  //  const handleOpenRecentGraph = (graphId: string) => {
  //   try {
  //     const savedState = localStorage.getItem(`agent-graph-${graphId}`);
  //     if (savedState) {
  //       const parsedState = JSON.parse(savedState);
  //       console.log(parsedState);
  //      setCurrentGraphId(graphId);
       
  //     loadCanvasStateFromPath(parsedState.path, graphId);
       
  //      setCurrentView("canvas");
  //       // console.log(parsedState);
  //     }
  //   } catch (error) {
  //     console.error("Error loading graph:", error);
  //     alert(`Failed to load graph: ${error instanceof Error ? error.message : String(error)}`);
  //   }
  // };

   // Handle opening a graph from file system
   const handleLoadFromFile = async () => {
    try {
      const loadedState = await loadCanvasState();
      if (loadedState) {
        console.log('Loaded state:', loadedState);
       
        setCurrentGraphId(loadedState.newGraphId);
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
      setCurrentGraphId(id);
      setCurrentView("canvas");
    }
  };
  
  // Handle returning to home screen
  const handleReturnToHome = () => {
    setCurrentGraphId("");
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
          graphId={currentGraphId}
          graph={currentGraph}
          onReturnToHome={handleReturnToHome}
        />
      )}
    </div>
  );
};

export default App;
