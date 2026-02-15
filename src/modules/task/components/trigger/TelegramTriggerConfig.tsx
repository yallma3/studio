import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Copy, 
  Check, 
  ExternalLink, 
  MessageCircle, 
  AlertCircle,
  ChevronRight 
} from 'lucide-react';
import { Trigger, TelegramTrigger, TelegramUpdateType } from '../../types/types';

interface TelegramTriggerConfigProps {
  onSave: (trigger: Trigger) => void;
  onBack: () => void;
  existingTrigger?: Trigger | null;
}

// Bot info type definition
type TelegramBotInfo = {
  id: number;
  username: string;
  first_name: string;
  can_join_groups: boolean;
  can_read_all_group_messages: boolean;
};

// Event type metadata matching n8n
const updateTypeOptions: {
  value: TelegramUpdateType;
  label: string;
  description: string;
  common: boolean;
}[] = [
  {
    value: 'message',
    label: 'On message',
    description: 'New messages sent to the bot',
    common: true
  },
  {
    value: 'callback_query',
    label: 'On callback query',
    description: 'Inline keyboard button clicks',
    common: true
  },
  {
    value: 'inline_query',
    label: 'On inline query',
    description: 'When someone uses @botname in inline mode',
    common: false
  },
  {
    value: 'edited_message',
    label: 'On edited message',
    description: 'When a user edits their message',
    common: false
  },
  {
    value: 'channel_post',
    label: 'On channel post',
    description: 'New posts in channels the bot is admin of',
    common: false
  },
  {
    value: 'edited_channel_post',
    label: 'On edited channel post',
    description: 'Edited posts in channels',
    common: false
  },
  {
    value: 'poll',
    label: 'On poll change',
    description: 'Poll state updates',
    common: false
  },
  {
    value: 'pre_checkout_query',
    label: 'On pre checkout query',
    description: 'Payment pre-checkout events',
    common: false
  },
  {
    value: 'shipping_query',
    label: 'On shipping query',
    description: 'Shipping query for payments',
    common: false
  }
];

