import { Position } from "../../flow/types/NodeTypes";
import { LucideIcon } from 'lucide-react';

export interface TaskSocket {
  id: number;
  title: string;
  type: "input" | "output";
}

export interface Task {
  id: string;
  title: string;
  description: string;
  expectedOutput: string;
  type: string;
  executorId: string | null;
  position: Position;
  selected: boolean;
  sockets: TaskSocket[];
}

export interface TaskConnection {
  fromSocket: number;
  toSocket: number;
}

export interface TaskGraph {
  tasks: Task[];
  connections: TaskConnection[];
}
export type TriggerType = 'scheduled' | 'webhook' | 'manual' | 'telegram'; 

export interface BaseTrigger {
  id: string;
  type: TriggerType;
  enabled: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface ScheduledTrigger extends BaseTrigger {
  type: 'scheduled';
  config: {
    cronExpression: string;
    timezone: string;
    description?: string;
    nextRun?: number;
  };
}

export interface WebhookTrigger extends BaseTrigger {
  type: 'webhook';
  config: {
    webhookUrl: string;
    webhookId?: string;
    secret?: string;
    method: 'POST' | 'GET';
    path?: string;
  };
}

export interface ManualTrigger extends BaseTrigger {
  type: 'manual';
  config: {
    description?: string;
    requiresConfirmation?: boolean;
  };
}
export type TelegramUpdateType = 
  | 'message'
  | 'edited_message'
  | 'channel_post'
  | 'edited_channel_post'
  | 'inline_query'
  | 'callback_query'
  | 'poll'
  | 'poll_answer'
  | 'pre_checkout_query'
  | 'shipping_query';

export interface TelegramTrigger extends BaseTrigger {
  type: 'telegram';
  config: {
    botToken: string;
    webhookUrl?: string;
    secretToken?: string;
    updateTypes: TelegramUpdateType[];
    filterChatId?: string;
    filterChatType?: 'private' | 'group' | 'supergroup' | 'channel';
    botInfo?: {
      id: number;
      username: string;
      first_name: string;
      can_join_groups: boolean;
      can_read_all_group_messages: boolean;
    };
  };
}

export type Trigger = ScheduledTrigger | WebhookTrigger | ManualTrigger | TelegramTrigger;

export interface TriggerOption {
  id: TriggerType;
  name: string;
  description: string;
  icon: LucideIcon;
  category: 'automation' | 'integration' | 'control';
  available: boolean;
}
