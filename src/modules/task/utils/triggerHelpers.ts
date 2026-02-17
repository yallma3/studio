import { 
  Trigger, 
  ScheduledTrigger, 
  ManualTrigger, 
  WebhookTrigger,
  TelegramTrigger, 
  TelegramUpdateType 
} from '../types/types';

/**
 * Create a new scheduled trigger with default values
 */
export function createScheduledTrigger(
  cronExpression: string,
  timezone: string,
  description?: string,
  existingId?: string,
  existingCreatedAt?: number
): ScheduledTrigger {
  return {
    id: existingId || `trigger-${Date.now()}`,
    type: 'scheduled',
    enabled: true,
    createdAt: existingCreatedAt || Date.now(),
    updatedAt: Date.now(),
    config: {
      cronExpression,
      timezone,
      description,
    },
  };
}

/**
 * Create a new manual trigger
 */
export function createManualTrigger(
  description?: string,
  requiresConfirmation: boolean = false
): ManualTrigger {
  return {
    id: `trigger-${Date.now()}`,
    type: 'manual',
    enabled: true,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    config: {
      description,
      requiresConfirmation,
    },
  };
}

/**
 * Create a new webhook trigger
 */
export function createWebhookTrigger(
  method: 'POST' | 'GET' = 'POST',
  secret?: string
): WebhookTrigger {
  return {
    id: `trigger-${Date.now()}`,
    type: 'webhook',
    enabled: true,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    config: {
      webhookUrl: '', 
      method,
      secret,
    },
  };
}


export function createTelegramTrigger(
  botToken: string,
  updateTypes: TelegramUpdateType[] = ['message'],
  filterChatId?: string,
  filterChatType?: 'private' | 'group' | 'supergroup' | 'channel'
): TelegramTrigger {
  return {
    id: `trigger-${Date.now()}`,
    type: 'telegram',
    enabled: true,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    config: {
      botToken,
      updateTypes,
      filterChatId,
      filterChatType,
    },
  };
}

/**
 * Validate manual trigger configuration
 */
export function validateManualTrigger(_config: ManualTrigger['config']): boolean {
  return true;
}


/**
 * Validate scheduled trigger (basic validation)
 */
export function validateScheduledTrigger(config: ScheduledTrigger['config']): boolean {
  const cronParts = config.cronExpression.trim().split(/\s+/);
  return cronParts.length === 5 && config.timezone.length > 0;
}

/**
 * Validate webhook trigger configuration
 */
export function validateWebhookTrigger(config: WebhookTrigger['config']): boolean {
  return Boolean(config.method);
}

/**
 *  Validate Telegram trigger configuration
 */
export function validateTelegramTrigger(config: TelegramTrigger['config']): boolean {
  return Boolean(
    config.botToken && 
    config.botToken.includes(':') &&
    config.updateTypes &&
    config.updateTypes.length > 0
  );
}

/**
 * Validate any trigger type
 */
export function validateTrigger(trigger: Trigger): boolean {
  if (!trigger.id || !trigger.type) {
    return false;
  }

  switch (trigger.type) {
    case 'scheduled':
      return validateScheduledTrigger(trigger.config);
    case 'manual':
      return validateManualTrigger(trigger.config);
    case 'webhook':
      return validateWebhookTrigger(trigger.config);
    case 'telegram': 
      return validateTelegramTrigger(trigger.config);
    default:
      return false;
  }
}

export function getTriggerDescription(trigger: Trigger): string {
  switch (trigger.type) {
    case 'scheduled':
      return trigger.config.description || trigger.config.cronExpression;
    case 'webhook':
      return `Webhook: ${trigger.config.method}${trigger.config.webhookUrl ? ' - ' + trigger.config.webhookUrl : ''}`;
    case 'telegram': 
      return getTelegramDescription(trigger);
    case 'manual':
      return trigger.config.description || 'Manual trigger - Run on demand';
    default:
      return 'Unknown trigger';
  }
}

export function getTelegramDescription(trigger: TelegramTrigger): string {
  const eventCount = trigger.config.updateTypes.length;
  const botName = trigger.config.botInfo?.username 
    ? `@${trigger.config.botInfo.username}` 
    : 'Telegram Bot';
  
  const events = eventCount === 1 
    ? trigger.config.updateTypes[0].replace(/_/g, ' ')
    : `${eventCount} events`;
  
  const filters = [];
  if (trigger.config.filterChatId) filters.push(`chat ${trigger.config.filterChatId}`);
  if (trigger.config.filterChatType) filters.push(trigger.config.filterChatType);
  
  return `${botName}: ${events}${filters.length ? ` (${filters.join(', ')})` : ''}`;
}

/**
 * Get the user's timezone
 */
export function getUserTimezone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
}

/**
 * Common cron presets
 */