const TelegramTriggerConfig: React.FC<TelegramTriggerConfigProps> = ({
  onSave,
  onBack,
  existingTrigger
}) => {
  const [botToken, setBotToken] = useState('');
  const [updateTypes, setUpdateTypes] = useState<TelegramUpdateType[]>(['message']);
  const [filterChatId, setFilterChatId] = useState('');
  const [filterChatType, setFilterChatType] = useState<'private' | 'group' | 'supergroup' | 'channel' | ''>('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  
  // Registration state
  const [webhookUrl, setWebhookUrl] = useState('');
  const [botInfo, setBotInfo] = useState<TelegramBotInfo | undefined>(undefined);
  const [copiedUrl, setCopiedUrl] = useState(false);

  useEffect(() => {
    if (existingTrigger && existingTrigger.type === 'telegram') {
      setBotToken(existingTrigger.config.botToken || '');
      setUpdateTypes(existingTrigger.config.updateTypes || ['message']);
      setFilterChatId(existingTrigger.config.filterChatId || '');
      setFilterChatType(existingTrigger.config.filterChatType || '');
      setWebhookUrl(existingTrigger.config.webhookUrl || '');
      setBotInfo(existingTrigger.config.botInfo || undefined);
    }
  }, [existingTrigger]);

  const toggleUpdateType = (type: TelegramUpdateType) => {
    setUpdateTypes(prev =>
      prev.includes(type)
        ? prev.filter(t => t !== type)
        : [...prev, type]
    );
  };

  const handleSelectAll = () => {
    setUpdateTypes(updateTypeOptions.map(opt => opt.value));
  };

  const handleSelectCommon = () => {
    setUpdateTypes(updateTypeOptions.filter(opt => opt.common).map(opt => opt.value));
  };

  const handleClearAll = () => {
    setUpdateTypes([]);
  };

  const handleCopyUrl = async () => {
    if (!webhookUrl) return;
    await navigator.clipboard.writeText(webhookUrl);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  const handleSave = () => {
    const trigger: TelegramTrigger = {
      id: existingTrigger?.id || `trigger-${Date.now()}`,
      type: 'telegram',
      enabled: true,
      createdAt: existingTrigger?.createdAt || Date.now(),
      updatedAt: Date.now(),
      config: {
        botToken: botToken.trim(),
        updateTypes,
        webhookUrl,
        filterChatId: filterChatId || undefined,
        filterChatType: filterChatType || undefined,
        botInfo
      }
    };

    onSave(trigger);
  };

  const isValid = Boolean(
    botToken && 
    botToken.includes(':') && 
    updateTypes.length > 0
  );

  // Group options by common/advanced
  const commonOptions = updateTypeOptions.filter(opt => opt.common);
  const advancedOptions = updateTypeOptions.filter(opt => !opt.common);

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <button 
        onClick={onBack} 
        className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors"
      >
        <ArrowLeft size={18} />
        <span className="text-sm">Back to trigger selection</span>
      </button>

      {/* Info Banner */}
      <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <MessageCircle className="text-blue-400 flex-shrink-0 mt-0.5" size={20} />
          <div>
            <h4 className="text-blue-400 font-medium mb-1">📱 Telegram Bot Trigger</h4>
            <p className="text-sm text-zinc-300 leading-relaxed mb-2">
              Your workspace will execute when your Telegram bot receives selected update types.
            </p>
            <a 
              href="https://t.me/BotFather" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-300 text-sm flex items-center gap-1"
            >
              Create a bot with @BotFather <ExternalLink size={14} />
            </a>
          </div>
        </div>
      </div>

      {/* Bot Token Input */}
      <div>
        <label className="block text-sm font-medium text-zinc-300 mb-2">
          Bot Token <span className="text-red-400">*</span>
        </label>
        <p className="text-xs text-zinc-500 mb-3">
          Get your bot token from <a href="https://t.me/BotFather" target="_blank" className="text-blue-400 hover:underline">@BotFather</a> by sending /newbot
        </p>
        <input
          type="text"
          value={botToken}
          onChange={(e) => setBotToken(e.target.value)}
          placeholder="123456789:ABCdefGHIjklMNOpqrsTUVwxyz"
          className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white font-mono text-sm focus:outline-none focus:border-yellow-500/50"
        />
      </div>

      {/* Bot Info Display (After Registration) */}
      {botInfo && (
        <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Check className="text-green-400 flex-shrink-0 mt-0.5" size={20} />
            <div className="flex-1">
              <h4 className="text-green-400 font-medium mb-2">✅ Bot Connected</h4>
              <div className="grid grid-cols-2 gap-2 text-sm text-zinc-300">
                <div>
                  <span className="text-zinc-500">Username:</span>{' '}
                  <span className="font-mono text-green-400">@{botInfo.username}</span>
                </div>
                <div>
                  <span className="text-zinc-500">Name:</span> {botInfo.first_name}
                </div>
                <div>
                  <span className="text-zinc-500">Bot ID:</span>{' '}
                  <span className="font-mono">{botInfo.id}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Update Types Selection */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <label className="text-sm font-medium text-zinc-300">
            Trigger On <span className="text-red-400">*</span>
          </label>
          <div className="flex gap-2 text-xs">
            <button
              type="button"
              onClick={handleSelectCommon}
              className="text-blue-400 hover:text-blue-300 transition-colors"
            >
              Select Common
            </button>
            <span className="text-zinc-600">|</span>
            <button
              type="button"
              onClick={handleSelectAll}
              className="text-blue-400 hover:text-blue-300 transition-colors"
            >
              Select All
            </button>
            <span className="text-zinc-600">|</span>
            <button
              type="button"
              onClick={handleClearAll}
              className="text-red-400 hover:text-red-300 transition-colors"
            >
              Clear
            </button>
          </div>
        </div>

        {/* Common Update Types */}
        <div className="space-y-2 mb-4">
          <p className="text-xs text-zinc-500 uppercase tracking-wide mb-2">Common Events</p>
          {commonOptions.map(option => (
            <label 
              key={option.value} 
              className="flex items-start gap-3 p-3 rounded-lg border border-zinc-700 hover:border-zinc-600 cursor-pointer transition-colors bg-zinc-800/50"
            >
              <input
                type="checkbox"
                checked={updateTypes.includes(option.value)}
                onChange={() => toggleUpdateType(option.value)}
                className="mt-0.5 w-4 h-4 rounded border-zinc-600 bg-zinc-700 text-yellow-500 focus:ring-yellow-500 focus:ring-offset-0"
              />
              <div className="flex-1">
                <div className="text-sm font-medium text-white">{option.label}</div>
                <div className="text-xs text-zinc-400 mt-0.5">{option.description}</div>
              </div>
            </label>
          ))}
        </div>

        {/* Advanced Update Types (Collapsible) */}
        <div>
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center gap-2 text-xs text-zinc-400 hover:text-white mb-2 transition-colors"
          >
            <ChevronRight 
              className={`transform transition-transform ${showAdvanced ? 'rotate-90' : ''}`} 
              size={14}
            />
            <span>Advanced Events ({advancedOptions.length})</span>
          </button>

          {showAdvanced && (
            <div className="space-y-2">
              {advancedOptions.map(option => (
                <label 
                  key={option.value} 
                  className="flex items-start gap-3 p-3 rounded-lg border border-zinc-700 hover:border-zinc-600 cursor-pointer transition-colors bg-zinc-800/50"
                >
                  <input
                    type="checkbox"
                    checked={updateTypes.includes(option.value)}
                    onChange={() => toggleUpdateType(option.value)}
                    className="mt-0.5 w-4 h-4 rounded border-zinc-600 bg-zinc-700 text-yellow-500 focus:ring-yellow-500 focus:ring-offset-0"
                  />
                  <div className="flex-1">
                    <div className="text-sm font-medium text-white">{option.label}</div>
                    <div className="text-xs text-zinc-400 mt-0.5">{option.description}</div>
                  </div>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Selection Summary */}
        {updateTypes.length > 0 && (
          <div className="mt-3 p-3 bg-blue-900/20 border border-blue-500/30 rounded-lg">
            <p className="text-sm text-blue-400">
              ✓ {updateTypes.length} event type{updateTypes.length !== 1 ? 's' : ''} selected
            </p>
          </div>
        )}
      </div>

      {/* Optional Filters */}
      <div className="space-y-4 pt-4 border-t border-zinc-700">
        <h4 className="text-sm font-medium text-zinc-300">
          Optional Filters <span className="text-zinc-500">(Advanced)</span>
        </h4>

        {/* Filter by Chat ID */}
        <div>
          <label className="block text-xs font-medium text-zinc-400 mb-2">
            Filter by Chat ID
          </label>
          <p className="text-xs text-zinc-500 mb-2">
            Only trigger for messages from a specific chat or user
          </p>
          <input
            type="text"
            value={filterChatId}
            onChange={(e) => setFilterChatId(e.target.value)}
            placeholder="123456789 or -1001234567890"
            className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white font-mono text-sm focus:outline-none focus:border-yellow-500/50"
          />
        </div>

        {/* Filter by Chat Type */}
        <div>
          <label className="block text-xs font-medium text-zinc-400 mb-2">
            Filter by Chat Type
          </label>
          <select
            value={filterChatType}
            onChange={(e) => setFilterChatType(e.target.value as typeof filterChatType)}
            className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm focus:outline-none focus:border-yellow-500/50"
          >
            <option value="">All chat types</option>
            <option value="private">Private chats only</option>
            <option value="group">Groups only</option>
            <option value="supergroup">Supergroups only</option>
            <option value="channel">Channels only</option>
          </select>
        </div>
      </div>

      {/* Webhook URL (After Registration) */}
      {webhookUrl && (
        <div className="pt-4 border-t border-zinc-700">
          <label className="block text-sm font-medium text-green-400 mb-2">
            ✅ Webhook Registered with Telegram
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={webhookUrl}
              readOnly
              className="flex-1 px-4 py-3 bg-zinc-900 border border-green-500/30 rounded-lg text-green-400 font-mono text-sm"
            />
            <button
              onClick={handleCopyUrl}
              className="px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              title="Copy webhook URL"
            >
              {copiedUrl ? <Check size={18} /> : <Copy size={18} />}
            </button>
          </div>
        </div>
      )}

      {/* Validation Warning */}
      {!isValid && (
        <div className="flex items-start gap-2 p-3 bg-yellow-900/20 border border-yellow-500/30 rounded-lg">
          <AlertCircle className="text-yellow-500 flex-shrink-0 mt-0.5" size={18} />
          <div className="text-sm text-yellow-400">
            {!botToken || !botToken.includes(':') 
              ? 'Please enter a valid bot token from @BotFather'
              : 'Please select at least one event type to trigger on'}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-4 border-t border-zinc-700">
        <button
          onClick={onBack}
          className="px-6 py-2.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={!isValid}
          className={`px-6 py-2.5 rounded-lg font-medium transition-colors ${
            isValid
              ? 'bg-yellow-500 hover:bg-yellow-600 text-black'
              : 'bg-zinc-700 text-zinc-500 cursor-not-allowed'
          }`}
        >
          {existingTrigger ? 'Update Telegram Trigger' : 'Register Telegram Bot'}
        </button>
      </div>
    </div>
  );
};

export default TelegramTriggerConfig;
