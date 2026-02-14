import React from "react";
import { LucideIcon } from "lucide-react";

interface TriggerCardProps {
  trigger: {
    id: string;
    name: string;
    description: string;
    icon: LucideIcon;
    category: string;
    available: boolean;
  };
  onSelect: () => void;
}

const TriggerCard: React.FC<TriggerCardProps> = ({ trigger, onSelect }) => {
  const Icon = trigger.icon;

  return (
    <button
      onClick={trigger.available ? onSelect : undefined}
      disabled={!trigger.available}
      className={`
        relative p-6 rounded-lg border text-left transition-all
        ${trigger.available
          ? 'bg-zinc-800/50 border-zinc-700 hover:border-yellow-500/50 hover:bg-zinc-800 cursor-pointer group'
          : 'bg-zinc-900/30 border-zinc-800 cursor-not-allowed opacity-50'
        }
      `}
    >
      {/* Icon */}
      <div className={`
        inline-flex p-3 rounded-lg mb-4
        ${trigger.available
          ? 'bg-yellow-500/10 text-yellow-500 group-hover:bg-yellow-500/20'
          : 'bg-zinc-800 text-zinc-600'
        }
      `}>
        <Icon size={24} />
      </div>

      {/* Content */}
      <h3 className="text-white font-semibold text-lg mb-2 flex items-center gap-2">
        {trigger.name}
        {!trigger.available && (
          <span className="text-xs font-normal bg-zinc-700 text-zinc-400 px-2 py-0.5 rounded">
            Coming Soon
          </span>
        )}
      </h3>
      <p className="text-zinc-400 text-sm leading-relaxed">
        {trigger.description}
      </p>

      {/* Hover indicator */}
      {trigger.available && (
        <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
        </div>
      )}
    </button>
  );
};

export default TriggerCard;