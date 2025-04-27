import React from "react";

interface TabsProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  tabs: { id: string; label: string }[];
}

const Tabs: React.FC<TabsProps> = ({ activeTab, onTabChange, tabs }) => {
  return (
    <div className="flex border-b border-gray-800">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`py-3 px-6 font-medium text-base transition-colors font-mono relative ${
            activeTab === tab.id
              ? "text-yellow-400"
              : "text-gray-400 hover:text-white"
          }`}
        >
          {tab.label}
          {activeTab === tab.id && (
            <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-yellow-400"></div>
          )}
        </button>
      ))}
    </div>
  );
};

export default Tabs; 