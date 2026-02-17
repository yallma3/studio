import React, { useState, useEffect } from "react";
import { ArrowLeft, AlertCircle, Clock } from "lucide-react";
import { Trigger } from "../../types/types";
import { createScheduledTrigger, getUserTimezone, CRON_PRESETS } from "../../utils/triggerHelpers";
import { CronExpressionParser } from 'cron-parser';
import cronstrue from 'cronstrue';

interface ScheduledTriggerConfigProps {
  onSave: (trigger: Trigger) => void;
  onBack: () => void;
  existingTrigger?: Trigger | null;
}

const ScheduledTriggerConfig: React.FC<ScheduledTriggerConfigProps> = ({
  onSave,
  onBack,
  existingTrigger,
}) => {
  const [cronExpression, setCronExpression] = useState("0 9 * * *"); // Default: Every day at 9 AM
  const [timezone, setTimezone] = useState(getUserTimezone());
  const [useCustom, setUseCustom] = useState(false);
  const [error, setError] = useState("");
  const [nextRuns, setNextRuns] = useState<Date[]>([]);

  // Load existing trigger if editing
  useEffect(() => {
    if (existingTrigger && existingTrigger.type === 'scheduled') {
      setCronExpression(existingTrigger.config.cronExpression);
      setTimezone(existingTrigger.config.timezone);
      
      // Check if it's a custom cron (not in presets)
      const isPreset = CRON_PRESETS.some(p => p.value === existingTrigger.config.cronExpression);
      setUseCustom(!isPreset);
    }
  }, [existingTrigger]);

  // Validate cron and calculate next runs
  useEffect(() => {
    try {
      const options = { 
        currentDate: new Date(),
        tz: timezone 
      };
      const interval = CronExpressionParser.parse(cronExpression, options);
      
      const runs: Date[] = [];
      for (let i = 0; i < 5; i++) {
        runs.push(interval.next().toDate());
      }
      setNextRuns(runs);
      setError("");
    } catch (err) {
       console.error("Cron validation error:", err);
      setError("Invalid cron expression");
      setNextRuns([]);
    }
  }, [cronExpression, timezone]);

  const handlePresetChange = (preset: string) => {
    setCronExpression(preset);
    setUseCustom(preset === 'custom');
  };

  const handleSave = () => {
    if (error) {
      return;
    }

    const existingScheduled = existingTrigger?.type === 'scheduled' ? existingTrigger : null;
    const trigger = createScheduledTrigger(
      cronExpression,
      timezone,
      undefined,
      existingScheduled?.id,
      existingScheduled?.createdAt
    );
    onSave(trigger);
  };

  const getCronDescription = () => {
    try {
      return cronstrue.toString(cronExpression);
    } catch {
      return "Invalid expression";
    }
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

      {/* Preset Selection */}
      <div>
        <label className="block text-sm font-medium text-white mb-2">
          Schedule Preset
        </label>
        <select
          value={useCustom ? 'custom' : cronExpression}
          onChange={(e) => handlePresetChange(e.target.value)}
          className="w-full bg-[#0a0a0a] border border-zinc-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-yellow-500/50"
        >
          {CRON_PRESETS.map((preset) => (
            <option key={preset.value} value={preset.value}>
              {preset.label} - {preset.description}
            </option>
          ))}
          <option value="custom">Custom cron expression</option>
        </select>
      </div>

      {/* Custom Cron Expression */}
      {useCustom && (
        <div>
          <label className="block text-sm font-medium text-white mb-2">
            Cron Expression
          </label>
          <input
            type="text"
            value={cronExpression}
            onChange={(e) => setCronExpression(e.target.value)}
            placeholder="* * * * *"
            className={`w-full bg-[#0a0a0a] border rounded-lg px-4 py-3 text-white placeholder-zinc-500 focus:outline-none ${
              error ? 'border-red-500' : 'border-zinc-700 focus:border-yellow-500/50'
            }`}
          />
          <p className="text-xs text-zinc-500 mt-2">
            Format: minute hour day month weekday (e.g., "0 9 * * *" = 9:00 AM daily)
          </p>
        </div>
      )}

      {/* Timezone */}
      <div>
        <label className="block text-sm font-medium text-white mb-2">
          Timezone
        </label>
        <select
          value={timezone}
          onChange={(e) => setTimezone(e.target.value)}
          className="w-full bg-[#0a0a0a] border border-zinc-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-yellow-500/50"
        >
          <option value={getUserTimezone()}>{getUserTimezone()} (Local)</option>
          <option value="UTC">UTC</option>
          <option value="America/New_York">America/New_York (EST/EDT)</option>
          <option value="America/Los_Angeles">America/Los_Angeles (PST/PDT)</option>
          <option value="Europe/London">Europe/London (GMT/BST)</option>
          <option value="Asia/Tokyo">Asia/Tokyo (JST)</option>
          <option value="Australia/Sydney">Australia/Sydney (AEST/AEDT)</option>
        </select>
      </div>

      {/* Error Message */}
      {error && (
        <div className="flex items-start gap-2 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
          <AlertCircle className="text-red-500 mt-0.5" size={18} />
          <div>
            <p className="text-red-500 font-medium">Invalid Configuration</p>
            <p className="text-red-400 text-sm mt-1">{error}</p>
          </div>
        </div>
      )}

      {/* Preview */}
      {!error && nextRuns.length > 0 && (
        <div className="bg-zinc-800/30 border border-zinc-700 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <Clock className="text-yellow-500" size={18} />
            <h4 className="text-white font-medium">Schedule Preview</h4>
          </div>
          
          <p className="text-zinc-300 text-sm mb-4">{getCronDescription()}</p>
          
          <div>
            <p className="text-zinc-400 text-sm font-medium mb-2">Next 5 runs:</p>
            <ul className="space-y-1">
              {nextRuns.map((run, idx) => (
                <li key={idx} className="text-zinc-400 text-sm font-mono">
                  {idx + 1}. {run.toLocaleString('en-US', {
                    weekday: 'short',
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    timeZoneName: 'short'
                  })}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

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
          disabled={!!error}
          className="px-6 py-2 bg-yellow-500 hover:bg-yellow-600 disabled:bg-zinc-700 disabled:text-zinc-500 text-black font-medium rounded-lg transition-colors flex items-center gap-2"
        >
          Continue
          <span className="text-sm">→</span>
        </button>
      </div>
    </div>
  );
};

export default ScheduledTriggerConfig;
