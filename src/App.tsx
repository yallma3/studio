import React, { useState } from "react";
import NodeCanvas from "./components/NodeCanvas.tsx";
import HomeScreen from "./components/HomeScreen.tsx";
import { Node, Connection } from "./types/NodeTypes";

interface GraphState {
  name: string;
  nodes: Node[];
  connections: Connection[];
  lastModified: number;
}

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<"home" | "canvas">("home");
  const [currentGraphId, setCurrentGraphId] = useState<string | null>(null);
  
  // Handle creating a new graph
  const handleCreateNewGraph = () => {
    // Generate a unique ID for the new graph
    const newGraphId = `graph-${Date.now()}`;
    
    // Initialize an empty state for the new graph
    const initialState: GraphState = {
      name: "Untitled Graph",
      nodes: [],
      connections: [],
      lastModified: Date.now()
    };
    
    // Save the initial state to localStorage
    localStorage.setItem(`agent-graph-${newGraphId}`, JSON.stringify(initialState));
    
    // Set the current graph ID and navigate to canvas
    setCurrentGraphId(newGraphId);
    setCurrentView("canvas");
  };
  
  // Handle opening an existing graph
  const handleOpenExistingGraph = (graphId: string) => {
    setCurrentGraphId(graphId);
    setCurrentView("canvas");
  };
  
  // Handle returning to home screen
  // const handleReturnToHome = () => {
  //   setCurrentView("home");
  // };
  
  return (
    <div className="app-container">
      {currentView === "home" ? (
        <HomeScreen 
          onCreateNew={handleCreateNewGraph}
          onOpenExisting={handleOpenExistingGraph}
        />
      ) : (
        
        <NodeCanvas 
          // graphId={currentGraphId} 
          // onReturnToHome={handleReturnToHome}
        />
      )}
    </div>
  );
};

export default App;
