import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { X, Search, Clock } from "lucide-react";
import i18n from "../../../i18n/i18n";

interface AgentData {
  id: string;
  path: string;
  name: string;
  lastModified: Date;
}

interface AllAgentsDialogProps {
  isOpen: boolean;
  agents: AgentData[];
  onClose: () => void;
  onOpenAgent: (path: string, id: string) => void;
}

const AllAgentsDialog: React.FC<AllAgentsDialogProps> = ({ isOpen, agents, onClose, onOpenAgent }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredAgents, setFilteredAgents] = useState<AgentData[]>(agents);
  const { t } = useTranslation();
  
  // Update filtered agents when search term or agents change
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredAgents(agents);
      return;
    }
    
    const searchTermLower = searchTerm.toLowerCase();
    const filtered = agents.filter(agent => 
      agent.name.toLowerCase().includes(searchTermLower) || 
      agent.id.toLowerCase().includes(searchTermLower) ||
      agent.path.toLowerCase().includes(searchTermLower)
    );
    
    setFilteredAgents(filtered);
  }, [searchTerm, agents]);
  
  // Reset search when dialog opens
  useEffect(() => {
    if (isOpen) {
      setSearchTerm("");
    }
  }, [isOpen]);
  
  // Format date to a readable format
  const formatDate = (date: Date) => {
    return date.toLocaleDateString([], { year: 'numeric', month: 'short', day: 'numeric' }) + 
           ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  // Format name to remove .json extension
  const formatName = (name: string) => {
    return name.replace(/\.json$/i, '');
  };
  
  // Handle escape key to close dialog
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }
  }, [onClose, isOpen]);
  
  // Handler for clicking outside to close
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };
  
  if (!isOpen) return null;
  
  return (
    <div 
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      onClick={handleBackdropClick}
    >
      <div className="bg-[#1f2937] rounded-lg shadow-xl p-6 w-full max-w-4xl max-h-[80vh] border border-gray-700 overflow-hidden flex flex-col">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white font-mono">
            {t('agents.allAgents.title', 'All Recent Agents')}
          </h2>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-white"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>
        
        {/* Search input */}
        <div className="relative mb-6">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search size={16} className="text-gray-400" />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={t('agents.allAgents.search', 'Search agents...')}
            className="w-full bg-[#111827] border border-gray-600 rounded px-10 py-2 text-white focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent font-mono"
            autoFocus
          />
          {searchTerm && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
              <button
                onClick={() => setSearchTerm("")}
                className="text-gray-400 hover:text-white"
                aria-label="Clear search"
              >
                <X size={14} />
              </button>
            </div>
          )}
        </div>
        
        {/* Agents list */}
        <div className="overflow-y-auto flex-grow" style={{ direction: 'ltr' }}>
          {filteredAgents.length === 0 ? (
            <div className="text-gray-400 text-center py-10 font-mono">
              {searchTerm 
                ? t('agents.allAgents.noResults', 'No agents found matching your search.')
                : t('agents.allAgents.noAgents', 'No recent agents available.')}
            </div>
          ) : (
            <table className="w-full border-collapse">
              <thead>
                <tr className="text-left border-b border-gray-700">
                  <th className="pb-2 pl-4 pr-2 text-gray-400 font-mono">
                    {t('agents.allAgents.nameColumn', 'Name')}
                  </th>
                  <th className="pb-2 px-2 text-gray-400 font-mono">
                    {t('agents.allAgents.idColumn', 'ID')}
                  </th>
                  <th className="pb-2 px-2 text-gray-400 font-mono">
                    {t('agents.allAgents.pathColumn', 'Path')}
                  </th>
                  <th className="pb-2 px-2 text-gray-400 font-mono">
                    {t('agents.allAgents.dateColumn', 'Last Modified')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredAgents.map((agent) => (
                  <tr 
                    key={agent.id}
                    onClick={() => onOpenAgent(agent.path, agent.id)}
                    className="border-b border-gray-800 hover:bg-[#2d3748] transition-colors cursor-pointer"
                  >
                    <td className="py-3 pl-4 pr-2 text-white font-mono">{formatName(agent.name)}</td>
                    <td className="py-3 px-2 text-gray-300 font-mono">{agent.id}</td>
                    <td className="py-3 px-2 text-gray-300 font-mono truncate max-w-[200px]">{agent.path}</td>
                    <td className="py-3 px-2 text-gray-300 font-mono">
                      <div className="flex items-center" style={{ direction: i18n.language === 'ar' ? 'rtl' : 'ltr' }}>
                        <Clock className="h-3 w-3 text-gray-500 mr-1" />
                        <span>{formatDate(agent.lastModified)}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default AllAgentsDialog; 