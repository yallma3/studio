import React, { useEffect, useState } from "react";
import { Plus, FolderUp, Clock, ChevronRight } from "lucide-react";
import { Button } from "../../../components/ui/button";
import { useTranslation } from "react-i18next";
import i18n from "../../../i18n/i18n";
import { loadRecentAgents } from "../utils/storageUtils.ts";
import AllAgentsDialog from "./AllAgentsDialog.tsx";

interface AgentData {
  id: string;
  path: string;
  name: string;
  lastModified: Date;
}

interface AgentsTabProps {
  onCreateNew: () => void;
  onOpenFromFile: () => void;
  onOpenFromPath: (path: string, id: string) => void;
}

const AgentsTab: React.FC<AgentsTabProps> = ({ onCreateNew, onOpenFromFile, onOpenFromPath }) => {
  const [recentAgents, setRecentAgents] = useState<AgentData[]>([]);
  const [allAgentsDialogOpen, setAllAgentsDialogOpen] = useState(false);
  const { t } = useTranslation();
  
  useEffect(() => {
    loadRecentAgents().then((agents) => {
      if (agents && agents.length > 0) {
        setRecentAgents(agents.map((agent) => ({
          id: agent.id,
          path: agent.path,
          name: agent.name,
          lastModified: new Date(agent.lastModified)
        })));
      }
    });
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
    <div className="container mx-auto px-4 flex flex-col items-center justify-center py-8 md:py-12 relative z-10">
      <div className="text-center max-w-4xl mx-auto">
        <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 font-mono">
          {t('agents.title', 'Agents')}
        </h1>
        <p className="text-lg text-gray-300 mb-12 max-w-2xl mx-auto font-mono">
          {t('agents.description', 'Create, customize and deploy your AI agents')}
        </p>

        <div className="flex flex-col md:flex-row gap-4 max-w-xl mx-auto justify-center">
          <Button
            size="lg"
            onClick={onCreateNew}
            className="bg-yellow-400 hover:bg-yellow-500 text-black font-medium border-0 flex items-center justify-center gap-2 h-14 px-8 text-lg font-mono"
          >
            <Plus className="h-5 w-5" />
            {t('agents.createNew', 'Create New Agent')}
          </Button>
          <Button
            variant="outline"
            size="lg"
            onClick={onOpenFromFile}
            className="bg-transparent hover:bg-black/40 text-white border-gray-700 flex items-center justify-center gap-2 h-14 px-8 text-lg font-mono"
          >
            <FolderUp className="h-5 w-5" />
            {t('agents.import', 'Import Agent')}
          </Button>
        </div>
      </div>
      
      <div className="w-full max-w-6xl mt-24">
        <div className="flex items-center justify-between mb-6" style={{ direction: i18n.language === 'ar' ? 'rtl' : 'ltr' }}>
          <div className="flex items-center">
            <Clock className="h-5 w-5 text-gray-400 mr-2" />
            <h2 className="text-xl font-bold text-white font-mono">{t('agents.recentAgents', 'Recent Agents')}</h2>
          </div>
          {recentAgents.length >= 4 && (
            <button
              onClick={() => setAllAgentsDialogOpen(true)}
              className="text-gray-400 hover:text-yellow-400 text-sm font-mono flex items-center transition-colors"
            >
              {t('home.viewAll')}
              <ChevronRight className="h-3 w-3 m-1" style={i18n.language === 'ar' ? { transform: 'rotate(180deg)', translate: '0 2px' } : {}} />
            </button>
          )}
        </div>
        {recentAgents.length === 0 ? (
          <div className="text-gray-400 text-center font-mono">
            {t('agents.noAgents', 'No agents yet. Create a new agent to get started.')}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {recentAgents.slice(0, 4).map((agent) => (
              <div 
                key={agent.id} 
                onClick={() => onOpenFromPath(agent.path, agent.id)}
                className="bg-[#111827] hover:bg-[#1a2234] border border-gray-800 rounded-md p-4 transition-colors cursor-pointer"
              >
                <h3 className="text-white font-mono mb-1 truncate">{formatName(agent.name)}</h3>
                <p className="text-gray-400 text-xs font-mono truncate mb-3">{agent.id}</p>
                <p title={agent.path} className="text-gray-400 text-sm font-mono truncate mb-3">{agent.path}</p>
                <div className="flex items-center" style={{ direction: i18n.language === 'ar' ? 'rtl' : 'ltr' }}>
                  <Clock className="h-3 w-3 text-gray-500 mr-1" />
                  <span className="text-gray-500 text-xs font-mono">{formatDate(agent.lastModified)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* All Agents Dialog */}
      {allAgentsDialogOpen && (
        <AllAgentsDialog
          isOpen={allAgentsDialogOpen}
          agents={recentAgents}
          onClose={() => setAllAgentsDialogOpen(false)}
          onOpenAgent={onOpenFromPath}
        />
      )}
    </div>
  );
};

export default AgentsTab; 