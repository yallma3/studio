import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import NodeCanvas from "./modules/flows/components/NodeCanvas.tsx";
import AgentCanvas from "./modules/agents/components/AgentCanvas.tsx";
import ProjectCanvas from "./modules/projects/components/ProjectCanvas.tsx";
import HomeScreen from "./components/HomeScreen.tsx";
import { loadCanvasState, loadCanvasStateFromPath, CanvasState } from "./modules/flows/utils/storageUtils.ts";
import { loadAgentState, loadAgentStateFromPath, AgentState } from "./modules/agents/utils/storageUtils.ts";
import { loadProjectState, loadProjectStateFromPath, ProjectState } from "./modules/projects/utils/storageUtils.ts";

import { initFlowSystem } from "./modules/flows/initFlowSystem.ts";

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<"home" | "canvas">("home");
  const [currentGraph, setCurrentGraph] = useState<CanvasState | null>(null);
  const [currentAgent, setCurrentAgent] = useState<AgentState | null>(null);
  const [currentProject, setCurrentProject] = useState<ProjectState | null>(null);
  const [projectType, setProjectType] = useState<"flows" | "agents" | "projects">("flows");
  const { i18n } = useTranslation();
  
  
  // Setup language direction based on current language
  useEffect(() => {
    initFlowSystem()
    document.documentElement.dir = i18n.language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = i18n.language;
  }, [i18n.language]);
  
  // Handle creating a new graph, agent, or project
  const handleCreateNew = (type: "flows" | "agents" | "projects" = "flows") => {
    setProjectType(type);
    
    if (type === "flows") {
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
      setCurrentAgent(null);
      setCurrentProject(null);
    } else if (type === "agents") {
      // Generate a unique ID for the new agent
      const newAgentId = `agent-${Date.now()}`;
      const agentState: AgentState = {
        agentId: newAgentId,
        agentName: null,
        nextComponentId: 0
      };
      setCurrentAgent(agentState);
      setCurrentGraph(null);
      setCurrentProject(null);
    } else if (type === "projects") {
      // Generate a unique ID for the new project
      const newProjectId = `project-${Date.now()}`;
      const projectState: ProjectState = {
        projectId: newProjectId,
        projectName: null,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        flows: [],
        agents: []
      };
      setCurrentProject(projectState);
      setCurrentGraph(null);
      setCurrentAgent(null);
    }
    
    setCurrentView("canvas");
  };
  
  // Handle opening a graph/agent/project from file system
  const handleLoadFromFile = async (type: "flows" | "agents" | "projects" = "flows") => {
    try {
      if (type === "flows") {
        const loadedState = await loadCanvasState();
        if (loadedState) {
          console.log('Loaded flow state:', loadedState);
          setCurrentGraph(loadedState.canvasState);
          setCurrentAgent(null);
          setCurrentProject(null);
          setProjectType("flows");
          setCurrentView("canvas");
        }
      } else if (type === "agents") {
        const loadedState = await loadAgentState();
        if (loadedState) {
          console.log('Loaded agent state:', loadedState);
          setCurrentAgent(loadedState.agentState);
          setCurrentGraph(null);
          setCurrentProject(null);
          setProjectType("agents");
          setCurrentView("canvas");
        }
      } else if (type === "projects") {
        const loadedState = await loadProjectState();
        if (loadedState) {
          console.log('Loaded project state:', loadedState);
          setCurrentProject(loadedState.projectState);
          setCurrentGraph(null);
          setCurrentAgent(null);
          setProjectType("projects");
          setCurrentView("canvas");
        }
      }
    } catch (error) {
      console.error(`Error loading ${type} state:`, error);
      alert(`Failed to load ${type} state: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  const handleOpenFromPath = async (path: string, id: string, type: "flows" | "agents" | "projects" = "flows") => {
    if (type === "flows") {
      const loadedState = await loadCanvasStateFromPath(path, id);
      if (loadedState) {
        console.log('Loaded flow state:', loadedState);
        setCurrentGraph(loadedState);
        setCurrentAgent(null);
        setCurrentProject(null);
        setProjectType("flows");
        setCurrentView("canvas");
      }
    } else if (type === "agents") {
      const loadedState = await loadAgentStateFromPath(path, id);
      if (loadedState) {
        console.log('Loaded agent state:', loadedState);
        setCurrentAgent(loadedState);
        setCurrentGraph(null);
        setCurrentProject(null);
        setProjectType("agents");
        setCurrentView("canvas");
      }
    } else if (type === "projects") {
      const loadedState = await loadProjectStateFromPath(path, id);
      if (loadedState) {
        console.log('Loaded project state:', loadedState);
        setCurrentProject(loadedState);
        setCurrentGraph(null);
        setCurrentAgent(null);
        setProjectType("projects");
        setCurrentView("canvas");
      }
    }
  };
  
  // Handle returning to home screen
  const handleReturnToHome = () => {
    setCurrentGraph(null);
    setCurrentAgent(null);
    setCurrentProject(null);
    setCurrentView("home");
  };
  
  return (
    <div className="app-container">
      {currentView === "home" ? (
        <HomeScreen 
          onCreateNew={(type) => handleCreateNew(type)}
          onOpenFromFile={(type) => handleLoadFromFile(type)}
          onOpenFromPath={(path, id, type) => handleOpenFromPath(path, id, type)}
        />  
      ) : (
        <>
          {projectType === "flows" && currentGraph && (
            <NodeCanvas 
              graph={currentGraph}
              onReturnToHome={handleReturnToHome}
            />
          )}
          {projectType === "agents" && currentAgent && (
            <AgentCanvas 
              agent={currentAgent}
              onReturnToHome={handleReturnToHome}
            />
          )}
          {projectType === "projects" && currentProject && (
            <ProjectCanvas 
              project={currentProject}
              onReturnToHome={handleReturnToHome}
            />
          )}
        </>
      )}
    </div>
  );
};

export default App;