export const CRON_PRESETS = [
  {
    label: 'Every minute',
    value: '* * * * *',
    description: 'Runs every minute',
  },
  {
    label: 'Every 5 minutes',
    value: '*/5 * * * *',
    description: 'Runs every 5 minutes',
  },
  {
    label: 'Every 15 minutes',
    value: '*/15 * * * *',
    description: 'Runs every 15 minutes',
  },
  {
    label: 'Every 30 minutes',
    value: '*/30 * * * *',
    description: 'Runs every 30 minutes',
  },
  {
    label: 'Every hour',
    value: '0 * * * *',
    description: 'Runs at the start of every hour',
  },
  {
    label: 'Every day at 9 AM',
    value: '0 9 * * *',
    description: 'Runs every day at 9:00 AM',
  },
  {
    label: 'Every Monday at 9 AM',
    value: '0 9 * * 1',
    description: 'Runs every Monday at 9:00 AM',
  },
  {
    label: 'First day of month at 9 AM',
    value: '0 9 1 * *',
    description: 'Runs on the 1st of every month at 9:00 AM',
  },
] as const;

/**
 * Get next run time for a trigger
 */
export function getNextRunTime(trigger: Trigger): Date | null {
  if (trigger.type === 'scheduled' && trigger.config.nextRun) {
    return new Date(trigger.config.nextRun);
  }
  return null;
}

/**
 *  UPDATED: Check if trigger is active (enabled and properly configured)
 */
export function isTriggerActive(trigger: Trigger): boolean {
  if (!trigger.enabled) return false;

  switch (trigger.type) {
    case 'scheduled':
      // Check if cron expression exists and has nextRun
      return Boolean(trigger.config.cronExpression && trigger.config.nextRun);
    
    case 'webhook':
      // Check if webhook URL is registered by backend
      return Boolean(trigger.config.webhookUrl && trigger.config.webhookId);
    
    case 'telegram': 
      // Check if bot is registered with Telegram
      return Boolean(trigger.config.webhookUrl && trigger.config.botInfo);
    
    case 'manual':
      // Manual triggers are always "active" if enabled
      return true;
    
    default:
      return false;
  }
}

/**
 *  Format trigger for display
 */
export function formatTriggerForDisplay(trigger: Trigger): string {
  switch (trigger.type) {
    case 'scheduled':
      return `Scheduled: ${trigger.config.cronExpression}`;
    case 'webhook':
      return `Webhook: ${trigger.config.method}${trigger.config.webhookUrl ? ' - ' + trigger.config.webhookUrl : ''}`;
    case 'telegram': 
      return getTelegramDescription(trigger);
    case 'manual':
      return 'Manual Trigger';
    default:
      return 'Unknown';
  }
}

/**
 * Get countdown time remaining for scheduled trigger
 */
