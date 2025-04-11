import React, { useState, useEffect } from "react";
import { Plus, FolderOpen, FileText } from "lucide-react";


interface AgentGraph {
  id: string;
  name: string;
  lastModified: Date;
}

interface HomeScreenProps {
  onCreateNew: () => void;
  onOpenExisting: (graphId: string) => void;
}

const HomeScreen: React.FC<HomeScreenProps> = ({ onCreateNew, onOpenExisting }) => {
  const [recentGraphs, setRecentGraphs] = useState<AgentGraph[]>([]);
  
  useEffect(() => {
    // Load recent graphs from localStorage
    const loadRecentGraphs = () => {
      try {
        const savedGraphKeys = Object.keys(localStorage).filter(key => 
          key.startsWith("agent-graph-")
        );
        
        const graphs: AgentGraph[] = savedGraphKeys.map(key => {
          // Default values
          let graph: AgentGraph = {
            id: key.replace("agent-graph-", ""),
            name: `Untitled (${key.replace("agent-graph-", "")})`,
            lastModified: new Date()
          };
          
          try {
            const savedState = JSON.parse(localStorage.getItem(key) || "");
            graph = {
              id: key.replace("agent-graph-", ""),
              name: savedState.name || graph.name,
              lastModified: new Date(savedState.lastModified || Date.now())
            };
          } catch {
            // Use default values on error
          }
          
          return graph;
        });
        
        // Sort by most recently modified
        graphs.sort((a, b) => b.lastModified.getTime() - a.lastModified.getTime());
        setRecentGraphs(graphs);
      } catch (error) {
        console.error("Error loading recent graphs:", error);
        setRecentGraphs([]);
      }
    };
    
    loadRecentGraphs();
  }, []);

  return (
    <div className="flex flex-col items-center justify-start p-12 min-h-screen bg-gray-900 text-gray-100 font-sans">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-primary to-primary-400 bg-clip-text text-transparent">
          Agent Graph Studio
        </h1>
        <p className="text-lg opacity-80">Create, edit, and execute agent workflows</p>
      </div>
      
      <div className="flex gap-6 mb-16 md:flex-row flex-col">
        <button 
          className="flex items-center justify-center gap-2 bg-gray-800 border border-gray-700 text-gray-100 py-3 px-6 rounded-lg text-base font-medium cursor-pointer transition-all duration-200 hover:bg-gray-700 hover:-translate-y-1 hover:shadow-lg hover:shadow-black/20 focus:outline-none focus:ring-2 focus:ring-primary"
          onClick={onCreateNew}
        >
          <Plus size={24} className="text-primary" />
          <span>Create New Graph</span>
        </button>
        
        <label className="flex items-center justify-center gap-2 bg-gray-800 border border-gray-700 text-gray-100 py-3 px-6 rounded-lg text-base font-medium cursor-pointer transition-all duration-200 hover:bg-gray-700 hover:-translate-y-1 hover:shadow-lg hover:shadow-black/20 focus:outline-none focus:ring-2 focus:ring-primary">
          <input
            type="file"
            accept=".json"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                const reader = new FileReader();
                reader.onload = (event) => {
                  try {
                    const graphData = JSON.parse(event.target?.result as string);
                    // Generate a unique ID for the imported graph
                    const importId = `imported-${Date.now()}`;
                    localStorage.setItem(`agent-graph-${importId}`, JSON.stringify({
                      ...graphData,
                      lastModified: Date.now()
                    }));
                    onOpenExisting(importId);
                  } catch (error) {
                    console.error("Error parsing imported file:", error);
                    alert("Invalid graph file format.");
                  }
                };
                reader.readAsText(file);
              }
            }}
          />
          <FolderOpen size={24} className="text-primary" />
          <span>Import Graph</span>
        </label>
      </div>
      
      {recentGraphs.length > 0 && (
        <div className="w-full max-w-5xl">
          <h2 className="text-2xl mb-6 pb-2 border-b border-gray-700">Recent Graphs</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {recentGraphs.map((graph) => (
              <div 
                key={graph.id} 
                className="bg-gray-800 border border-gray-700 rounded-lg p-4 flex items-center gap-4 cursor-pointer transition-all duration-200 hover:bg-gray-700 hover:-translate-y-1 hover:shadow-lg hover:shadow-black/20"
                onClick={() => onOpenExisting(graph.id)}
              >
                <FileText size={20} className="text-primary" />
                <div className="flex-1">
                  <h3 className="m-0 mb-2 text-lg">{graph.name}</h3>
                  <p className="m-0 text-sm opacity-60">Last modified: {graph.lastModified.toLocaleDateString()}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default HomeScreen; 