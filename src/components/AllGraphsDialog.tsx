import React from "react";
import { useTranslation } from "react-i18next";
import { Clock, X } from "lucide-react";
import i18n from "../i18n/i18n";

interface AgentGraph {
  id: string;
  path: string;
  name: string;
  lastModified: Date;
}

interface AllGraphsDialogProps {
  isOpen: boolean;
  graphs: AgentGraph[];
  onClose: () => void;
  onOpenGraph: (path: string, id: string) => void;
}

const AllGraphsDialog: React.FC<AllGraphsDialogProps> = ({
  isOpen,
  graphs,
  onClose,
  onOpenGraph,
}) => {
  const { t } = useTranslation();

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

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-fade-in overflow-hidden"
      style={{ direction: i18n.language === 'ar' ? 'rtl' : 'ltr' }}
      onClick={onClose}
    >
      <div 
        className="bg-[#111] border border-[#FFB30055] rounded-md w-full max-w-5xl h-[600px] p-6 shadow-xl animate-slide-up flex flex-col m-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-800">
          <h2 className="text-xl font-semibold text-white font-mono flex gap-3 items-center">
            {t('home.allGraphs')}
            <span className="px-2 py-0.5 text-xs bg-gray-800 rounded-full text-gray-300">
              {graphs.length} {graphs.length === 1 ? t('dialog.graphSingular') : t('dialog.graphPlural')}
            </span>
          </h2>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-white p-1 rounded-full hover:bg-gray-800 transition-colors"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="overflow-y-auto flex-grow pr-2" style={{
          scrollbarWidth: 'thin',
          scrollbarColor: '#FFC72C transparent',
        }}>
          <style dangerouslySetInnerHTML={{ __html: `
            .custom-scrollbar::-webkit-scrollbar {
              width: 4px;
            }
            .custom-scrollbar::-webkit-scrollbar-track {
              background: transparent;
            }
            .custom-scrollbar::-webkit-scrollbar-thumb {
              background-color: #FFC72C;
              border-radius: 4px;
            }
            .custom-scrollbar::-webkit-scrollbar-thumb:hover {
              background-color: #FFD75C;
            }
          `}} />
          <div className="h-full custom-scrollbar overflow-y-auto">
            {graphs.length === 0 ? (
              <div className="text-gray-400 text-sm font-mono w-full text-center p-6">
                {t('home.noRecentGraphs')}
              </div>
            ) : (
              <div className="flex flex-col">
                <div className="grid grid-cols-12 gap-2 py-2 px-3 text-xs text-gray-500 font-mono border-b border-gray-800 sticky top-0 bg-[#111] z-10">
                  <div className="col-span-4 md:col-span-3">{t('dialog.graphName')}</div>
                  <div className="col-span-5 md:col-span-6 hidden md:block">{t('dialog.graphPath')}</div>
                  <div className="col-span-3 text-right">{t('dialog.lastModified')}</div>
                </div>
                
                {graphs.map((graph) => (
                  <div 
                    key={graph.id} 
                    onClick={() => {
                      onOpenGraph(graph.path, graph.id);
                      onClose(); // Close the dialog after selecting a graph
                    }}
                    className={`grid grid-cols-12 gap-2 py-3 px-3 hover:bg-[#1a2234] border-b border-gray-800 transition-colors cursor-pointer ${i18n.language === 'ar' ? 'hover:border-r-2 hover:border-r-yellow-400 pr-[10px] hover:pr-2' : 'hover:border-l-2 hover:border-l-yellow-400 pl-[10px] hover:pl-2'}`}
                  >
                    <div className="col-span-4 md:col-span-3">
                      <div className="flex items-center">
                        <div className="mr-2 w-2 h-2 rounded-full bg-[#FFC72C] shadow-[0_0_10px_rgba(255,199,44,0.5)]"></div>
                        <div className="min-w-0 w-full">
                          <h3 className="text-white font-mono truncate max-w-full">{formatName(graph.name)}</h3>
                          <p className="text-gray-400 text-xs font-mono truncate md:hidden">{graph.id}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="col-span-5 md:col-span-6 hidden md:block min-w-0">
                      <div className="max-w-full overflow-hidden">
                        <p title={graph.path} className="text-gray-400 text-sm font-mono truncate">{graph.path}</p>
                        <p className="text-gray-500 text-xs font-mono truncate">{graph.id}</p>
                      </div>
                    </div>
                    
                    <div className="col-span-8 md:col-span-3 text-right flex justify-end items-center min-w-0">
                      <div className="flex items-center ml-auto whitespace-nowrap" style={{ direction: i18n.language === 'ar' ? 'rtl' : 'ltr' }}>
                        <Clock className="h-3 w-3 text-gray-500 mr-1 flex-shrink-0" />
                        <span className="text-gray-500 text-xs font-mono truncate">{formatDate(graph.lastModified)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AllGraphsDialog; 