export function getCountdownTime(nextExecutionTime: number): string {
  const now = Date.now();
  const diff = nextExecutionTime - now;

  if (diff <= 0) {
    return '00:00:00';
  }

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);

  return `${hours.toString().padStart(2, '0')}:${minutes
    .toString()
    .padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

/**
 * Get status badge colors for UI
 */
export function getTriggerStatusColor(trigger: Trigger): {
  bg: string;
  text: string;
  border: string;
} {
  if (!trigger.enabled) {
    return {
      bg: 'bg-zinc-800',
      text: 'text-zinc-400',
      border: 'border-zinc-700',
    };
  }

  if (isTriggerActive(trigger)) {
    return {
      bg: 'bg-green-900/20',
      text: 'text-green-400',
      border: 'border-green-500/30',
    };
  }

  return {
    bg: 'bg-yellow-900/20',
    text: 'text-yellow-400',
    border: 'border-yellow-500/30',
  };
}

/**
 * Format next execution time for display
 */
export function formatNextExecution(trigger: ScheduledTrigger): string {
  if (!trigger.config.nextRun) {
    return 'Not scheduled';
  }

  const date = new Date(trigger.config.nextRun);
  const now = new Date();
  const diff = trigger.config.nextRun - now.getTime();

  // If in the past
  if (diff < 0) {
    return 'Overdue';
  }

  // If within next hour
  if (diff < 60 * 60 * 1000) {
    const minutes = Math.floor(diff / (60 * 1000));
    return `In ${minutes} minute${minutes !== 1 ? 's' : ''}`;
  }

  // If within next 24 hours
  if (diff < 24 * 60 * 60 * 1000) {
    const hours = Math.floor(diff / (60 * 60 * 1000));
    return `In ${hours} hour${hours !== 1 ? 's' : ''}`;
  }

  // Otherwise show date
  return date.toLocaleString();
}

/**
 * Generate a random secret for webhooks
 */
export function generateWebhookSecret(length: number = 32): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let secret = '';
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  
  for (let i = 0; i < length; i++) {
    secret += chars[array[i] % chars.length];
  }
  
  return secret;
}

/**
 *  Get trigger type display name
 */
export function getTriggerTypeName(type: Trigger['type']): string {
  switch (type) {
    case 'scheduled':
      return 'Scheduled';
    case 'webhook':
      return 'Webhook';
    case 'telegram': 
      return 'Telegram';
    case 'manual':
      return 'Manual';
    default:
      return 'Unknown';
  }
}

/**
 *  Get trigger type icon name (for use with lucide-react)
 */
export function getTriggerTypeIcon(type: Trigger['type']): string {
  switch (type) {
    case 'scheduled':
      return 'Calendar';
    case 'webhook':
      return 'Webhook';
    case 'telegram':
      return 'MessageCircle';
    case 'manual':
      return 'Play';
    default:
      return 'HelpCircle';
  }
}

/**
 *  Get Telegram event type display name
 */
export function getTelegramEventTypeName(type: TelegramUpdateType): string {
  const names: Record<TelegramUpdateType, string> = {
    'message': 'Messages',
    'edited_message': 'Edited Messages',
    'channel_post': 'Channel Posts',
    'edited_channel_post': 'Edited Channel Posts',
    'inline_query': 'Inline Queries',
    'callback_query': 'Callback Queries',
    'poll': 'Polls',
    'poll_answer': 'Poll Answers',
    'pre_checkout_query': 'Pre-Checkout Queries',
    'shipping_query': 'Shipping Queries',
  };
  return names[type] || type.replace(/_/g, ' ');
}

export function isValidBotToken(token: string): boolean {
  if (!token || !token.includes(':')) return false;
  
  const parts = token.split(':');
  if (parts.length !== 2) return false;
  
  const [botId, secret] = parts;
  
  // Bot ID should be numeric
  if (!/^\d+$/.test(botId)) return false;
  
  // Secret should be at least 20 characters alphanumeric
  if (secret.length < 20 || !/^[A-Za-z0-9_-]+$/.test(secret)) return false;
  
  return true;
}

export function extractBotIdFromToken(token: string): string | null {
  if (!isValidBotToken(token)) return null;
  return token.split(':')[0];
}

export function formatTelegramChatId(chatId: string): string {
  if (chatId.startsWith('-')) {
    return `Group/Channel (${chatId})`;
  }
  return `User (${chatId})`;
}

export function getTriggerCategory(type: Trigger['type']): 'automation' | 'integration' | 'control' {
  switch (type) {
    case 'scheduled':
      return 'automation';
    case 'webhook':
    case 'telegram':
      return 'integration';
    case 'manual':
      return 'control';
    default:
      return 'control';
  }
}

export function supportsScheduling(type: Trigger['type']): boolean {
  return type === 'scheduled';
}

export function supportsExternalEvents(type: Trigger['type']): boolean {
  return type === 'webhook' || type === 'telegram';
}

export function getTriggerSummary(trigger: Trigger): {
  title: string;
  description: string;
  status: 'active' | 'pending' | 'disabled';
  details: string[];
} {
  const isActive = isTriggerActive(trigger);
  const status = !trigger.enabled ? 'disabled' : isActive ? 'active' : 'pending';

  switch (trigger.type) {
    case 'scheduled':
      return {
        title: 'Scheduled Trigger',
        description: getTriggerDescription(trigger),
        status,
        details: [
          `Timezone: ${trigger.config.timezone}`,
          trigger.config.nextRun 
            ? `Next run: ${formatNextExecution(trigger)}` 
            : 'Not scheduled',
        ],
      };

    case 'webhook':
      return {
        title: 'Webhook Trigger',
        description: getTriggerDescription(trigger),
        status,
        details: [
          `Method: ${trigger.config.method}`,
          trigger.config.webhookUrl 
            ? 'Endpoint registered' 
            : 'Pending registration',
          trigger.config.secret ? 'Secured with secret' : 'No authentication',
        ],
      };

    case 'telegram':
      return {
        title: 'Telegram Bot Trigger',
        description: getTriggerDescription(trigger),
        status,
        details: [
          trigger.config.botInfo 
            ? `Bot: @${trigger.config.botInfo.username}` 
            : 'Bot not registered',
          `Events: ${trigger.config.updateTypes.length}`,
          trigger.config.filterChatId 
            ? `Filtered to: ${formatTelegramChatId(trigger.config.filterChatId)}` 
            : 'All chats',
        ],
      };

    case 'manual':
      return {
        title: 'Manual Trigger',
        description: getTriggerDescription(trigger),
        status: 'active',
        details: [
          'Run on-demand',
          trigger.config.requiresConfirmation 
            ? 'Requires confirmation' 
            : 'Instant execution',
        ],
      };

    default:
      return {
        title: 'Unknown Trigger',
        description: 'Unknown trigger type',
        status: 'disabled',
        details: [],
      };
  }
}
