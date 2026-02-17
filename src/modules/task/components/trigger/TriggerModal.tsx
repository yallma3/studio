import React, { useState } from "react";
import { X, Search, Calendar, Webhook, Play, MessageCircle, Globe } from "lucide-react"; 
import { Trigger } from "../../types/types";
import TriggerCard from "./TriggerCard";
import ScheduledTriggerConfig from "./ScheduledTriggerConfig";
import ManualTriggerConfig from "./ManualTriggerConfig";
import WebhookTriggerConfig from "./WebhookTriggerConfig";
import TelegramTriggerConfig from "./TelegramTriggerConfig";

interface TriggerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (trigger: Trigger) => void;
  existingTrigger?: Trigger | null;
}

type TriggerStep = 'select' | 'webhook-type' | 'configure'; 
type CategoryFilter = 'all' | 'automation' | 'integration' | 'control';

const TriggerModal: React.FC<TriggerModalProps> = ({
  isOpen,
  onClose,
  onSave,
  existingTrigger,
}) => {
  const [step, setStep] = useState<TriggerStep>('select');
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all');

  if (!isOpen) return null;
  const triggerOptions = [
    {
      id: 'scheduled',
      name: 'Scheduled Run',
      description: 'Execute on a recurring schedule using cron expressions',
      icon: Calendar,
      category: 'automation' as const,
      available: true,
    },
    {
      id: 'webhook',
      name: 'Webhook Trigger',
      description: 'Start workflow when an HTTP webhook is received from external services',
      icon: Webhook,
      category: 'integration' as const,
      available: true,
    },
    {
      id: 'manual',
      name: 'Manual Trigger',
      description: 'Run workflow manually by clicking the Run button',
      icon: Play,
      category: 'control' as const,
      available: true,
    },
  ];
  const webhookTypes = [
    {
      id: 'telegram',
      name: 'Telegram Bot',
      description: 'Receive updates from Telegram when users interact with your bot',
      icon: MessageCircle,
      available: true,
    },
    {
      id: 'http-webhook',
      name: 'HTTP Webhook',
      description: 'Receive HTTP POST/GET requests from any external service',
      icon: Globe,
      available: true,
    },
  ];

  const filteredOptions = triggerOptions.filter(option => {
    const matchesSearch = 
      option.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      option.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = 
      categoryFilter === 'all' || option.category === categoryFilter;
    
    return matchesSearch && matchesCategory;
  });

  const handleSelectTrigger = (triggerId: string) => {
    if (triggerId === 'webhook') {
      setStep('webhook-type');
    } else {
      setSelectedType(triggerId);
      setStep('configure');
    }
  };
  const handleSelectWebhookType = (webhookTypeId: string) => {
    setSelectedType(webhookTypeId);
    setStep('configure');
  };

  const handleSaveTrigger = (trigger: Trigger) => {
    onSave(trigger);
    handleClose();
  };

  const handleBack = () => {
    if (step === 'webhook-type') {
      setStep('select');
    } else if (step === 'configure') {
      if (selectedType === 'telegram' || selectedType === 'http-webhook') {
        setStep('webhook-type');
      } else {
        setStep('select');
      }
      setSelectedType(null);
    }
  };

  const handleClose = () => {
    setStep('select');
    setSelectedType(null);
    setSearchQuery("");
    setCategoryFilter('all');
    onClose();
  };

  const categories = [
    { id: 'all' as const, label: 'All', count: triggerOptions.length },
    { 
      id: 'automation' as const, 
      label: 'Automation', 
      count: triggerOptions.filter(o => o.category === 'automation').length 
    },
    { 
      id: 'integration' as const, 
      label: 'Integration', 
      count: triggerOptions.filter(o => o.category === 'integration').length 
    },
    { 
      id: 'control' as const, 
      label: 'Control', 
      count: triggerOptions.filter(o => o.category === 'control').length 
    },
  ];
  const getCurrentStepNumber = () => {
    if (step === 'select') return 1;
    if (step === 'webhook-type') return 2;
    if (step === 'configure') {
      return (selectedType === 'telegram' || selectedType === 'http-webhook') ? 3 : 2;
    }
    return 1;
  };

  const getTotalSteps = () => {
    return (selectedType === 'telegram' || selectedType === 'http-webhook') ? 3 : 2;
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#1E1E1E] rounded-lg shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col border border-zinc-700">
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-700 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm text-zinc-400 mb-1">
              <span>Step {getCurrentStepNumber()} of {getTotalSteps()}</span>
            </div>
            <h2 className="text-xl font-semibold text-white">
              {step === 'select' && 'Select Trigger'}
              {step === 'webhook-type' && 'Choose Webhook Type'}
              {step === 'configure' && 'Configure Trigger'}
            </h2>
            <p className="text-sm text-zinc-400 mt-1">
              {step === 'select' && 'Choose how your task should be triggered'}
              {step === 'webhook-type' && 'Select the type of webhook to use'}
              {step === 'configure' && 'Set up your trigger configuration'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="bg-yellow-500/20 text-yellow-500 text-xs font-medium px-3 py-1 rounded">
              Required
            </span>
            <button
              onClick={handleClose}
              className="text-zinc-400 hover:text-white p-2 rounded-lg hover:bg-zinc-700/50 transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {step === 'select' && (
            <>
              {/* Search Bar */}
              <div className="relative mb-6">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-400" size={18} />
                <input
                  type="text"
                  placeholder="Search triggers..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-[#0a0a0a] border border-zinc-700 rounded-lg pl-10 pr-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-yellow-500/50"
                />
              </div>

              {/* Category Tabs */}
              <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
                {categories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => setCategoryFilter(category.id)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                      categoryFilter === category.id
                        ? 'bg-yellow-500 text-black'
                        : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white'
                    }`}
                  >
                    {category.label}
                    <span className={`ml-2 ${
                      categoryFilter === category.id 
                        ? 'text-black/70' 
                        : 'text-zinc-500'
                    }`}>
                      ({category.count})
                    </span>
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredOptions.map((option) => (
                  <TriggerCard
                    key={option.id}
                    trigger={option}
                    onSelect={() => handleSelectTrigger(option.id)}
                  />
                ))}
              </div>
              {filteredOptions.length === 0 && (
                <div className="text-center py-12">
                  <div className="text-zinc-600 mb-2">
                    <Search size={48} className="mx-auto" />
                  </div>
                  <p className="text-zinc-400 text-lg mb-1">No triggers found</p>
                  <p className="text-zinc-500 text-sm">
                    {searchQuery 
                      ? `Try a different search term or category`
                      : `No triggers available in this category`}
                  </p>
                  {(searchQuery || categoryFilter !== 'all') && (
                    <button
                      onClick={() => {
                        setSearchQuery("");
                        setCategoryFilter('all');
                      }}
                      className="mt-4 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg transition-colors"
                    >
                      Clear Filters
                    </button>
                  )}
                </div>
              )}
            </>
          )}
          {step === 'webhook-type' && (
            <>
              <div className="mb-6">
                <p className="text-zinc-400 text-sm">
                  Choose the type of webhook integration you want to use. Both options will receive HTTP requests, but with different configurations.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {webhookTypes.map((webhookType) => (
                  <TriggerCard
                    key={webhookType.id}
                    trigger={{
                      ...webhookType,
                      category: 'integration',
                    }}
                    onSelect={() => handleSelectWebhookType(webhookType.id)}
                  />
                ))}
              </div>
            </>
          )}
          {step === 'configure' && (
            <>
              {selectedType === 'scheduled' && (
                <ScheduledTriggerConfig
                  onSave={handleSaveTrigger}
                  onBack={handleBack}
                  existingTrigger={existingTrigger}
                />
              )}
              {selectedType === 'manual' && (
                <ManualTriggerConfig
                  onSave={handleSaveTrigger}
                  onBack={handleBack}
                  existingTrigger={existingTrigger}
                />
              )}
              {selectedType === 'http-webhook' && (
                <WebhookTriggerConfig
                  onSave={handleSaveTrigger}
                  onBack={handleBack}
                  existingTrigger={existingTrigger}
                />
              )}
              {selectedType === 'telegram' && (
                <TelegramTriggerConfig
                  onSave={handleSaveTrigger}
                  onBack={handleBack}
                  existingTrigger={existingTrigger}
                />
              )}
            </>
          )}
        </div>
        {(step === 'select' || step === 'webhook-type') && (
          <div className="px-6 py-4 border-b border-zinc-700 flex justify-between items-center">
            <span className="text-sm text-zinc-500">
              {step === 'select' && `${filteredOptions.length} ${filteredOptions.length === 1 ? 'trigger' : 'triggers'} available`}
              {step === 'webhook-type' && `${webhookTypes.length} webhook types available`}
            </span>
            <div className="flex gap-2">
              {step === 'webhook-type' && (
                <button
                  onClick={handleBack}
                  className="px-4 py-2 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-700/50 transition-colors"
                >
                  Back
                </button>
              )}
              <button
                onClick={handleClose}
                className="px-4 py-2 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-700/50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TriggerModal;
