import React, { useEffect, useState } from "react";
import { Plus, FolderUp, Clock } from "lucide-react";
import { Button } from "./ui/button";
import { useTranslation } from "react-i18next";
import LanguageSelector from "./LanguageSelector";
import i18n from "../i18n/i18n";

interface AgentGraph {
  id: string;
  path: string;
  name: string;
  lastModified: Date;
}

interface HomeScreenProps {
  onCreateNew: () => void;
  onOpenFromFile: () => void;
  onOpenFromPath: (path: string, id: string) => void;
}

const HomeScreen: React.FC<HomeScreenProps> = ({ onCreateNew, onOpenFromFile, onOpenFromPath }) => {
  const [recentGraphs, setRecentGraphs] = useState<AgentGraph[]>([]);
  const { t } = useTranslation();
  
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
            path: "",
            name: `Untitled (${key.replace("agent-graph-", "")})`,
            lastModified: new Date()
          };
          
          try {
            const savedState = JSON.parse(localStorage.getItem(key) || "");
            graph = {
              id: key.replace("agent-graph-", ""),
              path: savedState.path,
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

  // Format date to a readable format
  const formatDate = (date: Date) => {
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return t('home.time.today', { time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) });
    } else if (diffDays === 1) {
      return t('home.time.yesterday', { time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) });
    } else if (diffDays < 7) {
      return t('home.time.daysAgo', { days: diffDays });
    } else {
      return date.toLocaleDateString([], { year: 'numeric', month: 'short', day: 'numeric' });
    }
  };

  // Format name to remove .json extension
  const formatName = (name: string) => {
    return name.replace(/\.json$/i, '');
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

      {/* Main Content */}
      <main className="container mx-auto px-4 flex flex-col items-center justify-center py-8 md:py-12 relative z-10">
        <div className="text-center max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 font-mono">
            {t('app.subtitle')}
          </h1>
          <p className="text-lg text-gray-300 mb-12 max-w-2xl mx-auto font-mono">
            {t('app.description')}
          </p>

          <div className="flex flex-col md:flex-row gap-4 max-w-xl mx-auto justify-center">
            <Button
              size="lg"
              onClick={onCreateNew}
              className="bg-yellow-400 hover:bg-yellow-500 text-black font-medium border-0 flex items-center justify-center gap-2 h-14 px-8 text-lg font-mono"
            >
              <Plus className="h-5 w-5" />
              {t('home.createNewGraph')}
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={onOpenFromFile}
              className="bg-transparent hover:bg-black/40 text-white border-gray-700 flex items-center justify-center gap-2 h-14 px-8 text-lg font-mono"
            >
              <FolderUp className="h-5 w-5" />
              {t('home.importGraph')}
            </Button>
          </div>
        </div>

        
          <div className="w-full max-w-6xl mt-24">
            <div className="flex items-center mb-6" style={{ direction: i18n.language === 'ar' ? 'rtl' : 'ltr' }}>
              <Clock className="h-5 w-5 text-gray-400 mr-2" />
              <h2 className="text-xl font-bold text-white font-mono">{t('home.recentGraphs')}</h2>
            </div>
            {recentGraphs.length === 0 ? (
                <div className="text-gray-400 text-sm font-mono w-full text-center">{t('home.noRecentGraphs')}</div>
            ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {recentGraphs.slice(0, 4).map((graph) => (
                <div 
                  key={graph.id} 
                  onClick={() => onOpenFromPath(graph.path, graph.id)}
                  className="bg-[#111827] hover:bg-[#1a2234] border border-gray-800 rounded-md p-4 transition-colors cursor-pointer"
                >
                  <h3 className="text-white font-mono mb-1 truncate">{formatName(graph.name)}</h3>
                  <p className="text-gray-400 text-xs font-mono truncate mb-3">{graph.id}</p>
                  <p title={graph.path} className="text-gray-400 text-sm font-mono truncate mb-3">{graph.path}</p>
                  <div className="flex items-center" style={{ direction: i18n.language === 'ar' ? 'rtl' : 'ltr' }}>
                    <Clock className="h-3 w-3 text-gray-500 mr-1" />
                    <span className="text-gray-500 text-xs font-mono">{formatDate(graph.lastModified)}</span>
                  </div>
                </div>
              ))}
            </div>
            )}
          </div>
      </main>
    </div>
  );
};

export default HomeScreen; 