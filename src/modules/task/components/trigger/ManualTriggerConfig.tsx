import React, { useState, useEffect } from "react";
import { ArrowLeft, Play, Info, CheckCircle } from "lucide-react";
import { Trigger } from "../../types/types";
import { createManualTrigger } from "../../utils/triggerHelpers";

interface ManualTriggerConfigProps {
  onSave: (trigger: Trigger) => void;
  onBack: () => void;
  existingTrigger?: Trigger | null;
}

const ManualTriggerConfig: React.FC<ManualTriggerConfigProps> = ({
  onSave,
  onBack,
  existingTrigger,
}) => {
  const [description, setDescription] = useState("");

  // Load existing trigger if editing
  useEffect(() => {
    if (existingTrigger && existingTrigger.type === 'manual') {
      setDescription(existingTrigger.config.description || "");
    }
  }, [existingTrigger]);

  const handleSave = () => {
   const trigger = createManualTrigger(description);
    if (existingTrigger) {
        trigger.id = existingTrigger.id;
        trigger.createdAt = existingTrigger.createdAt;
      }
    onSave(trigger);
  };

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors"
      >
        <ArrowLeft size={16} />
        <span>Back to trigger selection</span>
      </button>

      {/* Info Box */}
      <div className="flex items-start gap-3 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
        <Info className="text-blue-500 mt-0.5 flex-shrink-0" size={18} />
        <div>
          <p className="text-blue-400 font-medium">Manual Trigger</p>
          <p className="text-blue-300/80 text-sm mt-1">
            This workspace will run only when you manually click the "Run" button.
            No automatic scheduling or webhooks will trigger it.
          </p>
        </div>
      </div>

      {/* Description (Optional) */}
      <div>
        <label className="block text-sm font-medium text-white mb-2">
          Description (Optional)
        </label>
        <input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="e.g., Run this workflow on demand for specific tasks"
          className="w-full bg-[#0a0a0a] border border-zinc-700 rounded-lg px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-yellow-500/50"
        />
        <p className="text-xs text-zinc-500 mt-2">
          Add a note to help you remember when to run this workflow manually
        </p>
      </div>

      {/* Preview */}
      <div className="bg-zinc-800/30 border border-zinc-700 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-3">
          <Play className="text-yellow-500" size={18} />
          <h4 className="text-white font-medium">Trigger Preview</h4>
        </div>
        
        <div className="space-y-2">
          <div className="flex items-start gap-2">
            <CheckCircle className="text-green-500 mt-0.5 flex-shrink-0" size={16} />
            <p className="text-zinc-300 text-sm">
              This workspace will execute when you click the Run button.
            </p>
          </div>
          
          {description && (
            <div className="flex items-start gap-2 mt-3 pt-3 border-t border-zinc-700">
              <div className="w-1 h-1 rounded-full bg-yellow-500 mt-2 flex-shrink-0" />
              <p className="text-zinc-400 text-sm italic">
                "{description}"
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-4 border-t border-zinc-700">
        <button
          onClick={onBack}
          className="px-6 py-2 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-700/50 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          className="px-6 py-2 bg-yellow-500 hover:bg-yellow-600 text-black font-medium rounded-lg transition-colors flex items-center gap-2"
        >
          Continue
          <span className="text-sm">→</span>
        </button>
      </div>
    </div>
  );
};

export default ManualTriggerConfig;
