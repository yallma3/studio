import React, { useState, useCallback, useEffect } from "react";
import { 
  Edit, 
  Calendar, 
  Webhook, 
  Play, 
  MessageCircle, 
  Copy, 
  Check,
  ExternalLink 
} from "lucide-react";
import { Trigger } from "../../types/types";
import cronstrue from 'cronstrue';

interface TriggerNodeProps {
  trigger: Trigger;
  position: { x: number; y: number };
  onEdit: () => void;
  onPositionChange: (position: { x: number; y: number }) => void;
  onSocketMouseDown?: (socketId: number, position: { x: number; y: number }, isOutput: boolean) => void;
  onSocketMouseUp?: (socketId: number, isInput: boolean) => void;
}

const TriggerNode: React.FC<TriggerNodeProps> = ({
  trigger,
  position,
  onEdit,
  onPositionChange,
  onSocketMouseDown,
  onSocketMouseUp,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [initialPosition, setInitialPosition] = useState({ x: 0, y: 0 });
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedSecret, setCopiedSecret] = useState(false); 
  const socketId = 9999; 

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.socket')) return;
    if ((e.target as HTMLElement).closest('button')) return;
    e.stopPropagation();
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
    setInitialPosition({ x: position.x, y: position.y });
  }, [position]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || !onPositionChange) return;
    e.preventDefault();
    
    const deltaX = e.clientX - dragStart.x;
    const deltaY = e.clientY - dragStart.y;
    
    const canvas = document.querySelector("[data-canvas-container]");
    const transformContainer = document.querySelector("[data-transform-container]");
    if (!canvas || !transformContainer) return;

    const transform = window.getComputedStyle(transformContainer).transform;
    let zoom = 1;
    if (transform && transform !== "none") {
      const matrix = transform.match(/matrix\(([^)]+)\)/);
      if (matrix) {
        zoom = parseFloat(matrix[1].split(",")[0]);
      }
    }

    onPositionChange({
      x: initialPosition.x + deltaX / zoom,
      y: initialPosition.y + deltaY / zoom
    });
  }, [isDragging, dragStart, initialPosition, onPositionChange]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      return () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);
  const getTriggerIcon = () => {
    switch (trigger.type) {
      case 'scheduled':
        return <Calendar className="w-4 h-4 text-[#FFC72C]" />;
      case 'webhook':
        return <Webhook className="w-4 h-4 text-[#FFC72C]" />;
      case 'telegram':
        return <MessageCircle className="w-4 h-4 text-[#FFC72C]" />;
      case 'manual':
        return <Play className="w-4 h-4 text-[#FFC72C]" />;
      default:
        return <Calendar className="w-4 h-4 text-[#FFC72C]" />;
    }
  };
  const getDescription = () => {
    if (trigger.type === 'scheduled') {
      try {
        return cronstrue.toString(trigger.config.cronExpression);
      } catch {
        return trigger.config.cronExpression;
      }
    } else if (trigger.type === 'manual') {
      return trigger.config.description || 'Run manually by clicking the Run button';
    } else if (trigger.type === 'webhook') {
      if (trigger.config.webhookUrl) {
        return `Webhook endpoint ready (${trigger.config.method})`;
      }
      return `Webhook trigger (${trigger.config.method}) - Pending registration`;
    } else if (trigger.type === 'telegram') {
      const eventCount = trigger.config.updateTypes.length;
      const botName = trigger.config.botInfo?.username 
        ? `@${trigger.config.botInfo.username}` 
        : 'Telegram Bot';
      return `${botName} - ${eventCount} event${eventCount > 1 ? 's' : ''}`;
    }
    return '';
  };
  const getTypeLabel = () => {
    switch (trigger.type) {
      case 'scheduled':
        return 'SCHEDULED';
      case 'manual':
        return 'MANUAL';
      case 'webhook':
        return 'WEBHOOK';
      case 'telegram': 
        return 'TELEGRAM';
      default:
        return 'TRIGGER';
    }
  };
  const handleCopyWebhookUrl = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (trigger.type === 'webhook' && trigger.config.webhookUrl) {
      navigator.clipboard.writeText(trigger.config.webhookUrl);
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2000);
    } else if (trigger.type === 'telegram' && trigger.config.webhookUrl) { 
      navigator.clipboard.writeText(trigger.config.webhookUrl);
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2000);
    }
  };
  const handleCopySecret = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (trigger.type === 'webhook' && trigger.config.secret) {
      navigator.clipboard.writeText(trigger.config.secret);
      setCopiedSecret(true);
      setTimeout(() => setCopiedSecret(false), 2000);
    } else if (trigger.type === 'telegram' && trigger.config.secretToken) {
      navigator.clipboard.writeText(trigger.config.secretToken);
      setCopiedSecret(true);
      setTimeout(() => setCopiedSecret(false), 2000);
    }
  };

  const handleSocketMouseDown = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (onSocketMouseDown) {
      const transformContainer = document.querySelector("[data-transform-container]");
      if (transformContainer) {
        const containerRect = transformContainer.getBoundingClientRect();
        const socketRect = (e.currentTarget as HTMLElement).getBoundingClientRect();
        
        const rawX = socketRect.left + socketRect.width / 2 - containerRect.left;
        const rawY = socketRect.top + socketRect.height / 2 - containerRect.top;

        const transform = window.getComputedStyle(transformContainer).transform;
        let zoom = 1;
        if (transform && transform !== "none") {
          const matrix = transform.match(/matrix\(([^)]+)\)/);
          if (matrix) zoom = parseFloat(matrix[1].split(",")[0]);
        }

        onSocketMouseDown(socketId, { x: rawX / zoom, y: rawY / zoom }, true);
      }
    }
  }, [onSocketMouseDown, socketId]);

  return (
    <div
      className={`flex flex-col text-white rounded-md bg-black hover:bg-[#111] relative border transition-colors duration-200 w-104 border-[#FFC72C] shadow-[0_0_10px_rgba(255,199,44,0.6)] ${
        isDragging ? "cursor-grabbing" : "cursor-grab"
      } select-none group`}
      style={{ minHeight: '200px' }}
      onMouseDown={handleMouseDown}
    >
      {/* Output Socket - Right Side */}
      <div className="absolute right-0 top-0 h-full flex flex-col justify-center -mr-2">
        <div
          data-socket-id={socketId}
          className="socket w-4 h-4 bg-[#FFC72C] rounded-full border-2 border-[#FFC72C] shadow-sm relative cursor-pointer hover:scale-110 transition-transform"
          title="Start"
          onMouseDown={handleSocketMouseDown}
          onMouseUp={(e) => { 
            e.stopPropagation(); 
            onSocketMouseUp?.(socketId, false); 
          }}
        />
      </div>

      {/* Header */}
      <div className="bg-[#FFC72C]/30 border-b border-[#FFC72C]/30 rounded-t-md px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {getTriggerIcon()}
            <h3 className="font-bold text-sm text-white leading-tight">Trigger</h3>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-[#FFC72C]/80 uppercase font-mono">
              {getTypeLabel()}
            </span>
            <button
              onMouseDown={(e) => e.stopPropagation()}
              onClick={(e) => { 
                e.stopPropagation(); 
                onEdit(); 
              }}
              title="Edit Trigger"
              className="hover:scale-110 transition-transform"
            >
              <Edit className="w-4 text-[#FFC72C]/80 hover:text-[#FFC72C] cursor-pointer" />
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 flex-1 flex flex-col">
        {/* Description */}
        <div className="mb-3">
          <p className="text-sm text-[#FFC72C] font-mono bg-[#FFC72C11] p-2 rounded leading-relaxed">
            {getDescription()}
          </p>
        </div>
        
        {/* ========================================== */}
        {/* SCHEDULED TRIGGER */}
        {/* ========================================== */}
        {trigger.type === 'scheduled' && (
          <>
            <div className="mb-2">
              <h4 className="text-xs font-medium text-[#FFC72C]/80 mb-1">Timezone:</h4>
              <p className="text-sm text-[#FFC72C] font-mono bg-[#FFC72C11] p-2 rounded border border-[#FFC72C33]">
                {trigger.config.timezone}
              </p>
            </div>
            {trigger.config.description && (
              <div className="text-xs text-[#FFC72C66] font-mono mt-2">
                {trigger.config.description}
              </div>
            )}
          </>
        )}

        {/* ========================================== */}
        {/* MANUAL TRIGGER */}
        {/* ========================================== */}
        {trigger.type === 'manual' && trigger.config.requiresConfirmation && (
          <div className="flex items-center gap-2 text-xs text-[#FFC72C]/60 bg-[#FFC72C11] p-2 rounded border border-[#FFC72C33]">
            <div className="w-1.5 h-1.5 rounded-full bg-[#FFC72C]/60" />
            <span>Requires confirmation before running</span>
          </div>
        )}

        {/* ========================================== */}
        {/* WEBHOOK TRIGGER */}
        {/* ========================================== */}
        {trigger.type === 'webhook' && (
          <div className="space-y-2 flex-1">
            {/* Method */}
            <div>
              <h4 className="text-xs font-medium text-[#FFC72C]/80 mb-1">Method:</h4>
              <p className={`text-sm font-mono font-bold bg-[#FFC72C11] p-2 rounded border border-[#FFC72C33] ${
                trigger.config.method === 'POST' ? 'text-green-400' : 'text-blue-400'
              }`}>
                {trigger.config.method}
              </p>
            </div>

            {/* Webhook ID */}
            {trigger.config.webhookId && (
              <div>
                <h4 className="text-xs font-medium text-[#FFC72C]/80 mb-1">Webhook ID:</h4>
                <p className="text-xs text-[#FFC72C] font-mono bg-[#FFC72C11] p-2 rounded border border-[#FFC72C33] break-all">
                  {trigger.config.webhookId}
                </p>
              </div>
            )}

            {/* Secret Status */}
            {trigger.config.secret && (
              <div className="flex items-center gap-2 text-xs text-green-400 bg-green-900/20 p-2 rounded border border-green-500/30">
                <Check className="w-3 h-3" />
                <span>Authentication enabled</span>
              </div>
            )}

            {/* Webhook URL */}
            {trigger.config.webhookUrl ? (
              <div className="bg-[#FFC72C11] border border-[#FFC72C33] rounded p-2">
                <div className="flex items-center justify-between mb-1">
                  <h4 className="text-xs font-medium text-[#FFC72C]/80">URL:</h4>
                  <button
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={handleCopyWebhookUrl}
                    className="p-1 hover:bg-[#FFC72C]/10 rounded transition-colors"
                    title="Copy URL"
                  >
                    {copiedUrl ? (
                      <Check className="w-3 h-3 text-green-400" />
                    ) : (
                      <Copy className="w-3 h-3 text-[#FFC72C]" />
                    )}
                  </button>
                </div>
                <p className="text-xs text-[#FFC72C] font-mono break-all">
                  {trigger.config.webhookUrl}
                </p>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-xs text-yellow-400 bg-yellow-900/20 p-2 rounded border border-yellow-500/30">
                <div className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse" />
                <span>Pending registration</span>
              </div>
            )}
          </div>
        )}

        {/* ========================================== */}
        {/* TELEGRAM TRIGGER */}
        {/* ========================================== */}
        {trigger.type === 'telegram' && (
          <div className="space-y-2 flex-1">
            {/* Bot Info */}
            {trigger.config.botInfo && (
              <div>
                <h4 className="text-xs font-medium text-[#FFC72C]/80 mb-1">Bot:</h4>
                <div className="bg-[#FFC72C11] border border-[#FFC72C33] rounded p-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-[#FFC72C] font-mono font-semibold">
                        @{trigger.config.botInfo.username}
                      </p>
                      <p className="text-xs text-[#FFC72C]/70 mt-0.5">
                        {trigger.config.botInfo.first_name}
                      </p>
                    </div>
                    <a
                      href={`https://t.me/${trigger.config.botInfo.username}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      onMouseDown={(e) => e.stopPropagation()}
                      onClick={(e) => e.stopPropagation()}
                      className="text-[#FFC72C] hover:text-[#FFC72C]/80 transition-colors"
                      title="Open in Telegram"
                    >
                      <ExternalLink size={16} />
                    </a>
                  </div>
                </div>
              </div>
            )}

            {/* Event Types */}
            <div>
              <h4 className="text-xs font-medium text-[#FFC72C]/80 mb-1">
                Events ({trigger.config.updateTypes.length}):
              </h4>
              <div className="flex flex-wrap gap-1">
                {trigger.config.updateTypes.slice(0, 3).map(type => (
                  <span 
                    key={type}
                    className="text-xs bg-[#FFC72C11] text-[#FFC72C] px-2 py-1 rounded border border-[#FFC72C33]"
                  >
                    {type.replace(/_/g, ' ')}
                  </span>
                ))}
                {trigger.config.updateTypes.length > 3 && (
                  <span className="text-xs bg-[#FFC72C11] text-[#FFC72C]/60 px-2 py-1 rounded border border-[#FFC72C33]">
                    +{trigger.config.updateTypes.length - 3} more
                  </span>
                )}
              </div>
            </div>

            {/* Filters */}
            {(trigger.config.filterChatId || trigger.config.filterChatType) && (
              <div>
                <h4 className="text-xs font-medium text-[#FFC72C]/80 mb-1">Filters:</h4>
                <div className="space-y-1">
                  {trigger.config.filterChatId && (
                    <div className="flex items-center gap-2 text-xs text-blue-400 bg-blue-900/20 p-2 rounded border border-blue-500/30">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                      <span>Chat: <code className="font-mono">{trigger.config.filterChatId}</code></span>
                    </div>
                  )}
                  {trigger.config.filterChatType && (
                    <div className="flex items-center gap-2 text-xs text-blue-400 bg-blue-900/20 p-2 rounded border border-blue-500/30">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                      <span>Type: {trigger.config.filterChatType}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Webhook Status */}
            {trigger.config.webhookUrl ? (
              <div className="bg-[#FFC72C11] border border-[#FFC72C33] rounded p-2">
                <div className="flex items-center justify-between mb-1">
                  <h4 className="text-xs font-medium text-[#FFC72C]/80">Status:</h4>
                  <div className="flex items-center gap-1 text-green-400">
                    <Check className="w-3 h-3" />
                    <span className="text-xs">Registered</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-xs text-[#FFC72C]/60">
                    Telegram → yallma3
                  </p>
                  <button
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={handleCopyWebhookUrl}
                    className="p-1 hover:bg-[#FFC72C]/10 rounded transition-colors"
                    title="Copy webhook URL"
                  >
                    {copiedUrl ? (
                      <Check className="w-3 h-3 text-green-400" />
                    ) : (
                      <Copy className="w-3 h-3 text-[#FFC72C]" />
                    )}
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-xs text-yellow-400 bg-yellow-900/20 p-2 rounded border border-yellow-500/30">
                <div className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse" />
                <span>Pending registration</span>
              </div>
            )}

            {/* Secret Token (if exists) */}
            {trigger.config.secretToken && (
              <div>
                <div className="flex items-center justify-between mb-1">
                  <h4 className="text-xs font-medium text-[#FFC72C]/80">Secret:</h4>
                  <button
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={handleCopySecret}
                    className="p-1 hover:bg-[#FFC72C]/10 rounded transition-colors"
                    title="Copy secret token"
                  >
                    {copiedSecret ? (
                      <Check className="w-3 h-3 text-green-400" />
                    ) : (
                      <Copy className="w-3 h-3 text-[#FFC72C]" />
                    )}
                  </button>
                </div>
                <div className="flex items-center gap-2 text-xs text-green-400 bg-green-900/20 p-2 rounded border border-green-500/30">
                  <Check className="w-3 h-3" />
                  <span>Webhook secured</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default TriggerNode;
